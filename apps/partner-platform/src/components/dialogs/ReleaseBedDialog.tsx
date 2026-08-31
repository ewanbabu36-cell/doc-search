import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { ReleaseBedRequest, InpatientBedDto } from '@docsearch/api-contracts';

export interface ReleaseBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: ReleaseBedRequest) => Promise<void>;
  bed: InpatientBedDto | null;
  tenantId: string;
}

export const ReleaseBedDialog: React.FC<ReleaseBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  tenantId
}) => {
  const [releasedBy, setReleasedBy] = useState('Floor Charge Nurse');
  const [reason, setReason] = useState('Bed vacated post-procedure / routed to terminal cleaning.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        bedId: bed.id,
        tenantId,
        releasedBy,
        reason
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to release bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Release Bed to Cleaning — ${bed.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Released By</label>
          <Input value={releasedBy} onChange={(e) => setReleasedBy(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Reason *</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Releasing...' : 'Release Bed'}</Button>
        </div>
      </form>
    </Dialog>
  );
};