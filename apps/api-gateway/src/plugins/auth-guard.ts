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
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
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
