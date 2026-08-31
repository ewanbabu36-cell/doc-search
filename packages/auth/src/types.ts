import type { RoleType, PermissionAction } from '@docsearch/api-contracts';

export type DataScope = 'global' | 'tenant' | 'branch' | 'own';

export interface SessionContext {
  userId: string;
  tenantId: string;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  roles: RoleType[];
  permissions: string[];
  dataScope: DataScope;
  sessionId: string;
  actorEmail: string;
  isSuperAdmin: boolean;
}

export type AuthUserContext = SessionContext;

export interface ScopeCheckParams {
  targetTenantId: string;
  targetOrganizationId?: string | undefined;
  targetBranchId?: string | undefined;
  targetUserId?: string | undefined;
}

export interface PermissionCheckParams {
  resource: string;
  action: PermissionAction;
  scopeParams?: ScopeCheckParams | undefined;
}

export interface SecurityEventPayload {
  tenantId?: string | undefined;
  branchId?: string | undefined;
  eventType: string;
  resourceType: string;
  resourceId?: string | undefined;
  correlationId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}
