import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { CancelAdmissionRequest, InpatientAdmissionRequestDto } from '@docsearch/api-contracts';

export interface CancelAdmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CancelAdmissionRequest) => Promise<void>;
  request: InpatientAdmissionRequestDto | null;
  tenantId: string;
}

export const CancelAdmissionDialog: React.FC<CancelAdmissionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  request,
  tenantId
}) => {
  const [reason, setReason] = useState('Patient opted out of admission / Transferred to other hospital.');
  const [cancelledBy, setCancelledBy] = useState('Admission Desk Coordinator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        requestId: request.id,
        tenantId,
        reason,
        cancelledBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Cancel Admission Request — ${request.requestNumber}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cancellation Reason *</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cancelled By</label>
          <Input value={cancelledBy} onChange={(e) => setCancelledBy(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Back</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}</Button>
        </div>
      </form>
    </Dialog>
  );
};