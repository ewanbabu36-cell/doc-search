import React, { useState } from 'react';
import type { AIGovernancePolicyDto, AIGovernancePolicyStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface PolicyTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: AIGovernancePolicyDto;
  onTransition: (toStatus: AIGovernancePolicyStatus, reason: string) => Promise<void>;
}

const allPolicyStatuses: AIGovernancePolicyStatus[] = [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'SUSPENDED',
  'RETIRED'
];

export const PolicyTransitionDialog: React.FC<PolicyTransitionDialogProps> = ({
  isOpen,
  onClose,
  policy,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AIGovernancePolicyStatus>(
    policy.status === 'DRAFT' ? 'UNDER_REVIEW' : policy.status === 'UNDER_REVIEW' ? 'APPROVED' : 'SUSPENDED'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allPolicyStatuses.filter((s) => s !== policy.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A business justification and clinical governance rationale is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policy transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Modify AI Governance Policy Lifecycle State"
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
        <Alert type="info" title="Audited AI Safety Policy Transition">
          Modifying governance policy lifecycle states enforces automated inference safety boundaries across all partner workspaces and is permanently logged in the audit trail.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="primary">{policy.status}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Status:</span>
          <Badge variant="neutral">{selectedStatus}</Badge>
        </div>

        <FormField label="Target Governance State" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AIGovernancePolicyStatus)}
          />
        </FormField>

        <FormField
          label="Governance / Clinical Rationale"
          required
          helperText="State clinical safety justification, institutional review sign-off, or operational reasons."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved following review by Clinical Safety Oversight Board."
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
