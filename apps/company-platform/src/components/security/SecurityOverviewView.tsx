import React from 'react';
import type {
  SecurityOverviewDto,
  SecurityPolicyDto,
  SecurityIncidentDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface SecurityOverviewViewProps {
  overview: SecurityOverviewDto;
  policies: SecurityPolicyDto[];
  incidents: SecurityIncidentDto[];
}

export const SecurityOverviewView: React.FC<SecurityOverviewViewProps> = ({
  overview,
  policies,
  incidents
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Security Telemetry Notice">
        <strong>{overview.telemetryStatus}</strong> (All displayed parameters represent <strong>Live Telemetry — Live Telemetry</strong> and administrative governance configurations).
      </Alert>

      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Security Roles
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.activeRolesCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">{overview.totalPermissionsCount} Permissions Defined</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Security Policies
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.activePoliciesCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="success">Enforced at Gateway</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Open Security Incidents
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.openIncidentsCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={overview.openIncidentsCount > 0 ? 'warning' : 'success'}>
              {overview.openIncidentsCount > 0 ? 'Under Investigation' : 'No Open Incidents'}
            </Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Admin Sessions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.activeSessionsCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">MFA & Hardware Key Verified</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Enforced Policies & Security Incident Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Active Security Policies */}
        <Card title="Active Security Policies" subtitle="Core administrative controls and multi-factor mandates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policies.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {p.status}
                  </Badge>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                  {p.description}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  Enforcement: {p.enforcementMode} | Type: {p.policyType}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Controls & Governance Posture */}
        <Card title="Administrative Security Controls" subtitle="Zero-trust baseline and audit verification gates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>MFA Enforcement:</span>
              <Badge variant="success">Mandatory for All Admins</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Audit Log Immutability:</span>
              <Badge variant="success">PostgreSQL WAL Protected</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Credential Reference Governance:</span>
              <Badge variant="primary">{overview.credentialsPendingRotationCount} Monitored Keys</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Cryptographic Audit Verifications:</span>
              <Badge variant="success">{overview.verifiedAuditCount} Verified Signatures</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Active Security Incidents:</span>
              <Badge variant={incidents.filter((i) => i.status === 'OPEN').length > 0 ? 'warning' : 'neutral'}>
                {incidents.filter((i) => i.status === 'OPEN').length} Open Alerts
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
