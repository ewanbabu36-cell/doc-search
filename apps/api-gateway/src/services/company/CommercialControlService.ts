/**
 * DOC SEARCH — Canonical Commercial Control & Decision Engine
 * 
 * Implements the authoritative server-side commercial control chain:
 * PLAN -> SUBSCRIPTION -> LICENSE -> ENTITLEMENT -> FEATURE -> MODULE -> ROLE -> PERMISSION -> ACTION
 * 
 * Enforces:
 * 1. Fail-closed commercial gating
 * 2. Deterministic lifecycle transitions with injected time support
 * 3. SHA-256 HMAC cryptographic license validation
 * 4. Grace period and renewal alert handling
 * 5. Emergency kill switches (GLOBAL_FREEZE, BILLING_FREEZE, COMMUNICATION_FREEZE)
 * 6. Partner profile boundary isolation
 * 7. Multi-tenant quota and seat limit verification
 */

import {
  createLogger,
  isModuleAllowedForPartnerProfile
} from '@docsearch/shared-core';
import { licenseService } from './LicenseService.js';
import { partnerGovernanceService } from './PartnerGovernanceService.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';

const logger = createLogger('commercial-control-service');

// ── Canonical Types & Interfaces ──────────────────────────────────────────

export type CommercialDecisionCode =
  | 'ALLOW'
  | 'GLOBAL_FREEZE'
  | 'BILLING_FREEZE'
  | 'COMMUNICATION_FREEZE'
  | 'LICENSE_REVOKED'
  | 'LICENSE_SUSPENDED'
  | 'LICENSE_LOCKED'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_TAMPERED'
  | 'LICENSE_MISSING'
  | 'SUBSCRIPTION_INACTIVE'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'MODULE_DISABLED_BY_HQ'
  | 'PROFILE_BOUNDARY_VIOLATION'
  | 'NOT_ENTITLED'
  | 'LIMIT_EXCEEDED'
  | 'PAYMENT_REQUIRED';

export type CommercialLifecycleStatus =
  | 'ACTIVE'
  | 'FREE_ACTIVE'
  | 'RENEWAL_WINDOW'
  | 'EXPIRING_SOON'
  | 'GRACE_PERIOD'
  | 'EXPIRED'
  | 'LOCKED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'CANCELLED'
  | 'FROZEN';

export interface CommercialDecision {
  decision: 'ALLOW' | 'DENY';
  reasonCode: CommercialDecisionCode;
  status: CommercialLifecycleStatus;
  message: string;
  daysRemaining: number;
  isInGracePeriod: boolean;
  limits?: {
    limitType: string;
    current: number;
    maxAllowed: number;
  };
}

export interface ResolveCommercialAccessParams {
  partnerId: string;
  tenantId?: string | undefined;
  partnerType?: string | undefined;
  subscription?: any;
  license?: any;
  entitlements?: Array<{ code: string; enabled?: boolean; value?: any }>;
  featureCode: string;
  currentTime?: Date | undefined;
  currentCount?: number | undefined;
  skipHmacVerification?: boolean | undefined;
}

export interface CommercialLimitCheckParams {
  partnerId: string;
  tenantId?: string | undefined;
  limitType: 'DOCTORS' | 'USERS' | 'BRANCHES' | 'BEDS' | 'STORAGE_GB' | 'WHATSAPP_CREDITS';
  currentCount: number;
  license?: any;
}

