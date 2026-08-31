import { type FastifyPluginAsync } from 'fastify';
import { securityAdminService } from '../../services/company/SecurityAdminService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const securityAdminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/security/roles',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const roles = await securityAdminService.getRoles(request.session);
      return { success: true, data: roles };
    }
  );

  fastify.get(
    '/api/v1/company/security/permissions',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const permissions = await securityAdminService.getPermissions(request.session);
      return { success: true, data: permissions };
    }
  );

  fastify.get(
    '/api/v1/company/security/policies',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const policies = await securityAdminService.getPolicies(request.session);
      return { success: true, data: policies };
    }
  );
};
