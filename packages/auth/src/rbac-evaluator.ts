import type { SessionContext, PermissionCheckParams } from './types.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

// High-risk governed actions that CANNOT be satisfied by generic resource prefix or manage role without explicit action or wildcard
const GOVERNED_ACTIONS = new Set([
  'delete',
  'refund',
  'share',
  'export',
  'approve',
  'validate',
  'override'
]);

// Action equivalence mapping (bidirectional or directed)
const ACTION_EQUIVALENCES: Record<string, string[]> = {
  view: ['read'],
  read: ['view'],
  create: ['save'],
  save: ['create'],
  edit: ['update'],
  update: ['edit'],
  remove: ['archive'],
  archive: ['remove'],
  export: ['download'],
  download: ['export']
};

export class RBACEvaluator {
  /**
   * Evaluates whether the session contains a specific permission.
   * Enforces the Golden Principles:
   * VIEW != EDIT != DELETE != SHARE != PRINT != EXPORT
   * EDIT != APPROVE
   * UPDATE != DELETE
   * REMOVE != DELETE
   * CREATE != APPROVE
   */
  static hasPermission(session: SessionContext, resourceOrPerm: string, maybeAction?: string): boolean {
    if (session.isSuperAdmin) {
      return true;
    }
    if (!session.permissions || session.permissions.length === 0) {
      return false;
    }
    if (session.permissions.includes('*') || session.permissions.includes('all')) {
      return true;
    }

    let resource: string;
    let action: string;

    if (maybeAction) {
      resource = resourceOrPerm;
      action = maybeAction.toLowerCase();
    } else {
      const lastColon = resourceOrPerm.lastIndexOf(':');
      if (lastColon !== -1) {
        resource = resourceOrPerm.substring(0, lastColon);
        action = resourceOrPerm.substring(lastColon + 1).toLowerCase();
      } else {
        resource = resourceOrPerm;
        action = 'read';
      }
    }

    const exactRequired = `${resource}:${action}`;
    if (session.permissions.includes(exactRequired)) {
      return true;
    }

    // Check action equivalence (e.g. read <=> view, create <=> save, edit <=> update)
    const equivalents = ACTION_EQUIVALENCES[action] || [];
    for (const eq of equivalents) {
      if (session.permissions.includes(`${resource}:${eq}`)) {
        return true;
      }
    }

    // Check if user has resource:manage
    if (session.permissions.includes(`${resource}:manage`)) {
      // manage grants operational actions, but high-risk governed actions require explicit permission
      if (!GOVERNED_ACTIONS.has(action)) {
        return true;
      }
    }

    // High-risk governed actions require explicit permission and CANNOT be matched by generic prefixes
    if (GOVERNED_ACTIONS.has(action)) {
      return false;
    }

    // Standard operational actions can match prefix or wildcard if explicitly configured
    if (
      session.permissions.includes(`${resource}:*`) ||
      session.permissions.includes(resource)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Enforces that the session has the required resource:action permission.
   * Throws safe AppError.forbidden if denied.
   */
  static enforcePermission(session: SessionContext, params: PermissionCheckParams): void {
    if (!this.hasPermission(session, params.resource, params.action)) {
      throw new AppError({
        message: `Access denied: Insufficient permissions for action "${params.action}" on resource "${params.resource}"`,
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
