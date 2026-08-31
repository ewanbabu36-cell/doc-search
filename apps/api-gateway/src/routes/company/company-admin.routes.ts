import { type FastifyPluginAsync } from 'fastify';
import { companyAdminService } from '../../services/company/CompanyAdminService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const companyAdminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/admin/legal-entities',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const entities = await companyAdminService.getLegalEntities(request.session);
      return { success: true, data: entities };
    }
  );

  fastify.get(
    '/api/v1/company/admin/departments',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const depts = await companyAdminService.getDepartments(request.session);
      return { success: true, data: depts };
    }
  );

  fastify.get(
    '/api/v1/company/admin/policies',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const policies = await companyAdminService.getPolicies(request.session);
      return { success: true, data: policies };
    }
  );
};
