import React, { useState } from 'react';
import type { SecurityPolicyDto, SecurityPolicyStatus } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';
import { PolicyTransitionDialog } from './PolicyTransitionDialog.js';

export interface SecurityPolicyProfileViewProps {
  policy: SecurityPolicyDto;
  onBack: () => void;
  onTransition: (toStatus: SecurityPolicyStatus, reason: string) => Promise<void>;
}

export const SecurityPolicyProfileView: React.FC<SecurityPolicyProfileViewProps> = ({
  policy,
  onBack,
  onTransition
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Policies
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {policy.policyCode}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {policy.name}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {policy.policyType} | Version: v{policy.version} | Owner: {policy.ownerEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={policy.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {policy.status}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(true)}>
            Transition State
          </Button>
        </div>
      </div>

      <Alert type="warning" title="Enforcement Mode">
        This security policy is currently operating in <strong>{policy.enforcementMode}</strong> mode. Violations will trigger automated gateway blocking and emit audit incident events.
      </Alert>

      {/* Two Column Grid: Policy Rules & Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Enforced Security Rules" subtitle="Automated conditions evaluated at gateway and service boundaries" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {policy.rules.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--ds-color-primary)', fontWeight: '700' }}>•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Policy Governance & Approvals" subtitle="Sign-off authority and effective dates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Severity Level:</span>
              <Badge variant={policy.severity === 'CRITICAL' ? 'danger' : 'neutral'}>
                {policy.severity}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Approved By:</span>
              <span>{policy.approvedByEmail ?? 'Pending Review'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Approved At:</span>
              <span>{policy.approvedAt ? new Date(policy.approvedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Effective Date:</span>
              <span>{policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'Immediate'}</span>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '4px' }}>
                POLICY DESCRIPTION:
              </span>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
                {policy.description}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {isDialogOpen && (
        <PolicyTransitionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          policy={policy}
          onTransition={onTransition}
        />
      )}
    </div>
  );
};
