import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  verifyJwt,
  buildSessionContext,
  RBACEvaluator,
  ScopeGuard,
  type SessionContext,
  type VerifiedTokenClaims
} from '@docsearch/auth';
import type { PermissionAction, RoleType } from '@docsearch/api-contracts';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { getDatabase, breakGlassAccess, operationalPartners, partnerProfiles, operationalFacilities, eq, and } from '@docsearch/database';
import { env } from '../config/env.js';
import { enforceIdempotency } from './idempotency.js';
import { sessionRevocationService } from '../services/core/SessionRevocationService.js';
import { staffAdministrationRepository } from '../repositories/partner/StaffAdministrationRepository.js';
import { auditRepository } from '../repositories/core/AuditRepository.js';
import { toDeterministicUuid } from '../repositories/company/PartnerOnboardingRepository.js';
import { identitySecurityFoundationService } from '../services/security/IdentitySecurityFoundationService.js';

const logger = createLogger('auth-guard');

async function verifyActiveBreakGlassForPatientChart(
  session: SessionContext,
  patientId: string,
  actionPerformed = 'READ_PATIENT_CHART'
): Promise<boolean> {
  const db = getDatabase();
  if (!db || !session?.tenantId || !patientId) {
    return false;
  }

  try {
    const tenantUuid = toDeterministicUuid(session.tenantId);
    const rows = await db
      .select()
      .from(breakGlassAccess)
      .where(
        and(
          eq(breakGlassAccess.tenantId, tenantUuid),
          eq(breakGlassAccess.patientId, String(patientId).trim())
        )
      );

    if (!rows || rows.length === 0) {
      return false;
    }

    const nowMs = Date.now();
    const userUuid = toDeterministicUuid(session.userId);
    const callerEmail = (session.actorEmail || (session as any).email || '').toLowerCase().trim();

    const activeGrant = rows.find((r: any) => {
      if (r.revokedAt) return false;
      const expMs = r.expiresAt ? new Date(r.expiresAt).getTime() : 0;
      if (expMs <= nowMs) return false;
      const matchesUser =
        r.userId === session.userId ||
        r.userId === userUuid ||
        (callerEmail && String(r.userEmail || '').toLowerCase().trim() === callerEmail);
      return matchesUser;
    });

    if (!activeGrant) {
      return false;
    }

    await auditRepository.recordEvent(
      {
        eventType: 'BREAK_GLASS_PATIENT_CHART_ACCESSED',
        resourceType: 'patient_chart',
        resourceId: String(patientId),
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          breakGlassId: activeGrant.id,
          actorId: session.userId,
          actorEmail: callerEmail || activeGrant.userEmail,
          reason: activeGrant.reason,
          patientId: String(patientId),
          actionPerformed,
          expiresAt:
            activeGrant.expiresAt instanceof Date
              ? activeGrant.expiresAt.toISOString()
              : String(activeGrant.expiresAt),
          timestamp: new Date().toISOString()
        }
      },
      session
    );

    return true;
  } catch {
    return false;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionContext;
  }
}

export const authGuardPlugin: FastifyPluginAsync = async (app: FastifyInstance): Promise<void> => {
  // Decorate fastify request with session property
  app.decorateRequest('session', null as unknown as SessionContext);
};

// Ensure plugin decorations apply globally across encapsulated scopes
Object.assign(authGuardPlugin, { [Symbol.for('skip-override')]: true });

/**
 * Optional authentication hook for executive operational queries:
 * In development, provides a fallback SuperAdmin session if the client has not yet supplied an Authorization header.
 */
export async function optionalAuthenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.session) {
    return;
  }
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return await authenticate(request, reply);
  }
  // No authorization header provided: leave request.session undefined
  return;
}