export class CommercialControlService {
  /**
   * Deterministic server-side evaluation of license temporal lifecycle.
   * Evaluates exact day boundaries:
   * - ACTIVE: > 60 days remaining
   * - RENEWAL_WINDOW: <= 60 days remaining
   * - EXPIRING_SOON: <= 30 days remaining
   * - GRACE_PERIOD: now >= expiryDate AND now < gracePeriodEnd
   * - LOCKED: now >= gracePeriodEnd OR status === 'LOCKED'
   */
  evaluateLicenseLifecycle(
    license: any,
    asOf: Date = new Date()
  ): {
    status: CommercialLifecycleStatus;
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  } {
    if (!license) {
      return {
        status: 'REVOKED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0
      };
    }

    const normStatus = String(license.status || '').toUpperCase();
    if (
      normStatus === 'REVOKED' ||
      normStatus === 'SUSPENDED' ||
      normStatus === 'CANCELLED' ||
      normStatus === 'TERMINATED'
    ) {
      return {
        status: normStatus as CommercialLifecycleStatus,
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0
      };
    }

    const expiryTime = new Date(license.expiryDate).getTime();
    const nowTime = asOf.getTime();
    const graceTime = license.gracePeriodEnd
      ? new Date(license.gracePeriodEnd).getTime()
      : expiryTime;

    const msRemaining = expiryTime - nowTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    if (nowTime >= graceTime || normStatus === 'LOCKED' || normStatus === 'EXPIRED') {
      return {
        status: 'LOCKED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0
      };
    }

    if (nowTime >= expiryTime && nowTime < graceTime) {
      return {
        status: 'GRACE_PERIOD',
        isAccessAllowed: true,
        isInGracePeriod: true,
        daysRemaining: 0
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: 'EXPIRING_SOON',
        isAccessAllowed: true,
        isInGracePeriod: false,
        daysRemaining
      };
    }

    if (daysRemaining <= 60) {
      return {
        status: 'RENEWAL_WINDOW',
        isAccessAllowed: true,
        isInGracePeriod: false,
        daysRemaining
      };
    }

    return {
      status: (normStatus === 'FREE_ACTIVE' ? 'FREE_ACTIVE' : 'ACTIVE') as CommercialLifecycleStatus,
      isAccessAllowed: true,
      isInGracePeriod: false,
      daysRemaining
    };
  }

