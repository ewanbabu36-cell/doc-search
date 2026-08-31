import React, { useState } from 'react';
import type { WebhookDeliveryDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface WebhookRetryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: WebhookDeliveryDto;
  onRetry: (deliveryId: string, reason: string) => Promise<void>;
}

export const WebhookRetryDialog: React.FC<WebhookRetryDialogProps> = ({
  isOpen,
  onClose,
  delivery,
  onRetry
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A governance reason is mandatory for manual webhook redelivery.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onRetry(delivery.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Webhook retry failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Audited Webhook Redelivery"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Redeliver Webhook Event
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Webhook Event Replay">
          Manual redelivery initiates an audited dispatch cycle with HMAC signature regeneration and exponential backoff retry parameters.
        </Alert>

        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Delivery ID: </span>
              <code>{delivery.deliveryId}</code>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Event Type: </span>
              <strong>{delivery.eventType}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Previous Attempts: </span>
              <span>{delivery.attemptNumber} attempts</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
            Governance Reason (Mandatory Audit)
          </label>
          <Input
            required
            placeholder="e.g. Partner webhook endpoint recovered after transient network outage..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
};
