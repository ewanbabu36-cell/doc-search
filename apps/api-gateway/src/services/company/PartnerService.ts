import crypto from 'node:crypto';
import {
  partnerRepository,
  type FindPartnersParams,
  type DirectoryQueryParams,
  type DirectoryResponse,
  type DirectoryIntelligenceSummary,
  type PartnerAnalyticsSummary,
  type Partner360Profile
} from '../../repositories/company/PartnerRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { subscriptionService } from './SubscriptionService.js';
import { licenseService } from './LicenseService.js';
import { entitlementService } from './EntitlementService.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  getReadDatabase,
  tenants,
  branches,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  operationalStaff,
  doctorProfiles,
  products,
  plans,
  partnerPlanAssignments,
  eq,
  and,
  or,
  desc,
  type PartnerProfile,
  type NewPartnerProfile,
  type Subscription,
  type License,
  type Plan
} from '@docsearch/database';
import { AppError, ErrorCode, normalizeFacilityProfile } from '@docsearch/shared-core';

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
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      return partnerRepository.findMany(params, tx);
    });
  }

  async getPartnerById(partnerId: string, session: SessionContext): Promise<PartnerProfile> {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
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

  async getDirectoryIntelligence(
    session: SessionContext,
    appliedFilters?: DirectoryQueryParams
  ): Promise<DirectoryIntelligenceSummary> {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const tenantScope = session.isSuperAdmin ? undefined : session.tenantId;
      return partnerRepository.getDirectoryIntelligence(tenantScope, tx, appliedFilters);
    });
  }

  async getPartnerAnalytics(session: SessionContext): Promise<PartnerAnalyticsSummary> {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const tenantScope = session.isSuperAdmin ? undefined : session.tenantId;
      return partnerRepository.getPartnerAnalytics(tenantScope, tx);
    });
  }

  async getDirectory(params: DirectoryQueryParams, session: SessionContext): Promise<DirectoryResponse> {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const tenantScope = session.isSuperAdmin ? params.tenantId : session.tenantId;
      return partnerRepository.getDirectory({ ...params, tenantId: tenantScope }, tx);
    });
  }

  async getPartner360(partnerId: string, session: SessionContext): Promise<Partner360Profile> {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const tenantScope = session.isSuperAdmin ? undefined : session.tenantId;
      return partnerRepository.getPartner360(partnerId, tenantScope, tx);
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
      const normalizedProf = normalizeFacilityProfile(input.partnerType);
      let plan: Plan | null = null;
      if (input.planId) {
        plan = await productRepository.findPlanById(input.planId, tx);
        if (!plan) {
          throw new AppError({
            message: `Specified commercial plan '${input.planId}' was not found.`,
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400
          });
        }
      } else if (input.planCode) {
        plan = await productRepository.findPlanByCode(input.planCode, tx);
        if (!plan) {
          throw new AppError({
            message: `Specified commercial plan '${input.planCode}' was not found.`,
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400
          });
        }
      }

      if (!plan) {
        const candidateCodes = [
          `PLAN_${normalizedProf.workspace}_FOUNDING`,
          `PLAN_${normalizedProf.workspace}_STARTER`,
          'PLAN_CLINIC_STARTER'
        ];
        for (const code of candidateCodes) {
          plan = await productRepository.findPlanByCode(code, tx);
          if (plan) break;
        }
      }

      if (!plan) {
        const allPlans = await productRepository.findAllPlans(tx);
        if (allPlans && allPlans.length > 0) {
          plan = allPlans[0]!;
        }
      }

      // If still no plan in database catalog, dynamically provision a canonical plan for this vertical
      if (!plan) {
        const prodId = crypto.randomUUID();
        const planId = crypto.randomUUID();
        try {
          await tx
            .insert(products)
            .values({
              id: prodId,
              code: `PROD_${normalizedProf.workspace}_SUITE`,
              name: `${normalizedProf.workspace} Clinical Suite`,
              description: `Authoritative enterprise core suite for ${normalizedProf.workspace}`,
              category: 'CORE_PLATFORM',
              status: 'ACTIVE'
            })
            .onConflictDoNothing();

          await tx
            .insert(plans)
            .values({
              id: planId,
              productId: prodId,
              code: `PLAN_${normalizedProf.workspace}_FOUNDING`,
              name: normalizedProf.defaultPlanTier,
              description: `Founding partner tier with full vertical capability for ${normalizedProf.workspace}`,
              billingInterval: 'MONTHLY',
              basePrice: 0,
              currency: 'INR',
              status: 'ACTIVE',
              metadata: {
                maxConcurrentUsers: 50,
                maxDoctors: 20,
                maxBranches: 5,
                accessibleFeatures: normalizedProf.accessibleFeatures
              }
            })
            .onConflictDoNothing();

          plan = await productRepository.findPlanById(planId, tx);
        } catch {}
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
        lifecycleStatus: input.lifecycleStatus || 'LEAD',
        verificationStatus: input.verificationStatus || 'PENDING',
        onboardingStep: input.onboardingStep || 'ORGANIZATION_PROFILE',
        onboardingProgressPercent: input.onboardingProgressPercent !== undefined ? input.onboardingProgressPercent : 0,
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
      const deptId = crypto.randomUUID();
      const docId = crypto.randomUUID();

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

        await tx
          .insert(operationalDepartments)
          .values({
            id: deptId,
            tenantId,
            partnerId,
            organizationId: orgId,
            branchId: facilityId,
            departmentCode: `DEPT-OPD-${shortHash}`,
            departmentName: 'General OPD & Primary Care',
            status: 'ACTIVE'
          })
          .onConflictDoNothing();

        const staffId = crypto.randomUUID();
        await tx
          .insert(operationalStaff)
          .values({
            id: staffId,
            tenantId,
            partnerId,
            organizationId: orgId,
            branchId: facilityId,
            departmentId: deptId,
            staffCode: `STF-${shortHash}`,
            fullName: input.primaryContactName || 'Dr. Medical Director',
            workEmail: input.primaryContactEmail,
            workPhone: input.primaryContactPhone || null,
            staffType: 'DOCTOR',
            primaryRole: 'ATTENDING_PHYSICIAN',
            employmentType: 'FULL_TIME',
            employmentStatus: 'ACTIVE',
            joiningDate: new Date()
          })
          .onConflictDoNothing();

        await tx
          .insert(doctorProfiles)
          .values({
            id: docId,
            tenantId,
            partnerId,
            organizationId: orgId,
            branchId: facilityId,
            departmentId: deptId,
            staffId,
            doctorCode: `DOC-${shortHash}`,
            medicalLicenseNumber: `MED-REG-${shortHash}`,
            qualification: 'MBBS, MD',
            primarySpecialty: 'General Medicine',
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
        organizationId: orgId,
        facilityId,
        branchId: facilityId,
        departmentId: deptId,
        doctorId: docId,
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

  async getBranches(partnerId: string, session: SessionContext) {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }
      return tx
        .select()
        .from(branches)
        .where(eq(branches.tenantId, partner.tenantId));
    });
  }

  async updateBranchStatus(
    partnerId: string,
    branchId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    reason: string,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }

      await tx
        .update(branches)
        .set({ status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED', updatedAt: new Date() })
        .where(eq(branches.id, branchId));

      await tx
        .update(operationalFacilities)
        .set({ status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED', updatedAt: new Date() })
        .where(eq(operationalFacilities.id, branchId));

      const actor = (session as any)?.email || session?.userId || 'DOC SEARCH Founder Command';
      if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
        await sessionRevocationService.revokeBranch(branchId, reason, actor);
      } else if (status === 'ACTIVE') {
        await sessionRevocationService.unrevokeBranch(branchId);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'BRANCH_STATUS_UPDATED',
          resourceType: 'BRANCH',
          resourceId: branchId,
          tenantId: partner.tenantId,
          metadata: { partnerId, branchId, status, reason }
        },
        session,
        tx
      );

      return { id: branchId, partnerId, status, reason };
    });
  }

  async getPartnerStaff(partnerId: string, session: SessionContext) {
    return withSecurityContext(getReadDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }

      const staffList = await tx
        .select({
          staff: operationalStaff,
          deptName: operationalDepartments.departmentName
        })
        .from(operationalStaff)
        .leftJoin(operationalDepartments, eq(operationalStaff.departmentId, operationalDepartments.id))
        .where(or(eq(operationalStaff.partnerId, partner.id), eq(operationalStaff.tenantId, partner.tenantId)))
        .orderBy(desc(operationalStaff.createdAt));

      return staffList.map((r) => ({
        id: r.staff.id,
        tenantId: r.staff.tenantId,
        partnerId: r.staff.partnerId,
        organizationId: r.staff.organizationId,
        branchId: r.staff.branchId,
        departmentId: r.staff.departmentId,
        departmentName: r.deptName || 'Primary Care Unit',
        staffCode: r.staff.staffCode,
        fullName: r.staff.fullName,
        workEmail: r.staff.workEmail,
        workPhone: r.staff.workPhone || undefined,
        staffType: r.staff.staffType,
        primaryRole: r.staff.primaryRole,
        employmentType: r.staff.employmentType,
        employmentStatus: r.staff.employmentStatus,
        joiningDate: r.staff.joiningDate instanceof Date ? r.staff.joiningDate.toISOString() : String(r.staff.joiningDate),
        createdAt: r.staff.createdAt instanceof Date ? r.staff.createdAt.toISOString() : String(r.staff.createdAt)
      }));
    });
  }

  async addPartnerStaff(
    partnerId: string,
    staffData: {
      fullName: string;
      workEmail: string;
      workPhone?: string;
      staffType?: string;
      primaryRole?: string;
      employmentType?: string;
      departmentId?: string;
      requestedTotalCount?: number;
    },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }

      try {
        const limitCheck = await entitlementService.checkUserLimit(partner.tenantId, staffData.requestedTotalCount);
        if (!limitCheck.allowed) {
          throw new AppError({
            message: `Staff/User limit of ${limitCheck.maxAllowed} reached for current subscription plan. Upgrade plan to add more staff.`,
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 403) throw err;
      }

      let opPartnerId = partner.id;
      const [opP] = await tx
        .select({ id: operationalPartners.id })
        .from(operationalPartners)
        .where(eq(operationalPartners.tenantId, partner.tenantId))
        .limit(1);
      if (opP?.id) {
        opPartnerId = opP.id;
      } else {
        try {
          await tx.insert(operationalPartners).values({
            id: opPartnerId,
            tenantId: partner.tenantId,
            partnerCode: `PRT-${partner.tenantId.substring(0, 8).toUpperCase()}`,
            legalBusinessName: partner.legalName || 'Partner Entity',
            partnerType: partner.partnerType || 'HOSPITAL_SYSTEM',
            contactEmail: partner.primaryContactEmail || 'admin@partner.local',
            status: 'ACTIVE',
            metadata: {}
          });
        } catch {}
      }

      let organizationId = '00000000-0000-4000-8000-000000000002';
      const [opO] = await tx
        .select({ id: operationalOrganizations.id })
        .from(operationalOrganizations)
        .where(eq(operationalOrganizations.tenantId, partner.tenantId))
        .limit(1);
      if (opO?.id) {
        organizationId = opO.id;
      } else {
        try {
          organizationId = crypto.randomUUID();
          await tx.insert(operationalOrganizations).values({
            id: organizationId,
            tenantId: partner.tenantId,
            partnerId: opPartnerId,
            organizationCode: `ORG-${partner.tenantId.substring(0, 8).toUpperCase()}`,
            organizationName: partner.legalName || 'Clinical Services',
            organizationType: partner.partnerType || 'HOSPITAL',
            contactEmail: partner.primaryContactEmail || 'admin@facility.local',
            contactPhone: partner.primaryContactPhone || '+1-555-0100',
            status: 'ACTIVE',
            metadata: {}
          } as any);
        } catch {
          organizationId = '00000000-0000-4000-8000-000000000002';
        }
      }

      let branchId = '00000000-0000-4000-8000-000000000003';
      const [opF] = await tx
        .select({ id: operationalFacilities.id })
        .from(operationalFacilities)
        .where(eq(operationalFacilities.tenantId, partner.tenantId))
        .limit(1);
      if (opF?.id) {
        branchId = opF.id;
      } else {
        try {
          branchId = crypto.randomUUID();
          await tx.insert(operationalFacilities).values({
            id: branchId,
            tenantId: partner.tenantId,
            partnerId: opPartnerId,
            organizationId,
            facilityCode: `FAC-${partner.tenantId.substring(0, 8).toUpperCase()}`,
            facilityName: 'Primary Facility',
            facilityType: partner.partnerType || 'HOSPITAL',
            addressStreet: '100 Medical Center Dr',
            addressCity: 'Metro',
            addressState: 'State',
            addressPostalCode: '10001',
            contactEmail: partner.primaryContactEmail || 'facility@local.health',
            contactPhone: partner.primaryContactPhone || '+1-555-0100',
            status: 'ACTIVE',
            metadata: {}
          } as any);
        } catch {
          branchId = '00000000-0000-4000-8000-000000000003';
        }
      }

      let departmentId = staffData.departmentId;
      if (!departmentId) {
        const [opD] = await tx
          .select({ id: operationalDepartments.id })
          .from(operationalDepartments)
          .where(eq(operationalDepartments.tenantId, partner.tenantId))
          .limit(1);
        if (opD?.id) {
          departmentId = opD.id;
        } else {
          try {
            departmentId = crypto.randomUUID();
            await tx.insert(operationalDepartments).values({
              id: departmentId,
              tenantId: partner.tenantId,
              partnerId: opPartnerId,
              organizationId,
              branchId,
              departmentCode: 'GEN-OPS',
              departmentName: 'General Operations',
              status: 'ACTIVE',
              metadata: {}
            } as any);
          } catch {
            departmentId = '00000000-0000-4000-8000-000000000004';
          }
        }
      }

      const staffId = crypto.randomUUID();
      const codeRand = Math.floor(1000 + Math.random() * 9000);
      const staffCode = `STF-${codeRand}`;

      const [createdStaff] = await tx
        .insert(operationalStaff)
        .values({
          id: staffId,
          tenantId: partner.tenantId,
          partnerId: opPartnerId,
          organizationId,
          branchId,
          departmentId,
          staffCode,
          fullName: staffData.fullName,
          workEmail: staffData.workEmail,
          workPhone: staffData.workPhone || null,
          staffType: (staffData.staffType as any) || 'DOCTOR',
          primaryRole: staffData.primaryRole || 'ATTENDING_PHYSICIAN',
          employmentType: (staffData.employmentType as any) || 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joiningDate: new Date(),
          metadata: {}
        } as any)
        .returning();

      if (!createdStaff) {
        throw new AppError({
          message: 'Failed to insert operational staff record',
          code: ErrorCode.DATABASE_ERROR,
          statusCode: 500
        });
      }

      await auditRepository.recordEvent(
        {
          eventType: 'HQ_STAFF_CREATED',
          resourceType: 'operational_staff',
          resourceId: staffId,
          tenantId: partner.tenantId,
          metadata: {
            partnerId,
            fullName: staffData.fullName,
            email: staffData.workEmail,
            role: staffData.primaryRole
          }
        },
        session,
        tx
      );

      return {
        id: createdStaff.id,
        tenantId: createdStaff.tenantId,
        partnerId,
        staffCode: createdStaff.staffCode,
        fullName: createdStaff.fullName,
        workEmail: createdStaff.workEmail,
        workPhone: createdStaff.workPhone || undefined,
        staffType: createdStaff.staffType,
        primaryRole: createdStaff.primaryRole,
        employmentType: createdStaff.employmentType,
        employmentStatus: createdStaff.employmentStatus,
        joiningDate: createdStaff.joiningDate instanceof Date ? createdStaff.joiningDate.toISOString() : String(createdStaff.joiningDate),
        createdAt: createdStaff.createdAt instanceof Date ? createdStaff.createdAt.toISOString() : String(createdStaff.createdAt)
      };
    });
  }

  async updatePartnerStaffStatus(
    partnerId: string,
    staffId: string,
    status: string,
    reason: string,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const partner = await partnerRepository.findById(partnerId, tx);
      if (!partner) {
        throw AppError.notFound(`Partner ${partnerId} not found`);
      }

      await tx
        .update(operationalStaff)
        .set({
          employmentStatus: status,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(operationalStaff.id, staffId),
            or(eq(operationalStaff.partnerId, partner.id), eq(operationalStaff.tenantId, partner.tenantId))
          )
        );

      await auditRepository.recordEvent(
        {
          eventType: 'HQ_STAFF_STATUS_UPDATED',
          resourceType: 'operational_staff',
          resourceId: staffId,
          tenantId: partner.tenantId,
          metadata: { partnerId, staffId, status, reason }
        },
        session,
        tx
      );

      return { id: staffId, partnerId, status, reason };
    });
  }
}


export const partnerService = new PartnerService();
