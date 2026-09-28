import { type FastifyPluginAsync } from 'fastify';
import { salesMarketingService } from '../../services/company/SalesMarketingService.js';
import { authenticate, optionalAuthenticate, requirePermission } from '../../plugins/auth-guard.js';

export const salesMarketingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/sales/leads',
    {
      preHandler: [authenticate]
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

  fastify.post(
    '/api/v1/company/sales/leads',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request, reply) => {
      const body = request.body as any;
      const lead = await salesMarketingService.createLead(body, request.session);
      return reply.status(201).send({ success: true, data: lead });
    }
  );

  fastify.patch(
    '/api/v1/company/sales/leads/:id/stage',
    {
      preHandler: [authenticate, requirePermission('sales', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { status: string; notes?: string };
      const updated = await salesMarketingService.updateLeadStatus(id, body.status, body.notes, request.session);
      return { success: true, data: updated };
    }
  );

  fastify.get(
    '/api/v1/company/sales/leads/:id/check-duplicate',
    {
      preHandler: [authenticate, requirePermission('sales', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const duplicates = await salesMarketingService.checkLeadDuplicate(id, request.session);
      return { success: true, data: duplicates };
    }
  );

  fastify.post(
    '/api/v1/company/sales/leads/:id/convert',
    {
      preHandler: [authenticate, requirePermission('sales', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as any;
      const result = await salesMarketingService.convertLeadToPartner(id, body, request.session);
      return reply.status(201).send({ success: true, data: result });
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

