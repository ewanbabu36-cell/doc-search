import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireActiveCommercialAccess } from '../../plugins/commercial-guard.js';
import {
  aiVoiceService,
  type ProcessVoiceInteractionInput
} from '../../services/partner/AiVoiceService.js';
import { aiScribeExtractionService } from '../../services/partner/AiScribeExtractionService.js';
import type { ActionSafetyCategory } from '../../ai/voice/tts-provider.js';
import { AppError } from '@docsearch/shared-core';

export const aiVoiceRoutes: FastifyPluginAsync = async (app) => {
  /**
   * 1. Transcribe untrusted audio without capability execution
   */
  app.post(
    '/api/v1/partner/ai/voice/transcribe',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        audio?: string | undefined;
        mimeType?: string | undefined;
      };

      if (!body.audio) {
        throw AppError.badRequest("Field 'audio' is required (base64 encoded audio)");
      }

      const mimeType = body.mimeType || 'audio/wav';
      const result = await aiVoiceService.transcribeAudio(
        request.session,
        body.audio,
        mimeType
      );

      return reply.send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 2. Full Voice Interaction (Audio -> STT -> Permission Firewall -> AI Core -> Persist -> TTS -> Audio & Text)
   */
  app.post(
    '/api/v1/partner/ai/voice/interact',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        audio?: string | undefined;
        mimeType?: string | undefined;
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
      };

      if (!body.audio) {
        throw AppError.badRequest("Field 'audio' is required (base64 encoded audio)");
      }

      const idempotencyKey =
        (request.headers['x-idempotency-key'] as string | undefined) ||
        (request.headers['idempotency-key'] as string | undefined);

      const input: ProcessVoiceInteractionInput = {
        audio: body.audio,
        mimeType: body.mimeType || 'audio/wav',
        conversationId: body.conversationId,
        capabilityId: body.capabilityId,
        toolId: body.toolId,
        toolInput: body.toolInput,
        targetTenantId: body.targetTenantId,
        targetBranchId: body.targetBranchId,
        isApprovalGranted: body.isApprovalGranted,
        approverId: body.approverId,
        approvalCapabilityId: body.approvalCapabilityId,
        synthesizeAudio: body.synthesizeAudio !== false,
        idempotencyKey
      };

      const response = await aiVoiceService.processVoiceInteraction(request.session, input);

      return reply.send({
        success: true,
        data: response
      });
    }
  );

  /**
   * 3. Synthesize text to speech
   */
  app.post(
    '/api/v1/partner/ai/voice/synthesize',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        text?: string | undefined;
        voice?: string | undefined;
        safetyCategory?: ActionSafetyCategory | undefined;
      };

      if (!body.text || !body.text.trim()) {
        throw AppError.badRequest("Field 'text' is required for voice synthesis");
      }

      const result = await aiVoiceService.synthesizeText(request.session, body.text, {
        voice: body.voice,
        safetyCategory: body.safetyCategory
      });

      return reply.send({
        success: true,
        data: {
          audio: result.audioBuffer.toString('base64'),
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
          durationSeconds: result.durationSeconds,
          safetyCategory: result.safetyCategory,
          latencyMs: result.latencyMs
        }
      });
    }
  );

  /**
   * 4. Extract structured clinical SOAP notes, diagnoses, medications, and lab tests from speech transcripts
   */
  app.post(
    '/api/v1/partner/ai/voice/extract-soap',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        transcript?: string;
        patientContext?: any;
        doctorSpecialty?: string;
      };

      if (!body.transcript || !body.transcript.trim()) {
        throw AppError.badRequest("Field 'transcript' is required for clinical SOAP extraction");
      }

      const result = await aiScribeExtractionService.extractSoapFromTranscript(
        request.session,
        body as any
      );

      return reply.send({
        success: true,
        data: result
      });
    }
  );
};

