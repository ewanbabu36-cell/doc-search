import { type FastifyRequest, type FastifyReply } from 'fastify';
import { licenseRepository } from '../repositories/company/LicenseRepository.js';
import { licenseService } from '../services/company/LicenseService.js';
import { entitlementService } from '../services/company/EntitlementService.js';
import { machineFingerprintService } from '../services/security/MachineFingerprintService.js';
import { antiTamperClockService } from '../services/security/AntiTamperClockService.js';
import { documentVerificationRepository } from '../repositories/core/DocumentVerificationRepository.js';
import { authenticate, requirePermission } from './auth-guard.js';
import type { PermissionAction } from '@docsearch/api-contracts';
import {
  AppError,
  ErrorCode,
  PARTNER_PROFILE_ALLOWED_MODULES,
  isModuleAllowedForPartnerProfile
} from '@docsearch/shared-core';
import { getDatabase, partnerProfiles, eq } from '@docsearch/database';

export { PARTNER_PROFILE_ALLOWED_MODULES, isModuleAllowedForPartnerProfile };

/**
 * Enforces valid commercial subscription and software license on partner/tenant requests.
 * Completely blocks expired, suspended, or revoked subscriptions.
 */
export async function requireActiveCommercialAccess(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const session = request.session;
  if (!session) {
    throw AppError.unauthorized('Authentication required');
  }

  // Partner profile, account plan overview, read-only configuration diagnostics, and compliance document onboarding routes must remain accessible
  const rawUrl = request.url || '';
  const isReadOnlyConfigDiagnostic =
    request.method === 'GET' &&
    (rawUrl === '/api/v1/partner/configuration' ||
      rawUrl.startsWith('/api/v1/partner/configuration?') ||
      rawUrl === '/api/v1/partner/configuration/validation' ||
      rawUrl.startsWith('/api/v1/partner/configuration/validation?'));

  if (
    rawUrl.startsWith('/api/v1/partner/account/') ||
    rawUrl.startsWith('/api/v1/partner/profile') ||
    rawUrl.startsWith('/api/v1/partner/ewan') ||
    rawUrl.startsWith('/api/v1/partner/ai/trainer') ||
    rawUrl.startsWith('/api/v1/compliance/documents') ||
    rawUrl.startsWith('/api/v1/partner/security/') ||
    rawUrl.startsWith('/api/v1/partner/break-glass') ||
    rawUrl.startsWith('/api/v1/partner/workflows') ||
    rawUrl.startsWith('/api/v1/partner/patient-360') ||
    isReadOnlyConfigDiagnostic
  ) {
    return;
  }

  // Only global Super Admins and Company HQ Admins bypass tenant license gates for administration
  if (
    session.isSuperAdmin ||
    (session.roles &&
      ((session.roles as string[]).includes('SUPER_ADMIN') ||
       (session.roles as string[]).includes('COMPANY_ADMIN')))
  ) {
    return;
  }

  // Avoid redundant evaluations if already checked on this request
  if ((request as any).__commercialAccessChecked) {
    return;
  }
  (request as any).__commercialAccessChecked = true;

  const tenantId = session.tenantId;
  if (!tenantId) {
    throw new AppError({
      message: 'COMMERCIAL_ACCESS_DENIED: Tenant context required for commercial verification.',
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  // Canonical Fail-Closed Rule: Look up active license in company.licenses
  // A partner must NOT receive operational commercial access merely because no license row exists.
  const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
  const license =
    tenantLicenses.find(
      (l) =>
        l.status === 'ACTIVE' ||
        l.status === 'FREE_ACTIVE' ||
        l.status === 'EXPIRING_SOON' ||
        l.status === 'GRACE_PERIOD'
    ) || tenantLicenses[0];

  if (!license) {
    throw new AppError({
      message: 'COMMERCIAL_ACCESS_DENIED: No active commercial license exists for this organization. HQ approval and active license required.',
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  // Attach resolved license to request for downstream profile boundary checks
  (request as any).__activeCommercialLicense = license;

  const evaluation = licenseService.evaluateLicenseStatus(license);

  if (!evaluation.isAccessAllowed) {
    throw new AppError({
      message: `COMMERCIAL_ACCESS_DENIED: Commercial access suspended: Subscription is ${evaluation.status} (License status is ${license.status}). Please renew your plan.`,
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  // Verify HMAC signature on active/allowed licenses (blocks forged or expiry-extended licenses)
  const isSignatureValid = licenseService.verifyLicenseSignature(license);
  if (!isSignatureValid) {
    throw new AppError({
      message: 'COMMERCIAL_ACCESS_DENIED: Commercial license signature verification failed. Cryptographic tampering detected.',
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  // Anti-Piracy Check 1: Monotonic Clock Integrity (System Date Rollback Protection)
  const clockStatus = antiTamperClockService.verifyClockIntegrity();
  if (clockStatus.isTampered) {
    throw new AppError({
      message: clockStatus.message || 'COMMERCIAL_ACCESS_DENIED: System clock tampering detected. Security anti-tamper lock engaged.',
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  // Anti-Piracy Check 2: Hardware Node-Lock Verification
  const lockedMachine = (license.metadata as any)?.machineFingerprint;
  if (lockedMachine && !machineFingerprintService.verifyMachine(lockedMachine)) {
    const currentNode = machineFingerprintService.getMachineFingerprint();
    throw new AppError({
      message: `COMMERCIAL_ACCESS_DENIED: Hardware Node-Lock Violation: License is locked to machine "${lockedMachine}", but this computer is "${currentNode}". Unauthorized device cloning blocked.`,
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }

  if (evaluation.isInGracePeriod) {
    reply.header('x-commercial-grace-period', 'true');
    reply.header('x-commercial-warning', 'Subscription expired. You are operating in a grace period.');
  } else if (evaluation.status === 'EXPIRING_SOON') {
    reply.header('x-commercial-expiring-soon', 'true');
    reply.header('x-commercial-days-remaining', String(evaluation.daysRemaining));
  }

  // Runtime Mandatory Document Expiry Enforcement (FINDING-P1-COMP-EXPIRY-04):
  // If a tenant has a mandatory compliance document that has expired (expiryDate < today)
  // or whose renewal has not yet been VERIFIED, block dependent operational workflows.
  const complianceHold = await documentVerificationRepository.hasExpiredMandatoryComplianceHold(tenantId);
  if (complianceHold.onHold) {
    throw new AppError({
      message: complianceHold.reason || 'EXPIRED_COMPLIANCE_HOLD: Mandatory regulatory document expired.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }
}

/**
 * Resolves route-aware module code for Pharmacy routes (distinguishing Wholesale B2B,
 * shared Inventory/Catalog, and Retail POS Dispensing) and enforces server-side
 * PARTNER_PROFILE_ALLOWED_MODULES[partnerType] boundary intersection (POST-REM-CAP-03).
 */
export function enforcePartnerProfileModuleBoundary(
  rawPartnerType: string | null | undefined,
  moduleCode: string
): void {
  if (!rawPartnerType || typeof rawPartnerType !== 'string') {
    return;
  }
  if (!isModuleAllowedForPartnerProfile(rawPartnerType, moduleCode)) {
    throw new AppError({
      message: `PARTNER_PROFILE_MODULE_BOUNDARY_VIOLATION: Module '${moduleCode}' is outside the allowed capability boundary for partner profile '${rawPartnerType}'.`,
      code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
      statusCode: 403
    });
  }
}

async function resolvePartnerProfileType(
  request: FastifyRequest,
  activeLicense: any
): Promise<string | undefined> {
  let resolvedPartnerType =
    (activeLicense?.metadata as any)?.partnerType ||
    (activeLicense?.metadata as any)?.facilityType ||
    (activeLicense?.metadata as any)?.organizationType ||
    (request.session as any)?.partnerType ||
    (request.session as any)?.facilityType ||
    (request.session as any)?.organizationType ||
    (request.session as any)?.partnerCategory;

  if (!resolvedPartnerType && request.session?.tenantId) {
    const db = getDatabase();
    if (db) {
      try {
        const [prof] = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, request.session.tenantId))
          .limit(1);
        if (prof) {
          const pMeta = (prof.metadata as Record<string, any>) || {};
          resolvedPartnerType =
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
  return resolvedPartnerType;
}

/**
 * Enforces specific database-driven feature entitlement for the active tenant subscription.
 */
export function requireFeatureEntitlement(featureCode: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireActiveCommercialAccess(request, reply);
    if (request.session && !request.session.isSuperAdmin) {
      const activeLicense = (request as any).__activeCommercialLicense;
      const resolvedPartnerType = await resolvePartnerProfileType(request, activeLicense);
      if (resolvedPartnerType) {
        enforcePartnerProfileModuleBoundary(resolvedPartnerType, featureCode);
      }
      await entitlementService.enforceFeatureAccess(request.session, featureCode);
    }
  };
}

/**
 * Plugin-level commercial guard enforcing:
 * 1. authenticate (valid JWT, non-revoked session)
 * 2. requireActiveCommercialAccess (valid license, HMAC signature, non-expired, non-suspended, no kill-switch)
 * 3. PARTNER_PROFILE_ALLOWED_MODULES[partnerType] intersection check (POST-REM-CAP-03)
 * 4. enforceFeatureAccess (plan includes moduleCode)
 */
export function requireModuleCommercialAccess(moduleCode: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authenticate(request, reply);
    await requireActiveCommercialAccess(request, reply);
    if (request.session && !request.session.isSuperAdmin) {
      const rawUrl = request.url || '';
      let effectiveModuleCode = moduleCode;
      if (moduleCode === 'PHARMACY_POS') {
        if (
          rawUrl.includes('/pharmacy/wholesale') ||
          rawUrl.includes('/pharmacy/invoices/ingest-wholesale') ||
          rawUrl.includes('/pharmacy/invoices/generate-dynamic-sample') ||
          rawUrl.includes('/pharmacy/invoices/sample-marg-erp')
        ) {
          effectiveModuleCode = 'PHARMACY_WHOLESALE';
        } else if (
          rawUrl.includes('/pharmacy/medications') ||
          rawUrl.includes('/pharmacy/batches') ||
          rawUrl.includes('/pharmacy/inventory') ||
          rawUrl.includes('/pharmacy/overview') ||
          rawUrl.includes('/pharmacy/stock-movements') ||
          rawUrl.includes('/pharmacy/returns') ||
          rawUrl.includes('/pharmacy/adjustments') ||
          rawUrl.includes('/pharmacy/recalls') ||
          rawUrl.includes('/pharmacy/dev/')
        ) {
          effectiveModuleCode = 'PHARMACY';
        }
      } else if (moduleCode === 'CLINICAL_EMR' && rawUrl.includes('/patients')) {
        effectiveModuleCode = 'PATIENTS';
      }

      const activeLicense = (request as any).__activeCommercialLicense;
      const resolvedPartnerType = await resolvePartnerProfileType(request, activeLicense);

      if (resolvedPartnerType) {
        enforcePartnerProfileModuleBoundary(resolvedPartnerType, effectiveModuleCode);
      }

      await entitlementService.enforceFeatureAccess(request.session, effectiveModuleCode);
    }
  };
}

export interface AuthorizePartnerActionOptions {
  moduleCode: string;
  featureCode?: string | undefined;
  resource: string;
  action: PermissionAction;
}

/**
 * Universal Fail-Closed Partner Authorization Guard:
 * 1. Authenticate JWT & check instant server-side revocation
 * 2. Enforce active commercial software license & cryptographic HMAC validity
 * 3. Enforce database-driven feature entitlement for contracted plan / subscription
 * 4. Enforce granular role-based access control (RBAC) permission
 */
export function authorizePartnerAction(options: AuthorizePartnerActionOptions) {
  const permCheck = requirePermission(options.resource, options.action);
  const entitlementCheck = requireFeatureEntitlement(options.featureCode || options.moduleCode);

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Stage 1: Authenticate session & check revocation
    await authenticate(request, reply);

    // Stage 2 & 3: Active commercial subscription & feature entitlement verification
    await entitlementCheck(request, reply);

    // Stage 4: Granular RBAC permission check
    await permCheck(request, reply);
  };
}

