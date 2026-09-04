import crypto from 'node:crypto';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';
import { aiChatRepository, type CreateConversationInput } from '../../repositories/core/AiChatRepository.js';
import { aiCore, type ExecuteCapabilityOptions } from '../../ai/ai-core.js';
import { chatRateLimiter } from '../../ai/chat-rate-limiter.js';
import { resolveRoleContext } from '../../ai/role-context.js';
import { entitlementService } from '../company/EntitlementService.js';
import type { AiChatConversation, AiChatMessage } from '@docsearch/database';

export interface SendChatMessageInput {
  conversationId: string;
  message: string;
  capabilityId?: string | undefined;
  toolId?: string | undefined;
  toolInput?: Record<string, unknown> | undefined;
  targetTenantId?: string | undefined;
  targetBranchId?: string | undefined;
  isApprovalGranted?: boolean | undefined;
  approverId?: string | undefined;
  approvalCapabilityId?: string | undefined;
}

export interface ChatExecutionResponse {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  content: string;
  capabilityId: string;
  toolId?: string | undefined;
  role: string;
  dataScope: string;
  traceId: string;
  auditHash: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
}

export class AiChatService {
  /**
   * Creates a new conversation for the authenticated user and tenant.
   */
  async createConversation(
    session: SessionContext,
    input: CreateConversationInput
  ): Promise<AiChatConversation> {
    // 1. Verify commercial entitlement for AI Copilot
    const isEntitled = await entitlementService.canAccess(session, 'MODULE_AI_COPILOT');
    if (!isEntitled) {
      throw new AppError({
        message: "Commercial entitlement 'MODULE_AI_COPILOT' required for AI Chat",
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const roleContext = resolveRoleContext(session);
    return await aiChatRepository.createConversation(session, {
      title: input.title,
      branchId: input.branchId,
      metadata: input.metadata,
      role: roleContext.role,
      patientMrn: roleContext.patientMrn
    });
  }

  /**
   * Retrieves a conversation ensuring tenant & patient isolation.
   */
  async getConversation(
    session: SessionContext,
    conversationId: string
  ): Promise<AiChatConversation> {
    const conv = await aiChatRepository.getConversation(session, conversationId);
    if (!conv) {
      throw new AppError({
        message: `Conversation '${conversationId}' not found or access denied`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }
    return conv;
  }

  /**
   * Lists conversations for the current session.
   */
  async listConversations(
    session: SessionContext,
    options: { limit?: number | undefined; status?: string | undefined } = {}
  ): Promise<AiChatConversation[]> {
    return await aiChatRepository.listConversations(session, options);
  }

  /**
   * Archives a conversation.
   */
  async archiveConversation(
    session: SessionContext,
    conversationId: string
  ): Promise<AiChatConversation> {
    const archived = await aiChatRepository.archiveConversation(session, conversationId);
    if (!archived) {
      throw new AppError({
        message: `Conversation '${conversationId}' not found or access denied`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }
    return archived;
  }

  /**
   * Lists messages in a conversation.
   */
  async listMessages(
    session: SessionContext,
    conversationId: string,
    limit = 50
  ): Promise<AiChatMessage[]> {
    await this.getConversation(session, conversationId);
    return await aiChatRepository.listMessages(session, conversationId, limit);
  }

  /**
   * Sends a user message, passes execution through the 9-gate Permission Firewall and AI Core,
   * stores both user and assistant messages persistently, and returns the response.
   */
  async sendMessage(
    session: SessionContext,
    input: SendChatMessageInput
  ): Promise<ChatExecutionResponse> {
    if (!input.message || typeof input.message !== 'string' || !input.message.trim()) {
      throw new AppError({
        message: 'Message content cannot be empty',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    // 1. Rate Limiting & Abuse Check
    const rateResult = chatRateLimiter.checkLimit(session.tenantId, session.userId);
    if (!rateResult.allowed) {
      throw new AppError({
        message: `AI Chat rate limit exceeded: ${rateResult.reason}. Please try again later.`,
        code: 'AI_RATE_LIMITED' as unknown as ErrorCode,
        statusCode: 429
      });
    }

    // 2. Validate Conversation Ownership
    const conv = await this.getConversation(session, input.conversationId);
    if (conv.status === 'ARCHIVED') {
      throw new AppError({
        message: 'Cannot send messages to an archived conversation',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    // 3. Resolve Role Context & Capability
    const roleContext = resolveRoleContext(session);
    let targetCapabilityId = input.capabilityId;

    if (!targetCapabilityId) {
      targetCapabilityId = roleContext.permittedCapabilities[0];
    }

    if (!targetCapabilityId) {
      chatRateLimiter.recordSecurityViolation(session.tenantId, session.userId);
      throw new AppError({
        message: `Role '${roleContext.role}' has no authorized AI capabilities`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // Explicit cross-role capability escalation check
    if (!session.isSuperAdmin && !roleContext.permittedCapabilities.includes(targetCapabilityId)) {
      chatRateLimiter.recordSecurityViolation(session.tenantId, session.userId);
      throw new AppError({
        message: `Cross-role escalation violation: Role '${roleContext.role}' is not permitted to invoke capability '${targetCapabilityId}'`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // 4. Retrieve Context Window (Last 10 messages for context minimization)
    const recentMessages = await aiChatRepository.listMessages(session, input.conversationId, 10);
    const contextHistory = recentMessages.map((m) => `${m.senderType}: ${m.content}`).join('\n');
    const combinedPrompt = contextHistory ? `${contextHistory}\nUSER: ${input.message.trim()}` : input.message.trim();

    // 5. Store User Message
    const traceId = crypto.randomUUID();
    const userMessageRecord = await aiChatRepository.createMessage(session, {
      conversationId: input.conversationId,
      senderType: 'USER',
      content: input.message.trim(),
      traceId,
      capabilityId: targetCapabilityId,
      toolId: input.toolId
    });

    // 6. Execute Capability via AI Core Orchestrator
    try {
      const executeOptions: ExecuteCapabilityOptions = {
        prompt: combinedPrompt,
        toolId: input.toolId,
        toolInput: input.toolInput,
        targetTenantId: input.targetTenantId,
        targetBranchId: input.targetBranchId,
        isApprovalGranted: input.isApprovalGranted,
        approverId: input.approverId,
        approvalCapabilityId: input.approvalCapabilityId,
        correlationId: userMessageRecord.traceId
      };

      const result = await aiCore.executeCapability(session, targetCapabilityId, executeOptions);

      // Extract text content from result.data
      let assistantContent = '';
      if (typeof result.data === 'string') {
        assistantContent = result.data;
      } else if (result.data && typeof result.data === 'object') {
        const resObj = result.data as Record<string, unknown>;
        if (typeof resObj['response'] === 'string') {
          assistantContent = resObj['response'];
        } else if (typeof resObj['content'] === 'string') {
          assistantContent = resObj['content'];
        } else {
          assistantContent = JSON.stringify(result.data);
        }
      } else {
        assistantContent = 'Response processed successfully.';
      }

      // 7. Store Assistant Message
      const assistantMessageRecord = await aiChatRepository.createMessage(session, {
        conversationId: input.conversationId,
        senderType: 'ASSISTANT',
        content: assistantContent,
        capabilityId: targetCapabilityId,
        toolId: result.toolId,
        toolInput: input.toolInput || null,
        toolOutput: typeof result.data === 'object' ? (result.data as Record<string, unknown>) : null,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        latencyMs: result.usage.durationMs,
        traceId: result.audit.traceId,
        metadata: {
          auditHash: result.audit.integrityHash,
          actionClassification: result.actionClassification
        }
      });

      return {
        conversationId: input.conversationId,
        userMessageId: userMessageRecord.id,
        assistantMessageId: assistantMessageRecord.id,
        content: assistantContent,
        capabilityId: targetCapabilityId,
        toolId: result.toolId,
        role: roleContext.role,
        dataScope: roleContext.dataScope,
        traceId: result.audit.traceId,
        auditHash: result.audit.integrityHash,
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          latencyMs: result.usage.durationMs
        }
      };
    } catch (err: any) {
      if (err.statusCode === 403 || err.statusCode === 401) {
        chatRateLimiter.recordSecurityViolation(session.tenantId, session.userId);
      }
      throw err;
    }
  }
}

export const aiChatService = new AiChatService();
