import { type FastifyPluginAsync } from 'fastify';
import { analyticsService } from '../../services/company/AnalyticsService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/analytics/reports',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const reports = await analyticsService.getReports(request.session);
      return { success: true, data: reports };
    }
  );

  fastify.get(
    '/api/v1/company/analytics/insights',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const insights = await analyticsService.getInsights(request.session);
      return { success: true, data: insights };
    }
  );
};