/**
 * Fastify PreHandler Hook: Authenticates JWT from Authorization Bearer header
 * Validates cryptographic signature, issuer, audience, and expiration.
 * Establishes the typed, immutable request.session context.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.session) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid Authorization header', ErrorCode.UNAUTHORIZED);
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw AppError.unauthorized('Empty bearer token', ErrorCode.UNAUTHORIZED);
  }

  try {
    const claims = verifyJwt<VerifiedTokenClaims>(token, {
      secret: env.JWT_SECRET,
      expectedIssuer: env.JWT_ISSUER,
      expectedAudience: env.JWT_AUDIENCE
    });

    // =========================================================================
    // TEMPORAL ROLE ASSIGNMENT ENFORCEMENT (FINDING-P1-ABAC-BREAKGLASS-05)
    // effective_from <= NOW AND (effective_to IS NULL OR effective_to > NOW)
    // =========================================================================
    const nowMs = Date.now();
    const claimEffectiveFrom = (claims as any).effectiveFrom || (claims as any).roleEffectiveFrom;
    const claimEffectiveTo = (claims as any).effectiveTo || (claims as any).roleEffectiveTo;

    if (claimEffectiveFrom && new Date(claimEffectiveFrom).getTime() > nowMs) {
      throw new AppError({
        message: 'Access denied: Assigned role is not yet effective (effective_from > NOW)',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    if (claimEffectiveTo && new Date(claimEffectiveTo).getTime() <= nowMs) {
      throw new AppError({
        message: 'Access denied: Assigned role has expired (effective_to <= NOW)',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const built = buildSessionContext(claims);

    if (!built.isSuperAdmin && built.tenantId) {
      let temporalEval = await staffAdministrationRepository.evaluateStaffTemporalAccess(
        built.tenantId,
        built.userId,
        new Date(nowMs)
      );
      if (!temporalEval.hasAssignments && built.actorEmail) {
        temporalEval = await staffAdministrationRepository.evaluateStaffTemporalAccess(
          built.tenantId,
          built.actorEmail,
          new Date(nowMs)
        );
      }

      if (temporalEval.hasAssignments) {
        if (!temporalEval.isAccessAllowed) {
          throw new AppError({
            message: temporalEval.denialReason || 'Access denied: Role assignment has expired or is not yet effective.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
        if (temporalEval.expiredRoles.length > 0 || temporalEval.futureRoles.length > 0) {
          const inactiveRoleSet = new Set(
            [...temporalEval.expiredRoles, ...temporalEval.futureRoles].map((r) => r.toUpperCase())
          );
          const filteredRoles = built.roles.filter((r) => !inactiveRoleSet.has(String(r).toUpperCase()));
          const effectiveActiveRoles = (
            filteredRoles.length > 0 ? filteredRoles : (temporalEval.activeRoles as RoleType[])
          ).map((r) => String(r).toUpperCase());
          (built as any).roles = effectiveActiveRoles as RoleType[];

          // Invariant (P1-05): Expired/future role assignments contribute ZERO permissions.
          // Recompute allowed permission prefixes from remaining activeRoles so stale JWT permissions
          // from an expired role (e.g. expired NURSE alongside valid BILLING_EXECUTIVE) are removed.
          const ROLE_PERMISSION_PREFIXES: Record<string, string[]> = {
            OWNER: ['*'],
            HOSPITAL_ADMIN: ['*'],
            PARTNER_ADMIN: ['*'],
            CLINIC_ADMIN: ['*'],
            ADMINISTRATOR: ['*'],
            DOCTOR: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'lab:order', 'radiology:order', 'clinical:radiology'],
            CLINIC_DOCTOR: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'lab:order', 'radiology:order', 'clinical:radiology'],
            ATTENDING_DOCTOR: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'ipd:', 'clinical:radiology'],
            CONSULTANT_DOCTOR: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'ipd:', 'clinical:radiology'],
            SENIOR_CONSULTANT: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'ipd:', 'clinical:radiology'],
            OPD_DOCTOR: ['clinical:', 'patients:', 'patient:', 'prescription:', 'appointments:', 'clinical:radiology'],
            SURGEON: ['clinical:', 'patients:', 'patient:', 'prescription:', 'ot:', 'ipd:', 'clinical:radiology'],
            NURSE: ['clinical:', 'patients:', 'patient:', 'vitals:', 'nursing:', 'ipd:'],
            STAFF_NURSE: ['clinical:', 'patients:', 'patient:', 'vitals:', 'nursing:', 'ipd:'],
            HEAD_NURSE: ['clinical:', 'patients:', 'patient:', 'vitals:', 'nursing:', 'ipd:'],
            BILLING_EXECUTIVE: ['billing:', 'invoices:', 'payments:', 'finance:', 'reconciliation:'],
            FINANCE_OFFICER: ['billing:', 'invoices:', 'payments:', 'finance:', 'reconciliation:', 'reports:', 'payables:', 'shifts:', 'tax:'],
            CHIEF_FINANCIAL_OFFICER: ['*'],
            CASHIER: ['billing:', 'invoices:', 'payments:', 'shifts:'],
            ACCOUNTANT: ['billing:', 'invoices:', 'payments:', 'finance:', 'reconciliation:', 'payables:', 'tax:'],
            RECEPTIONIST: ['appointments:', 'patient:register', 'patients:create', 'queues:'],
            PHARMACIST: ['pharmacy:', 'inventory:', 'prescriptions:read'],
            DISPENSING_PHARMACIST: ['pharmacy:', 'inventory:', 'prescriptions:read'],
            LAB_TECHNICIAN: ['lab:', 'pathology:', 'samples:'],
            PATHOLOGIST: ['lab:', 'pathology:', 'samples:', 'reports:'],
            RADIOLOGIST: ['radiology:', 'clinical:radiology', 'imaging:', 'pacs:', 'reports:'],
            HOD_RADIOLOGIST: ['radiology:', 'clinical:radiology', 'imaging:', 'pacs:', 'reports:'],
            RADIOLOGY_TECHNOLOGIST: ['radiology:', 'clinical:radiology', 'imaging:', 'pacs:'],
            RADIOLOGY_SUPERVISOR: ['radiology:', 'clinical:radiology', 'imaging:', 'pacs:', 'reports:']
          };

          const allowedPrefixes = new Set<string>();
          for (const activeRole of effectiveActiveRoles) {
            const prefixes = ROLE_PERMISSION_PREFIXES[activeRole] || [];
            for (const p of prefixes) {
              allowedPrefixes.add(p.toLowerCase());
            }
          }

          if (!allowedPrefixes.has('*')) {
            (built as any).permissions = (built.permissions || []).filter((perm) => {
              const pLower = String(perm).toLowerCase();
              for (const prefix of allowedPrefixes) {
                if (pLower === prefix || pLower.startsWith(prefix)) {
                  return true;
                }
              }
              return false;
            });
          }
        }
      }
    }

    request.session = Object.freeze(built);

    // =========================================================================
    // SERVER-SIDE SESSION & ENTITY REVOCATION ENFORCEMENT
    // Immediately terminate stale JWTs for suspended partners, users, or sessions
    // =========================================================================
    if (!request.session.isSuperAdmin) {
      const revocation = await sessionRevocationService.isRevoked(claims);
      if (revocation.revoked) {
        throw new AppError({
          message: revocation.reason || 'Access denied: Session or account revoked',
          code: (revocation.code as ErrorCode) || ErrorCode.UNAUTHORIZED,
          statusCode: revocation.code === ErrorCode.TENANT_ACCESS_DENIED ? 403 : 401
        });
      }

      const rawReqUrl = request.url || '';
      const isSecurityEvalEndpoint =
        rawReqUrl.startsWith('/api/v1/partner/security/authorize') ||
        rawReqUrl.startsWith('/api/v1/company/security/authorize') ||
        rawReqUrl.startsWith('/api/v1/partner/security/access-diagnostics');

      if (!isSecurityEvalEndpoint) {
        const canonicalIdentity = await identitySecurityFoundationService.resolveCanonicalIdentity(request.session);
        if (canonicalIdentity && canonicalIdentity.staffStatus !== 'ACTIVE') {
          throw new AppError({
            message: `Access denied: Staff account is ${canonicalIdentity.staffStatus}`,
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
      }
    }

    // =========================================================================
    // ZERO TRUST IDENTITY & SCOPE ENFORCEMENT
    // Reject any client attempts to cross tenant boundaries or tamper with scope
    // =========================================================================
    const rawReqUrl = request.url || '';
    const isSecurityEvalEndpoint =
      rawReqUrl.startsWith('/api/v1/partner/security/authorize') ||
      rawReqUrl.startsWith('/api/v1/company/security/authorize') ||
      rawReqUrl.startsWith('/api/v1/partner/security/access-diagnostics');

    const body = (request.body as Record<string, unknown>) || {};
    const query = (request.query as Record<string, unknown>) || {};
    const params = (request.params as Record<string, unknown>) || {};
    const headers = request.headers;

    // 1. Enforce Tenant Isolation: Reject Mismatched Client-Supplied tenantId
    let clientTenantId =
      body['tenantId'] || body['tenant_id'] ||
      query['tenantId'] || query['tenant_id'] ||
      params['tenantId'] || params['tenant_id'] ||
      headers['x-tenant-id'];

    // ERP/SaaS Multi-Tenant Gateway Sanitization:
    // If client supplied the static template placeholder ('11111111-1111-4111-8111-111111111111'),
    // gracefully bind it to the authenticated session's tenantId rather than rejecting authentic enterprise users.
    if (clientTenantId === '11111111-1111-4111-8111-111111111111' && request.session.tenantId) {
      clientTenantId = request.session.tenantId;
      if (body['tenantId']) body['tenantId'] = request.session.tenantId;
      if (body['tenant_id']) body['tenant_id'] = request.session.tenantId;
      if (headers['x-tenant-id'] === '11111111-1111-4111-8111-111111111111') headers['x-tenant-id'] = request.session.tenantId;
    }

    if (
      !isSecurityEvalEndpoint &&
      clientTenantId &&
      typeof clientTenantId === 'string' &&
      !request.session.isSuperAdmin &&
      clientTenantId !== request.session.tenantId
    ) {
      logger.warn('Cross-tenant access attempt blocked', {
        requestId: request.id,
        sessionTenantId: request.session.tenantId,
        clientTenantId,
        userId: request.session.userId,
        url: request.url
      });
      throw new AppError({
        message: 'Access denied: Cross-tenant access is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    // 1b. Enforce Partner Isolation: Reject Mismatched Client-Supplied partnerId for non-HQ callers
    let clientPartnerId =
      body['partnerId'] || body['partner_id'] ||
      query['partnerId'] || query['partner_id'] ||
      params['partnerId'] || params['partner_id'] ||
      headers['x-partner-id'];

    if (
      (clientPartnerId === '11111111-1111-4111-8111-111111111111' || clientPartnerId === '') &&
      request.session.tenantId
    ) {
      clientPartnerId = request.session.tenantId;
      if (body['partnerId'] !== undefined) body['partnerId'] = request.session.tenantId;
      if (body['partner_id'] !== undefined) body['partner_id'] = request.session.tenantId;
      if (headers['x-partner-id'] === '11111111-1111-4111-8111-111111111111') headers['x-partner-id'] = request.session.tenantId;
    }

    if (
      !isSecurityEvalEndpoint &&
      clientPartnerId &&
      typeof clientPartnerId === 'string' &&
      !request.session.isSuperAdmin &&
      !request.session.roles.includes('COMPANY_ADMIN') &&
      clientPartnerId !== request.session.tenantId
    ) {
      let isPartnerOfTenant = false;
      const db = getDatabase();
      if (db && request.session.tenantId) {
        try {
          const [opP] = await db
            .select({ id: operationalPartners.id })
            .from(operationalPartners)
            .where(
              and(
                eq(operationalPartners.tenantId, request.session.tenantId),
                eq(operationalPartners.id, clientPartnerId)
              )
            )
            .limit(1);
          if (opP) {
            isPartnerOfTenant = true;
          } else {
            const [pp] = await db
              .select({ id: partnerProfiles.id })
              .from(partnerProfiles)
              .where(
                and(
                  eq(partnerProfiles.tenantId, request.session.tenantId),
                  eq(partnerProfiles.id, clientPartnerId)
                )
              )
              .limit(1);
            if (pp) isPartnerOfTenant = true;
          }
        } catch {}
      }

      if (!isPartnerOfTenant) {
        logger.warn('Cross-partner parameter tampering attempt blocked', {
          requestId: request.id,
          sessionTenantId: request.session.tenantId,
          clientPartnerId,
          userId: request.session.userId,
          url: request.url
        });
        throw new AppError({
          message: 'Access denied: Cross-partner parameter tampering is strictly forbidden',
          code: ErrorCode.TENANT_ACCESS_DENIED,
          statusCode: 403
        });
      }
    }

    // 2. Enforce Branch Isolation: Reject Unauthorized Client-Supplied branchId
    const clientBranchId =
      body['branchId'] || body['branch_id'] ||
      query['branchId'] || query['branch_id'] ||
      params['branchId'] || params['branch_id'] ||
      headers['x-branch-id'];

    if (
      !isSecurityEvalEndpoint &&
      clientBranchId &&
      typeof clientBranchId === 'string' &&
      !request.session.isSuperAdmin
    ) {
      // Determine if caller's session is restricted to a branch
      const sessionRoles = request.session.roles as string[];
      const isTenantOrGlobalAdmin =
        sessionRoles.includes('SUPER_ADMIN') ||
        sessionRoles.includes('COMPANY_ADMIN') ||
        sessionRoles.includes('PARTNER_ADMIN') ||
        sessionRoles.includes('OWNER') ||
        sessionRoles.includes('HOSPITAL_DIRECTOR') ||
        (sessionRoles.includes('HOSPITAL_ADMIN') && request.session.dataScope !== 'branch') ||
        (sessionRoles.includes('CLINIC_ADMIN') && request.session.dataScope !== 'branch') ||
        (sessionRoles.includes('CLINIC_DOCTOR') && request.session.dataScope !== 'branch');

      const isBranchScoped =
        request.session.dataScope === 'branch' ||
        (!isTenantOrGlobalAdmin && Boolean(request.session.branchId));

      if (isBranchScoped && request.session.branchId && clientBranchId !== request.session.branchId) {
        let isFacilityOfTenant = false;
        const db = getDatabase();
        if (db && request.session.tenantId && request.session.dataScope !== 'branch') {
          try {
            const [fac] = await db
              .select({ id: operationalFacilities.id })
              .from(operationalFacilities)
              .where(
                and(
                  eq(operationalFacilities.tenantId, request.session.tenantId),
                  eq(operationalFacilities.id, clientBranchId)
                )
              )
              .limit(1);
            if (fac) isFacilityOfTenant = true;
          } catch {}
        }

        if (!isFacilityOfTenant) {
          logger.warn('Unauthorized cross-branch access attempt blocked', {
            requestId: request.id,
            sessionBranchId: request.session.branchId,
            clientBranchId,
            userId: request.session.userId,
            url: request.url
          });
          throw new AppError({
            message: 'Access denied: Access outside your assigned branch is forbidden',
            code: ErrorCode.BRANCH_ACCESS_DENIED,
            statusCode: 403
          });
        }
      }
    }

    // 3. Post-Authentication Idempotency Deduplication (Tenant & User Scoped)
    await enforceIdempotency(request, reply);
  } catch (err) {
    logger.warn('Authentication token verification failed', {
      requestId: request.id,
      error: err instanceof Error ? err.message : String(err)
    });
    if (err instanceof AppError) {
      throw err;
    }
    throw AppError.unauthorized('Invalid or expired token', ErrorCode.TOKEN_INVALID);
  }
}

/**
 * PreHandler Factory: Enforces granular RBAC permission requirement before business logic,
 * with narrowly-scoped Break-Glass emergency clinical override for specific patient charts.
 */
