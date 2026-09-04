import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireActiveCommercialAccess } from '../../plugins/commercial-guard.js';
import { aiChatService, type SendChatMessageInput } from '../../services/partner/AiChatService.js';
import { AppError } from '@docsearch/shared-core';

export const aiChatRoutes: FastifyPluginAsync = async (app) => {
  /**
   * 1. Create a new persistent AI chat conversation
   */
  app.post(
    '/api/v1/partner/ai/chat/conversations',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        title?: string | undefined;
        branchId?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
      };

      const conversation = await aiChatService.createConversation(request.session, {
        title: body.title,
        branchId: body.branchId,
        metadata: body.metadata
      });

      return reply.status(201).send({
        success: true,
        data: conversation
      });
    }
  );

  /**
   * 2. List persistent AI chat conversations for the caller
   */
  app.get(
    '/api/v1/partner/ai/chat/conversations',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const query = (request.query || {}) as { limit?: string | undefined; status?: string | undefined };
      const limit = query.limit ? Number.parseInt(query.limit, 10) : 50;

      const conversations = await aiChatService.listConversations(request.session, {
        limit: Number.isNaN(limit) ? 50 : limit,
        status: query.status
      });

      return reply.send({
        success: true,
        data: conversations
      });
    }
  );

  /**
   * 3. Get specific conversation with message history
   */
  app.get(
    '/api/v1/partner/ai/chat/conversations/:conversationId',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const conversation = await aiChatService.getConversation(request.session, conversationId);
      const messages = await aiChatService.listMessages(request.session, conversationId);

      return reply.send({
        success: true,
        data: {
          ...conversation,
          messages
        }
      });
    }
  );

  /**
   * 4. Send message and execute AI capability through Permission Firewall
   */
  app.post(
    '/api/v1/partner/ai/chat/conversations/:conversationId/messages',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const body = (request.body || {}) as {
        message?: string | undefined;
        content?: string | undefined;
        capabilityId?: string | undefined;
        toolId?: string | undefined;
        toolInput?: Record<string, unknown> | undefined;
        targetTenantId?: string | undefined;
        targetBranchId?: string | undefined;
        isApprovalGranted?: boolean | undefined;
        approverId?: string | undefined;
        approvalCapabilityId?: string | undefined;
      };

      const messageContent = body.message || body.content;
      if (!messageContent || typeof messageContent !== 'string') {
        throw new AppError({
          message: "Field 'message' or 'content' is required",
          statusCode: 400
        });
      }

      const input: SendChatMessageInput = {
        conversationId,
        message: messageContent,
        capabilityId: body.capabilityId,
        toolId: body.toolId,
        toolInput: body.toolInput,
        targetTenantId: body.targetTenantId,
        targetBranchId: body.targetBranchId,
        isApprovalGranted: body.isApprovalGranted,
        approverId: body.approverId,
        approvalCapabilityId: body.approvalCapabilityId
      };

      const response = await aiChatService.sendMessage(request.session, input);

      return reply.send({
        success: true,
        data: response
      });
    }
  );

  /**
   * 5. Archive conversation
   */
  app.post(
    '/api/v1/partner/ai/chat/conversations/:conversationId/archive',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const archived = await aiChatService.archiveConversation(request.session, conversationId);

      return reply.send({
        success: true,
        data: archived
      });
    }
  );
};
