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
import { env } from '../config/env.js';
import { enforceIdempotency } from './idempotency.js';

const logger = createLogger('auth-guard');

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
 * Fastify PreHandler Hook: Authenticates JWT from Authorization Bearer header
 * Validates cryptographic signature, issuer, audience, and expiration.
 * Establishes the typed, immutable request.session context.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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

    const built = buildSessionContext(claims);
    request.session = Object.freeze(built);

    // =========================================================================
    // ZERO TRUST IDENTITY & SCOPE ENFORCEMENT
    // Reject any client attempts to cross tenant boundaries or tamper with scope
    // =========================================================================
    const body = (request.body as Record<string, unknown>) || {};
    const query = (request.query as Record<string, unknown>) || {};
    const params = (request.params as Record<string, unknown>) || {};
    const headers = request.headers;

    // 1. Enforce Tenant Isolation: Reject Mismatched Client-Supplied tenantId
    const clientTenantId =
      body['tenantId'] || body['tenant_id'] ||
      query['tenantId'] || query['tenant_id'] ||
      params['tenantId'] || params['tenant_id'] ||
      headers['x-tenant-id'];

    if (
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

    // 2. Enforce Branch Isolation: Reject Unauthorized Client-Supplied branchId
    const clientBranchId =
      body['branchId'] || body['branch_id'] ||
      query['branchId'] || query['branch_id'] ||
      params['branchId'] || params['branch_id'] ||
      headers['x-branch-id'];

    if (
      clientBranchId &&
      typeof clientBranchId === 'string' &&
      !request.session.isSuperAdmin
    ) {
      // Determine if caller's session is restricted to a branch
      const isTenantOrGlobalAdmin =
        request.session.roles.includes('SUPER_ADMIN') ||
        request.session.roles.includes('COMPANY_ADMIN') ||
        request.session.roles.includes('HOSPITAL_ADMIN') ||
        request.session.roles.includes('CLINIC_ADMIN');

      const isBranchScoped =
        !isTenantOrGlobalAdmin &&
        (request.session.dataScope === 'branch' || Boolean(request.session.branchId));

      if (isBranchScoped && request.session.branchId && clientBranchId !== request.session.branchId) {
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
 * PreHandler Factory: Enforces granular RBAC permission requirement before business logic.
 */
export function requirePermission(resource: string, action: PermissionAction) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.session) {
      throw AppError.unauthorized('Authentication required before checking permissions');
    }
    RBACEvaluator.enforcePermission(request.session, { resource, action });
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
