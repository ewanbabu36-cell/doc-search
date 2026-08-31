import React from 'react';
import type { SecurityRoleDto, SecurityRolePermissionDto, SecurityUserRoleDto } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface RoleProfileViewProps {
  role: SecurityRoleDto;
  rolePermissions: SecurityRolePermissionDto[];
  userRoles: SecurityUserRoleDto[];
  onBack: () => void;
}

export const RoleProfileView: React.FC<RoleProfileViewProps> = ({
  role,
  rolePermissions,
  userRoles,
  onBack
}) => {
  const assignedUsers = userRoles.filter((ur) => ur.roleId === role.id && ur.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Roles
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {role.roleCode}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {role.roleName}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {role.roleType} | Scope: {role.scopeType} | System Role: {role.isSystemRole ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <Badge variant={role.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {role.status}
        </Badge>
      </div>

      <Alert type="info" title="RBAC Role Definition">
        Permissions granted to this role are inherited across its declared scope boundary (<strong>{role.scopeType}</strong>). Any permission modification requires an explicit security governance reason and audit log entry.
      </Alert>

      {/* Two Column Grid: Permissions & Assigned Users */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title={`Assigned Permissions (${rolePermissions.length})`} subtitle="Specific capabilities granted to this role" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rolePermissions.length === 0 ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>No permissions attached.</span>
            ) : (
              rolePermissions.map((rp) => (
                <div
                  key={rp.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem', fontWeight: '600' }}>
                      {rp.permissionCode}
                    </code>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                      {rp.permissionName}
                    </span>
                  </div>
                  <Badge variant={rp.riskLevel === 'CRITICAL' || rp.riskLevel === 'HIGH' ? 'danger' : 'neutral'}>
                    {rp.riskLevel ?? 'LOW'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title={`Assigned Operators & Users (${assignedUsers.length})`} subtitle="Active accounts holding this role" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedUsers.length === 0 ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>No active user assignments.</span>
            ) : (
              assignedUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                      {u.userEmail}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                      Scope: {u.scopeReference} ({u.scopeType})
                    </span>
                  </div>
                  <Badge variant={u.isHighRisk ? 'danger' : 'primary'}>
                    {u.isHighRisk ? 'Privileged' : 'Standard'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
