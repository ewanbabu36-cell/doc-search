import type { SessionContext, ScopeCheckParams } from './types.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export class ScopeGuard {
  /**
   * Enforces multi-tenant isolation.
   * Guarantees Organization A users can NEVER access Organization B data.
   */
  static enforceTenantScope(session: SessionContext, params: ScopeCheckParams): void {
    if (session.isSuperAdmin) {
      return;
    }

    if (session.tenantId !== params.targetTenantId) {
      throw new AppError({
        message: 'Access denied: Cross-organization access is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
  }

  /**
   * Enforces branch-level data scoping.
   * Ensures Branch A users cannot access Branch B data unless holding a tenant-wide role.
   */
  static enforceBranchScope(session: SessionContext, params: ScopeCheckParams): void {
    if (session.isSuperAdmin) {
      return;
    }

    // First ensure tenant boundaries match
    this.enforceTenantScope(session, params);

    // If user is constrained to a specific branch scope
    if (session.dataScope === 'branch' && session.branchId && params.targetBranchId) {
      if (session.branchId !== params.targetBranchId) {
        throw new AppError({
          message: 'Access denied: Access outside your assigned branch is forbidden',
          code: ErrorCode.BRANCH_ACCESS_DENIED,
          statusCode: 403
        });
      }
    }
  }

  /**
   * Enforces resource ownership (ABAC constraint).
   * Ensures a user can only access their own records (e.g. own consultation notes or personal profile).
   */
  static enforceOwnership(session: SessionContext, targetUserId: string): void {
    if (session.isSuperAdmin) {
      return;
    }

    if (session.userId !== targetUserId) {
      throw new AppError({
        message: 'Access denied: You do not own this resource',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }
}
