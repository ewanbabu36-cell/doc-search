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
    '/api/v1/company/ai/audit',
    {
      preHandler: [authenticate, requirePermission('ai:governance', 'read')]
    },
    async (request) => {
      const audit = await aiGovernanceService.getAuditTraces(request.session);
      return { success: true, data: audit };
    }
  );
};
