import React, { useState } from 'react';
import type {
  PartnerProfileDto,
  PartnerLifecycleStatus
} from '@docsearch/api-contracts';
import {
  Dialog,
  Button,
  FormField,
  Select,
  Badge,
  Alert
} from '@docsearch/ui-kit';

export interface PartnerLifecycleTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerProfileDto;
  onTransition: (toStatus: PartnerLifecycleStatus, reason: string) => Promise<void>;
}

const allStatuses: PartnerLifecycleStatus[] = [
  'LEAD',
  'PROSPECT',
  'ONBOARDING',
  'VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'OFFBOARDED'
];

export const PartnerLifecycleTransitionDialog: React.FC<PartnerLifecycleTransitionDialogProps> = ({
  isOpen,
  onClose,
  partner,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PartnerLifecycleStatus>(
    partner.lifecycleStatus === 'LEAD'
      ? 'PROSPECT'
      : partner.lifecycleStatus === 'PROSPECT'
      ? 'ONBOARDING'
      : partner.lifecycleStatus === 'ONBOARDING'
      ? 'VERIFICATION'
      : partner.lifecycleStatus === 'VERIFICATION'
      ? 'ACTIVE'
      : 'SUSPENDED'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allStatuses.filter((s) => s !== partner.lifecycleStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid business rationale/reason is mandatory for lifecycle transitions.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Partner Lifecycle State Transition"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Transition & Log Audit
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Administrative Action">
          State transitions are immutable and immediately recorded in the security audit stream with your actor credentials.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="primary">{partner.lifecycleStatus}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Status:</span>
          <Badge variant="neutral">{selectedStatus}</Badge>
        </div>

        <FormField label="Target Lifecycle Stage" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as PartnerLifecycleStatus)}
          />
        </FormField>

        <FormField
          label="Transition Justification & Governance Reason"
          required
          helperText="Explain why this healthcare partner is advancing or changing state."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Completed HIPAA security evaluation and verified signed BAA document."
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
