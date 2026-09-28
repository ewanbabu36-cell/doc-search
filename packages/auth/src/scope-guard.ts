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

    // If user is constrained to a specific branch scope (or department scope within a branch)
    if ((session.dataScope === 'branch' || session.dataScope === 'department') && session.branchId) {
      if (!params.targetBranchId || session.branchId !== params.targetBranchId) {
        throw new AppError({
          message: 'Access denied: Access outside your assigned branch is forbidden',
          code: ErrorCode.BRANCH_ACCESS_DENIED,
          statusCode: 403
        });
      }
    }
  }

  /**
   * Enforces department-level data scoping (CAP-05).
   * Ensures Department A users cannot access Department B data.
   */
  static enforceDepartmentScope(session: SessionContext, params: ScopeCheckParams): void {
    if (session.isSuperAdmin) {
      return;
    }

    this.enforceBranchScope(session, params);

    const sessionDeptId = session.departmentId || (session as any).department;
    if (session.dataScope === 'department' && sessionDeptId) {
      if (!params.targetDepartmentId || sessionDeptId !== params.targetDepartmentId) {
        throw new AppError({
          message: 'Access denied: Access outside your assigned department is forbidden',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }
  }

  /**
   * Resolves effective tenantId, branchId, and departmentId for repository queries while
   * failing closed (403) if any requested tenantId, branchId, or departmentId conflicts
   * with the authenticated session's scope (CAP-05).
   */
  static resolveEffectiveQueryScope(
    session: SessionContext,
    requested?: {
      tenantId?: string | null | undefined;
      branchId?: string | null | undefined;
      departmentId?: string | null | undefined;
    }
  ): {
    tenantId: string;
    branchId?: string | undefined;
    departmentId?: string | undefined;
  } {
    if (!session || !session.tenantId) {
      throw new AppError({
        message: 'Access denied: Authenticated tenant session is required',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    if (!session.isSuperAdmin && requested?.tenantId && requested.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-organization access is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const sessionDeptId = session.departmentId || (session as any).department;

    const isBranchOrDeptScope =
      session.dataScope === 'branch' ||
      session.dataScope === 'department' ||
      String((session as any).scopeLevel || '').toUpperCase() === 'BRANCH' ||
      String((session as any).scopeLevel || '').toUpperCase() === 'DEPARTMENT';
    const isDeptScope =
      session.dataScope === 'department' ||
      String((session as any).scopeLevel || '').toUpperCase() === 'DEPARTMENT';

    // Enforce Branch Scope tampering check
    if (!session.isSuperAdmin && isBranchOrDeptScope && session.branchId) {
      if (requested?.branchId && requested.branchId !== session.branchId) {
        throw new AppError({
          message: 'Access denied: Tampered branchId outside your assigned branch is forbidden',
          code: ErrorCode.BRANCH_ACCESS_DENIED,
          statusCode: 403
        });
      }
    }

    // Enforce Department Scope tampering check
    if (!session.isSuperAdmin && isDeptScope && sessionDeptId) {
      if (requested?.departmentId && requested.departmentId !== sessionDeptId) {
        throw new AppError({
          message: 'Access denied: Tampered departmentId outside your assigned department is forbidden',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    const effectiveBranchId =
      isBranchOrDeptScope && session.branchId
        ? session.branchId
        : requested?.branchId || undefined;

    const effectiveDepartmentId =
      isDeptScope && sessionDeptId
        ? sessionDeptId
        : requested?.departmentId || undefined;

    return {
      tenantId: session.tenantId,
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      ...(effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {})
    };
  }

  /**
   * Filters a list of records by effective branchId and departmentId scope (POST-REM-CAP-02).
   * If a record specifies branchId / departmentId, it must match the session's constrained scope.
   */
  static filterRecordsByScope<T>(
    records: T[],
    scope: { branchId?: string | undefined; departmentId?: string | undefined }
  ): T[] {
    if (!Array.isArray(records) || (!scope.branchId && !scope.departmentId)) {
      return records;
    }
    return records.filter((item: any) => {
      if (!item || typeof item !== 'object') return true;
      const recBranch = item.branchId ? String(item.branchId) : '';
      if (
        scope.branchId &&
        recBranch &&
        recBranch !== String(scope.branchId)
      ) {
        return false;
      }
      const recDept = item.departmentId || item.orderingDepartment || item.department;
      if (
        scope.departmentId &&
        recDept &&
        String(recDept).toUpperCase().trim() !== String(scope.departmentId).toUpperCase().trim()
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Asserts that a single fetched record belongs to the caller's effective branch and department scope.
   */
  static assertRecordInScope(
    session: SessionContext,
    record: any,
    scope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ): void {
    if (!record || typeof record !== 'object' || session.isSuperAdmin) {
      return;
    }
    const effective = scope || this.resolveEffectiveQueryScope(session);
    if (record.tenantId && record.tenantId !== effective.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-organization access is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    const recBranch = record.branchId ? String(record.branchId) : '';
    if (
      effective.branchId &&
      recBranch &&
      recBranch !== String(effective.branchId)
    ) {
      throw new AppError({
        message: 'Access denied: Record belongs to a different branch outside your scope',
        code: ErrorCode.BRANCH_ACCESS_DENIED,
        statusCode: 403
      });
    }
    const recDept = record.departmentId || record.orderingDepartment || record.department;
    if (
      effective.departmentId &&
      recDept &&
      String(recDept).toUpperCase().trim() !== String(effective.departmentId).toUpperCase().trim()
    ) {
      throw new AppError({
        message: 'Access denied: Record belongs to a different department outside your scope',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
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
