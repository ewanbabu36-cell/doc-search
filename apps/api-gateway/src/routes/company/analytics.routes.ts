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
    '/api/v1/company/analytics/saved-reports',
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

  fastify.get(
    '/api/v1/company/analytics/usage-metrics',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const query = request.query as { category?: string };
      const metrics = await analyticsService.getUsageMetrics(request.session, query?.category);
      return { success: true, data: metrics };
    }
  );

  fastify.get(
    '/api/v1/company/analytics/cross-tenant-aggregates',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const aggs = await analyticsService.getCrossTenantAggregates(request.session);
      return { success: true, data: aggs };
    }
  );

  fastify.get(
    '/api/v1/company/analytics/api-telemetry',
    {
      preHandler: [authenticate, requirePermission('analytics', 'read')]
    },
    async (request) => {
      const telemetry = await analyticsService.getApiTelemetry(request.session);
      return { success: true, data: telemetry };
    }
  );
};
