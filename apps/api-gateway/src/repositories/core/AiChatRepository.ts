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
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('ai-chat-repository');

// Memory fallback store for standalone tests / offline mode
const memoryConversations = new Map<string, AiChatConversation>();
const memoryMessages: AiChatMessage[] = [];

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
    const id = crypto.randomUUID();
    const now = new Date();
    const roleContext = resolveRoleContext(session);
    const roleCandidate = input.role || roleContext.role || session.roles[0];
    const effectiveRole: string = roleCandidate || 'GUEST';
    const effectiveBranchId = input.branchId || session.branchId || null;
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

    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(aiChatConversations).values(record).returning();
        if (inserted) {
          memoryConversations.set(inserted.id, inserted);
          return inserted;
        }
      } catch (err) {
        logger.warn('Failed to insert conversation to DB, falling back to memory store', { error: err });
      }
    }

    const memoryRecord: AiChatConversation = {
      id,
      tenantId: session.tenantId,
      branchId: record.branchId ?? null,
      userId: session.userId,
      role: effectiveRole,
      patientMrn: record.patientMrn ?? null,
      title: record.title || 'New Conversation',
      status: 'ACTIVE',
      metadata: record.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
    memoryConversations.set(id, memoryRecord);
    return memoryRecord;
  }

  async getConversation(
    session: SessionContext,
    conversationId: string,
    dbClient = getDatabase()
  ): Promise<AiChatConversation | null> {
    const roleContext = resolveRoleContext(session);
    if (dbClient) {
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
          // If caller is patient, ensure MRN matches
          if (roleContext.patientMrn && conv.patientMrn && conv.patientMrn !== roleContext.patientMrn) {
            return null;
          }
          return conv;
        }
      } catch (err) {
        logger.warn('Failed to query conversation from DB, falling back to memory store', { error: err });
      }
    }

    const memoryConv = memoryConversations.get(conversationId);
    if (!memoryConv) return null;
    if (memoryConv.tenantId !== session.tenantId) return null;
    if (roleContext.patientMrn && memoryConv.patientMrn && memoryConv.patientMrn !== roleContext.patientMrn) {
      return null;
    }
    return memoryConv;
  }

  async listConversations(
    session: SessionContext,
    options: { limit?: number | undefined; status?: string | undefined } = {},
    dbClient = getDatabase()
  ): Promise<AiChatConversation[]> {
    const limit = options.limit || 50;
    const roleContext = resolveRoleContext(session);

    if (dbClient) {
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
        logger.warn('Failed to list conversations from DB, falling back to memory store', { error: err });
      }
    }

    let list = Array.from(memoryConversations.values()).filter(
      (c) => c.tenantId === session.tenantId && c.userId === session.userId
    );
    if (options.status) {
      list = list.filter((c) => c.status === options.status);
    }
    if (roleContext.patientMrn) {
      list = list.filter((c) => c.patientMrn === roleContext.patientMrn);
    }
    list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return list.slice(0, limit);
  }

  async archiveConversation(
    session: SessionContext,
    conversationId: string,
    dbClient = getDatabase()
  ): Promise<AiChatConversation | null> {
    const conv = await this.getConversation(session, conversationId, dbClient);
    if (!conv) return null;

    const now = new Date();
    if (dbClient) {
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
        if (updated) {
          memoryConversations.set(updated.id, updated);
          return updated;
        }
      } catch (err) {
        logger.warn('Failed to archive conversation in DB, falling back to memory store', { error: err });
      }
    }

    const updatedMem: AiChatConversation = { ...conv, status: 'ARCHIVED', updatedAt: now };
    memoryConversations.set(conversationId, updatedMem);
    return updatedMem;
  }

  async createMessage(
    session: SessionContext,
    input: CreateMessageInput,
    dbClient = getDatabase()
  ): Promise<AiChatMessage> {
    const id = crypto.randomUUID();
    const now = new Date();

    const record: NewAiChatMessage = {
      id,
      conversationId: input.conversationId,
      tenantId: session.tenantId,
      branchId: session.branchId || null,
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

    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(aiChatMessages).values(record).returning();
        await dbClient
          .update(aiChatConversations)
          .set({ updatedAt: now })
          .where(eq(aiChatConversations.id, input.conversationId));

        if (inserted) {
          memoryMessages.push(inserted);
          const memConv = memoryConversations.get(input.conversationId);
          if (memConv) {
            memConv.updatedAt = now;
          }
          return inserted;
        }
      } catch (err) {
        logger.warn('Failed to insert message to DB, falling back to memory store', { error: err });
      }
    }

    const memoryRecord: AiChatMessage = {
      id,
      conversationId: input.conversationId,
      tenantId: session.tenantId,
      branchId: record.branchId ?? null,
      senderType: record.senderType,
      userId: record.userId ?? null,
      content: record.content,
      capabilityId: record.capabilityId ?? null,
      toolId: record.toolId ?? null,
      toolInput: record.toolInput ?? null,
      toolOutput: record.toolOutput ?? null,
      modelProvider: record.modelProvider ?? null,
      modelVersion: record.modelVersion ?? null,
      inputTokens: record.inputTokens ?? 0,
      outputTokens: record.outputTokens ?? 0,
      latencyMs: record.latencyMs ?? 0,
      traceId: record.traceId,
      metadata: record.metadata ?? {},
      createdAt: now
    };
    memoryMessages.push(memoryRecord);
    const memConv = memoryConversations.get(input.conversationId);
    if (memConv) {
      memConv.updatedAt = now;
    }
    return memoryRecord;
  }

  async listMessages(
    session: SessionContext,
    conversationId: string,
    limit = 50,
    dbClient = getDatabase()
  ): Promise<AiChatMessage[]> {
    const conv = await this.getConversation(session, conversationId, dbClient);
    if (!conv) {
      return [];
    }

    if (dbClient) {
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
        logger.warn('Failed to list messages from DB, falling back to memory store', { error: err });
      }
    }

    return memoryMessages
      .filter((m) => m.conversationId === conversationId && m.tenantId === session.tenantId)
      .slice(-limit);
  }

  resetMemoryStore(): void {
    memoryConversations.clear();
    memoryMessages.length = 0;
  }
}

export const aiChatRepository = new AiChatRepository();
