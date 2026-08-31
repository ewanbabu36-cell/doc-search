import { type FastifyPluginAsync } from 'fastify';
import { executiveService } from '../../services/company/ExecutiveService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const executiveRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/executive/overview',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const summary = await executiveService.getOverview(request.session);
      return { success: true, data: summary };
    }
  );
};
