import { type SessionContext } from '@docsearch/auth';
import {
  getDatabase,
  partnerProfiles,
  operationalPartners,
  tenants,
  eq
} from '@docsearch/database';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { licenseService } from '../company/LicenseService.js';
import { entitlementService } from '../company/EntitlementService.js';
import { partnerGovernanceService } from '../company/PartnerGovernanceService.js';
import { masterFoundationService } from '../company/MasterFoundationService.js';
import {
  partnerOnboardingRepository,
  toDeterministicUuid
} from '../../repositories/company/PartnerOnboardingRepository.js';
import { partnerSyncService } from '../company/PartnerSyncService.js';
import { AppError, normalizeFacilityProfile } from '@docsearch/shared-core';
import { staffAdministrationService } from './StaffAdministrationService.js';

export interface PartnerAccountPlanFeaturesDto {
  masterFoundation?: any;
  organizationProfile: {
    partnerId: string | null;
    tenantId: string;
    legalName: string;
    tradeName: string;
    partnerType: string;
    lifecycleStatus: string;
    verificationStatus: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    primaryContactPhone: string | null;
    primaryContactRole: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    tenantStatus: string;
    isProfileCompleted?: boolean;
    profileCompletedAt?: string | null;
    preferences?: {
      themePreference?: string;
      [key: string]: any;
    };
  };
  currentPlan: {
    id: string;
    code: string;
    name: string;
    description: string;
    version: string;
    basePrice: number;
    currency: string;
    billingInterval: string;
    status: string;
    isTrial: boolean;
  } | null;
  subscription: {
    id: string | null;
    status: string;
    billingCycle: string;
    startDate: string | null;
    expiryDate: string | null;
    renewalDate: string | null;
    gracePeriodEnd: string | null;
    daysRemaining: number | null;
    planTermDays?: number | null;
    licenseKey: string | null;
    licenseStatus: string;
    licenseType: string;
    isSignatureValid: boolean | null;
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    isRenewalWindow?: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    isLocked?: boolean;
    isSuspended: boolean;
    isFirstYearFree: boolean;
    freePeriodEndDate: string | null;
    daysRemainingInFreeYear: number | null;
    availableRenewalTenures: Array<{
      tenureCode: string;
      label: string;
      months: number;
      defaultDiscountPercent: number;
      badge: string;
      monthlyEquivalent: number;
      totalPrice: number;
      savingsAmount: number;
    }>;
  };
  requestedPlan?: any;
  approvedPlan?: any;
  activePlan?: any;
  features: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    isEntitledInPlan: boolean;
    staffPermitted: boolean;
    status: 'AVAILABLE' | 'LOCKED' | 'EXPIRED' | 'SUSPENDED' | 'NOT_CONFIGURED';
    reason: string | null;
  }>;
  limits: {
    doctorSeats: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    inpatientBeds: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    branches: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    concurrentUsers: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
    whatsappCredits: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
    storageQuotaGb: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
  };
}

export interface UpdatePartnerProfileInput {
  legalName?: string;
  tradeName?: string;
  phone?: string;
  partnerType?: string;
  facilityType?: string;
  organizationType?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    pincode?: string;
    country?: string;
  };
  statutory?: {
    ceaLicenseNumber?: string;
    taxId?: string;
    clinicRegistrationNumber?: string;
    authorizedSignatoryName?: string;
    hospitalCeaRegNo?: string;
    doctorRegNo?: string;
    pharmacyCouncilRegNo?: string;
    nablCertificateNo?: string;
    [key: string]: any;
  };
  certificates?: any;
  bank?: any;
  preferences?: {
    themePreference?: string;
    [key: string]: any;
  };
}

