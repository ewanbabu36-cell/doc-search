import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { productService } from '../../services/company/ProductService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
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
      preHandler: [authenticate]
    },
    async (request) => {
      const prods = await productService.getProducts(request.session);
      return { success: true, data: prods };
    }
  );

  fastify.get(
    '/api/v1/company/products/:productId',
    {
      preHandler: [authenticate]
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
      preHandler: [authenticate]
    },
    async (request) => {
      const plansList = await productService.getPlans(request.session);
      return { success: true, data: plansList };
    }
  );

  fastify.get(
    '/api/v1/company/plans/:planId',
    {
      preHandler: [authenticate]
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
};