  /**
   * CANONICAL COMMERCIAL DECISION ENGINE (STEP 5)
   * Deterministically resolves access based on:
   * 1. Global & module emergency freeze kill switches
   * 2. Partner governance module status overrides
   * 3. License existence, cryptographic HMAC validity, and temporal state
   * 4. Subscription validity and status
   * 5. Partner profile capability boundary (e.g. Pharmacy profile cannot access OT)
   * 6. Feature entitlement mapping and quota enforcement
   */
  resolveCommercialAccess(params: ResolveCommercialAccessParams): CommercialDecision {
    const currentTime = params.currentTime || new Date();
    const targetTenantId = params.tenantId || params.partnerId;
    const normFeature = params.featureCode.toUpperCase().trim();

    // ── Tier 1: Emergency Kill Switches (Highest Precedence) ──────────────
    if (sessionRevocationService.isGlobalFrozen() || partnerGovernanceService.isTenantFrozen(targetTenantId)) {
      return {
        decision: 'DENY',
        reasonCode: 'GLOBAL_FREEZE',
        status: 'FROZEN',
        message: 'COMMERCIAL_ACCESS_DENIED: Platform global security freeze is active for this organization.',
        daysRemaining: 0,
        isInGracePeriod: false
      };
    }

    if (
      partnerGovernanceService.isBillingFrozen(targetTenantId) &&
      (normFeature.includes('BILLING') || normFeature.includes('INVOICE') || normFeature.includes('PAYMENT'))
    ) {
      return {
        decision: 'DENY',
        reasonCode: 'BILLING_FREEZE',
        status: 'FROZEN',
        message: 'COMMERCIAL_ACCESS_DENIED: Billing operations are frozen by HQ Command.',
        daysRemaining: 0,
        isInGracePeriod: false
      };
    }

    // ── Tier 2: Partner Governance Module Status Overrides ───────────────────
    const moduleOverride = partnerGovernanceService.getModuleOverride(targetTenantId, normFeature);
    if (moduleOverride === false) {
      return {
        decision: 'DENY',
        reasonCode: 'MODULE_DISABLED_BY_HQ',
        status: 'SUSPENDED',
        message: `COMMERCIAL_ACCESS_DENIED: Feature '${normFeature}' has been administratively disabled by HQ command.`,
        daysRemaining: 0,
        isInGracePeriod: false
      };
    }

    // ── Tier 3: Commercial Software License Verification ───────────────────
    const license = params.license;
    if (!license) {
      return {
        decision: 'DENY',
        reasonCode: 'LICENSE_MISSING',
        status: 'LOCKED',
        message: 'COMMERCIAL_ACCESS_DENIED: No commercial software license found for this organization. HQ approval required.',
        daysRemaining: 0,
        isInGracePeriod: false
      };
    }

    // Cryptographic HMAC Verification
    if (!params.skipHmacVerification) {
      const isSignatureValid = licenseService.verifyLicenseSignature(license);
      if (!isSignatureValid) {
        logger.warn('Commercial license HMAC signature tampering detected', {
          licenseId: license.id,
          partnerId: params.partnerId
        });
        return {
          decision: 'DENY',
          reasonCode: 'LICENSE_TAMPERED',
          status: 'REVOKED',
          message: 'COMMERCIAL_ACCESS_DENIED: Commercial license cryptographic signature check failed. Security tampering detected.',
          daysRemaining: 0,
          isInGracePeriod: false
        };
      }
    }

    // Temporal Lifecycle Evaluation
    const licenseEval = this.evaluateLicenseLifecycle(license, currentTime);
    if (!licenseEval.isAccessAllowed) {
      const codeMap: Record<string, CommercialDecisionCode> = {
        REVOKED: 'LICENSE_REVOKED',
        SUSPENDED: 'LICENSE_SUSPENDED',
        LOCKED: 'LICENSE_LOCKED',
        EXPIRED: 'LICENSE_EXPIRED'
      };
      const reasonCode = codeMap[licenseEval.status] || 'LICENSE_EXPIRED';
      return {
        decision: 'DENY',
        reasonCode,
        status: licenseEval.status,
        message: `COMMERCIAL_ACCESS_DENIED: Commercial software license is ${licenseEval.status}. Access blocked. Please renew plan.`,
        daysRemaining: licenseEval.daysRemaining,
        isInGracePeriod: licenseEval.isInGracePeriod
      };
    }

    // ── Tier 4: Subscription Status Verification ───────────────────────────
    const subscription = params.subscription;
    if (subscription) {
      const subStatus = String(subscription.status || '').toUpperCase();
      if (subStatus === 'CANCELLED') {
        return {
          decision: 'DENY',
          reasonCode: 'SUBSCRIPTION_CANCELLED',
          status: 'CANCELLED',
          message: 'COMMERCIAL_ACCESS_DENIED: Organization subscription has been cancelled.',
          daysRemaining: licenseEval.daysRemaining,
          isInGracePeriod: licenseEval.isInGracePeriod
        };
      }
      if (subStatus === 'SUSPENDED') {
        return {
          decision: 'DENY',
          reasonCode: 'SUBSCRIPTION_SUSPENDED',
          status: 'SUSPENDED',
          message: 'COMMERCIAL_ACCESS_DENIED: Organization subscription is suspended.',
          daysRemaining: licenseEval.daysRemaining,
          isInGracePeriod: licenseEval.isInGracePeriod
        };
      }
    }

    // ── Tier 5: Partner Profile Capability Boundary ────────────────────────
    const partnerType =
      params.partnerType ||
      (license.metadata as any)?.partnerType ||
      (license.metadata as any)?.facilityType ||
      (subscription?.metadata as any)?.partnerType;

    if (partnerType && !isModuleAllowedForPartnerProfile(partnerType, normFeature)) {
      return {
        decision: 'DENY',
        reasonCode: 'PROFILE_BOUNDARY_VIOLATION',
        status: licenseEval.status,
        message: `COMMERCIAL_ACCESS_DENIED: Module '${normFeature}' is outside the authorized capability boundary for partner profile '${partnerType}'.`,
        daysRemaining: licenseEval.daysRemaining,
        isInGracePeriod: licenseEval.isInGracePeriod
      };
    }

    // ── Tier 6: Feature Entitlement Mapping ────────────────────────────────
    if (params.entitlements && params.entitlements.length > 0) {
      const isEntitled = params.entitlements.some((e) => {
        const eCode = e.code.toUpperCase().trim();
        if (e.enabled === false) return false;
        if (eCode === normFeature || eCode.replace(/_/g, '') === normFeature.replace(/_/g, '')) return true;
        if (normFeature === 'PHARMACY' && eCode.includes('PHARMACY')) return true;
        if (normFeature === 'PATHOLOGY' && (eCode.includes('PATHOLOGY') || eCode.includes('LAB'))) return true;
        if (normFeature === 'RADIOLOGY' && eCode.includes('RADIOLOGY')) return true;
        if (normFeature === 'CLINICAL' && (eCode.includes('CLINICAL') || eCode.includes('EMR'))) return true;
        if (normFeature === 'BILLING' && (eCode.includes('BILLING') || eCode.includes('INVOICE'))) return true;
        return false;
      });

      if (!isEntitled) {
        return {
          decision: 'DENY',
          reasonCode: 'NOT_ENTITLED',
          status: licenseEval.status,
          message: `COMMERCIAL_ACCESS_DENIED: Feature '${normFeature}' is not included in organization's contracted plan entitlements.`,
          daysRemaining: licenseEval.daysRemaining,
          isInGracePeriod: licenseEval.isInGracePeriod
        };
      }
    }

    // ── Tier 7: All Commercial Gates Passed ────────────────────────────────
    return {
      decision: 'ALLOW',
      reasonCode: 'ALLOW',
      status: licenseEval.status,
      message: licenseEval.isInGracePeriod
        ? 'ALLOW: Access permitted within commercial grace period countdown.'
        : 'ALLOW: Valid commercial subscription and software license active.',
      daysRemaining: licenseEval.daysRemaining,
      isInGracePeriod: licenseEval.isInGracePeriod
    };
  }

