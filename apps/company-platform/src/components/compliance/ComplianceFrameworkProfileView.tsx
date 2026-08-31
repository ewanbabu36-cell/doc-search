import React from 'react';
import type {
  ComplianceFrameworkDto,
  ComplianceControlDto
} from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface ComplianceFrameworkProfileViewProps {
  framework: ComplianceFrameworkDto;
  controls: ComplianceControlDto[];
  onBack: () => void;
  onSelectControl: (controlId: string) => void;
}

export const ComplianceFrameworkProfileView: React.FC<ComplianceFrameworkProfileViewProps> = ({
  framework,
  controls,
  onBack,
  onSelectControl
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Frameworks
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {framework.frameworkCode}
              </code>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {framework.name}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {framework.frameworkType} | Version: v{framework.version} | Lead: {framework.ownerEmail}
            </span>
          </div>
        </div>

        <Badge variant={framework.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {framework.status}
        </Badge>
      </div>

      <Alert type="info" title="Framework Scope & Governance Baseline">
        {framework.description} Controls mapped under this framework evaluate platform operations against declared regulatory and industry baselines.
      </Alert>

      {/* Controls Table */}
      <Card title={`Mapped Controls (${controls.length})`} subtitle="Specific administrative and technical safeguarding assertions" padding="none">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          {controls.length === 0 ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>No controls mapped to this framework.</span>
          ) : (
            controls.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                      {c.controlCode}
                    </code>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>{c.title}</strong>
                    <Badge variant="neutral">{c.controlCategory}</Badge>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    {c.requirementSummary}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Owner: {c.ownerEmail} | Evidence: {c.evidenceCount} attached | Last Verified: {c.lastVerifiedAt ? new Date(c.lastVerifiedAt).toLocaleDateString() : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge
                    variant={
                      c.controlStatus === 'VERIFIED'
                        ? 'success'
                        : c.controlStatus === 'READY_FOR_REVIEW'
                        ? 'primary'
                        : c.controlStatus === 'EVIDENCE_REQUIRED'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {c.controlStatus}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => onSelectControl(c.id)}>
                    Inspect
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
