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

import { apiCall, isMockFallbackAllowed } from './api-client.js';

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
  private roles: SecurityRoleDto[] = [];
  private permissions: SecurityPermissionDto[] = [];
  private rolePermissions: SecurityRolePermissionDto[] = [];
  private userRoles: SecurityUserRoleDto[] = [];
  private policies: SecurityPolicyDto[] = [];
  private sessions: SecuritySessionDto[] = [];
  private credentials: SecurityCredentialDto[] = [];
  private incidents: SecurityIncidentDto[] = [];
  private verifications: SecurityAuditVerificationDto[] = [];

  async getSecurityOverview(): Promise<SecurityOverviewDto> {
    try {
      const data = await apiCall<SecurityOverviewDto>('/api/v1/company/security/overview');
      if (data) return data;
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return {
      telemetryStatus: 'DocSearch Zero-Trust Sentinel Active (PostgreSQL Real-Time)',
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
    try {
      const data = await apiCall<SecurityRoleDto[]>('/api/v1/company/security/roles');
      if (Array.isArray(data) && data.length > 0) {
        this.roles = data;
        return [...this.roles];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.roles];
  }

  async getRoleById(id: string): Promise<SecurityRoleDto | null> {
    try {
      return await apiCall<SecurityRoleDto>(`/api/v1/company/security/roles/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const r = this.roles.find((item) => item.id === id);
      return r ? { ...r } : null;
    }
  }

  async getPermissions(): Promise<SecurityPermissionDto[]> {
    try {
      const data = await apiCall<SecurityPermissionDto[]>('/api/v1/company/security/permissions');
      if (Array.isArray(data) && data.length > 0) {
        this.permissions = data;
        return [...this.permissions];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.permissions];
  }

  async getRolePermissions(roleId?: string): Promise<SecurityRolePermissionDto[]> {
    try {
      const url = roleId
        ? `/api/v1/company/security/roles/${roleId}/permissions`
        : '/api/v1/company/security/role-permissions';
      const data = await apiCall<SecurityRolePermissionDto[]>(url);
      if (Array.isArray(data)) {
        this.rolePermissions = data;
        return [...this.rolePermissions];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return roleId ? this.rolePermissions.filter((rp) => rp.roleId === roleId) : [...this.rolePermissions];
  }

  async assignPermission(req: AssignPermissionRequest): Promise<SecurityRolePermissionDto> {
    try {
      return await apiCall<SecurityRolePermissionDto>('/api/v1/company/security/role-permissions', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecurityUserRoleDto[]>('/api/v1/company/security/user-roles');
      if (Array.isArray(data)) {
        this.userRoles = data;
        return [...this.userRoles];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.userRoles];
  }

  async assignUserRole(req: AssignUserRoleRequest): Promise<SecurityUserRoleDto> {
    try {
      return await apiCall<SecurityUserRoleDto>('/api/v1/company/security/user-roles', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      return await apiCall<SecurityUserRoleDto>(`/api/v1/company/security/user-roles/${req.userRoleId}/revoke`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecurityPolicyDto[]>('/api/v1/company/security/policies');
      if (Array.isArray(data) && data.length > 0) {
        this.policies = data;
        return [...this.policies];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.policies];
  }

  async getSecurityPolicyById(id: string): Promise<SecurityPolicyDto | null> {
    try {
      return await apiCall<SecurityPolicyDto>(`/api/v1/company/security/policies/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const p = this.policies.find((item) => item.id === id);
      return p ? { ...p } : null;
    }
  }

  async transitionSecurityPolicy(
    id: string,
    req: TransitionSecurityPolicyRequest
  ): Promise<SecurityPolicyDto> {
    try {
      return await apiCall<SecurityPolicyDto>(`/api/v1/company/security/policies/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecuritySessionDto[]>('/api/v1/company/security/sessions');
      if (Array.isArray(data)) {
        this.sessions = data;
        return [...this.sessions];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.sessions];
  }

  async terminateSession(req: TerminateSessionRequest): Promise<SecuritySessionDto> {
    try {
      const data = await apiCall<SecuritySessionDto>(`/api/v1/company/security/sessions/${req.sessionId}/terminate`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (data) {
        this.sessions = this.sessions.map((s) => (s.sessionId === req.sessionId ? data : s));
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecurityCredentialDto[]>('/api/v1/company/security/credentials');
      if (Array.isArray(data)) {
        this.credentials = data;
        return [...this.credentials];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.credentials];
  }

  async rotateCredential(req: RotateCredentialRequest): Promise<SecurityCredentialDto> {
    try {
      const data = await apiCall<SecurityCredentialDto>(`/api/v1/company/security/credentials/${req.credentialCode}/rotate`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (data) {
        this.credentials = this.credentials.map((c) => (c.credentialCode === req.credentialCode ? data : c));
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecurityCredentialDto>(`/api/v1/company/security/credentials/${req.credentialCode}/revoke`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (data) {
        this.credentials = this.credentials.map((c) => (c.credentialCode === req.credentialCode ? data : c));
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
    try {
      const data = await apiCall<SecurityIncidentDto[]>('/api/v1/company/security/incidents');
      if (Array.isArray(data)) {
        this.incidents = data;
        return [...this.incidents];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.incidents];
  }

  async acknowledgeSecurityIncident(req: AcknowledgeSecurityIncidentRequest): Promise<SecurityIncidentDto> {
    try {
      const data = await apiCall<SecurityIncidentDto>(`/api/v1/company/security/incidents/${req.incidentId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (data) {
        this.incidents = this.incidents.map((i) => (i.id === req.incidentId ? data : i));
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const inc = this.incidents[idx];
    if (idx === -1 || !inc) throw new Error(`Incident ${req.incidentId} not found`);

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
    try {
      const data = await apiCall<SecurityIncidentDto>(`/api/v1/company/security/incidents/${req.incidentId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (data) {
        this.incidents = this.incidents.map((i) => (i.id === req.incidentId ? data : i));
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const inc = this.incidents[idx];
    if (idx === -1 || !inc) throw new Error(`Incident ${req.incidentId} not found`);

    const updated: SecurityIncidentDto = {
      ...inc,
      status: 'RESOLVED',
      resolutionNotes: req.resolutionNotes,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    return { ...updated };
  }

  async getAuditVerifications(): Promise<SecurityAuditVerificationDto[]> {
    try {
      const data = await apiCall<SecurityAuditVerificationDto[]>('/api/v1/company/security/audit-verifications');
      if (Array.isArray(data)) {
        this.verifications = data;
        return [...this.verifications];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.verifications];
  }

  async verifyAuditEvent(req: VerifyAuditEventRequest): Promise<SecurityAuditVerificationDto> {
    try {
      return await apiCall<SecurityAuditVerificationDto>('/api/v1/company/security/audit-verifications', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
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