export class PartnerAccountService {
  async getPlanAndFeatures(session: SessionContext): Promise<PartnerAccountPlanFeaturesDto> {
    const tenantId = session.tenantId;
    if (!tenantId) {
      throw AppError.unauthorized('Tenant context required for partner account details');
    }

    const db = getDatabase();

    // 1. Organization & Partner Profile Resolution
    let partnerRecord: any = null;
    let tenantRecord: any = null;

    if (db) {
      try {
        const pRows = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, tenantId))
          .limit(1);
        partnerRecord = pRows[0] || null;

        const tRows = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, tenantId))
          .limit(1);
        tenantRecord = tRows[0] || null;
      } catch (err) {
        // Handled gracefully below
      }
    }

    const resolvedPartnerId = partnerRecord?.id || (session as any).partnerId || session.organizationId || null;

    const organizationProfile = {
      partnerId: resolvedPartnerId,
      tenantId,
      legalName: partnerRecord?.legalName || tenantRecord?.name || 'Healthcare Facility',
      tradeName: partnerRecord?.tradeName || tenantRecord?.name || 'Healthcare Facility',
      partnerType: partnerRecord?.partnerType || 'HOSPITAL_NETWORK',
      lifecycleStatus: partnerRecord?.lifecycleStatus || 'ACTIVE',
      verificationStatus: partnerRecord?.verificationStatus || 'VERIFIED',
      primaryContactName: partnerRecord?.primaryContactName || null,
      primaryContactEmail: partnerRecord?.primaryContactEmail || session.actorEmail || null,
      primaryContactPhone: partnerRecord?.primaryContactPhone || null,
      primaryContactRole: partnerRecord?.primaryContactRole || null,
      tenantName: tenantRecord?.name || null,
      tenantSlug: tenantRecord?.slug || null,
      tenantStatus: tenantRecord?.status || 'ACTIVE',
      isProfileCompleted: Boolean(partnerRecord?.metadata?.isProfileCompleted),
      profileCompletedAt: partnerRecord?.metadata?.profileCompletedAt || null,
      preferences: (partnerRecord?.metadata as any)?.preferences || {}
    };

    // 2. Active Commercial License & Subscription Resolution
    let tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    let activeLicense =
      tenantLicenses.find(
        (l) =>
          l.status === 'ACTIVE' ||
          l.status === 'EXPIRING_SOON' ||
          l.status === 'GRACE_PERIOD' ||
          l.status === 'EXPIRED' ||
          l.status === 'SUSPENDED'
      ) || tenantLicenses[0] || null;

    let stagedRegFallback: any = null;
    const actorEmail = (session.actorEmail || (session as any).email || '').toLowerCase().trim();
    if (!activeLicense) {
      try {
        const queue = await partnerOnboardingRepository.getVerificationQueue();
        stagedRegFallback = queue.find((q: any) => {
          const qEmail = (q.details?.['Registered Email'] || q.details?.['Applicant Email'] || q.contactEmail || '').toLowerCase().trim();
          const qDeterministicTenantId = qEmail ? toDeterministicUuid(`tenant-${qEmail}`) : null;
          return q.tenantDraftId === tenantId || qDeterministicTenantId === tenantId || (actorEmail && qEmail === actorEmail);
        });
        if (stagedRegFallback && stagedRegFallback.status === 'APPROVED') {
          await partnerSyncService.syncApprovedPartnersToDatabase(true);
          tenantLicenses = await licenseRepository.findByTenantId(tenantId);
          activeLicense =
            tenantLicenses.find(
              (l) =>
                l.status === 'ACTIVE' ||
                l.status === 'EXPIRING_SOON' ||
                l.status === 'GRACE_PERIOD' ||
                l.status === 'EXPIRED' ||
                l.status === 'SUSPENDED'
            ) || tenantLicenses[0] || null;
        }
      } catch {
        // Non-fatal
      }
    }

    let activeSub: any = null;
    if (organizationProfile.partnerId) {
      activeSub = await subscriptionRepository.findByPartnerId(organizationProfile.partnerId);
    }
    if (!activeSub && activeLicense?.subscriptionId) {
      activeSub = await subscriptionRepository.findById(activeLicense.subscriptionId);
    }

    const planId = activeLicense?.planId || activeSub?.planId || null;
    let planRecord: any = null;
    if (planId) {
      planRecord = await productRepository.findPlanById(planId);
    }
    if (!planRecord && stagedRegFallback?.requestedPlan) {
      const rp = stagedRegFallback.requestedPlan;
      planRecord = {
        id: rp.planId || rp.planCode || 'STAGED-PLAN',
        code: rp.planCode || 'PARTNER_FREE_YEAR_1',
        name: rp.planName || '1st Year Free Promotional Plan',
        description: 'Staged Partner Registration Commercial Plan',
        version: '1.0.0',
        basePrice: Number(rp.finalPayableAmount ?? rp.annualSubscriptionInr ?? 0),
        currency: rp.currency || 'INR',
        billingInterval: rp.billingCadence || 'ANNUAL',
        status: stagedRegFallback.status === 'APPROVED' ? 'ACTIVE' : 'PENDING_APPROVAL',
        metadata: rp
      };
    }

    // License Evaluation & Dates (Strictly truthful: never manufacture active license before HQ approval)
    let licenseEval = {
      isAccessAllowed: Boolean(activeLicense),
      isInGracePeriod: false,
      status: activeLicense ? 'ACTIVE' : (stagedRegFallback?.status === 'REJECTED' ? 'REJECTED' : 'PENDING_HQ_REVIEW'),
      daysRemaining: activeLicense ? 30 : 0
    };
    let isSigValid: boolean | null = null;

    if (activeLicense) {
      try {
        isSigValid = licenseService.verifyLicenseSignature(activeLicense);
        licenseEval = licenseService.evaluateLicenseStatus(activeLicense);
      } catch {
        // Fallback
      }
    }

    const startDate = activeLicense ? (activeLicense.startDate || activeSub?.startDate || null) : null;
    const expiryDate = activeLicense ? (activeLicense.expiryDate || activeSub?.endDate || null) : null;
    const renewalDate = activeLicense ? (activeSub?.renewalDate || null) : null;
    const gracePeriodEnd = activeLicense ? (activeLicense.gracePeriodEnd || null) : null;

    let daysRemaining: number | null = null;
    if (expiryDate) {
      const msDiff = new Date(expiryDate).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    }

    const subStatus = activeLicense
      ? (activeSub?.status || activeLicense.status || 'ACTIVE')
      : (stagedRegFallback?.status === 'REJECTED' ? 'REJECTED' : 'PENDING_HQ_REVIEW');
    const isExpired = Boolean(activeLicense && (licenseEval.status === 'EXPIRED' || subStatus === 'EXPIRED' || (daysRemaining !== null && daysRemaining <= 0 && !licenseEval.isInGracePeriod)));
    const isSuspended = Boolean(licenseEval.status === 'SUSPENDED' || subStatus === 'SUSPENDED' || partnerGovernanceService.isTenantFrozen(tenantId));

    const isFirstYearFree = Boolean(
      activeSub?.metadata?.isFirstYearFree ||
      activeSub?.billingCycle === 'PROMOTIONAL_FREE_1_YEAR' ||
      planRecord?.metadata?.isFirstYearFreeEligible ||
      stagedRegFallback?.requestedPlan?.isFirstYearFree ||
      (!activeSub?.metadata?.agreedLumpSum && !activeSub?.metadata?.finalPayableAmount)
    );

    const freePeriodEndDate = activeLicense
      ? (activeSub?.metadata?.freePeriodEndDate || (expiryDate ? new Date(expiryDate).toISOString() : null))
      : null;
    const planTermDays = Number((planRecord?.metadata as any)?.durationDays || stagedRegFallback?.requestedPlan?.durationDays || 365);
    const daysRemainingInFreeYear = activeLicense ? (daysRemaining ?? planTermDays) : null;

    const annualBase = Number(planRecord?.basePrice ?? (planRecord?.metadata as any)?.basePrice ?? (planRecord?.code?.includes('HOSPITAL') ? 20000 : 6000));
    const tenureConfigs = [
      { code: 'YEARLY', label: '1 Year (12 Months)', years: 1, months: 12, discount: 0, badge: '⭐ Standard 1-Year' },
      { code: 'TWO_YEARS', label: '2 Years (24 Months)', years: 2, months: 24, discount: 2, badge: '🥈 2-Year Plan (2% Off)' },
      { code: 'THREE_YEARS', label: '3 Years (36 Months)', years: 3, months: 36, discount: 10, badge: '🥉 3-Year Plan (10% Off)' },
      { code: 'FIVE_YEARS', label: '5 Years (60 Months)', years: 5, months: 60, discount: 20, badge: '👑 5-Year Institutional (20% Off)' }
    ];

    const availableRenewalTenures = tenureConfigs.map((tc) => {
      const gross = annualBase * tc.years;
      const savings = Math.round(gross * (tc.discount / 100));
      const total = gross - savings;
      const monthlyEquiv = Math.round(total / tc.months);
      return {
        tenureCode: tc.code,
        label: tc.label,
        months: tc.months,
        defaultDiscountPercent: tc.discount,
        badge: tc.badge,
        monthlyEquivalent: monthlyEquiv,
        totalPrice: total,
        savingsAmount: savings
      };
    });

    const isRenewalWindow = Boolean(activeLicense && (licenseEval.status === 'RENEWAL_WINDOW' || (daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 30)));
    const isExpiringSoon = Boolean(activeLicense && (licenseEval.status === 'EXPIRING_SOON' || (daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0)));
    const isLocked = Boolean(activeLicense && (licenseEval.status === 'LOCKED' || isExpired));

    const subscription = {
      id: activeSub?.id || activeLicense?.subscriptionId || null,
      status: isSuspended ? 'SUSPENDED' : isLocked ? 'LOCKED' : isExpired ? 'EXPIRED' : subStatus,
      billingCycle: activeSub?.billingCycle || (planRecord?.metadata as any)?.billingCadence || 'ANNUAL',
      planTermDays,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
      gracePeriodEnd: gracePeriodEnd ? new Date(gracePeriodEnd).toISOString() : null,
      daysRemaining,
      licenseKey: activeLicense?.licenseKey || null,
      licenseStatus: !activeLicense
        ? (stagedRegFallback?.status === 'REJECTED' ? 'REJECTED' : 'PENDING_HQ_REVIEW')
        : (isLocked ? 'LOCKED' : (activeLicense.status || 'ACTIVE')),
      licenseType: activeLicense?.licenseType || 'COMMERCIAL',
      isSignatureValid: isSigValid,
      isAccessAllowed: Boolean(activeLicense && !isSuspended && !isLocked && !isExpired && licenseEval.isAccessAllowed),
      isInGracePeriod: licenseEval.isInGracePeriod,
      isRenewalWindow,
      isExpiringSoon,
      isExpired,
      isLocked,
      isSuspended,
      isFirstYearFree,
      freePeriodEndDate,
      daysRemainingInFreeYear,
      availableRenewalTenures
    };

    // Current / Requested / Approved / Active Plan Objects
    const currentPlan = planRecord
      ? {
          id: planRecord.id,
          code: planRecord.code,
          name: planRecord.name,
          description: planRecord.description || '',
          version: planRecord.version || '1.0.0',
          basePrice: planRecord.basePrice ?? (planRecord.metadata as any)?.basePrice ?? 0,
          currency: planRecord.currency || (planRecord.metadata as any)?.currency || 'INR',
          billingInterval: activeSub?.billingCycle || planRecord.billingInterval || (planRecord.metadata as any)?.billingCadence || 'MONTHLY',
          planTermDays,
          status: activeLicense ? (planRecord.status || 'ACTIVE') : (stagedRegFallback?.status === 'REJECTED' ? 'REJECTED' : 'PENDING_HQ_REVIEW'),
          isTrial: subStatus === 'TRIAL' || activeLicense?.licenseType === 'TRIAL'
        }
      : null;

    const requestedPlan = stagedRegFallback?.originalRequestedPlan || stagedRegFallback?.requestedPlan || currentPlan;
    const approvedPlan = (activeLicense || stagedRegFallback?.status === 'APPROVED')
      ? (stagedRegFallback?.assignedPlan || stagedRegFallback?.requestedPlan || currentPlan)
      : null;
    const activePlan = (activeLicense && !isSuspended && !isLocked && !isExpired) ? currentPlan : null;

    // 3. Features & Entitlements Matrix (Authoritative from Database)
    const allFeatures = await productRepository.findAllFeatures();
    const planEntitlements = planId ? await productRepository.getPlanEntitlements(planId) : [];

    const isFrozen = partnerGovernanceService.isTenantFrozen(tenantId);
    const isBillingFrozen = partnerGovernanceService.isBillingFrozen(tenantId);

    const userRoles = session.roles || [];
    const staffRole = userRoles[0] || 'HOSPITAL_ADMIN';

    const features = allFeatures.map((feat) => {
      const normFeatCode = feat.code.toUpperCase().trim();

      // Check if feature exists in active plan entitlements
      const matched = planEntitlements.find((e) => {
        const eCode = e.code.toUpperCase().trim();
        if (eCode === normFeatCode) return true;
        if (eCode.replace(/_/g, '') === normFeatCode.replace(/_/g, '')) return true;
        if (normFeatCode.startsWith(eCode) || eCode.startsWith(normFeatCode)) return true;
        return false;
      });

      const isEntitledInPlan = Boolean(matched && (matched.value as any)?.enabled !== false);
      const govOverride = partnerGovernanceService.getModuleOverride(tenantId, feat.code);

      // Determine Staff Role Clearance (preserving Rule 5 distinction)
      let staffPermitted = true;
      if (staffRole === 'RECEPTIONIST' && (normFeatCode.includes('CLINICAL') || normFeatCode.includes('SURGERY') || normFeatCode.includes('DIAGNOSTICS'))) {
        staffPermitted = false;
      } else if (staffRole === 'PHARMACIST' && (normFeatCode.includes('INPATIENT') || normFeatCode.includes('OT_') || normFeatCode.includes('SURGERY'))) {
        staffPermitted = false;
      } else if (staffRole === 'LAB_TECHNICIAN' && (normFeatCode.includes('PHARMACY') || normFeatCode.includes('OT_') || normFeatCode.includes('SURGERY'))) {
        staffPermitted = false;
      }

      // Truthful Status & Reason
      let status: 'AVAILABLE' | 'LOCKED' | 'EXPIRED' | 'SUSPENDED' | 'NOT_CONFIGURED';
      let reason: string | null = null;

      if (isFrozen) {
        status = 'SUSPENDED';
        reason = 'Facility operations suspended by platform administration command.';
      } else if (isBillingFrozen && (normFeatCode.includes('BILLING') || normFeatCode.includes('PHARMACY'))) {
        status = 'SUSPENDED';
        reason = 'Financial and billing operations temporarily frozen by platform command.';
      } else if (govOverride === false) {
        status = 'LOCKED';
        reason = 'Module disabled by platform governance override.';
      } else if (isExpired) {
        status = 'EXPIRED';
        reason = 'Subscription has expired. Please renew your plan to restore access.';
      } else if (isSuspended) {
        status = 'SUSPENDED';
        reason = 'Commercial software license is suspended.';
      } else if (!isEntitledInPlan) {
        status = 'LOCKED';
        reason = currentPlan ? `Not included in '${currentPlan.name}'. Plan upgrade required.` : 'Not included in active plan. Upgrade required.';
      } else {
        status = 'AVAILABLE';
        reason = null;
      }

      return {
        id: feat.id,
        code: feat.code,
        name: feat.name,
        description: feat.description || '',
        category: feat.category || 'MODULE_ACCESS',
        isEntitledInPlan,
        staffPermitted,
        status,
        reason
      };
    });

    // 4. Limits & Real-Time Usage Counters (Queried from Database)
    const docCheck = await entitlementService.checkDoctorLimit(tenantId);
    const bedCheck = await entitlementService.checkBedLimit(tenantId);
    const branchCheck = await entitlementService.checkBranchLimit(tenantId);

    const govQuotas = partnerGovernanceService.getGovernanceSnapshot(tenantId)?.quotas;

    const limits = {
      doctorSeats: {
        name: 'Doctor Seats',
        limit: docCheck.maxAllowed,
        used: docCheck.currentCount,
        remaining: Math.max(0, docCheck.maxAllowed - docCheck.currentCount),
        status: (docCheck.currentCount >= docCheck.maxAllowed ? 'EXCEEDED' : docCheck.currentCount >= docCheck.maxAllowed * 0.85 ? 'NEAR_LIMIT' : 'NORMAL') as any
      },
      inpatientBeds: {
        name: 'Inpatient Beds',
        limit: bedCheck.maxAllowed,
        used: bedCheck.currentCount,
        remaining: Math.max(0, bedCheck.maxAllowed - bedCheck.currentCount),
        status: (bedCheck.currentCount >= bedCheck.maxAllowed ? 'EXCEEDED' : bedCheck.currentCount >= bedCheck.maxAllowed * 0.85 ? 'NEAR_LIMIT' : 'NORMAL') as any
      },
      branches: {
        name: 'Operating Branches',
        limit: branchCheck.maxAllowed,
        used: branchCheck.currentCount,
        remaining: Math.max(0, branchCheck.maxAllowed - branchCheck.currentCount),
        status: (branchCheck.currentCount >= branchCheck.maxAllowed ? 'EXCEEDED' : branchCheck.currentCount >= branchCheck.maxAllowed * 0.85 ? 'NEAR_LIMIT' : 'NORMAL') as any
      },
      concurrentUsers: {
        name: 'Concurrent Active Users',
        limit: activeLicense?.maxConcurrentUsers || (planRecord?.metadata as any)?.maxConcurrentUsers || 25,
        used: 'UNKNOWN' as const,
        remaining: 'UNKNOWN' as const
      },
      whatsappCredits: {
        name: 'Monthly WhatsApp Patient Alerts',
        limit: govQuotas?.monthlyWhatsAppCredits || (planRecord?.metadata as any)?.monthlyWhatsAppCredits || 500,
        used: 'UNKNOWN' as const,
        remaining: 'UNKNOWN' as const
      },
      storageQuotaGb: {
        name: 'Medical Records Storage (GB)',
        limit: govQuotas?.storageQuotaGb || (planRecord?.metadata as any)?.storageQuotaGb || 25,
        used: 'UNKNOWN' as const,
        remaining: 'UNKNOWN' as const
      }
    };

    const masterFoundation = await masterFoundationService.resolveEffectivePartnerFoundation(
      organizationProfile.partnerId || tenantId
    );

    return {
      masterFoundation,
      organizationProfile,
      currentPlan,
      requestedPlan,
      approvedPlan,
      activePlan,
      subscription,
      features,
      limits
    };
  }

  async updateProfile(session: SessionContext, input: UpdatePartnerProfileInput) {
    const tenantId = session.tenantId;
    if (!tenantId) {
      throw AppError.unauthorized('Tenant context required for partner profile update');
    }

    // 1. Field-Level Security Guard (Section 11): Partner must NEVER modify HQ-controlled commercial/approval fields
    const rawBody = (input || {}) as Record<string, any>;
    const forbiddenCommercialKeys = [
      'plan',
      'planId',
      'planCode',
      'requestedPlan',
      'approvedPlan',
      'activePlan',
      'subscription',
      'subscriptionId',
      'license',
      'licenseKey',
      'licenseStatus',
      'licenseExpiry',
      'entitlement',
      'entitlements',
      'approvalStatus',
      'commercialStatus',
      'verificationStatus',
      'lifecycleStatus',
      'kycStatus',
      'industry',
      'operatingModel',
      'capabilities',
      'activeCapabilities',
      'configurationVersion',
      'masterFoundation'
    ];
    for (const key of forbiddenCommercialKeys) {
      if (rawBody[key] !== undefined) {
        throw AppError.forbidden(
          `Field-level security violation: '${key}' is HQ-controlled and cannot be modified by a partner.`
        );
      }
    }

    // 2. Role-Based Profile Edit Authorization (Section 10 & 11):
    // Non-admin staff (RECEPTIONIST, NURSE, LAB_TECHNICIAN, PHLEBOTOMIST, DISPENSING_PHARMACIST, CASHIER) may VIEW profile (GET),
    // but only Partner Owners / Facility Admins may EDIT organization profile (PUT).
    const authorizedEditRoles = new Set([
      'SUPER_ADMIN',
      'HOSPITAL_ADMIN',
      'HOSPITAL_DIRECTOR',
      'ORGANIZATION_ADMIN',
      'FOUNDER',
      'OWNER',
      'ADMINISTRATOR',
      'EXECUTIVE_ADMIN',
      'CENTRE_MANAGER',
      'PHARMACY_DIRECTOR',
      'CLINIC_DOCTOR',
      'PATHOLOGIST',
      'PHARMACIST',
      'RADIOLOGIST',
      'LAB_DIRECTOR',
      'CHIEF_PHARMACIST',
      'DOCTOR'
    ]);
    const userRoles = (session.roles || []).map((r) => String(r).toUpperCase().trim());
    const canEditProfile =
      session.isSuperAdmin ||
      userRoles.some((r) => authorizedEditRoles.has(r) || r.endsWith('_ADMIN') || r.endsWith('_DIRECTOR') || r.endsWith('_OWNER'));
    if (!canEditProfile) {
      throw AppError.forbidden(
        'Only authorized Partner Owners or Facility Administrators may modify organization profile settings. Staff may view profile details.'
      );
    }

    const db = getDatabase();
    if (!db) {
      throw AppError.internal('Database connection unavailable');
    }

    const now = new Date().toISOString();

    // 1. Fetch current partner profile
    const existing = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);

    const currentPartner = existing[0] || null;
    const currentMeta = (currentPartner?.metadata as Record<string, any>) || {};

    const requestedRawProfile = input.partnerType || input.facilityType || input.organizationType;
    let canonicalPartnerType: string | undefined;
    if (requestedRawProfile !== undefined) {
      const normalized = normalizeFacilityProfile(requestedRawProfile);
      if (normalized.isRestricted || String(normalized.workspace) === 'RESTRICTED') {
        throw new AppError({
          code: 'INVALID_PARTNER_PROFILE' as any,
          message: `Cannot transition partner profile to an unrecognized or restricted facility type '${requestedRawProfile}'.`,
          statusCode: 400
        });
      }
      canonicalPartnerType =
        String(normalized.crmType) === 'PHARMACY_WHOLESALE'
          ? 'PHARMACY_WHOLESALE'
          : normalized.workspace;
    }

    const updatedMeta: Record<string, any> = {
      ...currentMeta,
      isProfileCompleted: true,
      profileCompletedAt: now,
      ...(canonicalPartnerType
        ? {
            partnerType: canonicalPartnerType,
            facilityType: canonicalPartnerType,
            organizationType: canonicalPartnerType
          }
        : {}),
      statutory: {
        ...((currentMeta['statutory'] as Record<string, any>) || {}),
        ...(input.statutory || {})
      },
      address: {
        ...((currentMeta['address'] as Record<string, any>) || {}),
        ...(input.address || {})
      },
      certificates: {
        ...((currentMeta['certificates'] as Record<string, any>) || {}),
        ...(input.certificates || {})
      },
      bank: {
        ...((currentMeta['bank'] as Record<string, any>) || {}),
        ...(input.bank || {})
      },
      preferences: {
        ...((currentMeta['preferences'] as Record<string, any>) || {}),
        ...(input.preferences || {})
      }
    };

    if (currentPartner) {
      await db
        .update(partnerProfiles)
        .set({
          legalName: input.legalName || currentPartner.legalName,
          tradeName: input.tradeName || input.legalName || currentPartner.tradeName,
          primaryContactPhone: input.phone || currentPartner.primaryContactPhone,
          metadata: updatedMeta,
          updatedAt: new Date()
        })
        .where(eq(partnerProfiles.id, currentPartner.id));

      if (canonicalPartnerType) {
        await db
          .update(tenants)
          .set({
            type: canonicalPartnerType,
            updatedAt: new Date()
          })
          .where(eq(tenants.id, tenantId));
      }
    } else {
      const facilityName = input.legalName || input.tradeName || 'Healthcare Facility';
      const slug =
        facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
        '-' +
        tenantId.substring(0, 4);
      await db
        .insert(tenants)
        .values({
          id: tenantId,
          name: facilityName,
          slug,
          type: canonicalPartnerType || 'HOSPITAL',
          status: 'ACTIVE',
          metadata: { autoHydrated: true, email: session.actorEmail || '' }
        })
        .onConflictDoNothing();

      await db
        .insert(partnerProfiles)
        .values({
          tenantId,
          legalName: facilityName,
          tradeName: input.tradeName || facilityName,
          primaryContactName: session.actorEmail || 'Admin',
          primaryContactEmail: session.actorEmail || 'admin@docsearch.health',
          primaryContactPhone: input.phone || null,
          metadata: updatedMeta
        });
    }

    // 2. Also synchronize operationalPartners in clinical schema if present
    try {
      const opList = await db
        .select()
        .from(operationalPartners)
        .where(eq(operationalPartners.tenantId, tenantId))
        .limit(1);

      if (opList[0]) {
        const opMeta = (opList[0].metadata as Record<string, any>) || {};
        await db
          .update(operationalPartners)
          .set({
            legalBusinessName: input.legalName || opList[0].legalBusinessName,
            contactPhone: input.phone || opList[0].contactPhone,
            ...(canonicalPartnerType ? { type: canonicalPartnerType } : {}),
            metadata: {
              ...opMeta,
              isProfileCompleted: true,
              profileCompletedAt: now,
              ...(canonicalPartnerType
                ? {
                    partnerType: canonicalPartnerType,
                    facilityType: canonicalPartnerType
                  }
                : {}),
              statutory: updatedMeta['statutory'],
              address: updatedMeta['address']
            },
            updatedAt: new Date()
          })
          .where(eq(operationalPartners.id, opList[0].id));
      }
    } catch (opErr) {
      // Graceful fallback if operationalPartners doesn't exist for this tenant yet
    }

    // CAP-06: If partner profile changed, atomically revalidate all existing staff
    let staffRevalidation: Awaited<ReturnType<typeof staffAdministrationService.revalidateStaffOnProfileChange>> | undefined;
    if (canonicalPartnerType) {
      staffRevalidation = await staffAdministrationService.revalidateStaffOnProfileChange(
        tenantId,
        canonicalPartnerType,
        session
      );
    }

    return {
      success: true,
      isProfileCompleted: true,
      profileCompletedAt: now,
      legalName: input.legalName || currentPartner?.legalName,
      partnerType: canonicalPartnerType || updatedMeta['partnerType'] || currentMeta['partnerType'],
      metadata: updatedMeta,
      ...(staffRevalidation ? { staffRevalidation } : {})
    };
  }

  async getPreferences(session: SessionContext): Promise<{ themePreference?: string; [key: string]: any }> {
    const tenantId = session.tenantId;
    const db = getDatabase();
    if (!db || !tenantId) {
      return { themePreference: 'theme-advance-pro' };
    }

    try {
      // 1. Check partner_profiles metadata preferences
      const rows = await db
        .select({ metadata: partnerProfiles.metadata })
        .from(partnerProfiles)
        .where(eq(partnerProfiles.tenantId, tenantId))
        .limit(1);

      const meta = (rows[0]?.metadata as Record<string, any>) || {};
      const partnerPrefs = (meta['preferences'] as Record<string, any>) || {};

      // 2. Check user-level preferences if email present
      const actorEmail = (session.actorEmail || '').toLowerCase().trim();
      let userPrefs: Record<string, any> = {};
      if (actorEmail) {
        const { users } = await import('@docsearch/database');
        const userRows = await db
          .select({ metadata: users.metadata })
          .from(users)
          .where(eq(users.email, actorEmail))
          .limit(1);
        const userMeta = (userRows[0]?.metadata as Record<string, any>) || {};
        userPrefs = (userMeta['preferences'] as Record<string, any>) || {};
      }

      const resolvedTheme =
        (userPrefs['themePreference'] as string) ||
        (partnerPrefs['themePreference'] as string) ||
        (partnerPrefs['theme'] as string) ||
        'theme-advance-pro';

      return {
        themePreference: resolvedTheme,
        ...partnerPrefs,
        ...userPrefs
      };
    } catch (err) {
      return { themePreference: 'theme-advance-pro' };
    }
  }

  async updatePreferences(session: SessionContext, input: Record<string, any>): Promise<Record<string, any>> {
    const tenantId = session.tenantId;
    if (!tenantId) {
      throw AppError.unauthorized('Tenant context required for partner preferences update');
    }

    const db = getDatabase();
    if (!db) {
      throw AppError.internal('Database connection unavailable');
    }

    const rawPrefs = input || {};
    const theme = (rawPrefs['themePreference'] as string) || (rawPrefs['theme'] as string);
    const cleanedTheme = typeof theme === 'string' && theme.startsWith('theme-') ? theme : undefined;

    const newPreferences: Record<string, any> = {
      ...rawPrefs,
      ...(cleanedTheme ? { themePreference: cleanedTheme, theme: cleanedTheme } : {}),
      updatedAt: new Date().toISOString()
    };

    // Update partnerProfiles metadata
    const existing = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);

    if (existing[0]) {
      const currentMeta = (existing[0].metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...currentMeta,
        preferences: {
          ...((currentMeta['preferences'] as Record<string, any>) || {}),
          ...newPreferences
        }
      };
      await db
        .update(partnerProfiles)
        .set({
          metadata: updatedMeta,
          updatedAt: new Date()
        })
        .where(eq(partnerProfiles.id, existing[0].id));
    }

    // Also update users metadata if email is present
    const actorEmail = (session.actorEmail || '').toLowerCase().trim();
    if (actorEmail) {
      try {
        const { users } = await import('@docsearch/database');
        const userRows = await db
          .select({ id: users.id, metadata: users.metadata })
          .from(users)
          .where(eq(users.email, actorEmail))
          .limit(1);

        if (userRows[0]) {
          const userMeta = (userRows[0].metadata as Record<string, any>) || {};
          const updatedUserMeta = {
            ...userMeta,
            preferences: {
              ...((userMeta['preferences'] as Record<string, any>) || {}),
              ...newPreferences
            }
          };
          await db
            .update(users)
            .set({
              metadata: updatedUserMeta,
              updatedAt: new Date()
            })
            .where(eq(users.id, userRows[0].id));
        }
      } catch {}
    }

    return newPreferences;
  }
}

export const partnerAccountService = new PartnerAccountService();
