import React, { useState, useEffect } from 'react';
import type {
  SecurityOverviewDto,
  SecurityRoleDto,
  SecurityPermissionDto,
  SecurityRolePermissionDto,
  SecurityUserRoleDto,
  SecurityPolicyDto,
  SecurityPolicyStatus,
  SecuritySessionDto,
  SecurityCredentialDto,
  SecurityIncidentDto,
  SecurityAuditVerificationDto
} from '@docsearch/api-contracts';
import { securityService } from '../../services/security-service.js';
import { SecurityOverviewView } from './SecurityOverviewView.js';
import { RoleListView } from './RoleListView.js';
import { RoleProfileView } from './RoleProfileView.js';
import { PermissionMatrixView } from './PermissionMatrixView.js';
import { UserAccessView } from './UserAccessView.js';
import { SecurityPolicyListView } from './SecurityPolicyListView.js';
import { SecurityPolicyProfileView } from './SecurityPolicyProfileView.js';
import { AuditEventExplorerView } from './AuditEventExplorerView.js';
import { AuditVerificationView } from './AuditVerificationView.js';
import { SessionInspectionView } from './SessionInspectionView.js';
import { CredentialLifecycleView } from './CredentialLifecycleView.js';
import { SecurityIncidentCenterView } from './SecurityIncidentCenterView.js';

// 5 New Enterprise Add-ons
import { ZeroTrustMfaPolicyController } from './ZeroTrustMfaPolicyController.js';
import { IpWhitelistingFirewallView } from './IpWhitelistingFirewallView.js';
import { MerkleAuditProofVerifierView } from './MerkleAuditProofVerifierView.js';
import { EmergencyBreakGlassProtocolView } from './EmergencyBreakGlassProtocolView.js';
import { CustomRolePermissionBuilderModal, ROLE_PRESET_TEMPLATES } from './CustomRolePermissionBuilderModal.js';

import { Tabs, Badge, Spinner, ErrorState, Button } from '@docsearch/ui-kit';

export type ActiveSecurityTab =
  | 'overview'
  | 'roles'
  | 'mfa'
  | 'firewall'
  | 'matrix'
  | 'merkle'
  | 'verifications'
  | 'breakglass'
  | 'users'
  | 'policies'
  | 'audit'
  | 'sessions'
  | 'credentials'
  | 'incidents';

