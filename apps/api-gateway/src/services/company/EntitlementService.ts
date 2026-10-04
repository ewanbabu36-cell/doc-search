import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { licenseService } from './LicenseService.js';
import { type SessionContext } from '@docsearch/auth';
import {
  getDatabase,
  operationalFacilities,
  doctorProfiles,
  operationalStaff,
  inpatientBeds,
  partnerProfiles,
  eq,
  and
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger, isModuleAllowedForPartnerProfile } from '@docsearch/shared-core';
import { partnerGovernanceService } from './PartnerGovernanceService.js';


const logger = createLogger('entitlement-service');

export interface FeatureEntitlement {
  code: string;
  name: string;
  category: string;
  enabled: boolean;
  value?: any;
}

export interface LimitCheckResult {
  allowed: boolean;
  maxAllowed: number;
  limit?: number;
  currentCount: number;
  limitType: 'DOCTORS' | 'USERS' | 'BRANCHES';
}

export class EntitlementService {
  private accessCache = new Map<string, { result: boolean; expiresAt: number }>();

  private async resolvePartnerType(
    tenantId: string | undefined,
    session: any,
    license?: any
  ): Promise<string | undefined> {
    let resolved =
      (license?.metadata as any)?.partnerType ||
      (license?.metadata as any)?.facilityType ||
      (license?.metadata as any)?.organizationType ||
      session?.partnerType ||
      session?.facilityType ||
      session?.organizationType ||
      session?.partnerCategory;

    if (!resolved && tenantId) {
      const db = getDatabase();
      if (db) {
        try {
          const [prof] = await db
            .select()
            .from(partnerProfiles)
            .where(eq(partnerProfiles.tenantId, tenantId))
            .limit(1);
          if (prof) {
            const pMeta = (prof.metadata as Record<string, any>) || {};
            resolved =
              (prof as any).partnerType ||
              pMeta['partnerType'] ||
              pMeta['facilityType'] ||
              pMeta['organizationType'];
          }
        } catch {
          // Ignore DB lookup errors in non-DB unit environments
        }
      }
    }
    return resolved;
  }

  /**
   * Invalidates cached entitlement decisions for a tenant or globally
   */
  invalidateTenantCache(tenantId?: string): void {
    if (tenantId) {
      for (const key of this.accessCache.keys()) {
        if (key.startsWith(`${tenantId}:`)) {
          this.accessCache.delete(key);
        }
      }
    } else {
      this.accessCache.clear();
    }
  }

