import { type FastifyPluginAsync } from 'fastify';
import { aiGovernanceService } from '../../services/company/AIGovernanceService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const aiGovernanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/ai/models',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const models = await aiGovernanceService.getModels(request.session);
      return { success: true, data: models };
    }
  );

  fastify.get(
    '/api/v1/company/ai/models/:id',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const model = await aiGovernanceService.getModelById(id, request.session);
      return { success: true, data: model };
    }
  );

  fastify.patch(
    '/api/v1/company/ai/models/:id',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const updated = await aiGovernanceService.updateModel(id, body, request.session);
      return { success: true, data: updated };
    }
  );

  fastify.get(
    '/api/v1/company/ai/policies',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const policies = await aiGovernanceService.getPolicies(request.session);
      return { success: true, data: policies };
    }
  );

  fastify.get(
    '/api/v1/company/ai/policies/:id',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const policy = await aiGovernanceService.getPolicyById(id, request.session);
      return { success: true, data: policy };
    }
  );

  fastify.post(
    '/api/v1/company/ai/policies/:id/transition',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { toStatus: string; reason: string };
      const updated = await aiGovernanceService.transitionPolicy(id, body.toStatus, body.reason, request.session);
      return { success: true, data: updated };
    }
  );

  fastify.get(
    '/api/v1/company/ai/prompts',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const prompts = await aiGovernanceService.getPromptTemplates(request.session);
      return { success: true, data: prompts };
    }
  );

  fastify.get(
    '/api/v1/company/ai/prompts/:id',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const prompt = await aiGovernanceService.getPromptTemplateById(id, request.session);
      return { success: true, data: prompt };
    }
  );

  fastify.get(
    '/api/v1/company/ai/prompts/:id/versions',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const versions = await aiGovernanceService.getPromptVersions(id, request.session);
      return { success: true, data: versions };
    }
  );

  fastify.post(
    '/api/v1/company/ai/prompts/versions/approve',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'update')]
    },
    async (request) => {
      const body = request.body as any;
      const approved = await aiGovernanceService.approvePromptVersion(body, request.session);
      return { success: true, data: approved };
    }
  );

  fastify.get(
    '/api/v1/company/ai/quotas',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const quotas = await aiGovernanceService.getUsageQuotas(request.session);
      return { success: true, data: quotas };
    }
  );

  fastify.get(
    '/api/v1/company/ai/usage-records',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const records = await aiGovernanceService.getUsageRecords(request.session);
      return { success: true, data: records };
    }
  );

  fastify.get(
    '/api/v1/company/ai/audit',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const audit = await aiGovernanceService.getAuditTraces(request.session);
      return { success: true, data: audit };
    }
  );

  fastify.get(
    '/api/v1/company/ai/safety-events',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const events = await aiGovernanceService.getSafetyEvents(request.session);
      return { success: true, data: events };
    }
  );

  fastify.post(
    '/api/v1/company/ai/safety-events/acknowledge',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'update')]
    },
    async (request) => {
      const body = request.body as { eventId: string; reason: string };
      const event = await aiGovernanceService.acknowledgeSafetyEvent(body.eventId, body.reason, request.session);
      return { success: true, data: event };
    }
  );

  fastify.post(
    '/api/v1/company/ai/safety-events/resolve',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'update')]
    },
    async (request) => {
      const body = request.body as { eventId: string; resolutionStatus: string; resolutionNotes: string };
      const event = await aiGovernanceService.resolveSafetyEvent(body.eventId, body.resolutionStatus, body.resolutionNotes, request.session);
      return { success: true, data: event };
    }
  );
};
