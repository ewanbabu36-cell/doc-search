import React, { useState } from 'react';
import type { SecurityPolicyDto, SecurityPolicyStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface SecurityPolicyTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: SecurityPolicyDto;
  onTransition: (toStatus: SecurityPolicyStatus, reason: string) => Promise<void>;
}

const allPolicyStatuses: SecurityPolicyStatus[] = [
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED'
];

export const SecurityPolicyTransitionDialog: React.FC<SecurityPolicyTransitionDialogProps> = ({
  isOpen,
  onClose,
  policy,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SecurityPolicyStatus>(
    policy.status === 'DRAFT' ? 'UNDER_REVIEW' : policy.status === 'UNDER_REVIEW' ? 'ACTIVE' : 'SUSPENDED'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allPolicyStatuses.filter((s) => s !== policy.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A formal security governance justification is mandatory for policy lifecycle changes.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Security policy transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Privileged Security Policy Transition"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Policy Transition
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Privileged Security Action">
          Modifying security policy enforcement states impacts authentication boundaries and access control gates across all tenants and is recorded in the immutable audit log.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Policy:</span>
          <strong>{policy.policyCode}</strong>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>| Current Status:</span>
          <Badge variant="primary">{policy.status}</Badge>
        </div>

        <FormField label="Target Security State" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as SecurityPolicyStatus)}
          />
        </FormField>

        <FormField
          label="Governance & Security Rationale"
          required
          helperText="Explain risk evaluation, approval sign-off, or architectural motivation."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved following annual SOC 2 Trust Services Criteria review."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};

export const PolicyTransitionDialog = SecurityPolicyTransitionDialog;