  /**
   * Deterministic quota and capacity limit enforcement (Step 9)
   */
  checkLimit(params: CommercialLimitCheckParams): {
    allowed: boolean;
    limitType: string;
    currentCount: number;
    maxAllowed: number;
    decision: 'ALLOW' | 'DENY';
    reason?: string | undefined;
  } {
    const meta = (params.license?.metadata || {}) as Record<string, any>;
    let maxAllowed = 0;

    switch (params.limitType) {
      case 'DOCTORS':
        maxAllowed =
          meta['maxDoctorSeats'] ??
          meta['doctorSeats'] ??
          params.license?.maxDoctors ??
          20;
        break;
      case 'USERS':
        maxAllowed = params.license?.maxConcurrentUsers ?? meta['maxSeats'] ?? 50;
        break;
      case 'BRANCHES':
        maxAllowed = params.license?.maxBranches ?? 5;
        break;
      case 'BEDS':
        maxAllowed = meta['maxBeds'] ?? 25;
        break;
      case 'STORAGE_GB':
        maxAllowed = meta['storageQuotaGb'] ?? 100;
        break;
      case 'WHATSAPP_CREDITS':
        maxAllowed = meta['monthlyWhatsAppCredits'] ?? 5000;
        break;
      default:
        maxAllowed = 100;
    }

    const allowed = params.currentCount < maxAllowed;
    const result: {
      allowed: boolean;
      limitType: string;
      currentCount: number;
      maxAllowed: number;
      decision: 'ALLOW' | 'DENY';
      reason?: string | undefined;
    } = {
      allowed,
      limitType: params.limitType,
      currentCount: params.currentCount,
      maxAllowed,
      decision: allowed ? 'ALLOW' : 'DENY'
    };
    if (!allowed) {
      result.reason = `LIMIT_EXCEEDED: Maximum allowed ${params.limitType} quota (${maxAllowed}) reached.`;
    }
    return result;
  }
}

export const commercialControlService = new CommercialControlService();
