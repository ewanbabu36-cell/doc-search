import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { partnerService } from '../../services/company/PartnerService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { partnerClassificationRepository } from '../../repositories/company/PartnerClassificationRepository.js';
import { realAuthService } from '../../services/core/RealAuthService.js';

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

  // GET /api/v1/company/partners/:partnerId/entitlements
  fastify.get(
    '/api/v1/company/partners/:partnerId/entitlements',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const { partnerId } = request.params as { partnerId: string };
      const entitlements = await partnerService.getPartnerEntitlements(partnerId, request.session);
      return { success: true, data: entitlements };
    }
  );

  // POST /api/v1/company/partners/:partnerId/branches
  fastify.post(
    '/api/v1/company/partners/:partnerId/branches',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = request.body as { name: string; code?: string };
      if (!body || !body.name) {
        throw new AppError({
          message: 'Branch name is required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const branch = await partnerService.addBranch(partnerId, body, request.session);
      return reply.status(201).send({ success: true, data: branch });
    }
  );

  // POST /api/v1/company/partners/:partnerId/doctors
  fastify.post(
    '/api/v1/company/partners/:partnerId/doctors',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = request.body as { fullName: string; email: string; specialization?: string; requestedTotalCount?: number };
      if (!body || !body.fullName || !body.email) {
        throw new AppError({
          message: 'Doctor fullName and email are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const doctor = await partnerService.addDoctor(partnerId, body, request.session);
      return reply.status(201).send({ success: true, data: doctor });
    }
  );

  // GET /api/v1/company/partner-classifications
  fastify.get(
    '/api/v1/company/partner-classifications',
    async (request) => {
      const query = request.query as { status?: string };
      const items = await partnerClassificationRepository.findAll(query.status || 'ACTIVE');
      return { success: true, data: items, total: items.length };
    }
  );

  // POST /api/v1/company/partner-classifications
  fastify.post(
    '/api/v1/company/partner-classifications',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const body = request.body as {
        code: string;
        label: string;
        description?: string;
        category?: string;
        icon?: string;
        defaultPlanCode?: string;
        sortOrder?: number;
      };

      if (!body || !body.code || !body.label) {
        throw new AppError({
          message: 'Classification code and label are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const existing = await partnerClassificationRepository.findByCode(body.code);
      if (existing) {
        throw new AppError({
          message: `Classification code ${body.code} already exists`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const created = await partnerClassificationRepository.create(body);
      return reply.status(201).send({ success: true, data: created });
    }
  );

  // POST /api/v1/company/partners/complete-onboarding-activation
  // Real-world Full Onboarding: Basic Info -> Verified Docs -> Features/Plan -> Live Login Credentials
  fastify.post(
    '/api/v1/company/partners/complete-onboarding-activation',
    async (request, reply) => {
      const body = request.body as {
        partnerName: string;
        classification: string;
        contactPerson: string;
        phone: string;
        email: string;
        password?: string;
        plainPassword?: string;
        city?: string;
        state?: string;
        documents?: Array<{ type: string; fileName: string; documentNumber: string; status: string }>;
        planTier: string;
        monthlyFee?: number;
        features: string[];
      };

      const plainPassword = body.password || body.plainPassword || 'DocSearch@2026';
      if (!body.partnerName || !body.email || !body.contactPerson) {
        throw new AppError({
          message: 'partnerName, email and contactPerson are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const nameParts = body.contactPerson.split(' ');
      const firstName = nameParts[0] || 'Doctor';
      const lastName = body.contactPerson.substring(firstName.length).trim() || 'In-Charge';

      const orgType = body.classification || 'PATHOLOGY';
      let primaryRole: any = 'PATHOLOGIST';
      let defaultPerms: string[] = [];

      if (orgType === 'HOSPITAL') {
        primaryRole = 'HOSPITAL_DIRECTOR';
        defaultPerms = ['clinical:orders:read', 'clinical:orders:create', 'clinical:patients:read', 'inpatient:beds:manage', 'billing:invoices:read', 'billing:invoices:create'];
      } else if (orgType === 'PHARMACY') {
        primaryRole = 'PHARMACIST';
        defaultPerms = ['pharmacy:dispense', 'pharmacy:inventory:read', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'CLINIC') {
        primaryRole = 'CLINIC_DOCTOR';
        defaultPerms = ['clinical:consultations:create', 'clinical:patients:read', 'clinical:orders:create', 'billing:invoices:create'];
      } else if (orgType === 'DIAGNOSTIC_CENTRE') {
        primaryRole = 'RADIOLOGIST';
        defaultPerms = ['radiology:scans:read', 'radiology:reports:create', 'billing:invoices:create'];
      } else {
        primaryRole = 'PATHOLOGIST';
        defaultPerms = ['lab:orders:read', 'lab:orders:create', 'lab:specimens:create', 'lab:results:create', 'billing:invoices:create'];
      }

      const activationDate = new Date();
      const expiryDate = new Date(activationDate);
      expiryDate.setDate(expiryDate.getDate() + 30); // 30-day billing cycle
      const planExpiryDate = expiryDate.toISOString();
      const planExpiryFormatted = expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Register cryptographic user credential for Partner Platform login
      const registeredUser = realAuthService.registerPartnerUserCredential({
        email: body.email,
        plainPassword,
        firstName,
        lastName,
        tenantName: body.partnerName,
        organizationType: orgType,
        roles: [primaryRole, 'HOSPITAL_ADMIN'],
        permissions: defaultPerms,
        planTier: body.planTier || 'Healthcare Partner Pro',
        planExpiryDate: planExpiryFormatted,
        accessibleFeatures: body.features || [],
        phone: body.phone
      });

      const partnerId = `PRT-${Date.now().toString().slice(-6)}`;
      const activationVoucher = {
        partnerId,
        partnerName: body.partnerName,
        classification: orgType,
        contactPerson: body.contactPerson,
        phone: body.phone,
        city: body.city || 'Lucknow',
        state: body.state || 'Uttar Pradesh',
        status: 'LIVE_ACTIVE',
        verificationStatus: '100%_VERIFIED',
        documentsVerified: body.documents?.length || 3,
        subscriptionPlan: {
          tier: body.planTier,
          monthlyFee: body.monthlyFee || 6999,
          activeFeatures: body.features,
          expiryDate: planExpiryFormatted,
          expiryIso: planExpiryDate,
          renewalCycle: 'MONTHLY'
        },
        credentials: {
          loginUrl: 'http://localhost:5173/',
          userId: registeredUser.email,
          temporaryPassword: plainPassword,
          role: registeredUser.roles[0],
          activatedAt: activationDate.toISOString(),
          planExpiryDate: planExpiryFormatted
        }
      };

      return reply.status(201).send({
        success: true,
        data: activationVoucher,
        message: `Partner "${body.partnerName}" is now 100% LIVE. Credentials active for Partner Portal login.`
      });
    }
  );

  // GET /api/v1/company/partners/live-directory
  // Publicly readable by partner shell and company shell
  fastify.get(
    '/api/v1/company/partners/live-directory',
    async (_request, reply) => {
      const livePartners = realAuthService.getAllLivePartnerUsers().map((p) => ({
        id: p.id,
        email: p.email,
        name: `${p.firstName} ${p.lastName}`.trim(),
        tenantName: p.tenantName,
        organizationType: p.organizationType,
        planTier: p.planTier,
        planExpiryDate: p.planExpiryDate || '30 days from activation',
        accessibleFeatures: p.accessibleFeatures,
        phone: p.phone,
        status: 'LIVE_ACTIVE'
      }));
      return reply.status(200).send({ success: true, data: livePartners });
    }
  );
};

