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
    '/api/v1/company/communication/templates',
    {
      preHandler: [authenticate, requirePermission('communication', 'read')]
    },
    async (request) => {
      const templates = await communicationService.getTemplates(request.session);
      return { success: true, data: templates };
    }
  );
};
