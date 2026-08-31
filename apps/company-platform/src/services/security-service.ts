import type {
  SecurityRoleDto,
  SecurityPermissionDto,
  SecurityRolePermissionDto,
  SecurityUserRoleDto,
  SecurityPolicyDto,
  SecuritySessionDto,
  SecurityCredentialDto,
  SecurityIncidentDto,
  SecurityAuditVerificationDto,
  SecurityOverviewDto,
  AssignPermissionRequest,
  AssignUserRoleRequest,
  RevokeUserRoleRequest,
  TransitionSecurityPolicyRequest,
  TerminateSessionRequest,
  RotateCredentialRequest,
  RevokeCredentialRequest,
  AcknowledgeSecurityIncidentRequest,
  ResolveSecurityIncidentRequest,
  VerifyAuditEventRequest
} from '@docsearch/api-contracts';
import {
  mockSecurityRoles,
  mockSecurityPermissions,
  mockSecurityRolePermissions,
  mockSecurityUserRoles,
  mockSecurityPolicies,
  mockSecuritySessions,
  mockSecurityCredentials,
  mockSecurityIncidents,
  mockSecurityAuditVerifications,
  mockSecurityOverview
} from './mock-security-data.js';

export interface ISecurityService {
  getSecurityOverview(): Promise<SecurityOverviewDto>;
  getRoles(): Promise<SecurityRoleDto[]>;
  getRoleById(id: string): Promise<SecurityRoleDto | null>;
  getPermissions(): Promise<SecurityPermissionDto[]>;
  getRolePermissions(roleId?: string): Promise<SecurityRolePermissionDto[]>;
  assignPermission(req: AssignPermissionRequest): Promise<SecurityRolePermissionDto>;
  getUserRoles(): Promise<SecurityUserRoleDto[]>;
  assignUserRole(req: AssignUserRoleRequest): Promise<SecurityUserRoleDto>;
  revokeUserRole(req: RevokeUserRoleRequest): Promise<SecurityUserRoleDto>;
  getSecurityPolicies(): Promise<SecurityPolicyDto[]>;
  getSecurityPolicyById(id: string): Promise<SecurityPolicyDto | null>;
  transitionSecurityPolicy(id: string, req: TransitionSecurityPolicyRequest): Promise<SecurityPolicyDto>;
  getSessions(): Promise<SecuritySessionDto[]>;
  terminateSession(req: TerminateSessionRequest): Promise<SecuritySessionDto>;
  getCredentials(): Promise<SecurityCredentialDto[]>;
  rotateCredential(req: RotateCredentialRequest): Promise<SecurityCredentialDto>;
  revokeCredential(req: RevokeCredentialRequest): Promise<SecurityCredentialDto>;
  getSecurityIncidents(): Promise<SecurityIncidentDto[]>;
  acknowledgeSecurityIncident(req: AcknowledgeSecurityIncidentRequest): Promise<SecurityIncidentDto>;
  resolveSecurityIncident(req: ResolveSecurityIncidentRequest): Promise<SecurityIncidentDto>;
  getAuditVerifications(): Promise<SecurityAuditVerificationDto[]>;
  verifyAuditEvent(req: VerifyAuditEventRequest): Promise<SecurityAuditVerificationDto>;
}

