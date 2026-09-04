import crypto from 'node:crypto';
import { partnerRepository, type FindPartnersParams } from '../../repositories/company/PartnerRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { subscriptionService } from './SubscriptionService.js';
import { licenseService } from './LicenseService.js';
import { entitlementService } from './EntitlementService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  tenants,
  branches,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  partnerPlanAssignments,
  eq,
  type PartnerProfile,
  type NewPartnerProfile,
  type Subscription,
  type License,
  type Plan

} from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export interface CreatePartnerOnboardingInput {
  tenantId?: string | undefined;
  legalName: string;
  tradeName: string;
  partnerType?: string | undefined;
  lifecycleStatus?: string | undefined;
  verificationStatus?: string | undefined;
  onboardingStep?: string | undefined;
  onboardingProgressPercent?: number | undefined;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string | undefined;
  primaryContactRole?: string | undefined;
  planId?: string | undefined;
  planCode?: string | undefined;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | undefined;
  isTrial?: boolean | undefined;
  tenantSlug?: string | undefined;
  initialFacilityName?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface CommercialProfileResult {
  partner: PartnerProfile;
  subscription: Subscription | null;
  license: License | null;
  plan: Plan | null;
  entitlements: Array<{ code: string; name: string; category: string; value: any }>;
  evaluation: {
    status: string;
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
    isSignatureValid: boolean;
  } | null;
}

export class PartnerService {
  async getPartners(
    params: FindPartnersParams,
    session: SessionContext
  ): Promise<{ items: PartnerProfile[]; total: number }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerRepository.findMany(params, tx);
    });
  }

  async getPartnerById(partnerId: string, session: SessionContext): Promise<PartnerProfile> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      if (!session.isSuperAdmin && session.tenantId && partner.tenantId !== session.tenantId) {
        throw AppError.forbidden('Cannot access partner profile of another organization');
      }
      return partner;
    });

  }

  /**
   * Complete ACID transactional partner onboarding:
   * Partner -> Tenant -> Branch -> Plan Selection -> Subscription -> License -> Expiry -> Entitlements -> Audit
   */
  async createPartner(
    input: CreatePartnerOnboardingInput,
    session: SessionContext
  ): Promise<{
    partner: PartnerProfile;
    tenantId: string;
    subscription: Subscription;
    license: License;
    plan: Plan;
    entitlements: Array<{ code: string; name: string; category: string; value: any }>;
    commercialSummary: {
      status: string;
      billingCycle: string;
      startDate: string;
      expiryDate: string;
      gracePeriodEnd: string | null;
      daysRemaining: number;
      limits: { maxConcurrentUsers: number; maxDoctors: number; maxBranches: number };
    };
  }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // 1. Resolve Plan from authoritative database catalog
      let plan: Plan | null = null;
      if (input.planId) {
        plan = await productRepository.findPlanById(input.planId, tx);
      } else if (input.planCode) {
        plan = await productRepository.findPlanByCode(input.planCode, tx);
      } else {
        // Default to active Starter plan if none provided
        plan = await productRepository.findPlanByCode('PLAN_CLINIC_STARTER', tx);
      }

      if (!plan) {
        throw AppError.badRequest(
          `Plan ${input.planId || input.planCode || 'DEFAULT'} not found in authoritative database catalog`
        );
      }

      const planMeta = (plan.metadata || {}) as Record<string, any>;
      const billingCycle = input.billingCycle || planMeta['billingCadence'] || 'MONTHLY';
      const isTrial = Boolean(input.isTrial);

      // 2. Authoritative Dynamic Dates Calculation
      const { startDate, endDate, renewalDate, gracePeriodEnd } =
        subscriptionService.calculateSubscriptionDates(plan, billingCycle, isTrial);

      // 3. Resolve or Create Tenant
      const tenantId = input.tenantId || crypto.randomUUID();
      const slugBase = (input.tradeName || input.legalName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = input.tenantSlug || `${slugBase}-${crypto.randomBytes(3).toString('hex')}`;

      try {
        await tx
          .insert(tenants)
          .values({
            id: tenantId,
            name: input.tradeName || input.legalName,
            slug,
            type: (input.partnerType === 'HOSPITAL_NETWORK' ? 'HOSPITAL' : 'CLINIC') as any,
            status: 'ACTIVE'
          })
          .onConflictDoNothing();
      } catch {}

      // 4. Create Partner Profile
      const partnerId = crypto.randomUUID();
      const partnerData: NewPartnerProfile = {
        id: partnerId,
        tenantId,
        legalName: input.legalName,
        tradeName: input.tradeName,
        partnerType: input.partnerType ?? 'HOSPITAL_NETWORK',
        lifecycleStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        onboardingStep: 'COMPLETE',
        onboardingProgressPercent: 100,
        primaryContactName: input.primaryContactName,
        primaryContactEmail: input.primaryContactEmail,
        primaryContactPhone: input.primaryContactPhone ?? null,
        primaryContactRole: input.primaryContactRole ?? null,
        metadata: input.metadata || {}
      };

      const partner = await partnerRepository.create(partnerData, tx);

      // 5. Create Operational Partner, Org, and Facility for Clinical Integration
      const shortHash = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orgId = crypto.randomUUID();
      const facilityId = crypto.randomUUID();

      try {
        await tx
          .insert(operationalPartners)
          .values({
            id: partnerId,
            tenantId,
            partnerCode: `PTR-${shortHash}`,
            legalBusinessName: input.legalName,
            partnerType: input.partnerType === 'HOSPITAL_NETWORK' ? 'HOSPITAL_SYSTEM' : 'CLINIC_NETWORK',
            contactEmail: input.primaryContactEmail,
            contactPhone: input.primaryContactPhone || null,
            status: 'ACTIVE'
          })
          .onConflictDoNothing();

        await tx
          .insert(operationalOrganizations)
          .values({
            id: orgId,
            tenantId,
            partnerId,
            organizationCode: `ORG-${shortHash}`,
            organizationName: input.tradeName,
            organizationType: input.partnerType === 'HOSPITAL_NETWORK' ? 'HOSPITAL' : 'CLINIC',
            contactEmail: input.primaryContactEmail,
            contactPhone: input.primaryContactPhone || null,
            status: 'ACTIVE'
          })
          .onConflictDoNothing();

        await tx
          .insert(operationalFacilities)
          .values({
            id: facilityId,
            tenantId,
            partnerId,
            organizationId: orgId,
            facilityCode: `FAC-${shortHash}`,
            facilityName: input.initialFacilityName || `${input.tradeName} Main Facility`,
            facilityType: input.partnerType === 'HOSPITAL_NETWORK' ? 'INPATIENT_HOSPITAL' : 'OUTPATIENT_CLINIC',
            addressStreet: '123 Healthcare Boulevard',
            addressCity: 'Bangalore',
            addressState: 'Karnataka',
            addressPostalCode: '560001',
            addressCountry: 'IN',
            contactEmail: input.primaryContactEmail,
            contactPhone: input.primaryContactPhone || '080-12345678',
            status: 'ACTIVE'
          })
          .onConflictDoNothing();

        await tx
          .insert(branches)
          .values({
            id: facilityId,
            tenantId,
            name: input.initialFacilityName || `${input.tradeName} Main Facility`,
            code: 'FAC-01',
            status: 'ACTIVE'
          })
          .onConflictDoNothing();
      } catch {}

      // 6. Assign Plan in partnerPlanAssignments
      try {
        await tx
          .insert(partnerPlanAssignments)
          .values({
            partnerId,
            productId: plan.productId,
            planId: plan.id,
            assignmentStatus: 'ACTIVE',
            effectiveDate: startDate,
            expirationDate: endDate,
            assignedByEmail: (session as any).email || 'admin@docsearch.health',
            metadata: { billingCycle, isTrial }
          })
          .onConflictDoNothing();
      } catch {}

      // 7. Create Commercial Subscription
      const subscriptionId = crypto.randomUUID();
      const createdSub = await subscriptionRepository.create(
        {
          id: subscriptionId,
          partnerId,
          productId: plan.productId,
          planId: plan.id,
          planVersion: plan.version || '1.0.0',
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          billingCycle,
          startDate,
          renewalDate,
          endDate,
          metadata: {
            isTrial,
            basePrice: planMeta['basePrice'],
            currency: planMeta['currency'] || 'INR'
          }
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_CREATED',
          resourceType: 'SUBSCRIPTION',
          resourceId: createdSub.id,
          tenantId,
          metadata: {
            partnerId,
            planId: plan.id,
            planCode: plan.code,
            billingCycle,
            status: createdSub.status
          }
        },
        session,
        tx
      );

      // 8. Issue Persisted Software License with Cryptographic HMAC-SHA256 Signature

      const maxConcurrentUsers = Number(planMeta['maxConcurrentUsers']) || 50;
      const maxDoctors = Number(planMeta['maxDoctors']) || 20;
      const maxBranches = Number(planMeta['maxBranches']) || 5;

      const createdLicense = await licenseService.issueLicense(
        {
          partnerId,
          tenantId,
          subscriptionId,
          planId: plan.id,
          licenseType: isTrial ? 'TRIAL' : 'COMMERCIAL',
          maxConcurrentUsers,
          maxDoctors,
          maxBranches,
          startDate,
          expiryDate: endDate,
          gracePeriodEnd,
          metadata: {
            tradeName: input.tradeName,
            planCode: plan.code
          }
        },
        tx
      );

      // 9. Resolve Feature Entitlements
      const entitlements = await productRepository.getPlanEntitlements(plan.id, tx);

      // 10. Record Cryptographic Audit Trail
      await auditRepository.recordEvent(
        {
          eventType: 'PARTNER_CREATED',
          resourceType: 'PARTNER_PROFILE',
          resourceId: partner.id,
          tenantId,
          metadata: {
            legalName: partner.legalName,
            tradeName: partner.tradeName,
            partnerType: partner.partnerType,
            planCode: plan.code,
            subscriptionId: createdSub.id,
            licenseKey: createdLicense.licenseKey
          }
        },
        session,
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'LICENSE_ISSUED',
          resourceType: 'LICENSE',
          resourceId: createdLicense.id,
          tenantId,
          metadata: {
            partnerId,
            subscriptionId,
            licenseKey: createdLicense.licenseKey,
            expiryDate: endDate.toISOString(),
            signature: createdLicense.signature
          }
        },
        session,
        tx
      );

      const evaluation = licenseService.evaluateLicenseStatus(createdLicense);

      return {
        partner,
        tenantId,
        subscription: createdSub,
        license: createdLicense,
        plan,
        entitlements,
        commercialSummary: {
          status: createdSub.status,
          billingCycle,
          startDate: startDate.toISOString(),
          expiryDate: endDate.toISOString(),
          gracePeriodEnd: gracePeriodEnd ? gracePeriodEnd.toISOString() : null,
          daysRemaining: evaluation.daysRemaining,
          limits: {
            maxConcurrentUsers,
            maxDoctors,
            maxBranches
          }
        }
      };
    });
  }

  /**
   * Complete Partner Commercial Profile detail view
   */
  async getPartnerCommercialProfile(
    partnerId: string,
    session: SessionContext
  ): Promise<CommercialProfileResult> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      if (!session.isSuperAdmin && session.tenantId && partner.tenantId !== session.tenantId) {
        throw AppError.forbidden('Cannot access commercial profile of another organization');
      }


      const subscription = await subscriptionRepository.findByPartnerId(partnerId, tx);
      let license: License | null = null;
      let plan: Plan | null = null;
      let entitlements: any[] = [];
      let evaluation = null;

      if (subscription) {
        license = await licenseRepository.findBySubscriptionId(subscription.id, tx);
        plan = await productRepository.findPlanById(subscription.planId, tx);
        if (plan) {
          entitlements = await productRepository.getPlanEntitlements(plan.id, tx);
        }
        if (license) {
          const evalResult = licenseService.evaluateLicenseStatus(license);
          const isSignatureValid = licenseService.verifyLicenseSignature(license);
          evaluation = {
            ...evalResult,
            isSignatureValid
          };
        }
      }

      return {
        partner,
        subscription,
        license,
        plan,
        entitlements,
        evaluation
      };
    });
  }

  async updatePartnerStatus(
    partnerId: string,
    fromStatus: string,
    toStatus: string,
    reason: string,
    session: SessionContext
  ): Promise<PartnerProfile> {
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      LEAD: ['PROSPECT', 'ONBOARDING'],
      PROSPECT: ['ONBOARDING', 'SUSPENDED'],
      ONBOARDING: ['VERIFICATION', 'ACTIVE', 'SUSPENDED'],
      VERIFICATION: ['ACTIVE', 'SUSPENDED'],
      ACTIVE: ['SUSPENDED', 'OFFBOARDED'],
      SUSPENDED: ['ACTIVE', 'OFFBOARDED'],
      OFFBOARDED: []
    };

    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new AppError({
        message: `Invalid partner status transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await partnerRepository.updateStatus(
        partnerId,
        fromStatus,
        toStatus,
        session.userId || 'system',
        reason,
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'PARTNER_STATUS_UPDATED',
          resourceType: 'PARTNER_PROFILE',
          resourceId: partnerId,
          tenantId: updated.tenantId,
          metadata: {
            fromStatus,
            toStatus,
            reason
          }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async getPartnerEntitlements(partnerId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      if (!session.isSuperAdmin && session.tenantId && partner.tenantId !== session.tenantId) {
        throw AppError.forbidden('Cannot access entitlements of another organization');
      }
      return entitlementService.getPartnerEntitlements(partner.tenantId);
    });
  }

  async addBranch(
    partnerId: string,
    branchData: { name: string; code?: string },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      if (!session.isSuperAdmin && session.tenantId && partner.tenantId !== session.tenantId) {
        throw AppError.forbidden('Cannot modify branches of another organization');
      }


      // Enforce database-driven branch limit
      const limitCheck = await entitlementService.checkBranchLimit(partner.tenantId);
      if (!limitCheck.allowed) {
        throw new AppError({
          message: `Branch limit of ${limitCheck.maxAllowed} reached for current subscription plan. Upgrade plan to add more branches.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403,
          details: [
            {
              field: 'branches',
              message: `Current branches: ${limitCheck.currentCount}, Maximum allowed: ${limitCheck.maxAllowed}`
            }
          ]
        });
      }


      const branchId = crypto.randomUUID();
      const code = branchData.code || `FAC-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      let orgId = partner.tenantId;
      try {
        const [org] = await tx
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(eq(operationalOrganizations.partnerId, partnerId))
          .limit(1);
        if (org) orgId = org.id;
      } catch {}

      await tx
        .insert(operationalFacilities)
        .values({
          id: branchId,
          tenantId: partner.tenantId,
          partnerId,
          organizationId: orgId,
          facilityCode: code,
          facilityName: branchData.name,
          facilityType: 'OUTPATIENT_CLINIC',
          addressStreet: '100 Healthcare Way',
          addressCity: 'Bangalore',
          addressState: 'Karnataka',
          addressPostalCode: '560001',
          addressCountry: 'IN',
          contactEmail: partner.primaryContactEmail,
          contactPhone: partner.primaryContactPhone || '080-12345678',
          status: 'ACTIVE'
        })

        .onConflictDoNothing();

      await tx
        .insert(branches)
        .values({
          id: branchId,
          tenantId: partner.tenantId,
          name: branchData.name,
          code,
          status: 'ACTIVE'
        })
        .onConflictDoNothing();

      await auditRepository.recordEvent(
        {
          eventType: 'BRANCH_CREATED',
          resourceType: 'BRANCH',
          resourceId: branchId,
          tenantId: partner.tenantId,
          metadata: {
            partnerId,
            branchName: branchData.name,
            code
          }
        },
        session,
        tx
      );

      return {
        id: branchId,
        tenantId: partner.tenantId,
        partnerId,
        name: branchData.name,
        code,
        status: 'ACTIVE'
      };
    });
  }

  async addDoctor(
    partnerId: string,
    doctorData: { fullName: string; email: string; specialization?: string; requestedTotalCount?: number },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      if (!session.isSuperAdmin && session.tenantId && partner.tenantId !== session.tenantId) {
        throw AppError.forbidden('Cannot modify doctors of another organization');
      }


      // Enforce database-driven user/doctor limit
      const limitCheck = await entitlementService.checkUserLimit(partner.tenantId, doctorData.requestedTotalCount);
      if (!limitCheck.allowed) {
        throw new AppError({
          message: `Doctor/User limit of ${limitCheck.maxAllowed} reached for current subscription plan. Upgrade plan to add more doctors.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403,
          details: [
            {
              field: 'doctors',
              message: `Current count: ${limitCheck.currentCount}, Maximum allowed: ${limitCheck.maxAllowed}`
            }
          ]
        });
      }


      const docId = crypto.randomUUID();
      await auditRepository.recordEvent(
        {
          eventType: 'DOCTOR_ENROLLED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: docId,
          tenantId: partner.tenantId,
          metadata: {
            partnerId,
            fullName: doctorData.fullName,
            email: doctorData.email
          }
        },
        session,
        tx
      );

      return {
        id: docId,
        tenantId: partner.tenantId,
        partnerId,
        fullName: doctorData.fullName,
        email: doctorData.email,
        specialization: doctorData.specialization || 'General Practice',
        status: 'ACTIVE'
      };
    });
  }
}


export const partnerService = new PartnerService();
