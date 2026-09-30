import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { partnerService } from '../../services/company/PartnerService.js';
import { authenticate, requirePermission, requireRoles } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode, normalizeFacilityProfile } from '@docsearch/shared-core';
import { partnerClassificationRepository } from '../../repositories/company/PartnerClassificationRepository.js';
import { realAuthService } from '../../services/core/RealAuthService.js';
import { partnerOnboardingRepository, toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import {
  getDatabase,
  partnerOnboardingStagedRegistrations,
  partnerProfiles,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  branches,
  operationalDepartments,
  operationalStaff,
  doctorProfiles,
  partnerLifecycleTransitions,
  partnerGovernanceOverrides,
  partnerPlanAssignments,
  licenses,
  subscriptions,
  partnerHealthProfiles,
  partnerAgreements,
  tenants,
  eq,
  or,
  desc
} from '@docsearch/database';
import { updateApprovedPartnerStatusOnDisk, removeApprovedPartnerFromDisk, saveApprovedPartnerToDisk } from '../auth.routes.js';
import { partnerGovernanceService } from '../../services/company/PartnerGovernanceService.js';
import { sessionRevocationService } from '../../services/core/SessionRevocationService.js';
import { partnerSyncService } from '../../services/company/PartnerSyncService.js';
import { env } from '../../config/env.js';
import { partnerTombstoneService } from '../../services/company/PartnerTombstoneService.js';

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
  fromStatus: z.string().optional(),
  toStatus: z.string(),
  reason: z.string().optional()
});

