import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { productService } from '../../services/company/ProductService.js';
import { authenticate, optionalAuthenticate, requirePermission } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

const CreateProductSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().default('CORE_PLATFORM'),
  status: z.string().default('ACTIVE'),
  version: z.string().default('1.0.0')
});

export const productRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/products',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request) => {
      const prods = await productService.getProducts(request.session);
      return { success: true, data: prods };
    }
  );

  fastify.get(
    '/api/v1/company/products/:productId',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request) => {
      const { productId } = request.params as { productId: string };
      const prod = await productService.getProductById(productId, request.session);
      return { success: true, data: prod };
    }
  );

  fastify.post(
    '/api/v1/company/products',
    {
      preHandler: [authenticate, requirePermission('products', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreateProductSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid product payload',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const created = await productService.createProduct(parseResult.data, request.session);
      reply.status(201);
      return { success: true, data: created };
    }
  );

  fastify.get(
    '/api/v1/company/plans',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request) => {
      const plansList = await productService.getPlans(request.session);
      return { success: true, data: plansList };
    }
  );

  fastify.get(
    '/api/v1/company/plans/:planId',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request) => {
      const { planId } = request.params as { planId: string };
      const plan = await productService.getPlanById(planId, request.session);
      return { success: true, data: plan };
    }
  );

  fastify.post(
    '/api/v1/company/plans',
    {
      preHandler: [authenticate, requirePermission('products', 'create')]
    },
    async (request, reply) => {
      const body = request.body as any;
      if (!body || !body.name || !body.code || !body.productId) {
        throw new AppError({
          message: 'Plan name, code, and productId are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const created = await productService.createPlan(body, request.session);
      return reply.status(201).send({ success: true, data: created });
    }
  );

  fastify.put(
    '/api/v1/company/plans/:planId',
    {
      preHandler: [authenticate, requirePermission('products', 'update')]
    },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };
      const body = request.body as any;
      const updated = await productService.updatePlan(planId, body, request.session);
      return reply.send({ success: true, data: updated });
    }
  );

  fastify.patch(
    '/api/v1/company/plans/:planId/status',
    {
      preHandler: [authenticate, requirePermission('products', 'update')]
    },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };
      const body = request.body as { status: string };
      if (!body || !body.status) {
        throw new AppError({
          message: 'Status is required (e.g. ACTIVE, DEACTIVATED, ARCHIVED)',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const updated = await productService.updatePlanStatus(planId, body.status, request.session);
      return reply.send({ success: true, data: updated });
    }
  );

  fastify.delete(
    '/api/v1/company/plans/:planId',
    {
      preHandler: [authenticate, requirePermission('products', 'delete')]
    },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };
      const result = await productService.deletePlan(planId, request.session);
      return reply.send({ success: true, data: result, message: `Plan ${planId} successfully archived.` });
    }
  );

  fastify.get(
    '/api/v1/company/plans/:planId/entitlements',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };
      const entitlements = await productService.getPlanEntitlements(planId, request.session);
      return reply.send({ success: true, data: entitlements });
    }
  );

  fastify.post(
    '/api/v1/company/plans/:planId/entitlements',
    {
      preHandler: [authenticate, requirePermission('products', 'update')]
    },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };
      const body = request.body as { featureId: string; value?: any; entitlementType?: string };
      if (!body || !body.featureId) {
        throw new AppError({
          message: 'featureId is required to attach an entitlement',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const entitlement = await productService.attachPlanEntitlement(
        planId,
        body.featureId,
        body.value ?? { enabled: true },
        body.entitlementType ?? 'FEATURE_ACCESS',
        request.session
      );
      return reply.status(201).send({ success: true, data: entitlement });
    }
  );

  fastify.delete(
    '/api/v1/company/plans/:planId/entitlements/:featureId',
    {
      preHandler: [authenticate, requirePermission('products', 'update')]
    },
    async (request, reply) => {
      const { planId, featureId } = request.params as { planId: string; featureId: string };
      const result = await productService.removePlanEntitlement(planId, featureId, request.session);
      return reply.send({ success: true, data: result });
    }
  );

  fastify.get(
    '/api/v1/company/features',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request, reply) => {
      const featList = await productService.getFeatures(request.session);
      return reply.send({ success: true, data: featList });
    }
  );

  fastify.get(
    '/api/v1/company/partner-assignments',
    {
      preHandler: [optionalAuthenticate]
    },
    async () => {
      return { success: true, data: [] };
    }
  );

  fastify.post(
    '/api/v1/company/features',
    {
      preHandler: [authenticate, requirePermission('products', 'create')]
    },
    async (request, reply) => {
      const body = request.body as any;
      if (!body || !body.code || !body.name || !body.description) {
        throw new AppError({
          message: 'Feature code, name, and description are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const created = await productService.createFeature(body, request.session);
      return reply.status(201).send({ success: true, data: created });
    }
  );
};

