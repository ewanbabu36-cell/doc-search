import { type FastifyPluginAsync } from 'fastify';
import { subscriptionService } from '../../services/company/SubscriptionService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/subscriptions',
    {
      preHandler: [authenticate, requirePermission('subscriptions', 'read')]
    },
    async (request) => {
      const subs = await subscriptionService.getSubscriptions(request.session);
      return { success: true, data: subs };
    }
  );

  fastify.get(
    '/api/v1/company/subscriptions/:id',
    {
      preHandler: [authenticate, requirePermission('subscriptions', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const sub = await subscriptionService.getSubscriptionById(id, request.session);
      return { success: true, data: sub };
    }
  );
};
