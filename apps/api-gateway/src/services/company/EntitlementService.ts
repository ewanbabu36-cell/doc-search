import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { licenseService } from './LicenseService.js';
import { type SessionContext } from '@docsearch/auth';
import {
  getDatabase,
  operationalFacilities,
  doctorProfiles,
  eq
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';


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
  currentCount: number;
  limitType: 'DOCTORS' | 'USERS' | 'BRANCHES';
}

export class EntitlementService {
  /**
   * Evaluates whether the caller's session has active entitlement to a feature.
   * Central evaluation of: Partner + Subscription + Subscription Status + Plan + Entitlements + License Dates + Overrides.
   */
  async canAccess(session: SessionContext, featureCode: string): Promise<boolean> {
    // 1. Super admins and company admins have administrative bypass
    if (
      session.isSuperAdmin ||
      (session.roles && (session.roles.includes('SUPER_ADMIN') || session.roles.includes('COMPANY_ADMIN')))
    ) {
      return true;
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return false;
    }

    // 2. Fetch active license for tenant
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    if (!tenantLicenses || tenantLicenses.length === 0) {
      return false;
    }

    // Pick active or in-grace license
    const license =
      tenantLicenses.find(
        (l) => l.status === 'ACTIVE' || l.status === 'EXPIRING_SOON' || l.status === 'GRACE_PERIOD'
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
    const matched = planEntitlements.find((e) => {
      const eCode = e.code.toUpperCase().trim();
      return (
        eCode === normalizedCode ||
        eCode.replace(/_/g, '') === normalizedCode.replace(/_/g, '') ||
        (normalizedCode === 'PHARMACY' && eCode.includes('PHARMACY')) ||
        (normalizedCode === 'LAB' && (eCode.includes('LAB') || eCode.includes('DIAGNOSTICS'))) ||
        (normalizedCode === 'BILLING' && eCode.includes('BILLING')) ||
        (normalizedCode === 'OPD' && eCode.includes('OPD')) ||
        (normalizedCode === 'INPATIENT' && (eCode.includes('INPATIENT') || eCode.includes('ADT')))
      );
    });

    if (!matched) {
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
        message: `Feature '${featureCode}' is not included in your organization's subscription plan. Please upgrade your plan to unlock this capability.`,
        code: ErrorCode.FORBIDDEN,
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

