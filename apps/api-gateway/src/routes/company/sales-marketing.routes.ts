import { type FastifyPluginAsync } from 'fastify';
import { salesMarketingService } from '../../services/company/SalesMarketingService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const salesMarketingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/sales/leads',
    {
      preHandler: [authenticate, requirePermission('sales', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string };
      const leads = await salesMarketingService.getLeads(query.status, request.session);
      return { success: true, data: leads };
    }
  );

  fastify.get(
    '/api/v1/company/sales/opportunities',
    {
      preHandler: [authenticate, requirePermission('sales', 'read')]
    },
    async (request) => {
      const query = request.query as { stage?: string };
      const opps = await salesMarketingService.getOpportunities(query.stage, request.session);
      return { success: true, data: opps };
    }
  );

  fastify.get(
    '/api/v1/company/marketing/campaigns',
    {
      preHandler: [authenticate, requirePermission('marketing', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string };
      const campaigns = await salesMarketingService.getCampaigns(query.status, request.session);
      return { success: true, data: campaigns };
    }
  );
};
