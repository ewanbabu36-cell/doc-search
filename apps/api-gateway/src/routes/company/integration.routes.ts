import { type FastifyPluginAsync } from 'fastify';
import { integrationService } from '../../services/company/IntegrationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const integrationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/integration/providers',
    {
      preHandler: [authenticate, requirePermission('integrations', 'read')]
    },
    async (request) => {
      const providers = await integrationService.getProviders(request.session);
      return { success: true, data: providers };
    }
  );

  fastify.get(
    '/api/v1/company/integration/endpoints',
    {
      preHandler: [authenticate, requirePermission('integrations', 'read')]
    },
    async (request) => {
      const endpoints = await integrationService.getEndpoints(request.session);
      return { success: true, data: endpoints };
    }
  );

  fastify.get(
    '/api/v1/company/integration/webhooks',
    {
      preHandler: [authenticate, requirePermission('integrations', 'read')]
    },
    async (request) => {
      const webhooks = await integrationService.getWebhooks(request.session);
      return { success: true, data: webhooks };
    }
  );
};
