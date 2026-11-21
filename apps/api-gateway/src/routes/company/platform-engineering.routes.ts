import { type FastifyPluginAsync } from 'fastify';
import { platformEngineeringService } from '../../services/company/PlatformEngineeringService.js';
import { authenticate, requirePermission, requireRoles } from '../../plugins/auth-guard.js';

export const platformEngineeringRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/platform/projects',
    {
      preHandler: [authenticate, requirePermission('platform', 'read'), requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const projects = await platformEngineeringService.getProjects(request.session);
      return { success: true, data: projects };
    }
  );

  fastify.get(
    '/api/v1/company/platform/environments',
    {
      preHandler: [authenticate, requirePermission('platform', 'read'), requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const envs = await platformEngineeringService.getEnvironments(request.session);
      return { success: true, data: envs };
    }
  );

  fastify.get(
    '/api/v1/company/platform/deployments',
    {
      preHandler: [authenticate, requirePermission('platform', 'read'), requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request) => {
      const deployments = await platformEngineeringService.getDeployments(request.session);
      return { success: true, data: deployments };
    }
  );
};