export const SecurityDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveSecurityTab>('overview');
  const [overview, setOverview] = useState<SecurityOverviewDto | null>(null);
  const [roles, setRoles] = useState<SecurityRoleDto[]>([]);
  const [permissions, setPermissions] = useState<SecurityPermissionDto[]>([]);
  const [rolePermissions, setRolePermissions] = useState<SecurityRolePermissionDto[]>([]);
  const [userRoles, setUserRoles] = useState<SecurityUserRoleDto[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicyDto[]>([]);
  const [sessions, setSessions] = useState<SecuritySessionDto[]>([]);
  const [credentials, setCredentials] = useState<SecurityCredentialDto[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncidentDto[]>([]);
  const [verifications, setVerifications] = useState<SecurityAuditVerificationDto[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        rolesRes,
        permissionsRes,
        rolePermsRes,
        userRolesRes,
        policiesRes,
        sessionsRes,
        credentialsRes,
        incidentsRes,
        verifRes
      ] = await Promise.all([
        securityService.getSecurityOverview(),
        securityService.getRoles(),
        securityService.getPermissions(),
        securityService.getRolePermissions(),
        securityService.getUserRoles(),
        securityService.getSecurityPolicies(),
        securityService.getSessions(),
        securityService.getCredentials(),
        securityService.getSecurityIncidents(),
        securityService.getAuditVerifications()
      ]);
      setOverview(overviewRes);
      setRoles(rolesRes);
      setPermissions(permissionsRes);
      setRolePermissions(rolePermsRes);
      setUserRoles(userRolesRes);
      setPolicies(policiesRes);
      setSessions(sessionsRes);
      setCredentials(credentialsRes);
      setIncidents(incidentsRes);
      setVerifications(verifRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security governance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateCustomRole = (newRole: SecurityRoleDto) => {
    setRoles([newRole, ...roles]);
    setSuccessBanner(`Custom Role "${newRole.roleName}" created & granted ${newRole.permissionCount} permissions!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleProvisionAllTemplates = (templateRoles?: SecurityRoleDto[]) => {
    const toAdd = templateRoles || ROLE_PRESET_TEMPLATES.map((tpl) => ({
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      roleCode: tpl.code,
      roleName: tpl.name,
      description: tpl.description,
      roleType: 'CUSTOM' as const,
      scopeType: tpl.scopeType,
      status: 'ACTIVE' as const,
      isSystemRole: false,
      userCount: 0,
      permissionCount: Object.values(tpl.perms).filter(Boolean).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setRoles([...toAdd, ...roles]);
    setSuccessBanner(`⚡ 1-Click Provision: Successfully loaded all ${toAdd.length} standard healthcare role templates!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleTransitionPolicy = async (toStatus: SecurityPolicyStatus, reason: string) => {
    if (!selectedPolicyId) return;
    const updated = await securityService.transitionSecurityPolicy(selectedPolicyId, {
      toStatus,
      actorEmail: 'executive.lead@docsearch.internal',
      reason
    });
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleTerminateSession = async (sessionId: string, reason: string) => {
    const updated = await securityService.terminateSession({
      sessionId,
      actorEmail: 'executive.lead@docsearch.internal',
      reason
    });
    setSessions((prev) => prev.map((s) => (s.sessionId === updated.sessionId ? updated : s)));
  };

  const handleRotateCredential = async (credentialCode: string, reason: string) => {
    const updated = await securityService.rotateCredential({
      credentialCode,
      actorEmail: 'executive.lead@docsearch.internal',
      reason
    });
    setCredentials((prev) => prev.map((c) => (c.credentialCode === updated.credentialCode ? updated : c)));
  };

  const handleRevokeCredential = async (credentialCode: string, reason: string) => {
    const updated = await securityService.revokeCredential({
      credentialCode,
      actorEmail: 'executive.lead@docsearch.internal',
      reason
    });
    setCredentials((prev) => prev.map((c) => (c.credentialCode === updated.credentialCode ? updated : c)));
  };

  const handleAcknowledgeIncident = async (incidentId: string, reason: string) => {
    const updated = await securityService.acknowledgeSecurityIncident({
      incidentId,
      actorEmail: 'security.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string) => {
    const updated = await securityService.resolveSecurityIncident({
      incidentId,
      resolutionStatus: 'RESOLVED',
      resolutionNotes,
      actorEmail: 'security.lead@docsearch.internal'
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Security / RBAC / Policy / Audit workspace...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Security Governance Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: Role Profile
  if (selectedRoleId) {
    const role = roles.find((r) => r.id === selectedRoleId);
    if (role) {
      return (
        <RoleProfileView
          role={role}
          rolePermissions={rolePermissions.filter((rp) => rp.roleId === role.id)}
          userRoles={userRoles}
          onBack={() => setSelectedRoleId(null)}
        />
      );
    }
  }

  // Drilldown: Policy Profile
  if (selectedPolicyId) {
    const policy = policies.find((p) => p.id === selectedPolicyId);
    if (policy) {
      return (
        <SecurityPolicyProfileView
          policy={policy}
          onBack={() => setSelectedPolicyId(null)}
          onTransition={handleTransitionPolicy}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Security, RBAC, Policy & Audit HQ
            </h1>
            <Badge variant="success">SOC-2 Type II Certified</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Enterprise Zero-Trust security governance, Multi-tenant RBAC permissions, Cryptographic Merkle audit trails, WAF firewall, and Break-Glass protocols
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" size="sm" onClick={() => setIsCreateRoleModalOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
            + Create Custom Role & Permissions
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: '🛡️ Overview' },
          { id: 'roles', label: `👥 RBAC Roles (${roles.length})` },
          { id: 'mfa', label: '🔐 Zero-Trust MFA' },
          { id: 'firewall', label: '🌐 IP & Geo-Firewall' },
          { id: 'breakglass', label: '🚨 Emergency Break-Glass' },
          { id: 'merkle', label: '📜 Merkle Proofs' },
          { id: 'verifications', label: `🔒 Evidence (${verifications.length})` },
          { id: 'matrix', label: `📑 Matrix (${permissions.length})` },
          { id: 'users', label: `👤 Users (${userRoles.length})` },
          { id: 'policies', label: `⚖️ Policies (${policies.length})` },
          { id: 'audit', label: '🔍 Audit Explorer' },
          { id: 'sessions', label: `⏱️ Sessions (${sessions.length})` },
          { id: 'credentials', label: `🔑 Credentials (${credentials.length})` },
          { id: 'incidents', label: `🚨 Incidents (${incidents.filter((i) => i.status === 'OPEN').length})` }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveSecurityTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && overview && (
        <SecurityOverviewView
          overview={overview}
          policies={policies}
          incidents={incidents}
        />
      )}

      {activeTab === 'roles' && (
        <RoleListView
          roles={roles}
          onSelectRole={(id) => setSelectedRoleId(id)}
          onOpenCreateRole={() => setIsCreateRoleModalOpen(true)}
          onProvisionAllTemplates={handleProvisionAllTemplates}
        />
      )}

      {activeTab === 'mfa' && (
        <ZeroTrustMfaPolicyController />
      )}

      {activeTab === 'firewall' && (
        <IpWhitelistingFirewallView />
      )}

      {activeTab === 'breakglass' && (
        <EmergencyBreakGlassProtocolView />
      )}

      {activeTab === 'merkle' && (
        <MerkleAuditProofVerifierView />
      )}

      {activeTab === 'verifications' && (
        <AuditVerificationView verifications={verifications} />
      )}

      {activeTab === 'matrix' && (
        <PermissionMatrixView
          permissions={permissions}
          roles={roles}
          rolePermissions={rolePermissions}
          onOpenCreateRole={() => setIsCreateRoleModalOpen(true)}
        />
      )}

      {activeTab === 'users' && (
        <UserAccessView userRoles={userRoles} />
      )}

      {activeTab === 'policies' && (
        <SecurityPolicyListView
          policies={policies}
          onSelectPolicy={(id) => setSelectedPolicyId(id)}
        />
      )}

      {activeTab === 'audit' && (
        <AuditEventExplorerView />
      )}

      {activeTab === 'sessions' && (
        <SessionInspectionView
          sessions={sessions}
          onTerminateSession={handleTerminateSession}
        />
      )}

      {activeTab === 'credentials' && (
        <CredentialLifecycleView
          credentials={credentials}
          onRotateCredential={handleRotateCredential}
          onRevokeCredential={handleRevokeCredential}
        />
      )}

      {activeTab === 'incidents' && (
        <SecurityIncidentCenterView
          incidents={incidents}
          onAcknowledge={handleAcknowledgeIncident}
          onResolve={handleResolveIncident}
        />
      )}

      {/* Custom Role Builder Modal */}
      {isCreateRoleModalOpen && (
        <CustomRolePermissionBuilderModal
          isOpen={isCreateRoleModalOpen}
          onClose={() => setIsCreateRoleModalOpen(false)}
          onCreateRole={handleCreateCustomRole}
          onProvisionAllTemplates={handleProvisionAllTemplates}
        />
      )}
    </div>
  );
};
