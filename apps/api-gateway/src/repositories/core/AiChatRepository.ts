import crypto from 'node:crypto';
import {
  getDatabase,
  eq,
  and,
  desc,
  asc,
  aiChatConversations,
  aiChatMessages,
  type AiChatConversation,
  type NewAiChatConversation,
  type AiChatMessage,
  type NewAiChatMessage
} from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { resolveRoleContext } from '../../ai/role-context.js';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('ai-chat-repository');

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function handleDbError(operation: string, err: unknown): never {
  if (err instanceof AppError) throw err;
  logger.error(`AI Chat DB operation '${operation}' failed:`, err);
  throw new AppError({
    message: `Database operation failed for AI Chat '${operation}': ${(err as any)?.message || String(err)}`,
    code: ErrorCode.DATABASE_ERROR,
    statusCode: 500
  });
}

export interface CreateConversationInput {
  title?: string | undefined;
  role?: string | undefined;
  patientMrn?: string | undefined;
  branchId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface CreateMessageInput {
  conversationId: string;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  capabilityId?: string | undefined;
  toolId?: string | undefined;
  toolInput?: Record<string, unknown> | null | undefined;
  toolOutput?: Record<string, unknown> | null | undefined;
  modelProvider?: string | undefined;
  modelVersion?: string | undefined;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  latencyMs?: number | undefined;
  traceId: string;
  metadata?: Record<string, unknown> | undefined;
}

export class AiChatRepository {
  async createConversation(
    session: SessionContext,
    input: CreateConversationInput,
    dbClient = getDatabase()
  ): Promise<AiChatConversation> {
    if (!dbClient) handleDbError('createConversation', new Error('Database connection unavailable'));

    const id = crypto.randomUUID();
    const now = new Date();
    const roleContext = resolveRoleContext(session);
    const roleCandidate = input.role || roleContext.role || session.roles[0];
    const effectiveRole: string = roleCandidate || 'GUEST';
    const effectiveBranchId = input.branchId && isUuid(input.branchId)
      ? input.branchId
      : (session.branchId && isUuid(session.branchId) ? session.branchId : null);
    const effectivePatientMrn = roleContext.patientMrn || input.patientMrn || null;

    const record: NewAiChatConversation = {
      id,
      tenantId: session.tenantId,
      branchId: effectiveBranchId,
      userId: session.userId,
      role: effectiveRole,
      patientMrn: effectivePatientMrn,
      title: input.title || 'New Conversation',
      status: 'ACTIVE',
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };

    try {
      const [inserted] = await dbClient.insert(aiChatConversations).values(record).returning();
      if (!inserted) {
        throw new Error('Database insert succeeded but returned no row');
      }
      return inserted;
    } catch (err) {
      handleDbError('createConversation', err);
    }
  }

  async getConversation(
    session: SessionContext,
    conversationId: string,
    dbClient = getDatabase()
  ): Promise<AiChatConversation | null> {
    if (!dbClient) handleDbError('getConversation', new Error('Database connection unavailable'));
    if (!isUuid(conversationId)) return null;

    const roleContext = resolveRoleContext(session);
    try {
      const results = await dbClient
        .select()
        .from(aiChatConversations)
        .where(
          and(
            eq(aiChatConversations.id, conversationId),
            eq(aiChatConversations.tenantId, session.tenantId)
          )
        )
        .limit(1);

      if (results.length > 0 && results[0]) {
        const conv = results[0];
        if (roleContext.patientMrn && conv.patientMrn && conv.patientMrn !== roleContext.patientMrn) {
          return null;
        }
        return conv;
      }
      return null;
    } catch (err) {
      handleDbError('getConversation', err);
    }
  }

