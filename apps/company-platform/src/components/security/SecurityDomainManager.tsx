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
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'roles'
  | 'matrix'
  | 'users'
  | 'policies'
  | 'audit'
  | 'verifications'
  | 'sessions'
  | 'credentials'
  | 'incidents';

export const SecurityDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
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
              Security, RBAC, Policy & Audit
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Administrative security governance, multi-tenant RBAC policies, immutable audit streams, session telemetry, and credential lifecycle
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '🛡️ Overview'
          },
          {
            id: 'roles',
            label: '👥 RBAC Roles',
            badge: <Badge variant="neutral">{roles.length}</Badge>
          },
          {
            id: 'matrix',
            label: '📑 Permission Matrix',
            badge: <Badge variant="neutral">{permissions.length}</Badge>
          },
          {
            id: 'users',
            label: '👤 User Access',
            badge: <Badge variant="neutral">{userRoles.length}</Badge>
          },
          {
            id: 'policies',
            label: '⚖️ Policies',
            badge: <Badge variant="neutral">{policies.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 Audit Explorer'
          },
          {
            id: 'verifications',
            label: '🔒 Verification Evidence',
            badge: <Badge variant="neutral">{verifications.length}</Badge>
          },
          {
            id: 'sessions',
            label: '⏱️ Sessions',
            badge: <Badge variant="neutral">{sessions.length}</Badge>
          },
          {
            id: 'credentials',
            label: '🔑 Credentials',
            badge: <Badge variant="neutral">{credentials.length}</Badge>
          },
          {
            id: 'incidents',
            label: '🚨 Incidents',
            badge: <Badge variant="danger">{incidents.filter((i) => i.status === 'OPEN').length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
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
        />
      )}

      {activeTab === 'matrix' && (
        <PermissionMatrixView
          permissions={permissions}
          roles={roles}
          rolePermissions={rolePermissions}
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

      {activeTab === 'verifications' && (
        <AuditVerificationView verifications={verifications} />
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
    </div>
  );
};