export class SecurityService implements ISecurityService {
  private readonly apiUrl?: string | undefined;
  private roles: SecurityRoleDto[] = [...mockSecurityRoles];
  private permissions: SecurityPermissionDto[] = [...mockSecurityPermissions];
  private rolePermissions: SecurityRolePermissionDto[] = [...mockSecurityRolePermissions];
  private userRoles: SecurityUserRoleDto[] = [...mockSecurityUserRoles];
  private policies: SecurityPolicyDto[] = [...mockSecurityPolicies];
  private sessions: SecuritySessionDto[] = [...mockSecuritySessions];
  private credentials: SecurityCredentialDto[] = [...mockSecurityCredentials];
  private incidents: SecurityIncidentDto[] = [...mockSecurityIncidents];
  private verifications: SecurityAuditVerificationDto[] = [...mockSecurityAuditVerifications];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getSecurityOverview(): Promise<SecurityOverviewDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/overview`);
      if (!res.ok) throw new Error(`Failed to fetch security overview: ${res.statusText}`);
      return (await res.json()) as SecurityOverviewDto;
    }
    return {
      ...mockSecurityOverview,
      activeRolesCount: this.roles.filter((r) => r.status === 'ACTIVE').length,
      totalPermissionsCount: this.permissions.length,
      activePoliciesCount: this.policies.filter((p) => p.status === 'ACTIVE').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length,
      activeSessionsCount: this.sessions.filter((s) => s.status === 'ACTIVE').length,
      credentialsPendingRotationCount: this.credentials.filter((c) => c.status === 'PENDING_ROTATION' || c.status === 'ACTIVE').length,
      verifiedAuditCount: this.verifications.length
    };
  }

  async getRoles(): Promise<SecurityRoleDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/roles`);
      if (!res.ok) throw new Error(`Failed to fetch roles: ${res.statusText}`);
      return (await res.json()) as SecurityRoleDto[];
    }
    return [...this.roles];
  }

  async getRoleById(id: string): Promise<SecurityRoleDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/roles/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch role: ${res.statusText}`);
      return (await res.json()) as SecurityRoleDto;
    }
    const r = this.roles.find((item) => item.id === id);
    return r ? { ...r } : null;
  }

  async getPermissions(): Promise<SecurityPermissionDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/permissions`);
      if (!res.ok) throw new Error(`Failed to fetch permissions: ${res.statusText}`);
      return (await res.json()) as SecurityPermissionDto[];
    }
    return [...this.permissions];
  }

  async getRolePermissions(roleId?: string): Promise<SecurityRolePermissionDto[]> {
    if (this.apiUrl) {
      const url = roleId
        ? `${this.apiUrl}/api/v1/company/security/roles/${roleId}/permissions`
        : `${this.apiUrl}/api/v1/company/security/role-permissions`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch role permissions: ${res.statusText}`);
      return (await res.json()) as SecurityRolePermissionDto[];
    }
    if (roleId) {
      return this.rolePermissions.filter((rp) => rp.roleId === roleId);
    }
    return [...this.rolePermissions];
  }

  async assignPermission(req: AssignPermissionRequest): Promise<SecurityRolePermissionDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/role-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to assign permission: ${res.statusText}`);
      return (await res.json()) as SecurityRolePermissionDto;
    }

    const role = this.roles.find((r) => r.id === req.roleId);
    const perm = this.permissions.find((p) => p.id === req.permissionId);
    if (!role || !perm) throw new Error('Role or Permission not found');

    const newRp: SecurityRolePermissionDto = {
      id: `srp-${Date.now()}`,
      roleId: req.roleId,
      roleCode: role.roleCode,
      permissionId: req.permissionId,
      permissionCode: perm.permissionCode,
      permissionName: perm.permissionName,
      action: perm.action,
      riskLevel: perm.riskLevel,
      grantedByEmail: req.actorEmail,
      grantedAt: new Date().toISOString()
    };
    this.rolePermissions.push(newRp);
    return { ...newRp };
  }

  async getUserRoles(): Promise<SecurityUserRoleDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/user-roles`);
      if (!res.ok) throw new Error(`Failed to fetch user roles: ${res.statusText}`);
      return (await res.json()) as SecurityUserRoleDto[];
    }
    return [...this.userRoles];
  }

  async assignUserRole(req: AssignUserRoleRequest): Promise<SecurityUserRoleDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/user-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to assign user role: ${res.statusText}`);
      return (await res.json()) as SecurityUserRoleDto;
    }

    const role = this.roles.find((r) => r.id === req.roleId);
    if (!role) throw new Error(`Role ${req.roleId} not found`);

    const newUr: SecurityUserRoleDto = {
      id: `sur-${Date.now()}`,
      userId: req.userId,
      userEmail: req.userEmail,
      userName: req.userEmail.split('@')[0],
      roleId: req.roleId,
      roleCode: role.roleCode,
      roleName: role.roleName,
      scopeType: req.scopeType,
      scopeReference: req.scopeReference,
      assignedByEmail: req.actorEmail,
      assignedAt: new Date().toISOString(),
      expiresAt: req.expiresAt,
      status: 'ACTIVE',
      isHighRisk: role.roleCode === 'SUPER_ADMIN' || role.roleType === 'SYSTEM'
    };
    this.userRoles.push(newUr);
    return { ...newUr };
  }

  async revokeUserRole(req: RevokeUserRoleRequest): Promise<SecurityUserRoleDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/user-roles/${req.userRoleId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to revoke user role: ${res.statusText}`);
      return (await res.json()) as SecurityUserRoleDto;
    }

    const idx = this.userRoles.findIndex((ur) => ur.id === req.userRoleId);
    const ur = this.userRoles[idx];
    if (idx === -1 || !ur) throw new Error(`User role assignment ${req.userRoleId} not found`);

    const updated: SecurityUserRoleDto = {
      ...ur,
      status: 'SUSPENDED'
    };
    this.userRoles[idx] = updated;
    return { ...updated };
  }

  async getSecurityPolicies(): Promise<SecurityPolicyDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/policies`);
      if (!res.ok) throw new Error(`Failed to fetch security policies: ${res.statusText}`);
      return (await res.json()) as SecurityPolicyDto[];
    }
    return [...this.policies];
  }

  async getSecurityPolicyById(id: string): Promise<SecurityPolicyDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/policies/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch security policy: ${res.statusText}`);
      return (await res.json()) as SecurityPolicyDto;
    }
    const p = this.policies.find((item) => item.id === id);
    return p ? { ...p } : null;
  }

  async transitionSecurityPolicy(
    id: string,
    req: TransitionSecurityPolicyRequest
  ): Promise<SecurityPolicyDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/policies/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to transition security policy: ${res.statusText}`);
      return (await res.json()) as SecurityPolicyDto;
    }

    const idx = this.policies.findIndex((item) => item.id === id);
    const p = this.policies[idx];
    if (idx === -1 || !p) throw new Error(`Security policy ${id} not found`);

    const updated: SecurityPolicyDto = {
      ...p,
      status: req.toStatus,
      approvedAt: req.toStatus === 'ACTIVE' ? new Date().toISOString() : p.approvedAt,
      approvedByEmail: req.toStatus === 'ACTIVE' ? req.actorEmail : p.approvedByEmail,
      updatedAt: new Date().toISOString()
    };
    this.policies[idx] = updated;
    return { ...updated };
  }

  async getSessions(): Promise<SecuritySessionDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/sessions`);
      if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
      return (await res.json()) as SecuritySessionDto[];
    }
    return [...this.sessions];
  }

  async terminateSession(req: TerminateSessionRequest): Promise<SecuritySessionDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/sessions/${req.sessionId}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to terminate session: ${res.statusText}`);
      return (await res.json()) as SecuritySessionDto;
    }

    const idx = this.sessions.findIndex((s) => s.sessionId === req.sessionId);
    const s = this.sessions[idx];
    if (idx === -1 || !s) throw new Error(`Session ${req.sessionId} not found`);

    const updated: SecuritySessionDto = {
      ...s,
      status: 'TERMINATED',
      terminatedAt: new Date().toISOString(),
      terminationReason: req.reason
    };
    this.sessions[idx] = updated;
    return { ...updated };
  }

  async getCredentials(): Promise<SecurityCredentialDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/credentials`);
      if (!res.ok) throw new Error(`Failed to fetch credentials: ${res.statusText}`);
      return (await res.json()) as SecurityCredentialDto[];
    }
    return [...this.credentials];
  }

  async rotateCredential(req: RotateCredentialRequest): Promise<SecurityCredentialDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/credentials/${req.credentialCode}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to rotate credential: ${res.statusText}`);
      return (await res.json()) as SecurityCredentialDto;
    }

    const idx = this.credentials.findIndex((c) => c.credentialCode === req.credentialCode);
    const c = this.credentials[idx];
    if (idx === -1 || !c) throw new Error(`Credential ${req.credentialCode} not found`);

    const now = new Date();
    const nextRotation = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const updated: SecurityCredentialDto = {
      ...c,
      status: 'ACTIVE',
      lastRotatedAt: now.toISOString(),
      nextRotationDue: nextRotation.toISOString()
    };
    this.credentials[idx] = updated;
    return { ...updated };
  }

  async revokeCredential(req: RevokeCredentialRequest): Promise<SecurityCredentialDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/credentials/${req.credentialCode}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to revoke credential: ${res.statusText}`);
      return (await res.json()) as SecurityCredentialDto;
    }

    const idx = this.credentials.findIndex((c) => c.credentialCode === req.credentialCode);
    const c = this.credentials[idx];
    if (idx === -1 || !c) throw new Error(`Credential ${req.credentialCode} not found`);

    const updated: SecurityCredentialDto = {
      ...c,
      status: 'REVOKED',
      revokedAt: new Date().toISOString()
    };
    this.credentials[idx] = updated;
    return { ...updated };
  }

  async getSecurityIncidents(): Promise<SecurityIncidentDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/incidents`);
      if (!res.ok) throw new Error(`Failed to fetch security incidents: ${res.statusText}`);
      return (await res.json()) as SecurityIncidentDto[];
    }
    return [...this.incidents];
  }

  async acknowledgeSecurityIncident(req: AcknowledgeSecurityIncidentRequest): Promise<SecurityIncidentDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/incidents/${req.incidentId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to acknowledge security incident: ${res.statusText}`);
      return (await res.json()) as SecurityIncidentDto;
    }

    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const inc = this.incidents[idx];
    if (idx === -1 || !inc) throw new Error(`Security incident ${req.incidentId} not found`);

    const updated: SecurityIncidentDto = {
      ...inc,
      status: 'INVESTIGATING',
      assignedToEmail: req.actorEmail,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    return { ...updated };
  }

  async resolveSecurityIncident(req: ResolveSecurityIncidentRequest): Promise<SecurityIncidentDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/incidents/${req.incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to resolve security incident: ${res.statusText}`);
      return (await res.json()) as SecurityIncidentDto;
    }

    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const inc = this.incidents[idx];
    if (idx === -1 || !inc) throw new Error(`Security incident ${req.incidentId} not found`);

    const updated: SecurityIncidentDto = {
      ...inc,
      status: req.resolutionStatus,
      resolutionNotes: req.resolutionNotes,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    return { ...updated };
  }

  async getAuditVerifications(): Promise<SecurityAuditVerificationDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/audit-verifications`);
      if (!res.ok) throw new Error(`Failed to fetch audit verifications: ${res.statusText}`);
      return (await res.json()) as SecurityAuditVerificationDto[];
    }
    return [...this.verifications];
  }

  async verifyAuditEvent(req: VerifyAuditEventRequest): Promise<SecurityAuditVerificationDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/security/audit-verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to verify audit event: ${res.statusText}`);
      return (await res.json()) as SecurityAuditVerificationDto;
    }

    const newV: SecurityAuditVerificationDto = {
      id: `verif-${Date.now()}`,
      verificationCode: `VERIF-AUTO-${Date.now()}`,
      auditEventReference: req.auditEventReference,
      verificationType: req.verificationType,
      verificationStatus: req.verificationStatus,
      verifiedByEmail: req.actorEmail,
      verifiedAt: new Date().toISOString(),
      evidenceReference: req.evidenceReference,
      notes: req.notes,
      createdAt: new Date().toISOString()
    };
    this.verifications.push(newV);
    return { ...newV };
  }
}

export const securityService = new SecurityService();
