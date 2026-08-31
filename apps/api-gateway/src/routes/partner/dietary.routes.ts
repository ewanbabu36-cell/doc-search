import { type FastifyPluginAsync } from 'fastify';
import { dietaryService } from '../../services/partner/DietaryService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';

export const dietaryRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Overview & Telemetry
  fastify.get(
    '/api/v1/partner/dietary/overview',
    {
      preHandler: [authenticate, requirePermission('dietary:assessment', 'read')]
    },
    async (request) => {
      const overview = await dietaryService.getOverviewMetrics(request.session);
      return { success: true, data: overview };
    }
  );

  fastify.get(
    '/api/v1/partner/dietary/analytics',
    {
      preHandler: [authenticate, requirePermission('dietary:assessment', 'read')]
    },
    async (request) => {
      const analytics = await dietaryService.getAnalytics(request.session);
      return { success: true, data: analytics };
    }
  );

  // 2. Kitchens & Diet Types
  fastify.get(
    '/api/v1/partner/dietary/kitchens',
    {
      preHandler: [authenticate, requirePermission('dietary:kitchen', 'read')]
    },
    async (request) => {
      const kitchens = await dietaryService.getKitchens(request.session);
      return { success: true, data: kitchens };
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/kitchens',
    {
      preHandler: [authenticate, requirePermission('dietary:kitchen', 'create')]
    },
    async (request, reply) => {
      const kitchen = await dietaryService.createKitchen((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: kitchen });
    }
  );

  fastify.get(
    '/api/v1/partner/dietary/diet-types',
    {
      preHandler: [authenticate, requirePermission('dietary:diet-type', 'read')]
    },
    async (request) => {
      const dietTypes = await dietaryService.getDietTypes(request.session);
      return { success: true, data: dietTypes };
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/diet-types',
    {
      preHandler: [authenticate, requirePermission('dietary:diet-type', 'create')]
    },
    async (request, reply) => {
      const dietType = await dietaryService.createDietType((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: dietType });
    }
  );

  // 3. Clinical Assessments
  fastify.get(
    '/api/v1/partner/dietary/assessments',
    {
      preHandler: [authenticate, requirePermission('dietary:assessment', 'read')]
    },
    async (request) => {
      const query = request.query as { patientId?: string };
      const assessments = await dietaryService.getAssessments(query.patientId, request.session);
      return { success: true, data: assessments };
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/assessments',
    {
      preHandler: [authenticate, requirePermission('dietary:assessment', 'create')]
    },
    async (request, reply) => {
      const assessment = await dietaryService.createAssessment((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: assessment });
    }
  );

  fastify.patch(
    '/api/v1/partner/dietary/assessments/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('dietary:assessment', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const finalized = await dietaryService.finalizeAssessment(id, request.session);
      return { success: true, data: finalized };
    }
  );

  // 4. Diet Orders
  fastify.get(
    '/api/v1/partner/dietary/orders',
    {
      preHandler: [authenticate, requirePermission('dietary:order', 'read')]
    },
    async (request) => {
      const query = request.query as { patientId?: string };
      const orders = await dietaryService.getOrders(query.patientId, request.session);
      return { success: true, data: orders };
    }
  );

  fastify.get(
    '/api/v1/partner/dietary/orders/:id',
    {
      preHandler: [authenticate, requirePermission('dietary:order', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const order = await dietaryService.getOrderById(id, request.session);
      return { success: true, data: order };
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/orders',
    {
      preHandler: [authenticate, requirePermission('dietary:order', 'create')]
    },
    async (request, reply) => {
      const order = await dietaryService.createOrder((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: order });
    }
  );

  fastify.patch(
    '/api/v1/partner/dietary/orders/:id/approve',
    {
      preHandler: [authenticate, requirePermission('dietary:order', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const approved = await dietaryService.approveOrder(id, request.session);
      return { success: true, data: approved };
    }
  );

  // 5. Production & Quality
  fastify.post(
    '/api/v1/partner/dietary/production-plans',
    {
      preHandler: [authenticate, requirePermission('dietary:production', 'create')]
    },
    async (request, reply) => {
      const plan = await dietaryService.createProductionPlan((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: plan });
    }
  );

  fastify.patch(
    '/api/v1/partner/dietary/production-plans/:id/release',
    {
      preHandler: [authenticate, requirePermission('dietary:production', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const released = await dietaryService.releaseProductionPlan(id, request.session);
      return { success: true, data: released };
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/quality-checks',
    {
      preHandler: [authenticate, requirePermission('dietary:quality', 'create')]
    },
    async (request, reply) => {
      const check = await dietaryService.recordQualityCheck((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: check });
    }
  );

  // 6. Tray Assembly, Dispatch & Delivery
  fastify.post(
    '/api/v1/partner/dietary/tray-assemblies',
    {
      preHandler: [authenticate, requirePermission('dietary:tray', 'create')]
    },
    async (request, reply) => {
      const tray = await dietaryService.createTrayAssembly((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: tray });
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/dispatches',
    {
      preHandler: [authenticate, requirePermission('dietary:dispatch', 'create')]
    },
    async (request, reply) => {
      const dispatch = await dietaryService.dispatchMeal((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: dispatch });
    }
  );

  fastify.patch(
    '/api/v1/partner/dietary/dispatches/:id/deliver',
    {
      preHandler: [authenticate, requirePermission('dietary:delivery', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const delivered = await dietaryService.confirmMealDelivery(id, request.session);
      return { success: true, data: delivered };
    }
  );

  fastify.patch(
    '/api/v1/partner/dietary/dispatches/:id/refuse',
    {
      preHandler: [authenticate, requirePermission('dietary:delivery', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as Record<string, unknown> as { reason?: string };
      const refused = await dietaryService.refuseMeal(id, body?.reason || 'PATIENT_REFUSED', request.session);
      return { success: true, data: refused };
    }
  );

  // 7. Billing & Procurement References
  fastify.post(
    '/api/v1/partner/dietary/billing-references',
    {
      preHandler: [authenticate, requirePermission('dietary:billing', 'create')]
    },
    async (request, reply) => {
      const billing = await dietaryService.createBillingReference((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: billing });
    }
  );

  fastify.post(
    '/api/v1/partner/dietary/procurement-references',
    {
      preHandler: [authenticate, requirePermission('dietary:procurement', 'create')]
    },
    async (request, reply) => {
      const procurement = await dietaryService.createProcurementReference((request.body || {}) as Record<string, unknown>, request.session);
      return reply.status(201).send({ success: true, data: procurement });
    }
  );
};
