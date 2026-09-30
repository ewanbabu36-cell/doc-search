import crypto from 'node:crypto';
import {
  AppError,
  ErrorCode,
  createLogger,
  ClinicalSafetyService,
  type ClinicalSafetyReport
} from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';
import { aiChatRepository } from '../../repositories/core/AiChatRepository.js';
import { aiCore, type ExecuteCapabilityOptions } from '../../ai/ai-core.js';
import { resolveRoleContext } from '../../ai/role-context.js';
import { entitlementService } from '../company/EntitlementService.js';
import { validateAudioPayload } from '../../ai/voice/audio-validator.js';
import { getSttProvider, type SttTranscriptionResult } from '../../ai/voice/stt-provider.js';
import {
  getTtsProvider,
  categorizeVoiceResponse,
  sanitizeVoiceSpokenText,
  type ActionSafetyCategory,
  type TtsSynthesisResult
} from '../../ai/voice/tts-provider.js';
import { voiceRateLimiter } from '../../ai/voice/voice-rate-limiter.js';
import type { AiChatConversation } from '@docsearch/database';

const logger = createLogger('ai-voice-service');

export interface ProcessVoiceInteractionInput {
  audio: Buffer | Uint8Array | string;
  mimeType: string;
  conversationId?: string | undefined;
  capabilityId?: string | undefined;
  toolId?: string | undefined;
  toolInput?: Record<string, unknown> | undefined;
  targetTenantId?: string | undefined;
  targetBranchId?: string | undefined;
  isApprovalGranted?: boolean | undefined;
  approverId?: string | undefined;
  approvalCapabilityId?: string | undefined;
  synthesizeAudio?: boolean | undefined;
  idempotencyKey?: string | undefined;
}

export interface VoiceExecutionResponse {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  transcript: string;
  content: string;
  safetyCategory: ActionSafetyCategory;
  audio?: string | undefined; // Base64 encoded audio
  audioMimeType?: string | undefined;
  capabilityId: string;
  toolId?: string | undefined;
  role: string;
  dataScope: string;
  traceId: string;
  auditHash: string;
  cached?: boolean | undefined;
  clinicalSafety?: ClinicalSafetyReport | undefined;
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    sttLatencyMs: number;
    ttsLatencyMs: number;
  };
}

interface CachedVoiceResult {
  response: VoiceExecutionResponse;
  timestamp: number;
}

