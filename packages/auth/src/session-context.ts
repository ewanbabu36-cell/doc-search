import { z } from 'zod';
import type { SessionContext, DataScope } from './types.js';
import type { RoleType } from '@docsearch/api-contracts';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export const VerifiedTokenClaimsSchema = z.object({
  sub: z.string().min(1, 'User ID (sub) is mandatory'),
  email: z.string().email('Valid email is mandatory'),
  tenantId: z.string().min(1, 'Tenant ID is mandatory'),
  organizationId: z.string().optional(),
  branchId: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is mandatory'),
  permissions: z.array(z.string()).default([]),
  scope: z.enum(['global', 'tenant', 'branch', 'own']).optional(),
  dataScope: z.enum(['global', 'tenant', 'branch', 'own']).optional(),
  jti: z.string().optional(),
  tokenFamilyId: z.string().optional(),
  iat: z.number().int(),
  exp: z.number().int(),
  iss: z.string().optional(),
  aud: z.string().optional()
});

export type VerifiedTokenClaims = z.infer<typeof VerifiedTokenClaimsSchema>;

/**
 * Builds a validated, immutable SessionContext from verified token claims.
 * Fails closed on any invalid or missing required identifiers.
 */
export function buildSessionContext(rawClaims: unknown): SessionContext {
  const parseResult = VerifiedTokenClaimsSchema.safeParse(rawClaims);
  if (!parseResult.success) {
    throw AppError.unauthorized(
      `Malformed token claims: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      ErrorCode.TOKEN_INVALID
    );
  }

  const claims = parseResult.data;
  const isSuperAdmin = claims.roles.includes('SUPER_ADMIN');

  let dataScope: DataScope;
  const rawScope = claims.scope || claims.dataScope;
  if (rawScope) {
    dataScope = rawScope;
  } else if (isSuperAdmin) {
    dataScope = 'global';
  } else if (claims.branchId) {
    dataScope = 'branch';
  } else {
    dataScope = 'tenant';
  }

  return {
    userId: claims.sub,
    tenantId: claims.tenantId,
    organizationId: claims.organizationId ?? claims.tenantId,
    branchId: claims.branchId,
    actorEmail: claims.email,
    roles: claims.roles as RoleType[],
    permissions: claims.permissions,
    dataScope,
    sessionId: claims.jti || `sess_${claims.sub.slice(0, 8)}`,
    isSuperAdmin
  };
}