async function assertPartnerTenantScope(partnerId: string, session: any): Promise<void> {
  if (!session) {
    throw AppError.unauthorized('Authentication required');
  }
  if (session.isSuperAdmin || session.roles?.includes('COMPANY_ADMIN')) {
    return;
  }
  if (partnerId === session.tenantId) {
    return;
  }
  const db = getDatabase();
  if (db) {
    try {
      const [p] = await db
        .select({ id: partnerProfiles.id, tenantId: partnerProfiles.tenantId })
        .from(partnerProfiles)
        .where(or(eq(partnerProfiles.id, partnerId), eq(partnerProfiles.tenantId, partnerId)))
        .limit(1);
      if (p && (p.tenantId === session.tenantId || p.id === session.tenantId)) {
        return;
      }
    } catch {}
  }
  throw new AppError({
    message: 'Access denied: You do not have permission to access another partner organization',
    code: ErrorCode.TENANT_ACCESS_DENIED,
    statusCode: 403
  });
}

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

  // GET /api/v1/company/partners/directory-intelligence
  fastify.get(
    '/api/v1/company/partners/directory-intelligence',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      try {
        await partnerSyncService.syncApprovedPartnersToDatabase();
      } catch {}

      const query = request.query as any;
      const normalized = {
        ...query,
        partnerType: query.partnerType || query.type,
        lifecycleStatus: query.lifecycleStatus || query.status
      };
      const summary = await partnerService.getDirectoryIntelligence(request.session, normalized);
      return { success: true, data: summary };
    }
  );

  // GET /api/v1/company/partners/analytics (Real-Time 7-Stage Funnel & Bottlenecks)
  fastify.get(
    '/api/v1/company/partners/analytics',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const analytics = await partnerService.getPartnerAnalytics(request.session);
      return { success: true, data: analytics };
    }
  );

  // GET /api/v1/company/partners/directory (Multi-Filter Server-Side Directory)
  fastify.get(
    '/api/v1/company/partners/directory',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      try {
        await partnerSyncService.syncApprovedPartnersToDatabase();
      } catch {}
      const query = request.query as {
        search?: string;
        type?: string;
        partnerType?: string;
        status?: string;
        lifecycleStatus?: string;
        kycStatus?: string;
        onboardingStatus?: string;
        accountStatus?: string;
        queue?: 'all' | 'my_work' | 'unassigned';
        userEmail?: string;
        userId?: string;
        assignedReviewerId?: string;
        slaStatus?: string;
        aging?: '<24h' | '24-48h' | '2-7d' | '>7d';
        duplicateRisk?: string;
        registrationSource?: string;
        branchId?: string;
        branch?: string;
        dateRange?: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM';
        startDate?: string;
        endDate?: string;
        pricingTier?: 'ALL' | 'FREE' | 'PAID';
        page?: string;
        pageSize?: string;
        limit?: string;
        offset?: string;
        sortBy?: 'createdAt' | 'name' | 'status' | 'age' | 'completion';
        sortOrder?: 'asc' | 'desc';
      };

      const page = query.page ? parseInt(query.page, 10) : (query.offset && query.limit ? Math.floor(parseInt(query.offset, 10) / parseInt(query.limit, 10)) + 1 : 1);
      const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : (query.limit ? parseInt(query.limit, 10) : 20);

      const res = await partnerService.getDirectory(
        {
          search: query.search,
          partnerType: query.partnerType || query.type,
          lifecycleStatus: query.lifecycleStatus || query.status,
          kycStatus: query.kycStatus,
          onboardingStatus: query.onboardingStatus,
          accountStatus: query.accountStatus,
          queue: query.queue,
          userEmail: query.userEmail || request.session.actorEmail,
          userId: query.userId || request.session.userId,
          assignedReviewerId: query.assignedReviewerId,
          slaStatus: query.slaStatus,
          aging: query.aging,
          duplicateRisk: query.duplicateRisk,
          registrationSource: query.registrationSource,
          branchId: query.branchId || query.branch,
          dateRange: query.dateRange,
          startDate: query.startDate,
          endDate: query.endDate,
          pricingTier: query.pricingTier,
          page,
          pageSize,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder
        },
        request.session
      );

      return {
        success: true,
        data: res.items,
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
        totalPages: res.totalPages
      };
    }
  );

  // GET /api/v1/company/partners/:partnerId/360
  fastify.get(
    '/api/v1/company/partners/:partnerId/360',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const { partnerId } = request.params as { partnerId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const profile360 = await partnerService.getPartner360(partnerId, request.session);
      return { success: true, data: profile360 };
    }
  );

  // GET /api/v1/company/partners/:partnerId
  fastify.get(
    '/api/v1/company/partners/:partnerId',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      if (partnerId === 'verification-queue') {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
      }
      await assertPartnerTenantScope(partnerId, request.session);
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
      await assertPartnerTenantScope(partnerId, request.session);
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

      const pType = parseResult.data.partnerType || 'HOSPITAL_NETWORK';
      const normalizedProfile = normalizeFacilityProfile(pType);
      const primaryRole = normalizedProfile.primaryRole;
      const catPath = normalizedProfile.workspace === 'PHARMACY' ? '/pharmacy' : normalizedProfile.workspace === 'PATHOLOGY' ? '/pathology' : normalizedProfile.workspace === 'CLINIC' ? '/clinic' : normalizedProfile.workspace === 'DIAGNOSTIC_CENTRE' ? '/radiology' : '/hospital';

      let partnerCredentials: { loginUrl: string; email: string; temporaryPassword: string; role: string } | null = null;
      try {
        const nameParts = (parseResult.data.primaryContactName || 'Admin User').trim().split(' ');
        const firstName = nameParts[0] || 'Doctor';
        const lastName = parseResult.data.primaryContactName.substring(firstName.length).trim() || 'In-Charge';
        const tempPassword = 'PartnerPass2026!';

        const registeredUser = realAuthService.registerPartnerUserCredential({
          email: parseResult.data.primaryContactEmail,
          plainPassword: tempPassword,
          firstName,
          lastName,
          tenantName: parseResult.data.tradeName || parseResult.data.legalName,
          organizationType: normalizedProfile.workspace,
          roles: [primaryRole, 'HOSPITAL_ADMIN'] as any,
          accessibleFeatures: normalizedProfile.accessibleFeatures,
          tenantId: result.tenantId,
          organizationId: (result as any).organizationId,
          branchId: (result as any).branchId || (result as any).facilityId,
          permissions: [
            'clinical:orders:read',
            'clinical:orders:create',
            'clinical:patients:read',
            'clinical:patients:create',
            'clinical:encounters:read',
            'clinical:encounters:create',
            'clinical:consultations:create',
            'clinical:prescriptions:create',
            'inpatient:beds:manage',
            'lab:orders:read',
            'lab:orders:create',
            'lab:specimens:create',
            'lab:results:create',
            'pharmacy:medications:read',
            'pharmacy:medications:create',
            'pharmacy:inventory:read',
            'pharmacy:inventory:create',
            'pharmacy:orders:read',
            'pharmacy:dispense:create',
            'billing:invoices:read',
            'billing:invoices:create'
          ],
          planTier: result.plan?.name || normalizedProfile.defaultPlanTier,
          phone: parseResult.data.primaryContactPhone || ''
        });

        partnerCredentials = {
          loginUrl: `${env.PARTNER_PORTAL_URL}${catPath}`,
          email: registeredUser.email,
          temporaryPassword: tempPassword,
          role: primaryRole
        };
      } catch {}

      // Authoritative Disk & Tombstone Synchronization:
      // Clear any prior tombstone and persist to disk fixture so partner survives server restarts
      try {
        partnerTombstoneService.clearTombstone(result.partner.id);
        partnerTombstoneService.clearTombstone(result.partner.primaryContactEmail);
        partnerTombstoneService.clearTombstone(result.partner.legalName);
        partnerTombstoneService.clearTombstone(result.partner.tradeName);
        if (result.tenantId) partnerTombstoneService.clearTombstone(result.tenantId);

        await saveApprovedPartnerToDisk({
          id: result.partner.id,
          email: result.partner.primaryContactEmail,
          facilityName: result.partner.tradeName || result.partner.legalName,
          status: result.partner.lifecycleStatus || 'ACTIVE',
          kycStatus: result.partner.verificationStatus === 'VERIFIED' ? 'KYC_VERIFIED' : 'PENDING',
          organizationType: normalizedProfile.workspace,
          planTier: result.plan?.name || normalizedProfile.defaultPlanTier
        });
      } catch {}

      reply.status(201);
      return {
        success: true,
        data: {
          ...result.partner,
          ...result,
          id: result.partner.id,
          legalName: result.partner.legalName,
          tradeName: result.partner.tradeName,
          lifecycleStatus: result.partner.lifecycleStatus,
          verificationStatus: result.partner.verificationStatus,
          credentials: partnerCredentials
        }
      };
    }
  );

  // PATCH /api/v1/company/partners/:partnerId (Update Partner Profile Details e.g. city, state, legalName, phone, metadata)
  fastify.patch(
    '/api/v1/company/partners/:partnerId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const rawBody = (request.body as any) || {};
      const body: {
        legalName?: string;
        tradeName?: string;
        partnerType?: string;
        lifecycleStatus?: string;
        verificationStatus?: string;
        primaryContactName?: string;
        primaryContactPhone?: string;
        primaryContactEmail?: string;
        city?: string;
        state?: string;
        metadata?: Record<string, any>;
      } = rawBody;
      const db = getDatabase();
      const deterministicId = toDeterministicUuid(partnerId);

      let updatedProfile: any = null;
      let matchedProfile: any = null;
      let matchedStaged: any = null;

      // 1. Check partnerProfiles table in DB
      try {
        const allProfiles = await db.select().from(partnerProfiles);
        matchedProfile = allProfiles.find(
          (p) =>
            p.id === partnerId ||
            p.id === deterministicId ||
            p.tenantId === partnerId ||
            p.legalName.toLowerCase() === partnerId.toLowerCase() ||
            p.tradeName.toLowerCase() === partnerId.toLowerCase() ||
            p.primaryContactEmail.toLowerCase() === partnerId.toLowerCase()
        );
      } catch (err: any) {
        fastify.log.error('partnerProfiles query error: ' + String(err));
        throw new AppError({
          message: 'Failed to query partner profiles from database.',
          code: ErrorCode.DATABASE_ERROR,
          statusCode: 500
        });
      }

      // 2. Check staged registrations
      try {
        const allStaged = await db.select().from(partnerOnboardingStagedRegistrations);
        matchedStaged = allStaged.find(
          (s) =>
            s.id === partnerId ||
            s.id === deterministicId ||
            s.tenantDraftId === partnerId ||
            s.organizationName.toLowerCase() === partnerId.toLowerCase() ||
            s.contactEmail.toLowerCase() === partnerId.toLowerCase()
        );
      } catch (stagedErr: any) {
        fastify.log.error('stagedRegistrations query error: ' + String(stagedErr));
        throw new AppError({
          message: 'Failed to query staged registrations from database.',
          code: ErrorCode.DATABASE_ERROR,
          statusCode: 500
        });
      }

      if (!matchedProfile && !matchedStaged) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }

      if (matchedProfile) {
        try {
          const currentMeta = (matchedProfile.metadata as Record<string, any>) || {};
          const updatedMeta = {
            ...currentMeta,
            ...(body.metadata || {}),
            ...(body.city ? { city: body.city } : {}),
            ...(body.state ? { state: body.state } : {})
          };

          const [upd] = await db
            .update(partnerProfiles)
            .set({
              legalName: body.legalName || matchedProfile.legalName,
              tradeName: body.tradeName || matchedProfile.tradeName,
              partnerType: (body.partnerType || matchedProfile.partnerType) as any,
              lifecycleStatus: body.lifecycleStatus || matchedProfile.lifecycleStatus,
              verificationStatus: body.verificationStatus || matchedProfile.verificationStatus,
              primaryContactName: body.primaryContactName || matchedProfile.primaryContactName,
              primaryContactPhone: body.primaryContactPhone || matchedProfile.primaryContactPhone,
              primaryContactEmail: body.primaryContactEmail || matchedProfile.primaryContactEmail,
              metadata: updatedMeta,
              updatedAt: new Date()
            })
            .where(eq(partnerProfiles.id, matchedProfile.id))
            .returning();

          if (upd) {
            updatedProfile = upd;
          }
        } catch (err: any) {
          fastify.log.error('partnerProfiles update error: ' + String(err));
          throw new AppError({
            message: 'Failed to update partner profile in database.',
            code: ErrorCode.DATABASE_ERROR,
            statusCode: 500
          });
        }
      }

      if (matchedStaged) {
        try {
          const payload = (matchedStaged.registrationPayload as Record<string, any>) || {};
          const newPayload = {
            ...payload,
            ...(body.city ? { city: body.city } : {}),
            ...(body.state ? { state: body.state } : {}),
            ...(body.metadata || {})
          };

          const [updStaged] = await db
            .update(partnerOnboardingStagedRegistrations)
            .set({
              organizationName: body.legalName || body.tradeName || matchedStaged.organizationName,
              organizationType: body.partnerType ? normalizeFacilityProfile(body.partnerType).workspace : matchedStaged.organizationType,
              status: body.lifecycleStatus === 'SUSPENDED' ? 'SUSPENDED' : (body.verificationStatus === 'VERIFIED' ? 'APPROVED' : matchedStaged.status),
              contactEmail: body.primaryContactEmail || matchedStaged.contactEmail,
              contactPhone: body.primaryContactPhone || matchedStaged.contactPhone,
              registrationPayload: newPayload,
              updatedAt: new Date()
            })
            .where(eq(partnerOnboardingStagedRegistrations.id, matchedStaged.id))
            .returning();

          if (!updatedProfile && updStaged) {
            updatedProfile = updStaged;
          }
        } catch (stagedErr: any) {
          fastify.log.error('stagedRegistrations update error: ' + String(stagedErr));
          throw new AppError({
            message: 'Failed to update staged registration in database.',
            code: ErrorCode.DATABASE_ERROR,
            statusCode: 500
          });
        }
      }

      // 3. Disk Fixture & Credential Sync (Non-blocking secondary sync)
      try {
        if (updatedProfile) {
          const normProfile = normalizeFacilityProfile(updatedProfile.partnerType || updatedProfile.organizationType);
          await saveApprovedPartnerToDisk({
            id: updatedProfile.id,
            email: updatedProfile.primaryContactEmail || updatedProfile.contactEmail,
            facilityName: updatedProfile.tradeName || updatedProfile.legalName || updatedProfile.organizationName,
            status: updatedProfile.lifecycleStatus || updatedProfile.status,
            kycStatus: updatedProfile.verificationStatus === 'VERIFIED' ? 'KYC_VERIFIED' : updatedProfile.verificationStatus,
            organizationType: normProfile.workspace
          });
          const contactEmail = updatedProfile.primaryContactEmail || updatedProfile.contactEmail;
          if (contactEmail) {
            if (updatedProfile.lifecycleStatus === 'SUSPENDED' || updatedProfile.status === 'SUSPENDED') {
              realAuthService.setPartnerUserStatus(contactEmail, 'SUSPENDED');
            } else if (updatedProfile.lifecycleStatus === 'ACTIVE' || updatedProfile.status === 'APPROVED') {
              realAuthService.activatePartnerUserCredential(contactEmail);
            }
          }
        }
      } catch (syncErr: any) {
        fastify.log.warn('Partner profile disk fixture or credential sync error: ' + String(syncErr?.message || syncErr));
      }

      return reply.status(200).send({
        success: true,
        data: updatedProfile,
        message: `Partner ${partnerId} profile successfully updated.`
      });
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/status (Transition partner lifecycle status e.g. SUSPENDED / ACTIVE)
  fastify.patch(
    '/api/v1/company/partners/:partnerId/status',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const parseResult = UpdatePartnerStatusSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid status update payload: toStatus is required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const { toStatus, reason } = parseResult.data;
      const normToStatus = toStatus.toUpperCase();
      const statusReason = reason || `Transitioned to ${normToStatus} via Founder console`;

      let updatedProfile: any = null;
      const db = getDatabase();
      const deterministicId = toDeterministicUuid(partnerId);
      const emailsToSync = new Set<string>();
      if (partnerId.includes('@')) emailsToSync.add(partnerId.toLowerCase().trim());

      // 1. If partner exists in partnerProfiles, update it directly by primary key
      try {
        const allProfiles = await db.select().from(partnerProfiles);
        const matchedProfile = allProfiles.find(
          (p) =>
            p.id === partnerId ||
            p.id === deterministicId ||
            p.tenantId === partnerId ||
            p.legalName.toLowerCase() === partnerId.toLowerCase() ||
            p.tradeName.toLowerCase() === partnerId.toLowerCase() ||
            p.primaryContactEmail.toLowerCase() === partnerId.toLowerCase()
        );

        if (matchedProfile) {
          const [upd] = await db
            .update(partnerProfiles)
            .set({
              lifecycleStatus: normToStatus as any,
              verificationStatus: (normToStatus === 'ACTIVE' ? 'VERIFIED' : normToStatus === 'SUSPENDED' ? 'SUSPENDED' : matchedProfile.verificationStatus) as any,
              updatedAt: new Date()
            })
            .where(eq(partnerProfiles.id, matchedProfile.id))
            .returning();

          if (upd) {
            updatedProfile = upd;
            if (upd.primaryContactEmail) emailsToSync.add(upd.primaryContactEmail.toLowerCase().trim());
          }

          try {
            await db
              .update(operationalPartners)
              .set({
                status: (normToStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED') as any
              })
              .where(eq(operationalPartners.id, matchedProfile.id));
          } catch {}
        }
      } catch (err) {
        fastify.log.warn('partnerProfiles update note: ' + String(err));
      }

      // 2. Update partnerOnboardingStagedRegistrations in database by primary key
      try {
        const allStaged = await db.select().from(partnerOnboardingStagedRegistrations);
        fastify.log.info({ partnerId, deterministicId, count: allStaged.length, ids: allStaged.map(s => s.id) }, 'DEBUG-STAGED-LOOKUP');
        const matchedStaged = allStaged.find(
          (s) =>
            s.id === partnerId ||
            s.id === deterministicId ||
            s.tenantDraftId === partnerId ||
            s.organizationName.toLowerCase() === partnerId.toLowerCase() ||
            s.contactEmail.toLowerCase() === partnerId.toLowerCase() ||
            (s.registrationPayload as any)?._originalId === partnerId ||
            (s.registrationPayload as any)?.id === partnerId
        );

        if (matchedStaged) {
          const targetStagedStatus = normToStatus === 'SUSPENDED' ? 'SUSPENDED' : normToStatus === 'ACTIVE' ? 'APPROVED' : normToStatus;
          const [updStaged] = await db
            .update(partnerOnboardingStagedRegistrations)
            .set({
              status: targetStagedStatus as any,
              rejectionReason: normToStatus === 'SUSPENDED' ? statusReason : undefined,
              updatedAt: new Date()
            })
            .where(eq(partnerOnboardingStagedRegistrations.id, matchedStaged.id))
            .returning();

          fastify.log.info({ matched: !!matchedStaged, updated: !!updStaged, matchedId: matchedStaged?.id }, 'DEBUG-STAGED-RESULT');

          if (updStaged) {
            if (updStaged.contactEmail) emailsToSync.add(updStaged.contactEmail.toLowerCase().trim());
            const regEmail = (updStaged.registrationPayload as any)?.registeredByEmail;
            if (regEmail) emailsToSync.add(regEmail.toLowerCase().trim());

            if (!updatedProfile) {
              updatedProfile = {
                id: updStaged.id,
                legalName: updStaged.organizationName,
                tradeName: updStaged.organizationName,
                partnerType: updStaged.organizationType,
                lifecycleStatus: normToStatus,
                verificationStatus: normToStatus === 'ACTIVE' ? 'VERIFIED' : normToStatus === 'SUSPENDED' ? 'SUSPENDED' : 'PENDING',
                primaryContactEmail: updStaged.contactEmail
              };
            }
          }
        }
      } catch (dbErr) {
        fastify.log.warn('stagedRegistrations update note: ' + String(dbErr));
      }

      // 3. Search and synchronize all live users in realAuthService
      try {
        const liveUsers = realAuthService.getAllLivePartnerUsers();
        for (const u of liveUsers) {
          const matches =
            u.id === partnerId ||
            u.tenantId === partnerId ||
            u.email.toLowerCase() === partnerId.toLowerCase() ||
            (u.tenantName && (
              u.tenantName.toLowerCase() === partnerId.toLowerCase() ||
              (updatedProfile?.legalName && u.tenantName.toLowerCase() === updatedProfile.legalName.toLowerCase()) ||
              (updatedProfile?.tradeName && u.tenantName.toLowerCase() === updatedProfile.tradeName.toLowerCase())
            ));
          if (matches) {
            emailsToSync.add(u.email.toLowerCase().trim());
          }
        }
      } catch {}

      // 4. Synchronize partner credentials in realAuthService and disk
      await updateApprovedPartnerStatusOnDisk(partnerId, normToStatus);
      for (const email of emailsToSync) {
        if (normToStatus === 'ACTIVE') {
          realAuthService.activatePartnerUserCredential(email);
        } else {
          realAuthService.setPartnerUserStatus(email, normToStatus);
        }
        await updateApprovedPartnerStatusOnDisk(email, normToStatus);
      }

      // 5. Instantly revoke or reactivate active JWT sessions across the partner / tenant in SessionRevocationService
      const targetTenantId = updatedProfile?.tenantId || partnerId;
      const adminActor = (request.session as any)?.email || request.session?.userId || 'DOC SEARCH Founder Command';
      if (normToStatus === 'SUSPENDED' || normToStatus === 'TERMINATED' || normToStatus === 'REVOKED') {
        sessionRevocationService.revokeTenant(targetTenantId, statusReason, adminActor).catch(() => {});
        if (partnerId !== targetTenantId) {
          sessionRevocationService.revokeTenant(partnerId, statusReason, adminActor).catch(() => {});
        }
      } else if (normToStatus === 'ACTIVE') {
        sessionRevocationService.unrevokeTenant(targetTenantId);
        if (partnerId !== targetTenantId) {
          sessionRevocationService.unrevokeTenant(partnerId);
        }
      }

      return reply.status(200).send({
        success: true,
        data: updatedProfile || {
          id: partnerId,
          lifecycleStatus: normToStatus,
          status: normToStatus,
          updatedAt: new Date().toISOString(),
          reason: statusReason
        },
        message: `Partner ${partnerId} status successfully transitioned to ${normToStatus}.`
      });
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
      await assertPartnerTenantScope(partnerId, request.session);
      const entitlements = await partnerService.getPartnerEntitlements(partnerId, request.session);
      return { success: true, data: entitlements };
    }
  );

  // GET /api/v1/company/partners/:partnerId/branches
  fastify.get(
    '/api/v1/company/partners/:partnerId/branches',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const branchesList = await partnerService.getBranches(partnerId, request.session);
      return reply.send({ success: true, data: branchesList });
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
      await assertPartnerTenantScope(partnerId, request.session);
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

  // PATCH /api/v1/company/partners/:partnerId/branches/:branchId
  fastify.patch(
    '/api/v1/company/partners/:partnerId/branches/:branchId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId, branchId } = request.params as { partnerId: string; branchId: string };
      const body = request.body as { status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'; reason?: string };
      if (!body || !body.status) {
        throw new AppError({
          message: 'Status is required (ACTIVE, SUSPENDED, DEACTIVATED)',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const result = await partnerService.updateBranchStatus(
        partnerId,
        branchId,
        body.status,
        body.reason || 'HQ Facility Governance Action',
        request.session
      );
      return reply.send({ success: true, data: result, message: `Facility ${branchId} status updated to ${body.status}.` });
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
      await assertPartnerTenantScope(partnerId, request.session);
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

  // GET /api/v1/company/partners/:partnerId/staff
  fastify.get(
    '/api/v1/company/partners/:partnerId/staff',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const staffList = await partnerService.getPartnerStaff(partnerId, request.session);
      return reply.send({ success: true, data: staffList });
    }
  );

  // POST /api/v1/company/partners/:partnerId/staff
  fastify.post(
    '/api/v1/company/partners/:partnerId/staff',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const body = request.body as {
        fullName: string;
        workEmail: string;
        workPhone?: string;
        staffType?: string;
        primaryRole?: string;
        employmentType?: string;
        departmentId?: string;
        requestedTotalCount?: number;
      };

      if (!body || !body.fullName || !body.workEmail) {
        throw new AppError({
          message: 'Staff fullName and workEmail are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const staff = await partnerService.addPartnerStaff(partnerId, body, request.session);
      return reply.status(201).send({ success: true, data: staff });
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/staff/:staffId/status
  fastify.patch(
    '/api/v1/company/partners/:partnerId/staff/:staffId/status',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { partnerId, staffId } = request.params as { partnerId: string; staffId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const body = request.body as { status: string; reason?: string };

      if (!body || !body.status) {
        throw new AppError({
          message: 'Status is required (ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED)',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const updated = await partnerService.updatePartnerStaffStatus(
        partnerId,
        staffId,
        body.status,
        body.reason || 'HQ Staff Governance',
        request.session
      );
      return reply.send({ success: true, data: updated });
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
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
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
        streetAddress?: string;
        pincode?: string;
        documents?: Array<{ type: string; fileName: string; documentNumber: string; status: string }>;
        planTier: string;
        monthlyFee?: number;
        features: string[];
      };

      const plainPassword = body.password || body.plainPassword;
      if (!body.partnerName || !body.email || !body.contactPerson || !plainPassword || plainPassword.length < 8) {
        throw new AppError({
          message: 'partnerName, email, contactPerson, and secure password (minimum 8 characters) are required',
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

      if (orgType === 'COMBO_CLINIC_PATHOLOGY') {
        primaryRole = 'CLINIC_DOCTOR';
        defaultPerms = [
          'clinical:consultations:create',
          'clinical:patients:read',
          'clinical:orders:create',
          'lab:orders:read',
          'lab:orders:create',
          'lab:specimens:create',
          'lab:results:create',
          'billing:invoices:create',
          'billing:invoices:read'
        ];
      } else if (orgType === 'COMBO_CLINIC_PHARMACY') {
        primaryRole = 'CLINIC_DOCTOR';
        defaultPerms = [
          'clinical:consultations:create',
          'clinical:patients:read',
          'clinical:orders:create',
          'pharmacy:dispense',
          'pharmacy:inventory:read',
          'billing:invoices:create',
          'billing:invoices:read'
        ];
      } else if (orgType === 'HOSPITAL') {
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
      } else if (orgType === 'BLOOD_BANK') {
        primaryRole = 'BLOOD_BANK_OFFICER';
        defaultPerms = ['blood:inventory:read', 'blood:transfusion:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'DENTAL_CLINIC') {
        primaryRole = 'DENTIST';
        defaultPerms = ['clinical:consultations:create', 'dental:procedures:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'AYUSH_WELLNESS') {
        primaryRole = 'AYURVEDIC_VAIDYA';
        defaultPerms = ['clinical:consultations:create', 'ayush:panchakarma:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'DIALYSIS_CENTRE') {
        primaryRole = 'NEPHROLOGIST';
        defaultPerms = ['dialysis:sessions:manage', 'inpatient:beds:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'EYE_CARE') {
        primaryRole = 'OPHTHALMOLOGIST';
        defaultPerms = ['clinical:consultations:create', 'eyecare:optometry:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else if (orgType === 'PHYSIOTHERAPY') {
        primaryRole = 'PHYSIOTHERAPIST';
        defaultPerms = ['clinical:consultations:create', 'physio:rehab:manage', 'billing:invoices:create', 'billing:invoices:read'];
      } else {
        primaryRole = 'PATHOLOGIST';
        defaultPerms = ['lab:orders:read', 'lab:orders:create', 'lab:specimens:create', 'lab:results:create', 'billing:invoices:create'];
      }

      const activationDate = new Date();
      const expiryDate = new Date(activationDate);
      expiryDate.setDate(expiryDate.getDate() + 365); // 1st Year 100% Free Founding Partner Program (365 Days)
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
        roles: [primaryRole, 'HOSPITAL_ADMIN'] as any,
        permissions: defaultPerms,
        planTier: body.planTier || 'Healthcare Partner Pro',
        planExpiryDate: planExpiryFormatted,
        accessibleFeatures: body.features || [],
        phone: body.phone
      });

      const categoryLoginPath =
        orgType === 'HOSPITAL' ? '/hospital' :
        orgType === 'PHARMACY' ? '/pharmacy' :
        orgType === 'CLINIC' || orgType === 'COMBO_CLINIC_PATHOLOGY' || orgType === 'COMBO_CLINIC_PHARMACY' ? '/clinic' :
        orgType === 'DIAGNOSTIC_CENTRE' ? '/radiology' :
        orgType === 'BLOOD_BANK' ? '/hospital/blood-bank' :
        orgType === 'DENTAL_CLINIC' ? '/clinic/consultation' :
        orgType === 'AYUSH_WELLNESS' ? '/clinic/consultation' :
        orgType === 'DIALYSIS_CENTRE' ? '/hospital/inpatient' :
        orgType === 'EYE_CARE' ? '/clinic/consultation' :
        orgType === 'PHYSIOTHERAPY' ? '/clinic/consultation' : '/pathology';

      const partnerTypeMap: Record<string, string> = {
        HOSPITAL: 'HOSPITAL_NETWORK',
        PHARMACY: 'PHARMACY',
        PATHOLOGY: 'DIAGNOSTIC_LAB',
        DIAGNOSTIC_CENTRE: 'DIAGNOSTIC_LAB',
        CLINIC: 'CLINIC_GROUP',
        COMBO_CLINIC_PATHOLOGY: 'CLINIC_GROUP',
        COMBO_CLINIC_PHARMACY: 'CLINIC_GROUP',
        BLOOD_BANK: 'HOSPITAL_NETWORK',
        DENTAL_CLINIC: 'CLINIC_GROUP',
        AYUSH_WELLNESS: 'CLINIC_GROUP',
        DIALYSIS_CENTRE: 'HOSPITAL_NETWORK',
        EYE_CARE: 'CLINIC_GROUP',
        PHYSIOTHERAPY: 'CLINIC_GROUP'
      };
      const partnerType = partnerTypeMap[orgType] || 'CLINIC_GROUP';
      const tenantId = registeredUser.tenantId || toDeterministicUuid(`tenant-${body.email.toLowerCase().trim()}`);
      const profileId = toDeterministicUuid(registeredUser.email.toLowerCase().trim());
      let savedPartnerProfileId = profileId;

      const db = getDatabase();
      if (db) {
        try {
          // 1. Ensure Tenant in core.tenants
          const [existingTenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

          if (!existingTenant) {
            const slug = (body.partnerName || 'partner')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') + '-' + tenantId.substring(0, 4);

            await db
              .insert(tenants)
              .values({
                id: tenantId,
                name: body.partnerName,
                slug,
                type: partnerType,
                status: 'ACTIVE',
                metadata: { autoHydrated: true, email: body.email.toLowerCase().trim() }
              })
              .onConflictDoNothing();
          }

          // 2. Insert or update company.partner_profiles
          const [existingProfile] = await db
            .select({ id: partnerProfiles.id })
            .from(partnerProfiles)
            .where(
              or(
                eq(partnerProfiles.id, profileId),
                eq(partnerProfiles.tenantId, tenantId),
                eq(partnerProfiles.primaryContactEmail, body.email.toLowerCase().trim())
              )
            )
            .limit(1);

          savedPartnerProfileId = existingProfile?.id || profileId;

          const partnerMetadata = {
            classification: orgType,
            planTier: body.planTier,
            monthlyFee: body.monthlyFee ?? 0,
            accessibleFeatures: body.features || [],
            city: body.city || 'Lucknow',
            state: body.state || 'Uttar Pradesh',
            streetAddress: body.streetAddress || '',
            pincode: body.pincode || '',
            documentsVerified: body.documents?.length || 3,
            loginUrl: `${env.PARTNER_PORTAL_URL}${categoryLoginPath}`,
            credentials: {
              userId: registeredUser.email,
              role: registeredUser.roles[0],
              activatedAt: activationDate.toISOString(),
              planExpiryDate: planExpiryFormatted
            }
          };

          if (!existingProfile) {
            await db
              .insert(partnerProfiles)
              .values({
                id: savedPartnerProfileId,
                tenantId,
                partnerType: partnerType as any,
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                legalName: body.partnerName,
                tradeName: body.partnerName,
                primaryContactName: body.contactPerson,
                primaryContactEmail: body.email.toLowerCase().trim(),
                primaryContactPhone: body.phone,
                primaryContactRole: 'Partner Director',
                metadata: partnerMetadata
              })
              .onConflictDoNothing();
          } else {
            await db
              .update(partnerProfiles)
              .set({
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                tradeName: body.partnerName,
                legalName: body.partnerName,
                primaryContactName: body.contactPerson,
                primaryContactPhone: body.phone,
                metadata: partnerMetadata,
                updatedAt: new Date()
              })
              .where(eq(partnerProfiles.id, savedPartnerProfileId));
          }

          // 3. Mark matching staged registration APPROVED
          const allStaged = await db.select().from(partnerOnboardingStagedRegistrations);
          const matchedStaged = allStaged.find(
            (s) =>
              s.contactEmail?.toLowerCase().trim() === body.email.toLowerCase().trim() ||
              s.organizationName?.toLowerCase().trim() === body.partnerName.toLowerCase().trim()
          );
          if (matchedStaged) {
            await db
              .update(partnerOnboardingStagedRegistrations)
              .set({
                status: 'APPROVED',
                updatedAt: new Date()
              })
              .where(eq(partnerOnboardingStagedRegistrations.id, matchedStaged.id));
          }
        } catch (dbErr) {
          fastify.log.warn('Failed to persist onboarded partner into DB: ' + String(dbErr));
        }
      }

      // 4. Persist to approved disk fixtures & invalidate cache
      try {
        await saveApprovedPartnerToDisk({
          id: savedPartnerProfileId,
          email: body.email.toLowerCase().trim(),
          facilityName: body.partnerName,
          status: 'ACTIVE',
          kycStatus: 'KYC_VERIFIED',
          organizationType: orgType,
          planTier: body.planTier,
          monthlyFee: body.monthlyFee ?? 0,
          finalAmount: body.monthlyFee ?? 0
        });
        partnerSyncService.invalidateCache();
      } catch {}

      const activationVoucher = {
        partnerId: savedPartnerProfileId,
        partnerName: body.partnerName,
        classification: orgType,
        contactPerson: body.contactPerson,
        phone: body.phone,
        city: body.city || 'Lucknow',
        state: body.state || 'Uttar Pradesh',
        streetAddress: body.streetAddress || '',
        pincode: body.pincode || '',
        status: 'LIVE_ACTIVE',
        verificationStatus: '100%_VERIFIED',
        documentsVerified: body.documents?.length || 3,
        subscriptionPlan: {
          tier: body.planTier,
          monthlyFee: body.monthlyFee ?? 0,
          activeFeatures: body.features || [],
          isFirstYearFree: true,
          freeDurationDays: 365,
          expiryDate: planExpiryFormatted,
          expiryIso: planExpiryDate,
          renewalCycle: 'ANNUAL'
        },
        credentials: {
          loginUrl: `${env.PARTNER_PORTAL_URL}${categoryLoginPath}`,
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
  // Restricted to authenticated Company & Super Admins
  fastify.get(
    '/api/v1/company/partners/live-directory',
    { preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')] },
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

  const purgePartnerPermanently = async (
    partnerId: string,
    extraHints?: { email?: string | undefined; tradeName?: string | undefined; tenantSlug?: string | undefined }
  ): Promise<{ success: boolean; purgedId: string; message: string }> => {
    const db = getDatabase();
    const rawNeedle = String(partnerId).trim();
    const lowerNeedle = rawNeedle.toLowerCase();
    const targetUuid = toDeterministicUuid(rawNeedle);

    const profileIds = new Set<string>();
    const stagedIds = new Set<string>();
    const emails = new Set<string>();
    const names = new Set<string>();
    const tenantIds = new Set<string>();

    profileIds.add(rawNeedle);
    stagedIds.add(rawNeedle);
    if (targetUuid) {
      profileIds.add(targetUuid);
      stagedIds.add(targetUuid);
    }

    if (extraHints?.email) emails.add(extraHints.email.toLowerCase().trim());
    if (extraHints?.tradeName) names.add(extraHints.tradeName.trim());
    if (extraHints?.tenantSlug) {
      profileIds.add(extraHints.tenantSlug);
      tenantIds.add(extraHints.tenantSlug);
    }

    if (db) {
      // 1. Gather matching rows from partnerProfiles
      try {
        const matchedProfiles = await db
          .select()
          .from(partnerProfiles)
          .where(
            or(
              eq(partnerProfiles.id, targetUuid),
              eq(partnerProfiles.id, rawNeedle),
              eq(partnerProfiles.primaryContactEmail, lowerNeedle),
              eq(partnerProfiles.tradeName, rawNeedle),
              eq(partnerProfiles.legalName, rawNeedle),
              eq(partnerProfiles.tenantId, rawNeedle),
              eq(partnerProfiles.tenantId, targetUuid)
            )
          );

        for (const p of matchedProfiles) {
          if (p.id) profileIds.add(p.id);
          if (p.primaryContactEmail) emails.add(p.primaryContactEmail.toLowerCase().trim());
          if (p.tradeName) names.add(p.tradeName.trim());
          if (p.legalName) names.add(p.legalName.trim());
          if (p.tenantId) tenantIds.add(p.tenantId);
        }
      } catch (err) {
        fastify.log.warn('Error querying partnerProfiles for purge: ' + String(err));
      }

      // 2. Gather matching rows from partnerOnboardingStagedRegistrations
      // Comprehensive match: also check against emails, names, and tenantIds discovered from profiles!
      try {
        const allStaged = await db.select().from(partnerOnboardingStagedRegistrations);
        for (const s of allStaged) {
          const sId = s.id ? s.id.toLowerCase() : '';
          let sDeterministic = '';
          try { sDeterministic = toDeterministicUuid(s.id).toLowerCase(); } catch {}
          const sEmail = s.contactEmail ? s.contactEmail.toLowerCase().trim() : '';
          const sOrgName = s.organizationName ? s.organizationName.trim().toLowerCase() : '';
          const sTenant = s.tenantDraftId ? s.tenantDraftId.toLowerCase() : '';

          const isMatch =
            sId === lowerNeedle ||
            sId === targetUuid.toLowerCase() ||
            (sDeterministic && (sDeterministic === targetUuid.toLowerCase() || sDeterministic === lowerNeedle)) ||
            sEmail === lowerNeedle ||
            sOrgName === lowerNeedle ||
            sTenant === lowerNeedle ||
            sTenant === targetUuid.toLowerCase() ||
            Array.from(emails).some((e) => e.toLowerCase() === sEmail) ||
            Array.from(names).some((n) => n.toLowerCase() === sOrgName || sOrgName.includes(n.toLowerCase())) ||
            Array.from(tenantIds).some((t) => t.toLowerCase() === sTenant);

          if (isMatch) {
            if (s.id) stagedIds.add(s.id);
            if (s.contactEmail) emails.add(s.contactEmail.toLowerCase().trim());
            if (s.organizationName) names.add(s.organizationName.trim());
            if (s.tenantDraftId) tenantIds.add(s.tenantDraftId);
          }
        }
      } catch (err) {
        fastify.log.warn('Error querying partnerOnboardingStagedRegistrations for purge: ' + String(err));
      }

      // 3. Record Authoritative Persistent Tombstone
      partnerTombstoneService.recordPurge({
        primaryId: rawNeedle,
        ids: Array.from(profileIds),
        emails: Array.from(emails),
        names: Array.from(names),
        tenantIds: Array.from(tenantIds),
        stagedIds: Array.from(stagedIds),
        reason: 'ADMIN_PERMANENT_CASCADE_PURGE'
      });

      // 4. Exhaustive Cascade Delete across ALL child and parent clinical/operational tables
      for (const pid of profileIds) {
        try { await db.delete(partnerLifecycleTransitions).where(eq(partnerLifecycleTransitions.partnerId, pid)); } catch {}
        try { await db.delete(partnerGovernanceOverrides).where(eq(partnerGovernanceOverrides.partnerId, pid)); } catch {}
        try { await db.delete(partnerPlanAssignments).where(eq(partnerPlanAssignments.partnerId, pid)); } catch {}
        try { await db.delete(licenses).where(eq(licenses.partnerId, pid)); } catch {}
        try { await db.delete(subscriptions).where(eq(subscriptions.partnerId, pid)); } catch {}
        try { await db.delete(partnerHealthProfiles).where(eq(partnerHealthProfiles.partnerId, pid)); } catch {}
        try { await db.delete(doctorProfiles).where(eq(doctorProfiles.partnerId, pid)); } catch {}
        try { await db.delete(operationalStaff).where(eq(operationalStaff.partnerId, pid)); } catch {}
        try { await db.delete(operationalDepartments).where(eq(operationalDepartments.partnerId, pid)); } catch {}
        try { await db.delete(operationalFacilities).where(eq(operationalFacilities.partnerId, pid)); } catch {}
        try { await db.delete(operationalOrganizations).where(eq(operationalOrganizations.partnerId, pid)); } catch {}
        try { await db.delete(operationalPartners).where(eq(operationalPartners.id, pid)); } catch {}
        try { await db.delete(partnerProfiles).where(eq(partnerProfiles.id, pid)); } catch {}
      }

      // Remove tenant-linked operational records and root tenant
      for (const tid of tenantIds) {
        try { await db.delete(licenses).where(eq(licenses.tenantId, tid)); } catch {}
        try { await db.delete(doctorProfiles).where(eq(doctorProfiles.tenantId, tid)); } catch {}
        try { await db.delete(operationalStaff).where(eq(operationalStaff.tenantId, tid)); } catch {}
        try { await db.delete(operationalDepartments).where(eq(operationalDepartments.tenantId, tid)); } catch {}
        try { await db.delete(operationalFacilities).where(eq(operationalFacilities.tenantId, tid)); } catch {}
        try { await db.delete(branches).where(eq(branches.tenantId, tid)); } catch {}
        try { await db.delete(operationalOrganizations).where(eq(operationalOrganizations.tenantId, tid)); } catch {}
        try { await db.delete(partnerAgreements).where(eq(partnerAgreements.tenantId, tid)); } catch {}
        try { await db.delete(operationalPartners).where(eq(operationalPartners.tenantId, tid)); } catch {}
        try { await db.delete(partnerProfiles).where(eq(partnerProfiles.tenantId, tid)); } catch {}
        try { await db.delete(tenants).where(eq(tenants.id, tid)); } catch {}
      }

      // Remove staged onboarding rows permanently
      for (const sid of stagedIds) {
        try {
          await db.delete(partnerOnboardingStagedRegistrations).where(eq(partnerOnboardingStagedRegistrations.id, sid));
        } catch {}
      }
      for (const em of emails) {
        try {
          await db.delete(partnerOnboardingStagedRegistrations).where(eq(partnerOnboardingStagedRegistrations.contactEmail, em));
        } catch {}
      }
      for (const nm of names) {
        try {
          await db.delete(partnerOnboardingStagedRegistrations).where(eq(partnerOnboardingStagedRegistrations.organizationName, nm));
        } catch {}
      }
    }

    // 5. In-Memory User Cache: Remove credentials
    realAuthService.removePartnerByIdOrTenant(rawNeedle);
    if (targetUuid) {
      realAuthService.removePartnerByIdOrTenant(targetUuid);
    }
    for (const email of emails) {
      realAuthService.removePartnerUserCredential(email);
      realAuthService.removePartnerByIdOrTenant(email);
    }
    for (const name of names) {
      realAuthService.removePartnerByIdOrTenant(name);
    }
    for (const tid of tenantIds) {
      realAuthService.removePartnerByIdOrTenant(tid);
    }

    // 6. Disk Persistence: Wipe permanently from approved_partners.json and partner_credentials.json
    await removeApprovedPartnerFromDisk(rawNeedle);
    if (targetUuid) {
      await removeApprovedPartnerFromDisk(targetUuid);
    }
    for (const email of emails) {
      await removeApprovedPartnerFromDisk(email);
    }
    for (const name of names) {
      await removeApprovedPartnerFromDisk(name);
    }
    for (const tid of tenantIds) {
      await removeApprovedPartnerFromDisk(tid);
    }

    return {
      success: true,
      purgedId: rawNeedle,
      message: `Partner "${rawNeedle}" permanently purged from DB, memory cache, and disk fixtures with tombstone registration.`
    };
  };

  // DELETE /api/v1/company/partners/:partnerId (Hard Cascade Purge Partner Profile & Directory)
  fastify.delete(
    '/api/v1/company/partners/:partnerId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const query = (request.query || {}) as { email?: string; tradeName?: string; slug?: string };
      const body = (request.body || {}) as { email?: string; tradeName?: string; slug?: string };
      const email = query.email || body.email;
      const tradeName = query.tradeName || body.tradeName;
      const tenantSlug = query.slug || body.slug;

      const res = await purgePartnerPermanently(partnerId, { email, tradeName, tenantSlug });
      return reply.status(200).send({ success: true, data: res, message: `Partner ${partnerId} permanently purged.` });
    }
  );

  // DELETE /api/v1/company/partners/staged/:partnerId (Hard Purge Staged Lead)
  fastify.delete(
    '/api/v1/company/partners/staged/:partnerId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const query = (request.query || {}) as { email?: string; tradeName?: string; slug?: string };
      const body = (request.body || {}) as { email?: string; tradeName?: string; slug?: string };
      const email = query.email || body.email;
      const tradeName = query.tradeName || body.tradeName;
      const tenantSlug = query.slug || body.slug;

      const res = await purgePartnerPermanently(partnerId, { email, tradeName, tenantSlug });
      return reply.status(200).send({ success: true, data: res, message: `Lead ${partnerId} successfully purged.` });
    }
  );

  // POST /api/v1/company/partners/reset-directory (Day-0 Zero Slate Purge)
  fastify.post(
    '/api/v1/company/partners/reset-directory',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN')]
    },
    async (_request, reply) => {
      partnerTombstoneService.clearAllTombstones();
      const res = await partnerOnboardingRepository.purgeAllStagedRegistrations();
      return reply.status(200).send({ success: true, data: res, message: 'Partner Directory reset to Day-0 clean slate (0 leads).' });
    }
  );

  // POST /api/v1/company/partners/clear-tombstones (Administrative Tombstone Slate Reset)
  fastify.post(
    '/api/v1/company/partners/clear-tombstones',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (_request, reply) => {
      partnerTombstoneService.clearAllTombstones();
      return reply.status(200).send({ success: true, message: 'All partner purge tombstones successfully cleared.' });
    }
  );

  // POST /api/v1/company/partners/reset-password (HQ Administrative Password Reset)
  fastify.post(
    '/api/v1/company/partners/reset-password',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const body = (request.body || {}) as {
        email?: string;
        partnerId?: string;
        newPassword?: string;
      };

      const isUuid = (val?: string): val is string =>
        !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

      let email = body.email?.trim();
      if (!email && isUuid(body.partnerId)) {
        const db = getDatabase();
        if (db) {
          try {
            const [p] = await db
              .select({ email: partnerProfiles.primaryContactEmail })
              .from(partnerProfiles)
              .where(eq(partnerProfiles.id, body.partnerId.trim()))
              .limit(1);
            if (p?.email) {
              email = p.email;
            }
          } catch (lookupErr: any) {
            fastify.log.warn('Partner profile email lookup failed: ' + String(lookupErr?.message || lookupErr));
          }
        }
      }

      if (!email) {
        throw new AppError({
          message: 'Partner email or valid partnerId is required to reset password',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const result = realAuthService.resetPartnerPassword(email, body.newPassword);

      // Also update temporaryPassword in partnerProfiles metadata if profile exists in DB
      const db = getDatabase();
      if (db) {
        try {
          const emailNorm = email.toLowerCase().trim();
          const conditions = [eq(partnerProfiles.primaryContactEmail, emailNorm)];
          if (isUuid(body.partnerId)) {
            conditions.push(eq(partnerProfiles.id, body.partnerId.trim()));
          }

          const [existing] = await db
            .select()
            .from(partnerProfiles)
            .where(or(...conditions))
            .limit(1);

          if (existing) {
            const currentMeta = (existing.metadata || {}) as Record<string, any>;
            const creds = (currentMeta['credentials'] || {}) as Record<string, any>;
            creds['temporaryPassword'] = result.newPassword;
            currentMeta['credentials'] = creds;

            await db
              .update(partnerProfiles)
              .set({ metadata: currentMeta, updatedAt: new Date() })
              .where(eq(partnerProfiles.id, existing.id));
          }
        } catch (dbErr: any) {
          fastify.log.warn('Could not sync temporary password to partnerProfiles metadata: ' + String(dbErr?.message || dbErr));
        }
      }

      return reply.status(200).send({
        success: true,
        data: result,
        message: `Password for ${email} has been successfully reset to ${result.newPassword}.`
      });
    }
  );

  // =========================================================================
  // PARTNER ACCESS, ENTITLEMENTS & STAFF GOVERNANCE ROUTES (HQ ULTIMATE CONTROL)
  // =========================================================================

  // GET /api/v1/company/partners/:partnerId/governance (Full Access & Staff Snapshot)
  fastify.get(
    '/api/v1/company/partners/:partnerId/governance',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const p = await partnerService.getPartnerById(partnerId, request.session);
      const metadata = {
        tenantId: p.tenantId,
        facilityName: p.tradeName || p.legalName,
        partnerType: p.partnerType
      };

      const snapshot = partnerGovernanceService.getGovernanceSnapshot(partnerId, metadata);
      return reply.status(200).send({ success: true, data: snapshot });
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/governance/modules (Toggle Module)
  fastify.patch(
    '/api/v1/company/partners/:partnerId/governance/modules',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = request.body as {
        moduleCode: string;
        status: 'ACTIVE' | 'DISABLED' | 'TRIAL';
        reason?: string;
        trialDays?: number;
      };

      if (!body || !body.moduleCode || !body.status) {
        throw new AppError({
          message: 'moduleCode and status (ACTIVE, DISABLED, TRIAL) are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const actor = (request.session as any)?.email || request.session?.userId || 'DocSearch Founder Command';
      const updated = await partnerGovernanceService.toggleModule(
        partnerId,
        body.moduleCode,
        body.status,
        body.reason || 'Founder module toggle',
        actor,
        body.trialDays || 14
      );

      return reply.status(200).send({
        success: true,
        data: updated,
        message: `Module ${body.moduleCode} successfully updated to ${body.status}`
      });
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/governance/staff/:userId (Update Staff Permissions/Status)
  fastify.patch(
    '/api/v1/company/partners/:partnerId/governance/staff/:userId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId, userId } = request.params as { partnerId: string; userId: string };
      const body = request.body as {
        role?: string;
        permissions?: string[];
        status?: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
        temporaryPassword?: string;
        reason?: string;
      };

      const actor = (request.session as any)?.email || request.session?.userId || 'DocSearch Founder Command';
      const updated = partnerGovernanceService.updateStaffUser(
        partnerId,
        userId,
        body,
        body.reason || 'HQ Staff Governance Action',
        actor
      );

      return reply.status(200).send({
        success: true,
        data: updated,
        message: `Staff user ${userId} access updated successfully.`
      });
    }
  );

  // POST /api/v1/company/partners/:partnerId/governance/kill-switch (Trigger Emergency Kill-Switch)
  fastify.post(
    '/api/v1/company/partners/:partnerId/governance/kill-switch',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = request.body as {
        switchType: 'GLOBAL_FREEZE' | 'BILLING_FREEZE' | 'COMMUNICATION_FREEZE';
        enabled: boolean;
        reason?: string;
      };

      if (!body || !body.switchType || body.enabled === undefined) {
        throw new AppError({
          message: 'switchType and enabled boolean are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const actor = (request.session as any)?.email || request.session?.userId || 'DocSearch Founder Command';
      const killSwitches = await partnerGovernanceService.triggerKillSwitch(
        partnerId,
        body.switchType,
        body.enabled,
        body.reason || `Emergency kill-switch ${body.switchType} triggered by HQ`,
        actor
      );

      return reply.status(200).send({
        success: true,
        data: killSwitches,
        message: `Emergency kill-switch ${body.switchType} is now ${body.enabled ? 'ENGAGED ⚠️' : 'RELEASED 🟢'}`
      });
    }
  );

  // PATCH /api/v1/company/partners/:partnerId/governance/quotas (Update Resource Quotas)
  fastify.patch(
    '/api/v1/company/partners/:partnerId/governance/quotas',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = (request.body as any) || {};
      const quotaUpdates = body.quotas ? body.quotas : body;
      const { reason, ...actualQuotas } = quotaUpdates;

      const actor = (request.session as any)?.email || request.session?.userId || 'DocSearch Founder Command';
      const quotas = await partnerGovernanceService.updateQuotas(
        partnerId,
        actualQuotas,
        body.reason || reason || 'Resource capacity updated by Founder',
        actor
      );

      return reply.status(200).send({
        success: true,
        data: quotas,
        message: 'Partner quotas successfully updated.'
      });
    }
  );

  // Operational Departments Endpoints for HQ Remote Control
  fastify.get(
    '/api/v1/company/partners/:partnerId/departments',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      await assertPartnerTenantScope(partnerId, request.session);
      const db = getDatabase();
      if (!db) return reply.send({ success: true, data: [] });

      const depts = await db
        .select()
        .from(operationalDepartments)
        .where(
          partnerId.length === 36
            ? eq(operationalDepartments.tenantId, partnerId)
            : eq(operationalDepartments.departmentCode, partnerId)
        )
        .orderBy(desc(operationalDepartments.createdAt));

      return reply.send({ success: true, data: depts });
    }
  );

  fastify.post(
    '/api/v1/company/partners/:partnerId/departments',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const body = request.body as {
        departmentCode: string;
        departmentName: string;
        tenantId?: string;
        organizationId?: string;
        branchId?: string;
        parentDepartmentId?: string;
        departmentHeadName?: string;
        costCenterCode?: string;
      };

      if (!body.departmentCode || !body.departmentName) {
        throw new AppError({
          message: 'departmentCode and departmentName are required',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const db = getDatabase();
      if (!db) throw new AppError({ message: 'Database client unavailable', statusCode: 500 });

      // Resolve tenantId
      let tenantId = body.tenantId;
      let partnerUuid = partnerId;
      if (partnerId.length === 36) {
        tenantId = tenantId || partnerId;
      } else {
        const [prof] = await db.select().from(partnerProfiles).where(eq(partnerProfiles.id, toDeterministicUuid(partnerId))).limit(1);
        if (prof?.tenantId) {
          tenantId = prof.tenantId;
          partnerUuid = prof.id;
        }
      }

      if (!tenantId) {
        throw new AppError({ message: 'Could not resolve tenantId for partner', statusCode: 400 });
      }

      const [created] = await db
        .insert(operationalDepartments)
        .values({
          tenantId,
          partnerId: partnerUuid.length === 36 ? partnerUuid : toDeterministicUuid(partnerUuid),
          organizationId: body.organizationId || toDeterministicUuid(`org-${partnerId}`),
          branchId: body.branchId || null,
          departmentCode: body.departmentCode.toUpperCase(),
          departmentName: body.departmentName,
          parentDepartmentId: body.parentDepartmentId || null,
          departmentHeadName: body.departmentHeadName || null,
          costCenterCode: body.costCenterCode || null,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return reply.status(201).send({ success: true, data: created });
    }
  );

  fastify.patch(
    '/api/v1/company/partners/:partnerId/departments/:departmentId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { departmentId } = request.params as { partnerId: string; departmentId: string };
      const body = request.body as {
        departmentName?: string;
        departmentHeadName?: string;
        costCenterCode?: string;
        status?: string;
      };

      const db = getDatabase();
      if (!db) throw new AppError({ message: 'Database client unavailable', statusCode: 500 });

      const [updated] = await db
        .update(operationalDepartments)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(operationalDepartments.id, departmentId))
        .returning();

      if (!updated) {
        throw new AppError({ message: `Department ${departmentId} not found`, statusCode: 404 });
      }

      return reply.send({ success: true, data: updated });
    }
  );

  fastify.delete(
    '/api/v1/company/partners/:partnerId/departments/:departmentId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { departmentId } = request.params as { partnerId: string; departmentId: string };
      const db = getDatabase();
      if (!db) throw new AppError({ message: 'Database client unavailable', statusCode: 500 });

      const [deleted] = await db
        .update(operationalDepartments)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(eq(operationalDepartments.id, departmentId))
        .returning();

      return reply.send({ success: true, data: deleted });
    }
  );
};


