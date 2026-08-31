import React from 'react';
import type { ComplianceEvidenceDto } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface ComplianceEvidenceProfileViewProps {
  evidence: ComplianceEvidenceDto;
  onBack: () => void;
}

export const ComplianceEvidenceProfileView: React.FC<ComplianceEvidenceProfileViewProps> = ({
  evidence,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Evidence
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {evidence.evidenceCode}
              </code>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {evidence.title}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {evidence.evidenceType} | Source: {evidence.sourceDomain}
            </span>
          </div>
        </div>

        <Badge variant={evidence.evidenceStatus === 'ACCEPTED' ? 'success' : evidence.evidenceStatus === 'UNDER_REVIEW' ? 'warning' : 'neutral'}>
          {evidence.evidenceStatus}
        </Badge>
      </div>

      <Alert type="info" title="Zero-PHI Evidence Reference">
        Doc Search persists cryptographic reference identifiers and attestation hashes only. Raw internal documents, patient data, and private configurations are never held directly in this registry.
      </Alert>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Evidence Summary & Rationale" subtitle="Operational context and validation narrative" padding="md">
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
            {evidence.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Source Reference: </span>
              <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{evidence.sourceReference}</code>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Collected At: </span>
              <span>{new Date(evidence.collectedAt).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card title="Validity & Sign-off Details" subtitle="Attestation dates and reviewer identity" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Submitted By:</span>
              <span>{evidence.submittedByEmail}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Reviewed By:</span>
              <span>{evidence.reviewedByEmail ?? 'Pending Review'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Reviewed At:</span>
              <span>{evidence.reviewedAt ? new Date(evidence.reviewedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Validity Period:</span>
              <span>
                {evidence.validFrom ? new Date(evidence.validFrom).toLocaleDateString() : 'Immediate'} –{' '}
                {evidence.validUntil ? new Date(evidence.validUntil).toLocaleDateString() : 'Indefinite'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Linked Controls:</span>
              <Badge variant="primary">{evidence.linkedControlCount} Mapped Controls</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
