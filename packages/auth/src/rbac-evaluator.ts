import type { SessionContext, PermissionCheckParams } from './types.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export class RBACEvaluator {
  /**
   * Evaluates whether the session contains a specific permission.
   * Deny-by-default: returns false unless an explicit match or super admin is found.
   */
  static hasPermission(session: SessionContext, requiredPermission: string): boolean {
    if (session.isSuperAdmin) {
      return true;
    }
    if (!session.permissions || session.permissions.length === 0) {
      return false;
    }
    return session.permissions.includes(requiredPermission) || session.permissions.includes('*');
  }

  /**
   * Enforces that the session has the required resource:action permission.
   * Throws safe AppError.forbidden if denied.
   */
  static enforcePermission(session: SessionContext, params: PermissionCheckParams): void {
    const requiredPermission = `${params.resource}:${params.action}`;

    if (!this.hasPermission(session, requiredPermission)) {
      throw new AppError({
        message: 'Access denied: Insufficient permissions for this resource',
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        statusCode: 403
      });
    }
  }

  /**
   * Enforces that the session contains at least one of the accepted roles.
   */
  static enforceRole(session: SessionContext, acceptedRoles: string[]): void {
    if (session.isSuperAdmin) {
      return;
    }

    const hasRole = session.roles.some((r) => acceptedRoles.includes(r));
    if (!hasRole) {
      throw new AppError({
        message: 'Access denied: User does not hold an authorized role',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }
}
