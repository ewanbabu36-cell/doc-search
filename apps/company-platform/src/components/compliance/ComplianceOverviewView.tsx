import React from 'react';
import type {
  ComplianceOverviewDto,
  ComplianceFrameworkDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface ComplianceOverviewViewProps {
  overview: ComplianceOverviewDto;
  frameworks: ComplianceFrameworkDto[];
}

export const ComplianceOverviewView: React.FC<ComplianceOverviewViewProps> = ({
  overview,
  frameworks
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Telemetry Notice */}
      <Alert type="info" title="Compliance Verification Status">
        <strong>{overview.telemetryStatus}</strong> (All displayed posture parameters represent <strong>Live Telemetry — Live Telemetry</strong> and administrative governance configurations).
      </Alert>

      {/* Mandatory Disclaimer Alert */}
      <Alert type="warning" title="Regulatory Governance Notice">
        Configuration and evidence tracking within Doc Search does not constitute legal, regulatory, or third-party certification approval (e.g. formal SOC 2 audit issuance or HIPAA safe harbor certification). Continuous evaluation requires certified auditor attestation.
      </Alert>

      {/* 4 Posture Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Frameworks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.activeFrameworksCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">{overview.totalControlsCount} Configured Controls</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Controls Requiring Review
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.controlsRequiringReviewCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={overview.controlsRequiringReviewCount > 0 ? 'warning' : 'success'}>
              {overview.controlsRequiringReviewCount > 0 ? 'Action Required' : 'All Verified'}
            </Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Partner BAAs
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.activeBAACount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={overview.expiringBAACount > 0 ? 'warning' : 'success'}>
              {overview.expiringBAACount} Expiring within 90 Days
            </Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Open Governance Exceptions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {overview.openExceptionsCount}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={overview.openExceptionsCount > 0 ? 'warning' : 'neutral'}>
              Compensating Controls Monitored
            </Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Frameworks & Controls Posture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Active Frameworks */}
        <Card title="Active Compliance Frameworks" subtitle="Structured governance baselines tracked across platform" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {frameworks.map((fw) => (
              <div
                key={fw.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                      {fw.frameworkCode}
                    </code>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{fw.name}</strong>
                  </div>
                  <Badge variant="primary">{fw.frameworkType}</Badge>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                  {fw.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  <span>Version: v{fw.version} | Lead: {fw.ownerEmail}</span>
                  <span>{fw.verifiedControlCount} of {fw.controlCount} Controls Verified</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Governance Controls & Lifecycle Summary */}
        <Card title="Data Governance & Retention Posture" subtitle="Operational safeguards, retention rules, and evidence verification gates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Data Classifications:</span>
              <Badge variant="primary">5 Tiers (PUBLIC $\rightarrow$ PHI_RESTRICTED)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Active Retention Policies:</span>
              <Badge variant="success">{overview.activeRetentionPoliciesCount} Enforced (7-Yr Medical / 6-Yr Audit)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Pending Verifications:</span>
              <Badge variant={overview.pendingVerificationsCount > 0 ? 'warning' : 'neutral'}>
                {overview.pendingVerificationsCount} Reviews Scheduled
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Evidence Requiring Review:</span>
              <Badge variant={overview.evidenceRequiringReviewCount > 0 ? 'warning' : 'success'}>
                {overview.evidenceRequiringReviewCount} Evidence Artifacts
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Audit Log Immutability:</span>
              <Badge variant="success">core.audit_events Protected</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
