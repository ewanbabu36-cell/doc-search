import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { CompleteTransferRequest, InpatientTransferDto } from '@docsearch/api-contracts';

export interface CompleteTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CompleteTransferRequest) => Promise<void>;
  transfer: InpatientTransferDto | null;
  tenantId: string;
}

export const CompleteTransferDialog: React.FC<CompleteTransferDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transfer,
  tenantId
}) => {
  const [completedBy, setCompletedBy] = useState('Receiving Staff Nurse Patricia Bailey');
  const [handoffConfirmed, setHandoffConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transfer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!transfer.destinationBedId) {
      setError('Destination bed is not yet assigned.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        transferId: transfer.id,
        tenantId,
        destinationBedId: transfer.destinationBedId,
        completedBy,
        handoffConfirmed
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Complete Bedside Handoff — ${transfer.transferNumber}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
          Transferring from <strong>{transfer.sourceWardName} ({transfer.sourceBedCode})</strong> to <strong>{transfer.destinationWardName} ({transfer.destinationBedCode})</strong>.
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Receiving Nurse Full Name *</label>
          <Input value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} required />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={handoffConfirmed} onChange={(e) => setHandoffConfirmed(e.target.checked)} />
          Bedside clinical handoff SBAR, medications, and chart verified.
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !handoffConfirmed}>
            {isSubmitting ? 'Finalizing...' : 'Complete Transfer & Occupy Bed'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};