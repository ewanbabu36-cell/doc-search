import React, { useState } from 'react';
import type { SubscriptionDto, SubscriptionStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface SubscriptionTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionDto;
  onTransition: (toStatus: SubscriptionStatus, reason: string) => Promise<void>;
}

const allStatuses: SubscriptionStatus[] = [
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED'
];

export const SubscriptionTransitionDialog: React.FC<SubscriptionTransitionDialogProps> = ({
  isOpen,
  onClose,
  subscription,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>(
    subscription.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allStatuses.filter((s) => s !== subscription.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A business justification reason is mandatory for subscription status modifications.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Subscription Lifecycle State"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute State Transition
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Subscription Change">
          Modifying subscription status alters entitlement enforcement for the partner tenant and is recorded in the security audit pipeline.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="primary">{subscription.status}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Status:</span>
          <Badge variant="neutral">{selectedStatus}</Badge>
        </div>

        <FormField label="Target Status" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
          />
        </FormField>

        <FormField
          label="Status Change Justification"
          required
          helperText="State the commercial or administrative reason for this subscription adjustment."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Partner requested temporary maintenance pause per contract amendment."
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
