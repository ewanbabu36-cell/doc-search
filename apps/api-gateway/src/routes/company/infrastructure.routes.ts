import { type FastifyPluginAsync } from 'fastify';
import { infrastructureService } from '../../services/company/InfrastructureService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const infrastructureRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/infrastructure/clusters',
    {
      preHandler: [authenticate, requirePermission('infrastructure', 'read')]
    },
    async (request) => {
      const clusters = await infrastructureService.getClusters(request.session);
      return { success: true, data: clusters };
    }
  );

  fastify.get(
    '/api/v1/company/infrastructure/databases',
    {
      preHandler: [authenticate, requirePermission('infrastructure', 'read')]
    },
    async (request) => {
      const dbs = await infrastructureService.getDatabases(request.session);
      return { success: true, data: dbs };
    }
  );

  fastify.get(
    '/api/v1/company/infrastructure/dr',
    {
      preHandler: [authenticate, requirePermission('infrastructure', 'read')]
    },
    async (request) => {
      const dr = await infrastructureService.getDRPlans(request.session);
      return { success: true, data: dr };
    }
  );
};