export function requirePermission(resource: string, action: PermissionAction) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before checking permissions');
    }

    const targetPatientId = (request.params as Record<string, string>)?.['id'];
    const isSpecificPatientChartRead =
      (resource === 'clinical:patients' || resource === 'patients') &&
      action === 'read' &&
      Boolean(targetPatientId);

    // Section 20 Invariant: SUPER_ADMIN does NOT receive automatic patient-chart access without a clinical role or explicit Break-Glass grant
    if (isSpecificPatientChartRead && targetPatientId && request.session.isSuperAdmin) {
      const hasClinicalRole = request.session.roles.some((r) =>
        ['DOCTOR', 'CLINIC_DOCTOR', 'ATTENDING_DOCTOR', 'HOSPITAL_ADMIN', 'PARTNER_ADMIN', 'CLINIC_ADMIN'].includes(String(r))
      );
      if (!hasClinicalRole) {
        const hasBreakGlass = await verifyActiveBreakGlassForPatientChart(request.session, targetPatientId);
        if (!hasBreakGlass) {
          throw new AppError({
            message: 'Access denied: SUPER_ADMIN does not have automatic patient-chart access; explicit scoped Break-Glass emergency authorization is required.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
        return;
      }
    }

    try {
      RBACEvaluator.enforcePermission(request.session, { resource, action });
    } catch (err) {
      if (isSpecificPatientChartRead && targetPatientId) {
        const hasBreakGlass = await verifyActiveBreakGlassForPatientChart(request.session, targetPatientId);
        if (hasBreakGlass) {
          return;
        }
      }
      throw err;
    }
  };
}

/**
 * PreHandler Factory: Enforces that the session has at least one of the specified permissions.
 */
export function requireAnyPermission(...permissions: { resource: string; action: PermissionAction }[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before checking permissions');
    }
    const hasAny = permissions.some((p) => RBACEvaluator.hasPermission(request.session, p.resource, p.action));
    if (!hasAny) {
      throw AppError.forbidden(
        `Access denied: Requires at least one permission from: ${permissions.map((p) => `${p.resource}:${p.action}`).join(', ')}`
      );
    }
  };
}

