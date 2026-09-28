import { type FastifyPluginAsync } from 'fastify';
import { communicationService } from '../../services/company/CommunicationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const communicationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/communication/content',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string };
      const content = await communicationService.getContentItems(query.status, request.session);
      return { success: true, data: content };
    }
  );

  fastify.get(
    '/api/v1/company/communication/items',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string };
      const content = await communicationService.getContentItems(query.status, request.session);
      return { success: true, data: content };
    }
  );

  fastify.get(
    '/api/v1/company/communication/templates',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const templates = await communicationService.getTemplates(request.session);
      return { success: true, data: templates };
    }
  );

  fastify.get(
    '/api/v1/company/communication/items/:id',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const item = await communicationService.getContentItemById(id, request.session);
      return { success: true, data: item };
    }
  );

  fastify.post(
    '/api/v1/company/communication/items/:id/transition',
    {
      preHandler: [authenticate, requirePermission('communication', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { toStatus: string; reason: string };
      const updated = await communicationService.transitionContentStatus(id, body.toStatus, body.reason, request.session);
      return { success: true, data: updated };
    }
  );

  fastify.get(
    '/api/v1/company/communication/dispatches',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const query = request.query as { contentItemId?: string; partnerId?: string; status?: string };
      const dispatches = await communicationService.getDispatchRecords(query, request.session);
      return { success: true, data: dispatches };
    }
  );

  fastify.post(
    '/api/v1/company/communication/dispatch',
    {
      preHandler: [authenticate, requirePermission('communication', 'create')]
    },
    async (request) => {
      const body = request.body as any;
      const dispatch = await communicationService.triggerDispatch(body, request.session);
      return { success: true, data: dispatch };
    }
  );
};
