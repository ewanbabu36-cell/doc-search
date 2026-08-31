import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { CompleteCleaningRequest, InpatientBedTurnaroundDto } from '@docsearch/api-contracts';

export interface CompleteCleaningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CompleteCleaningRequest) => Promise<void>;
  turnaround: InpatientBedTurnaroundDto | null;
  tenantId: string;
}

export const CompleteCleaningDialog: React.FC<CompleteCleaningDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  turnaround,
  tenantId
}) => {
  const [inspectedBy, setInspectedBy] = useState('Infection Control Officer Sarah Jenkins');
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState('Terminal disinfection passed and verified.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!turnaround) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        turnaroundId: turnaround.id,
        tenantId,
        inspectedBy,
        passed,
        notes
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete cleaning inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Environmental Inspection — Bed ${turnaround.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <Alert type="success">Terminal cleaning finished. Inspect environmental disinfection to mark bed AVAILABLE.</Alert>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Inspected By</label>
          <Input value={inspectedBy} onChange={(e) => setInspectedBy(e.target.value)} required />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={passed} onChange={(e) => setPassed(e.target.checked)} />
          Environmental disinfection inspection PASSED and certified.
        </label>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Inspection Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !passed}>
            {isSubmitting ? 'Certifying...' : 'Certify & Make Bed Available'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};