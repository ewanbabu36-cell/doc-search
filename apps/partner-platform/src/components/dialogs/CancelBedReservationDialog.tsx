import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { CancelBedReservationRequest, InpatientBedDto } from '@docsearch/api-contracts';

export interface CancelBedReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CancelBedReservationRequest) => Promise<void>;
  bed: InpatientBedDto | null;
  tenantId: string;
}

export const CancelBedReservationDialog: React.FC<CancelBedReservationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  tenantId
}) => {
  const [reason, setReason] = useState('Patient admission rescheduled / cancelled.');
  const [cancelledBy, setCancelledBy] = useState('ADT Desk Officer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        reservationId: 'res-active',
        tenantId,
        reason,
        cancelledBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Release Bed Reservation — ${bed.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cancellation Reason *</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Authorized Officer</label>
          <Input value={cancelledBy} onChange={(e) => setCancelledBy(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Back</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Releasing...' : 'Release Bed Reservation'}</Button>
        </div>
      </form>
    </Dialog>
  );
};