  async listConversations(
    session: SessionContext,
    options: { limit?: number | undefined; status?: string | undefined } = {},
    dbClient = getDatabase()
  ): Promise<AiChatConversation[]> {
    if (!dbClient) handleDbError('listConversations', new Error('Database connection unavailable'));

    const limit = options.limit || 50;
    const roleContext = resolveRoleContext(session);

    try {
      const conditions = [
        eq(aiChatConversations.tenantId, session.tenantId),
        eq(aiChatConversations.userId, session.userId)
      ];
      if (options.status) {
        conditions.push(eq(aiChatConversations.status, options.status));
      }
      if (roleContext.patientMrn) {
        conditions.push(eq(aiChatConversations.patientMrn, roleContext.patientMrn));
      }

      return await dbClient
        .select()
        .from(aiChatConversations)
        .where(and(...conditions))
        .orderBy(desc(aiChatConversations.updatedAt))
        .limit(limit);
    } catch (err) {
      handleDbError('listConversations', err);
    }
  }

  async archiveConversation(
    session: SessionContext,
    conversationId: string,
    dbClient = getDatabase()
  ): Promise<AiChatConversation | null> {
    if (!dbClient) handleDbError('archiveConversation', new Error('Database connection unavailable'));
    if (!isUuid(conversationId)) return null;

    const conv = await this.getConversation(session, conversationId, dbClient);
    if (!conv) return null;

    const now = new Date();
    try {
      const [updated] = await dbClient
        .update(aiChatConversations)
        .set({ status: 'ARCHIVED', updatedAt: now })
        .where(
          and(
            eq(aiChatConversations.id, conversationId),
            eq(aiChatConversations.tenantId, session.tenantId)
          )
        )
        .returning();
      return updated || null;
    } catch (err) {
      handleDbError('archiveConversation', err);
    }
  }

  async createMessage(
    session: SessionContext,
    input: CreateMessageInput,
    dbClient = getDatabase()
  ): Promise<AiChatMessage> {
    if (!dbClient) handleDbError('createMessage', new Error('Database connection unavailable'));
    if (!isUuid(input.conversationId)) {
      throw AppError.badRequest('Invalid conversationId UUID');
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const effectiveBranchId = session.branchId && isUuid(session.branchId) ? session.branchId : null;

    const record: NewAiChatMessage = {
      id,
      conversationId: input.conversationId,
      tenantId: session.tenantId,
      branchId: effectiveBranchId,
      senderType: input.senderType,
      userId: input.senderType === 'USER' ? session.userId : null,
      content: input.content,
      capabilityId: input.capabilityId || null,
      toolId: input.toolId || null,
      toolInput: input.toolInput || null,
      toolOutput: input.toolOutput || null,
      modelProvider: input.modelProvider || 'anthropic',
      modelVersion: input.modelVersion || 'claude-3-5-sonnet',
      inputTokens: input.inputTokens || 0,
      outputTokens: input.outputTokens || 0,
      latencyMs: input.latencyMs || 0,
      traceId: input.traceId,
      metadata: input.metadata || {},
      createdAt: now
    };

    try {
      const [inserted] = await dbClient.insert(aiChatMessages).values(record).returning();
      await dbClient
        .update(aiChatConversations)
        .set({ updatedAt: now })
        .where(eq(aiChatConversations.id, input.conversationId));

      if (!inserted) {
        throw new Error('Database insert succeeded but returned no message row');
      }
      return inserted;
    } catch (err) {
      handleDbError('createMessage', err);
    }
  }

  async listMessages(
    session: SessionContext,
    conversationId: string,
    limit = 50,
    dbClient = getDatabase()
  ): Promise<AiChatMessage[]> {
    if (!dbClient) handleDbError('listMessages', new Error('Database connection unavailable'));
    if (!isUuid(conversationId)) return [];

    const conv = await this.getConversation(session, conversationId, dbClient);
    if (!conv) {
      return [];
    }

    try {
      return await dbClient
        .select()
        .from(aiChatMessages)
        .where(
          and(
            eq(aiChatMessages.conversationId, conversationId),
            eq(aiChatMessages.tenantId, session.tenantId)
          )
        )
        .orderBy(asc(aiChatMessages.createdAt))
        .limit(limit);
    } catch (err) {
      handleDbError('listMessages', err);
    }
  }
}

export const aiChatRepository = new AiChatRepository();