  /**
   * Evaluates whether the caller's session has active entitlement to a feature.
   * Central evaluation of: Partner + Subscription + Subscription Status + Plan + Entitlements + License Dates + Overrides.
   */
  async canAccess(sessionOrTenantId: SessionContext | string, featureCode: string): Promise<boolean> {
    const session: Partial<SessionContext> =
      typeof sessionOrTenantId === 'string'
        ? { tenantId: sessionOrTenantId, isSuperAdmin: false, roles: [] }
        : sessionOrTenantId || {};
    const tenantId = session.tenantId;
    const normFeat = featureCode.toUpperCase().trim();

    // Real-time Emergency Kill-Switches & Partner Governance Overrides (highest precedence)
    if (tenantId && partnerGovernanceService.isTenantFrozen(tenantId)) {
      return false;
    }

    if (
      tenantId &&
      partnerGovernanceService.isBillingFrozen(tenantId) &&
      (normFeat.includes('BILLING') || normFeat.includes('PHARMACY'))
    ) {
      return false;
    }

    // 1. Only global Super Admins and Company HQ Admins bypass entitlement checks
    if (
      session.isSuperAdmin ||
      (session.roles &&
        ((session.roles as string[]).includes('SUPER_ADMIN') ||
         (session.roles as string[]).includes('COMPANY_ADMIN')))
    ) {
      return true;
    }

    if (tenantId) {
      const govOverride = partnerGovernanceService.getModuleOverride(tenantId, featureCode);
      if (govOverride !== undefined) {
        if (govOverride === false) return false;
        const earlyPartnerType = await this.resolvePartnerType(tenantId, session);
        if (earlyPartnerType && !isModuleAllowedForPartnerProfile(earlyPartnerType, normFeat)) {
          return false;
        }
        return true;
      }
    }

    if (!tenantId) {
      return false;
    }

    // Check parent module override if featureCode is a granular sub-feature
    if (normFeat.startsWith('PHARMACY_') && normFeat !== 'PHARMACY_POS' && !normFeat.startsWith('PHARMACY_WHOLESALE')) {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'PHARMACY_POS');
      if (parentGov === false) return false;
    } else if (normFeat.startsWith('PHARMACY_WHOLESALE') && normFeat !== 'PHARMACY_WHOLESALE') {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'PHARMACY_WHOLESALE');
      if (parentGov === false) return false;
    } else if ((normFeat.startsWith('BILLING_') || normFeat.startsWith('INSURANCE_')) && normFeat !== 'TPA_INSURANCE') {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'TPA_INSURANCE');
      if (parentGov === false) return false;
    } else if ((normFeat.startsWith('LAB_') || normFeat.startsWith('PATHOLOGY_')) && normFeat !== 'PATHOLOGY_LIMS') {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'PATHOLOGY_LIMS');
      if (parentGov === false) return false;
    } else if (normFeat.startsWith('CLINICAL_') && normFeat !== 'CLINICAL_EMR') {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'CLINICAL_EMR');
      if (parentGov === false) return false;
    } else if (normFeat.startsWith('INPATIENT_') && normFeat !== 'INPATIENT_IPD') {
      const parentGov = partnerGovernanceService.getModuleOverride(tenantId, 'INPATIENT_IPD');
      if (parentGov === false) return false;
    }

    // 2. Canonical Fail-Closed Rule: Fetch active license for tenant.
    // A partner must NOT receive operational commercial access if no active license row exists.
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    if (!tenantLicenses || tenantLicenses.length === 0) {
      return false;
    }

    // Pick active or in-grace license
    const license =
      tenantLicenses.find(
        (l) =>
          l.status === 'ACTIVE' ||
          l.status === 'FREE_ACTIVE' ||
          l.status === 'EXPIRING_SOON' ||
          l.status === 'GRACE_PERIOD'
      ) || tenantLicenses[0];

    if (!license) {
      return false;
    }

    // 3. Cryptographic integrity check
    if (!licenseService.verifyLicenseSignature(license)) {
      logger.warn('License signature mismatch during entitlement check', { tenantId, licenseId: license.id });
      return false;
    }

    // 4. Temporal evaluation
    const evaluation = licenseService.evaluateLicenseStatus(license);
    if (!evaluation.isAccessAllowed) {
      return false;
    }

    // 5. Query plan entitlements from authoritative catalog
    const planEntitlements = await productRepository.getPlanEntitlements(license.planId);

    // Normalize featureCode matching (support both exact code like 'PHARMACY_POS' and aliases like 'PHARMACY')
    const normalizedCode = featureCode.toUpperCase().trim();
    const isWholesaleFeature =
      normalizedCode === 'PHARMACY_WHOLESALE' || normalizedCode.startsWith('PHARMACY_WHOLESALE');
    const isRetailPosFeature =
      normalizedCode === 'PHARMACY_POS' || normalizedCode.startsWith('PHARMACY_POS');

    // Enforce canonical partner profile boundary BEFORE evaluating DB plan_entitlements or metadata overrides (POST-REM-CAP-03 / P1-02)
    const licensePartnerType = await this.resolvePartnerType(tenantId, session, license);
    if (licensePartnerType && !isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)) {
      return false;
    }

    const matched = planEntitlements.find((e) => {
      const eCode = e.code.toUpperCase().trim();
      if (eCode === normalizedCode) return true;
      if (eCode.replace(/_/g, '') === normalizedCode.replace(/_/g, '')) return true;
      if (isWholesaleFeature) {
        return eCode === 'PHARMACY_WHOLESALE' || eCode.includes('WHOLESALE');
      }
      if (isRetailPosFeature) {
        return (eCode === 'PHARMACY_POS' || eCode.includes('PHARMACY')) && !eCode.includes('WHOLESALE');
      }
      if ((normalizedCode === 'PHARMACY' || normalizedCode.startsWith('PHARMACY_')) && eCode.includes('PHARMACY')) return true;
      if ((normalizedCode === 'LAB' || normalizedCode === 'PATHOLOGY_LIMS' || normalizedCode.startsWith('LAB_') || normalizedCode.startsWith('PATHOLOGY_')) && (eCode.includes('LAB') || eCode.includes('PATHOLOGY') || eCode.includes('DIAGNOSTICS'))) return true;
      if ((normalizedCode === 'RADIOLOGY' || normalizedCode === 'RADIOLOGY_PACS' || normalizedCode.startsWith('RADIOLOGY_')) && eCode.includes('RADIOLOGY')) return true;
      if ((normalizedCode === 'BILLING' || normalizedCode === 'TPA_INSURANCE' || normalizedCode.startsWith('BILLING_') || normalizedCode.startsWith('INSURANCE_')) && (eCode.includes('BILLING') || eCode.includes('INSURANCE') || eCode.includes('TPA'))) return true;
      if ((normalizedCode === 'OPD' || normalizedCode === 'OPD_QUEUE' || normalizedCode.startsWith('OPD_')) && eCode.includes('OPD')) return true;
      if ((normalizedCode === 'INPATIENT' || normalizedCode === 'INPATIENT_IPD' || normalizedCode.startsWith('INPATIENT_')) && (eCode.includes('INPATIENT') || eCode.includes('ADT') || eCode.includes('IPD'))) return true;
      if ((normalizedCode === 'EMERGENCY' || normalizedCode === 'EMERGENCY_ICU' || normalizedCode.startsWith('EMERGENCY_')) && (eCode.includes('EMERGENCY') || eCode.includes('ICU'))) return true;
      if ((normalizedCode === 'OT' || normalizedCode === 'OT_SURGERY' || normalizedCode.startsWith('OT_')) && (eCode.includes('OT') || eCode.includes('SURGERY'))) return true;
      if ((normalizedCode === 'ABDM' || normalizedCode === 'ABDM_GATEWAY') && eCode.includes('ABDM')) return true;
      if ((normalizedCode === 'WHATSAPP' || normalizedCode === 'WHATSAPP_AUTOMATION') && (eCode.includes('WHATSAPP') || eCode.includes('COMMUNICATION'))) return true;
      if (normalizedCode === 'BLOOD_BANK' && (eCode.includes('BLOOD') || eCode.includes('DIAGNOSTICS'))) return true;
      if (normalizedCode === 'MRD' && (eCode.includes('MRD') || eCode.includes('RECORDS') || eCode.includes('EMR'))) return true;
      if (normalizedCode === 'DIETARY' && (eCode.includes('DIETARY') || eCode.includes('OPERATIONS') || eCode.includes('CLINICAL'))) return true;
      if (normalizedCode === 'OPERATIONS' && (eCode.includes('OPERATIONS') || eCode.includes('CORE') || eCode.includes('ADMIN'))) return true;
      if ((normalizedCode === 'CLINICAL_EMR' || normalizedCode.startsWith('CLINICAL_')) && (eCode.includes('CLINICAL') || eCode.includes('EMR'))) return true;
      if ((normalizedCode === 'MODULE_AI_COPILOT' || normalizedCode === 'AI_COPILOT' || normalizedCode.startsWith('AI_') || normalizedCode.startsWith('MODULE_AI_')) && (eCode.includes('AI') || eCode.includes('COPILOT'))) return true;
      if (normalizedCode === 'PATIENTS' || normalizedCode.startsWith('PATIENT')) return true;
      if (normalizedCode === 'EXECUTIVE_COMMAND' && (eCode.includes('COMMAND') || eCode.includes('EXECUTIVE') || eCode.includes('ANALYTICS') || eCode.includes('ADMIN'))) return true;
      return false;
    });

    if (!matched) {
      const hasExplicitIncludedModules = Array.isArray((license.metadata as any)?.includedModules);
      const metaModules: string[] = hasExplicitIncludedModules
        ? (license.metadata as any).includedModules
            .map((m: string) => String(m).toUpperCase().trim())
            .filter(Boolean)
        : [];

      // If metadata explicitly defines includedModules: [] (empty), fail closed when no DB entitlement matched
      if (hasExplicitIncludedModules && metaModules.length === 0) {
        return false;
      }

      if (planEntitlements.length > 0) {
        const hasAnyEnabledEntitlement = planEntitlements.some(
          (e) => !(e.value && typeof e.value === 'object' && (e.value as any).enabled === false)
        );
        if (!hasAnyEnabledEntitlement) {
          return false;
        }
        const corePlatformCapabilities = ['OPERATIONS', 'STAFF', 'PATIENTS', 'APPOINTMENTS', 'BILLING'];
        return corePlatformCapabilities.includes(normalizedCode);
      }

      if (hasExplicitIncludedModules && metaModules.length > 0) {
        const matchesIncludedModule = metaModules.some((m) => {
          if (m === normalizedCode) return true;
          if (m.replace(/_/g, '') === normalizedCode.replace(/_/g, '')) return true;
          if (isWholesaleFeature) {
            return m === 'PHARMACY_WHOLESALE' || m.includes('WHOLESALE');
          }
          if (isRetailPosFeature) {
            return (m === 'PHARMACY_POS' || m.includes('PHARMACY')) && !m.includes('WHOLESALE');
          }
          if (
            (normalizedCode === 'PHARMACY' || normalizedCode.startsWith('PHARMACY_')) &&
            m.includes('PHARMACY')
          ) {
            return true;
          }
          if (
            (normalizedCode === 'LAB' ||
              normalizedCode === 'PATHOLOGY' ||
              normalizedCode === 'PATHOLOGY_LIMS' ||
              normalizedCode.startsWith('LAB_') ||
              normalizedCode.startsWith('PATHOLOGY_')) &&
            (m.includes('LAB') || m.includes('PATHOLOGY') || m.includes('DIAGNOSTICS'))
          ) {
            return true;
          }
          if (
            (normalizedCode === 'RADIOLOGY' || normalizedCode === 'RADIOLOGY_PACS' || normalizedCode.startsWith('RADIOLOGY_')) &&
            m.includes('RADIOLOGY')
          ) {
            return true;
          }
          if (
            (normalizedCode === 'CLINICAL' ||
              normalizedCode === 'CLINICAL_EMR' ||
              normalizedCode === 'OPD' ||
              normalizedCode.startsWith('CLINICAL_') ||
              normalizedCode.startsWith('OPD_')) &&
            (m.includes('CLINICAL') || m.includes('EMR') || m.includes('OPD'))
          ) {
            return true;
          }
          if (
            (normalizedCode === 'INPATIENT' || normalizedCode === 'INPATIENT_IPD' || normalizedCode.startsWith('INPATIENT_')) &&
            (m.includes('INPATIENT') || m.includes('IPD') || m.includes('ADT'))
          ) {
            return true;
          }
          if (
            (normalizedCode === 'BILLING' ||
              normalizedCode === 'TPA_INSURANCE' ||
              normalizedCode.startsWith('BILLING_') ||
              normalizedCode.startsWith('INSURANCE_')) &&
            (m.includes('BILLING') || m.includes('INSURANCE') || m.includes('TPA'))
          ) {
            return true;
          }
          return false;
        });
        return matchesIncludedModule || ['OPERATIONS', 'STAFF', 'PATIENTS'].includes(normalizedCode);
      }

      // Authoritative source 3: Canonical vertical plan IDs for Pathology, Pharmacy (Retail & Wholesale), Clinic, Diagnostic Centre
      const planIdUpper = String(license.planId || '').toUpperCase().trim();
      const planRadioIds = new Set([
        toDeterministicUuid('plan-radio-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-radio-annual-yr2').toUpperCase(),
        'PLAN-RADIO-FREE-YR1',
        'PLAN-RADIO-ANNUAL-YR2'
      ]);
      const planPathIds = new Set([
        toDeterministicUuid('plan-path-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-path-annual-yr2').toUpperCase(),
        'PLAN-PATH-FREE-YR1',
        'PLAN-PATH-ANNUAL-YR2'
      ]);
      const planPharmaWholesaleIds = new Set([
        toDeterministicUuid('plan-pharma-wholesale-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-pharma-wholesale-annual-yr2').toUpperCase(),
        'PLAN-PHARMA-WHOLESALE-FREE-YR1',
        'PLAN-PHARMA-WHOLESALE-ANNUAL-YR2'
      ]);
      const planPharmIds = new Set([
        toDeterministicUuid('plan-pharma-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-pharma-annual-yr2').toUpperCase(),
        toDeterministicUuid('plan-pharma-wholesale-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-pharma-wholesale-annual-yr2').toUpperCase(),
        'PLAN-PHARMA-FREE-YR1',
        'PLAN-PHARMA-ANNUAL-YR2',
        'PLAN-PHARMA-WHOLESALE-FREE-YR1',
        'PLAN-PHARMA-WHOLESALE-ANNUAL-YR2'
      ]);
      const planComboCpIds = new Set([
        toDeterministicUuid('plan-combo-cp-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-combo-cp-annual-yr2').toUpperCase(),
        'PLAN-COMBO-CP-FREE-YR1',
        'PLAN-COMBO-CP-ANNUAL-YR2'
      ]);
      const planComboCrxIds = new Set([
        toDeterministicUuid('plan-combo-crx-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-combo-crx-annual-yr2').toUpperCase(),
        'PLAN-COMBO-CRX-FREE-YR1',
        'PLAN-COMBO-CRX-ANNUAL-YR2'
      ]);
      const planClinicIds = new Set([
        toDeterministicUuid('plan-clinic-free-yr1').toUpperCase(),
        toDeterministicUuid('plan-clinic-annual-yr2').toUpperCase(),
        'PLAN-CLINIC-FREE-YR1',
        'PLAN-CLINIC-ANNUAL-YR2'
      ]);

      if (planRadioIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'RADIOLOGY', 'RADIOLOGY_PACS', 'PATHOLOGY', 'PATHOLOGY_LIMS', 'LAB', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS', 'APPOINTMENTS'];
        return allowed.includes(normalizedCode) || normalizedCode.startsWith('RADIOLOGY_') || normalizedCode.startsWith('LAB_') || normalizedCode.startsWith('PATHOLOGY_');
      }
      if (planPathIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'PATHOLOGY', 'PATHOLOGY_LIMS', 'LAB', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS', 'APPOINTMENTS'];
        return allowed.includes(normalizedCode) || normalizedCode.startsWith('LAB_') || normalizedCode.startsWith('PATHOLOGY_');
      }
      if (planPharmaWholesaleIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'PHARMACY', 'PHARMACY_WHOLESALE', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS'];
        return allowed.includes(normalizedCode) || (normalizedCode.startsWith('PHARMACY_') && !isRetailPosFeature);
      }
      if (planPharmIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'PHARMACY', 'PHARMACY_POS', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS'];
        return allowed.includes(normalizedCode) || (normalizedCode.startsWith('PHARMACY_') && !isWholesaleFeature);
      }
      if (planComboCpIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'CLINICAL_EMR', 'CLINICAL', 'OPD', 'PATHOLOGY', 'PATHOLOGY_LIMS', 'LAB', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS', 'APPOINTMENTS', 'ABDM'];
        return allowed.includes(normalizedCode) || normalizedCode.startsWith('CLINICAL_') || normalizedCode.startsWith('OPD_') || normalizedCode.startsWith('LAB_') || normalizedCode.startsWith('PATHOLOGY_');
      }
      if (planComboCrxIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'CLINICAL_EMR', 'CLINICAL', 'OPD', 'PHARMACY', 'PHARMACY_POS', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS', 'APPOINTMENTS', 'ABDM'];
        return allowed.includes(normalizedCode) || normalizedCode.startsWith('CLINICAL_') || normalizedCode.startsWith('OPD_') || (normalizedCode.startsWith('PHARMACY_') && !isWholesaleFeature);
      }
      if (planClinicIds.has(planIdUpper)) {
        const allowed = ['OPERATIONS', 'CLINICAL_EMR', 'CLINICAL', 'OPD', 'BILLING', 'TPA_INSURANCE', 'STAFF', 'PATIENTS', 'APPOINTMENTS', 'ABDM'];
        return allowed.includes(normalizedCode) || normalizedCode.startsWith('CLINICAL_') || normalizedCode.startsWith('OPD_') || normalizedCode.startsWith('BILLING_');
      }

      // FAIL CLOSED: Active license without explicit entitlement or includedModules is strictly denied
      return false;
    }

    // Check if explicitly disabled in value jsonb
    if (matched.value && typeof matched.value === 'object') {
      if ((matched.value as any).enabled === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enforces feature entitlement. Throws HTTP 403 Forbidden if not entitled.
   */
  async enforceFeatureAccess(session: SessionContext, featureCode: string): Promise<void> {
    const hasAccess = await this.canAccess(session, featureCode);
    if (!hasAccess) {
      throw new AppError({
        message: `COMMERCIAL_ACCESS_DENIED: Feature '${featureCode}' is not accessible under your organization's current commercial license/subscription state.`,
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }
  }

  /**
   * Returns all active feature entitlements for the partner's active plan.
   */
  async getPartnerEntitlements(tenantId: string): Promise<FeatureEntitlement[]> {
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    if (!tenantLicenses || tenantLicenses.length === 0 || !tenantLicenses[0]) {
      return [];
    }
    const license = tenantLicenses[0];
    const raw = await productRepository.getPlanEntitlements(license.planId);
    return raw.map((r) => ({
      code: r.code,
      name: r.name,
      category: r.category,
      enabled: (r.value as any)?.enabled !== false,
      value: r.value
    }));
  }

  /**
   * Database-driven doctor seat quota check (considers licenses + partner governance overrides + operationalStaff).
   */
  async checkDoctorLimit(tenantId: string, currentCount?: number): Promise<LimitCheckResult> {
    const govQuotas = partnerGovernanceService.getGovernanceSnapshot(tenantId)?.quotas;
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const license =
      (tenantLicenses &&
        tenantLicenses.find((l) => l.status === 'ACTIVE' || l.status === 'EXPIRING_SOON' || l.status === 'GRACE_PERIOD')) ||
      (tenantLicenses && tenantLicenses.length > 0 ? tenantLicenses[0] : null);

    const maxAllowed =
      (license?.metadata as any)?.maxDoctors ??
      (license?.metadata as any)?.maxDoctorSeats ??
      (license?.metadata as any)?.doctorSeats ??
      license?.maxDoctors ??
      govQuotas?.maxDoctorSeats ??
      20;

    let countVal = currentCount;
    if (countVal === undefined) {
      const db = getDatabase();
      if (db) {
        try {
          const rows = await db
            .select()
            .from(operationalStaff)
            .where(
              and(
                eq(operationalStaff.tenantId, tenantId),
                eq(operationalStaff.staffType, 'DOCTOR'),
                eq(operationalStaff.employmentStatus, 'ACTIVE')
              )
            );
          countVal = rows.length;
        } catch {
          countVal = 0;
        }
      } else {
        countVal = 0;
      }
    }

    return {
      allowed: countVal < maxAllowed,
      maxAllowed,
      limit: maxAllowed,
      currentCount: countVal,
      limitType: 'DOCTORS'
    };
  }

  /**
   * Database-driven operational staff seat quota check (considers licenses + partner governance overrides + operationalStaff).
   */
  async checkStaffLimit(tenantId: string, currentCount?: number): Promise<LimitCheckResult> {
    const govQuotas = partnerGovernanceService.getGovernanceSnapshot(tenantId)?.quotas;
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const license =
      (tenantLicenses &&
        tenantLicenses.find((l) => l.status === 'ACTIVE' || l.status === 'EXPIRING_SOON' || l.status === 'GRACE_PERIOD')) ||
      (tenantLicenses && tenantLicenses.length > 0 ? tenantLicenses[0] : null);

    const maxAllowed =
      (license?.metadata as any)?.maxStaff ??
      (license?.metadata as any)?.staffSeatsQuota ??
      license?.maxConcurrentUsers ??
      (govQuotas as any)?.maxStaffSeats ??
      30;

    let countVal = currentCount;
    if (countVal === undefined) {
      const db = getDatabase();
      if (db) {
        try {
          const rows = await db
            .select()
            .from(operationalStaff)
            .where(
              and(
                eq(operationalStaff.tenantId, tenantId),
                eq(operationalStaff.employmentStatus, 'ACTIVE')
              )
            );
          countVal = rows.length;
        } catch {
          countVal = 0;
        }
      } else {
        countVal = 0;
      }
    }

    return {
      allowed: countVal < maxAllowed,
      maxAllowed,
      limit: maxAllowed,
      currentCount: countVal,
      limitType: 'STAFF' as any
    };
  }

  /**
   * Database-driven inpatient bed quota check (considers licenses + partner governance overrides + inpatientBeds).
   */
  async checkBedLimit(tenantId: string, currentCount?: number): Promise<LimitCheckResult> {
    const govQuotas = partnerGovernanceService.getGovernanceSnapshot(tenantId)?.quotas;
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const license = tenantLicenses && tenantLicenses.length > 0 ? tenantLicenses[0] : null;

    let maxAllowed = govQuotas?.maxBeds || (license?.metadata as any)?.maxBeds || 25;

    let countVal = currentCount;
    if (countVal === undefined) {
      const db = getDatabase();
      if (db) {
        try {
          const rows = await db
            .select()
            .from(inpatientBeds)
            .where(eq(inpatientBeds.tenantId, tenantId));
          countVal = rows.length;
        } catch {
          countVal = 0;
        }
      } else {
        countVal = 0;
      }
    }

    return {
      allowed: countVal < maxAllowed,
      maxAllowed,
      limit: maxAllowed,
      currentCount: countVal,
      limitType: 'BEDS' as any
    };
  }

  /**
   * Database-driven doctor / user limit check.
   */
  async checkUserLimit(tenantId: string, currentCount?: number): Promise<LimitCheckResult> {
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const license = tenantLicenses && tenantLicenses.length > 0 ? tenantLicenses[0] : null;
    const maxAllowed = license ? license.maxDoctors || 25 : 25;

    let countVal = currentCount;
    if (countVal === undefined) {
      const db = getDatabase();
      if (db) {
        try {
          const rows = await db
            .select()
            .from(doctorProfiles)
            .where(eq(doctorProfiles.tenantId, tenantId));
          countVal = rows.length;
        } catch {
          countVal = 0;
        }
      } else {
        countVal = 0;
      }
    }

    return {
      allowed: countVal < maxAllowed,
      maxAllowed,
      currentCount: countVal,
      limitType: 'DOCTORS'
    };
  }

  /**
   * Database-driven branch / facility limit check.
   */
  async checkBranchLimit(tenantId: string, currentCount?: number): Promise<LimitCheckResult> {
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const license = tenantLicenses && tenantLicenses.length > 0 ? tenantLicenses[0] : null;
    const maxAllowed = license ? license.maxBranches || 3 : 3;

    let countVal = currentCount;
    if (countVal === undefined) {
      const db = getDatabase();
      if (db) {
        try {
          const rows = await db
            .select()
            .from(operationalFacilities)
            .where(eq(operationalFacilities.tenantId, tenantId));
          countVal = rows.length;
        } catch {
          countVal = 0;
        }
      } else {
        countVal = 0;
      }
    }

    return {
      allowed: countVal < maxAllowed,
      maxAllowed,
      currentCount: countVal,
      limitType: 'BRANCHES'
    };
  }

  async canUse(partnerId: string, capability: string): Promise<boolean> {
    const lics = await licenseRepository.findByPartnerId(partnerId);
    if (!lics || lics.length === 0 || !lics[0]) return false;
    const license = lics[0];
    const planEntitlements = await productRepository.getPlanEntitlements(license.planId);
    const norm = capability.toUpperCase().trim();
    return planEntitlements.some((e) => e.code.toUpperCase().includes(norm));
  }

  async getUsageLimit(partnerId: string, capability: string): Promise<number> {
    const lics = await licenseRepository.findByPartnerId(partnerId);
    if (!lics || lics.length === 0 || !lics[0]) return 0;
    const license = lics[0];
    if (capability.toLowerCase().includes('branch')) return license.maxBranches || 1;
    if (capability.toLowerCase().includes('doc') || capability.toLowerCase().includes('user')) return license.maxDoctors || 5;
    return license.maxConcurrentUsers || 10;
  }

  async getRemainingCapacity(partnerId: string, capability: string): Promise<number> {
    const limit = await this.getUsageLimit(partnerId, capability);
    return Math.max(0, limit - 1);
  }
}

export const entitlementService = new EntitlementService();

