import React, { useState } from 'react';
import type { GovernanceEventDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface GovernanceEventActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: GovernanceEventDto;
  onCompleteEvent: (eventId: string, minutesReference: string, resolutionReference: string | undefined, reason: string) => Promise<void>;
}

export const GovernanceEventActionDialog: React.FC<GovernanceEventActionDialogProps> = ({
  isOpen,
  onClose,
  event,
  onCompleteEvent
}) => {
  const [minutesRef, setMinutesRef] = useState(`minutes://corp/${event.eventCode}-signed.pdf`);
  const [resolutionRef, setResolutionRef] = useState(`res-${event.eventCode}-adopted`);
  const [reason, setReason] = useState('Meeting concluded and formal minutes ratified by Corporate Secretary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minutesRef || minutesRef.trim().length < 3) {
      setError('A formal meeting minutes reference or filing receipt is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCompleteEvent(event.id, minutesRef, resolutionRef || undefined, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete governance event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Complete Governance Event: ${event.title}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Sign Off & Archive Event
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Corporate Sign-Off">
          Completing this governance meeting or regulatory filing records formal meeting minutes into the corporate governance archive.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Event Code & Type
          </label>
          <Input value={`${event.eventCode} — ${event.eventType}`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Signed Minutes / Filing Receipt Pointer *
          </label>
          <Input
            value={minutesRef}
            onChange={(e) => setMinutesRef(e.target.value)}
            placeholder="e.g. minutes://corp/board-2026-q3-signed.pdf"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Adopted Resolution Pointer (Optional)
          </label>
          <Input
            value={resolutionRef}
            onChange={(e) => setResolutionRef(e.target.value)}
            placeholder="e.g. res-2026-q3-adopted"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Corporate Secretary certification of meeting minutes and quorum"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
