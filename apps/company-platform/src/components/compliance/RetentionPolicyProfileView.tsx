import React from 'react';
import type {
  DataRetentionPolicyDto,
  DataRetentionRuleDto
} from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface RetentionPolicyProfileViewProps {
  policy: DataRetentionPolicyDto;
  rules: DataRetentionRuleDto[];
  onBack: () => void;
}

export const RetentionPolicyProfileView: React.FC<RetentionPolicyProfileViewProps> = ({
  policy,
  rules,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Retention Policies
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {policy.policyCode}
              </code>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {policy.name}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Version: v{policy.version} | Lead: {policy.ownerEmail}
            </span>
          </div>
        </div>

        <Badge variant={policy.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {policy.status}
        </Badge>
      </div>

      <Alert type="warning" title="Retention Pipeline Enforcement Notice">
        Retention configuration does not itself execute deletion or archival. Enforcement requires a connected lifecycle pipeline and dual-authorization verification.
      </Alert>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Policy Directives" subtitle="High-level retention period and legal hold parameters" padding="md">
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
            {policy.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Default Retention:</span>
              <strong>{policy.defaultRetentionDays} Days ({(policy.defaultRetentionDays / 365).toFixed(1)} Years)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Legal Hold Supported:</span>
              <Badge variant={policy.legalHoldSupported ? 'success' : 'neutral'}>
                {policy.legalHoldSupported ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Deletion Method:</span>
              <code>{policy.deletionMethod}</code>
            </div>
          </div>
        </Card>

        <Card title="Lifecycle Rules" subtitle="Domain-specific rules mapped under this policy" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{r.dataDomain} — {r.resourceType}</strong>
                  <Badge variant="primary">{r.classificationLevel}</Badge>
                </div>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>
                  Retention: {r.retentionDays} Days | Archival: {r.archiveBehavior}
                </span>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>
                  Deletion: {r.deletionBehavior} | Legal Hold: {r.legalHoldBehavior}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
