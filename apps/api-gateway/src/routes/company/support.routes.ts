import { type FastifyPluginAsync } from 'fastify';
import { supportService } from '../../services/company/SupportService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const supportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/support/tickets',
    {
      preHandler: [authenticate, requirePermission('support', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; priority?: string };
      const tickets = await supportService.getTickets(query.status, query.priority, request.session);
      return { success: true, data: tickets };
    }
  );

  fastify.get(
    '/api/v1/company/support/tickets/:id',
    {
      preHandler: [authenticate, requirePermission('support', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const ticket = await supportService.getTicketById(id, request.session);
      return { success: true, data: ticket };
    }
  );

  fastify.get(
    '/api/v1/company/support/health',
    {
      preHandler: [authenticate, requirePermission('support', 'read')]
    },
    async (request) => {
      const query = request.query as { partnerId?: string };
      const health = await supportService.getPartnerHealth(query.partnerId, request.session);
      return { success: true, data: health };
    }
  );
};