export class AiVoiceService {
  private idempotencyCache = new Map<string, CachedVoiceResult>();
  private readonly IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Transcribes untrusted audio into text without executing AI capabilities.
   */
  async transcribeAudio(
    session: SessionContext,
    rawAudio: Buffer | Uint8Array | string,
    mimeType: string
  ): Promise<SttTranscriptionResult> {
    // 1. Voice rate limit check
    voiceRateLimiter.checkLimit(session.userId, session.tenantId);

    // 2. Verify commercial entitlement
    const isEntitled = await entitlementService.canAccess(session, 'MODULE_AI_COPILOT');
    if (!isEntitled) {
      voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      throw new AppError({
        message: "Commercial entitlement 'MODULE_AI_COPILOT' required for Voice AI",
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // 3. Ingestion validation
    const validated = validateAudioPayload(rawAudio, mimeType);

    // 4. Invoke STT provider
    const traceId = crypto.randomUUID();
    const rawResult = await getSttProvider().transcribe(validated.buffer, validated.mimeType, { traceId });

    // 5. P0-01: Untrusted-by-default Clinical Safety Evaluation
    const clinicalSafety = ClinicalSafetyService.validateSpeechTranscript(rawResult.transcript);

    return {
      ...rawResult,
      clinicalSafety
    };
  }

  /**
   * Synthesizes text to speech audio.
   */
  async synthesizeText(
    session: SessionContext,
    text: string,
    options: {
      voice?: string | undefined;
      safetyCategory?: ActionSafetyCategory | undefined;
    } = {}
  ): Promise<TtsSynthesisResult> {
    // 1. Voice rate limit check
    voiceRateLimiter.checkLimit(session.userId, session.tenantId);

    // 2. Commercial entitlement
    const isEntitled = await entitlementService.canAccess(session, 'MODULE_AI_COPILOT');
    if (!isEntitled) {
      voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      throw new AppError({
        message: "Commercial entitlement 'MODULE_AI_COPILOT' required for Voice AI",
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    if (!text || !text.trim()) {
      throw AppError.badRequest('Text for synthesis cannot be empty');
    }

    const traceId = crypto.randomUUID();
    return await getTtsProvider().synthesize(text, {
      voice: options.voice,
      safetyCategory: options.safetyCategory || 'INFORMATIONAL',
      traceId
    });
  }

  /**
   * Full Voice Interaction Pipeline:
   * Audio -> STT -> Untrusted Transcript -> 9-gate Permission Firewall -> AI Core -> Persist -> TTS -> Audio
   */
  async processVoiceInteraction(
    session: SessionContext,
    input: ProcessVoiceInteractionInput
  ): Promise<VoiceExecutionResponse> {
    const overallStartTime = Date.now();

    // 0. Check Idempotency Key (Replay Protection)
    if (input.idempotencyKey) {
      const cacheKey = `${session.tenantId}:${session.userId}:${input.idempotencyKey}`;
      const cached = this.idempotencyCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.IDEMPOTENCY_TTL_MS) {
        logger.info('Returning cached response for idempotency key', {
          idempotencyKey: input.idempotencyKey
        });
        return {
          ...cached.response,
          cached: true
        };
      }
    }

    // 1. Voice Rate Limiting & Abuse Check
    voiceRateLimiter.checkLimit(session.userId, session.tenantId);

    // 2. Commercial Entitlement Check
    const isEntitled = await entitlementService.canAccess(session, 'MODULE_AI_COPILOT');
    if (!isEntitled) {
      voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      throw new AppError({
        message: "Commercial entitlement 'MODULE_AI_COPILOT' required for Voice AI",
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // 3. Audio Ingestion Validation
    const validated = validateAudioPayload(input.audio, input.mimeType);

    // 4. STT Transcription (Untrusted Natural Language Extraction)
    const traceId = crypto.randomUUID();
    let sttResult: SttTranscriptionResult;
    try {
      sttResult = await getSttProvider().transcribe(validated.buffer, validated.mimeType, {
        traceId
      });
    } catch (err: any) {
      logger.error('STT Transcription failure in voice pipeline', {
        traceId,
        error: err.message
      });
      throw err;
    }

    const untrustedTranscript = sttResult.transcript.trim();
    if (!untrustedTranscript) {
      throw AppError.badRequest('No intelligible speech could be transcribed from audio');
    }

    // 4.1 P0-01: Untrusted-by-default Clinical Safety Evaluation
    const clinicalSafety = ClinicalSafetyService.validateSpeechTranscript(untrustedTranscript);

    // 5. Conversation Resolution or Auto-Creation
    let conversation: AiChatConversation;
    const roleContext = resolveRoleContext(session);

    if (input.conversationId) {
      const existing = await aiChatRepository.getConversation(session, input.conversationId);
      if (!existing) {
        throw new AppError({
          message: `Conversation '${input.conversationId}' not found or access denied`,
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }
      if (existing.status === 'ARCHIVED') {
        throw new AppError({
          message: 'Cannot send voice messages to an archived conversation',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      conversation = existing;
    } else {
      const summarySnippet =
        untrustedTranscript.length > 30
          ? `${untrustedTranscript.slice(0, 30)}...`
          : untrustedTranscript;
      conversation = await aiChatRepository.createConversation(session, {
        title: `Voice: ${summarySnippet}`,
        branchId: session.branchId,
        role: roleContext.role,
        patientMrn: roleContext.patientMrn,
        metadata: {
          channel: 'VOICE',
          sttProvider: sttResult.provider
        }
      });
    }

    // 6. Role Context & Permitted Capability Resolution
    let targetCapabilityId = input.capabilityId;
    if (!targetCapabilityId) {
      targetCapabilityId = roleContext.permittedCapabilities[0];
    }

    if (!targetCapabilityId) {
      voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      throw new AppError({
        message: `Role '${roleContext.role}' has no authorized AI capabilities`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // Cross-role capability escalation check
    if (!session.isSuperAdmin && !roleContext.permittedCapabilities.includes(targetCapabilityId)) {
      voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      throw new AppError({
        message: `Cross-role escalation violation: Role '${roleContext.role}' is not permitted to invoke capability '${targetCapabilityId}'`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // 7. Store User Voice Message (Persist in database before AI Core with clinical safety metadata)
    const userMessageRecord = await aiChatRepository.createMessage(session, {
      conversationId: conversation.id,
      senderType: 'USER',
      content: untrustedTranscript,
      traceId,
      capabilityId: targetCapabilityId,
      toolId: input.toolId,
      metadata: {
        inputType: 'VOICE',
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        estimatedDurationSeconds: validated.estimatedDurationSeconds,
        sttProvider: sttResult.provider,
        sttConfidence: sttResult.confidence,
        sttLatencyMs: sttResult.latencyMs,
        clinicalSafety
      }
    });

    // 8. Execute Capability or Enforce Clinical Safety Rejection
    if (clinicalSafety.status === 'REJECTED') {
      logger.warn('Clinical safety guard blocked voice execution due to rejected clinical entities', {
        traceId,
        flags: clinicalSafety.safetyFlags,
        summary: clinicalSafety.summary
      });

      const rejectionMessage = clinicalSafety.summary;
      const safetyCategory: ActionSafetyCategory = 'PROPOSED';

      let ttsAudioBase64: string | undefined;
      let ttsMimeType: string | undefined;
      let ttsLatencyMs = 0;

      if (input.synthesizeAudio !== false) {
        try {
          const ttsResult = await getTtsProvider().synthesize(rejectionMessage, {
            safetyCategory,
            traceId
          });
          ttsAudioBase64 = ttsResult.audioBuffer.toString('base64');
          ttsMimeType = ttsResult.mimeType;
          ttsLatencyMs = ttsResult.latencyMs;
        } catch (ttsErr: any) {
          logger.error('TTS synthesis failed during safety rejection notification', {
            traceId,
            error: ttsErr.message
          });
        }
      }

      const assistantMessageRecord = await aiChatRepository.createMessage(session, {
        conversationId: conversation.id,
        senderType: 'ASSISTANT',
        content: rejectionMessage,
        capabilityId: targetCapabilityId,
        toolId: input.toolId,
        toolInput: input.toolInput || null,
        toolOutput: null,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        traceId,
        metadata: {
          inputType: 'VOICE',
          auditHash: userMessageRecord.id,
          actionClassification: 'READ_ONLY',
          safetyCategory,
          hasAudio: Boolean(ttsAudioBase64),
          ttsLatencyMs,
          clinicalSafetyBlocked: true
        }
      });

      const response: VoiceExecutionResponse = {
        conversationId: conversation.id,
        userMessageId: userMessageRecord.id,
        assistantMessageId: assistantMessageRecord.id,
        transcript: untrustedTranscript,
        content: rejectionMessage,
        safetyCategory,
        audio: ttsAudioBase64,
        audioMimeType: ttsMimeType,
        capabilityId: targetCapabilityId,
        toolId: input.toolId,
        role: roleContext.role,
        dataScope: roleContext.dataScope,
        traceId,
        auditHash: userMessageRecord.id,
        clinicalSafety,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - overallStartTime,
          sttLatencyMs: sttResult.latencyMs,
          ttsLatencyMs
        }
      };

      if (input.idempotencyKey) {
        const cacheKey = `${session.tenantId}:${session.userId}:${input.idempotencyKey}`;
        this.idempotencyCache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      }

      return response;
    }

    try {
      const executeOptions: ExecuteCapabilityOptions = {
        prompt: untrustedTranscript,
        toolId: input.toolId,
        toolInput: input.toolInput,
        targetTenantId: input.targetTenantId,
        targetBranchId: input.targetBranchId,
        isApprovalGranted: input.isApprovalGranted,
        approverId: input.approverId,
        approvalCapabilityId: input.approvalCapabilityId,
        correlationId: traceId
      };

      const aiResult = await aiCore.executeCapability(
        session,
        targetCapabilityId,
        executeOptions
      );

      // 9. Process Text Response & Action Classification
      let rawAssistantContent = '';
      if (typeof aiResult.data === 'string') {
        rawAssistantContent = aiResult.data;
      } else if (aiResult.data && typeof aiResult.data === 'object') {
        const resObj = aiResult.data as Record<string, unknown>;
        if (typeof resObj['response'] === 'string') {
          rawAssistantContent = resObj['response'];
        } else if (typeof resObj['content'] === 'string') {
          rawAssistantContent = resObj['content'];
        } else {
          rawAssistantContent = JSON.stringify(aiResult.data);
        }
      } else {
        rawAssistantContent = 'Voice instruction processed successfully.';
      }

      // 10. Voice Response Safety Categorization
      // Invariant: Spoken responses must distinguish between PROPOSED, PENDING_CONFIRMATION, and EXECUTED
      let safetyCategory = categorizeVoiceResponse(
        aiResult.actionClassification
      );
      if (input.isApprovalGranted && aiResult.success && safetyCategory === 'PENDING_CONFIRMATION') {
        safetyCategory = 'EXECUTED';
      }
      const sanitizedResponseContent = sanitizeVoiceSpokenText(
        rawAssistantContent,
        safetyCategory
      );

      // 11. TTS Synthesis (Optional, defaults to true)
      let ttsAudioBase64: string | undefined;
      let ttsMimeType: string | undefined;
      let ttsLatencyMs = 0;

      if (input.synthesizeAudio !== false) {
        try {
          const ttsResult = await getTtsProvider().synthesize(sanitizedResponseContent, {
            safetyCategory,
            traceId
          });
          ttsAudioBase64 = ttsResult.audioBuffer.toString('base64');
          ttsMimeType = ttsResult.mimeType;
          ttsLatencyMs = ttsResult.latencyMs;
        } catch (ttsErr: any) {
          logger.error('TTS synthesis failed, falling back to text-only voice response', {
            traceId,
            error: ttsErr.message
          });
          // Invariant: If TTS fails, text response is preserved, action state is unchanged
        }
      }

      // 12. Store Assistant Voice Message
      const assistantMessageRecord = await aiChatRepository.createMessage(session, {
        conversationId: conversation.id,
        senderType: 'ASSISTANT',
        content: sanitizedResponseContent,
        capabilityId: targetCapabilityId,
        toolId: aiResult.toolId,
        toolInput: input.toolInput || null,
        toolOutput:
          typeof aiResult.data === 'object'
            ? (aiResult.data as Record<string, unknown>)
            : null,
        inputTokens: aiResult.usage.inputTokens,
        outputTokens: aiResult.usage.outputTokens,
        latencyMs: aiResult.usage.durationMs,
        traceId: aiResult.audit.traceId,
        metadata: {
          inputType: 'VOICE',
          auditHash: aiResult.audit.integrityHash,
          actionClassification: aiResult.actionClassification,
          safetyCategory,
          hasAudio: Boolean(ttsAudioBase64),
          ttsLatencyMs
        }
      });

      const response: VoiceExecutionResponse = {
        conversationId: conversation.id,
        userMessageId: userMessageRecord.id,
        assistantMessageId: assistantMessageRecord.id,
        transcript: untrustedTranscript,
        content: sanitizedResponseContent,
        safetyCategory,
        audio: ttsAudioBase64,
        audioMimeType: ttsMimeType,
        capabilityId: targetCapabilityId,
        toolId: aiResult.toolId,
        role: roleContext.role,
        dataScope: roleContext.dataScope,
        traceId: aiResult.audit.traceId,
        auditHash: aiResult.audit.integrityHash,
        clinicalSafety,
        usage: {
          inputTokens: aiResult.usage.inputTokens,
          outputTokens: aiResult.usage.outputTokens,
          latencyMs: Date.now() - overallStartTime,
          sttLatencyMs: sttResult.latencyMs,
          ttsLatencyMs
        }
      };

      // 13. Save to Idempotency Cache if key provided
      if (input.idempotencyKey) {
        const cacheKey = `${session.tenantId}:${session.userId}:${input.idempotencyKey}`;
        this.idempotencyCache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (err: any) {
      if (err.statusCode === 403 || err.statusCode === 401) {
        voiceRateLimiter.recordViolation(session.userId, session.tenantId);
      }
      throw err;
    }
  }

  /**
   * Resets internal idempotency cache (for test suite isolation).
   */
  resetCache(): void {
    this.idempotencyCache.clear();
  }
}

export const aiVoiceService = new AiVoiceService();
