import { type FastifyPluginAsync } from 'fastify';
import { complianceService } from '../../services/company/ComplianceService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const complianceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/compliance/frameworks',
    {
      preHandler: [authenticate, requirePermission('compliance', 'read')]
    },
    async (request) => {
      const frameworks = await complianceService.getFrameworks(request.session);
      return { success: true, data: frameworks };
    }
  );

  fastify.get(
    '/api/v1/company/compliance/controls',
    {
      preHandler: [authenticate, requirePermission('compliance', 'read')]
    },
    async (request) => {
      const controls = await complianceService.getControls(request.session);
      return { success: true, data: controls };
    }
  );
};
