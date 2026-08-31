import React, { useState } from 'react';
import type { SupportTicketDto, TicketStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface TicketTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicketDto;
  onTransition: (toStatus: TicketStatus, reason: string, resolutionNotes?: string) => Promise<void>;
}

const allTicketStatuses: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'PENDING_PARTNER',
  'RESOLVED',
  'CLOSED'
];

export const TicketTransitionDialog: React.FC<TicketTransitionDialogProps> = ({
  isOpen,
  onClose,
  ticket,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(
    ticket.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED'
  );
  const [reason, setReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allTicketStatuses.filter((s) => s !== ticket.status);
  const isResolving = selectedStatus === 'RESOLVED' || selectedStatus === 'CLOSED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A business justification reason is mandatory for modifying ticket escalation state.');
      return;
    }
    if (isResolving && !resolutionNotes.trim()) {
      setError('Resolution notes are mandatory when marking a ticket as Resolved or Closed.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim(), resolutionNotes.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ticket transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Update Support Ticket Escalation State"
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
        <Alert type="info" title="Audited Support State Change">
          Modifying ticket resolution states updates SLA compliance metrics and is recorded in the platform audit event stream.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="primary">{ticket.status}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Status:</span>
          <Badge variant="neutral">{selectedStatus}</Badge>
        </div>

        <FormField label="Target Ticket Status" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
          />
        </FormField>

        {isResolving && (
          <FormField
            label="Root Cause & Resolution Summary"
            required
            helperText="State technical actions taken, root cause diagnosis, or partner confirmation received."
          >
            <textarea
              required
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Diagnosed socket timeout on partner edge listener; partner reconfigured firewall whitelist; verified bidirectional telemetry."
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
        )}

        <FormField
          label="Operational Transition Rationale"
          required
          helperText="Reason for updating ticket escalation tier or assigning to partner."
        >
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verified resolution with partner informatics lead."
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