/**
 * PreHandler Factory: Enforces role membership requirement.
 */
export function requireRoles(...roles: RoleType[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before checking roles');
    }
    RBACEvaluator.enforceRole(request.session, roles);
  };
}

/**
 * PreHandler Factory: Enforces multi-tenant boundary.
 * Tenant context is ALWAYS strictly derived from authenticated session.
 */
export function requireTenantScope(
  tenantIdExtractor: (req: FastifyRequest) => string = (req) =>
    ((req.params as Record<string, string>)?.['tenantId'] ||
      (req.headers['x-tenant-id'] as string) ||
      req.session?.tenantId ||
      '')
) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before verifying tenant scope');
    }

    const targetTenantId = tenantIdExtractor(request);
    if (!targetTenantId) {
      throw AppError.badRequest('Tenant identifier missing from request context');
    }

    ScopeGuard.enforceTenantScope(request.session, { targetTenantId });
  };
}

/**
 * PreHandler Factory: Enforces facility branch data scoping.
 */
export function requireBranchScope(
  branchIdExtractor: (req: FastifyRequest) => string = (req) =>
    ((req.params as Record<string, string>)?.['branchId'] ||
      (req.headers['x-branch-id'] as string) ||
      '')
) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before verifying branch scope');
    }

    const targetBranchId = branchIdExtractor(request);
    if (!targetBranchId) {
      throw AppError.badRequest('Branch identifier missing from request context');
    }

    ScopeGuard.enforceBranchScope(request.session, {
      targetTenantId: request.session.tenantId,
      targetBranchId
    });
  };
}
