import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { partnerService } from '../../services/company/PartnerService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

const CreatePartnerSchema = z.object({
  tenantId: z.string().uuid().optional(),
  legalName: z.string().min(2),
  tradeName: z.string().min(2),
  partnerType: z.string().default('HOSPITAL_NETWORK'),
  lifecycleStatus: z.string().default('LEAD'),
  verificationStatus: z.string().default('PENDING'),
  onboardingStep: z.string().default('ORGANIZATION_PROFILE'),
  onboardingProgressPercent: z.number().int().default(0),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string().optional(),
  primaryContactRole: z.string().optional(),
  planId: z.string().uuid().optional(),
  planCode: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  isTrial: z.boolean().optional(),
  tenantSlug: z.string().optional(),
  initialFacilityName: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const UpdatePartnerStatusSchema = z.object({
  fromStatus: z.string(),
  toStatus: z.string(),
  reason: z.string().min(3)
});

export const partnerRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/company/partners
  fastify.get(
    '/api/v1/company/partners',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; type?: string; limit?: string; offset?: string };
      const res = await partnerService.getPartners(
        {
          lifecycleStatus: query.status,
          partnerType: query.type,
          limit: query.limit ? parseInt(query.limit, 10) : 20,
          offset: query.offset ? parseInt(query.offset, 10) : 0
        },
        request.session
      );
      return { success: true, data: res.items, total: res.total };
    }
  );

  // GET /api/v1/company/partners/:partnerId
  fastify.get(
    '/api/v1/company/partners/:partnerId',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const { partnerId } = request.params as { partnerId: string };
      const partner = await partnerService.getPartnerById(partnerId, request.session);
      return { success: true, data: partner };
    }
  );

  // GET /api/v1/company/partners/:partnerId/commercial
  fastify.get(
    '/api/v1/company/partners/:partnerId/commercial',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const { partnerId } = request.params as { partnerId: string };
      const profile = await partnerService.getPartnerCommercialProfile(partnerId, request.session);
      return { success: true, data: profile };
    }
  );

  // POST /api/v1/company/partners (Transactional Onboarding)
  fastify.post(
    '/api/v1/company/partners',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const parseResult = CreatePartnerSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid partner profile payload',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const partnerData = {
        ...parseResult.data,
        tenantId: parseResult.data.tenantId
      };
      const result = await partnerService.createPartner(partnerData, request.session);
      reply.status(201);
      return { success: true, data: result };
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/status
  fastify.patch(
    '/api/v1/company/partners/:partnerId/status',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request) => {
      const { partnerId } = request.params as { partnerId: string };
      const parseResult = UpdatePartnerStatusSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid status update payload',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const updated = await partnerService.updatePartnerStatus(
        partnerId,
        parseResult.data.fromStatus,
        parseResult.data.toStatus,
        parseResult.data.reason,
        request.session
      );

      return { success: true, data: updated };
    }
  );
};
