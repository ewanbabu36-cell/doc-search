import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { RejectAdmissionRequest, InpatientAdmissionRequestDto } from '@docsearch/api-contracts';

export interface RejectAdmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RejectAdmissionRequest) => Promise<void>;
  request: InpatientAdmissionRequestDto | null;
  tenantId: string;
}

export const RejectAdmissionDialog: React.FC<RejectAdmissionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  request,
  tenantId
}) => {
  const [reason, setReason] = useState('No clinical indication for inpatient admission / Treated as Outpatient OPD.');
  const [rejectorName, setRejectorName] = useState('Medical Director Dr. Gregory House');
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
        rejectorName,
        reason
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Reject Admission Request — ${request.requestNumber}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Reason for Denial / Rejection *</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Reviewing Doctor / Officer</label>
          <Input value={rejectorName} onChange={(e) => setRejectorName(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Rejecting...' : 'Reject Request'}</Button>
        </div>
      </form>
    </Dialog>
  );
};