import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { BlockBedRequest, InpatientBedDto } from '@docsearch/api-contracts';

export interface BlockBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: BlockBedRequest) => Promise<void>;
  bed: InpatientBedDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const BlockBedDialog: React.FC<BlockBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [blockReason, setBlockReason] = useState('BIOMEDICAL_MAINTENANCE');
  const [authorizedBy, setAuthorizedBy] = useState('Facility Supervisor Frank Castle');
  const [justificationNotes, setJustificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        bedId: bed.id,
        blockReason,
        authorizedBy,
        justificationNotes
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Block Bed — ${bed.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <Alert type="warning">Blocking this bed will take it out of active allocation and update occupancy metrics.</Alert>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Block Reason *</label>
          <Select value={blockReason} onChange={(e) => setBlockReason(e.target.value)} options={[
            { value: 'BIOMEDICAL_MAINTENANCE', label: 'Biomedical Sensor / Equipment Maintenance' },
            { value: 'INFECTION_CONTROL_QUARANTINE', label: 'Infection Control / Fumigation' },
            { value: 'FACILITY_RENOVATION', label: 'Room / Infrastructure Renovation' },
            { value: 'NURSE_STAFFING_SHORTAGE', label: 'Staffing Capacity Constraint' }
          ]} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Authorized By *</label>
          <Input value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Audit Justification & Ticket Reference *</label>
          <Input value={justificationNotes} onChange={(e) => setJustificationNotes(e.target.value)} placeholder="e.g. Work order #WO-991 for motor repair" required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Blocking...' : 'Confirm Bed Block'}</Button>
        </div>
      </form>
    </Dialog>
  );
};