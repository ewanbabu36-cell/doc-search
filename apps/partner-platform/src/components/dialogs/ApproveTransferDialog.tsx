import React, { useState } from 'react';
import { Dialog, Button, Select, Input, Alert } from '@docsearch/ui-kit';
import type { ApproveTransferRequest, InpatientTransferDto, InpatientBedDto } from '@docsearch/api-contracts';

export interface ApproveTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: ApproveTransferRequest) => Promise<void>;
  transfer: InpatientTransferDto | null;
  beds: InpatientBedDto[];
  tenantId: string;
}

export const ApproveTransferDialog: React.FC<ApproveTransferDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transfer,
  beds,
  tenantId
}) => {
  const availableBeds = beds.filter((b) => b.wardId === transfer?.destinationWardId && (b.status === 'AVAILABLE' || b.status === 'RESERVED'));
  const [assignedBedId, setAssignedBedId] = useState(availableBeds[0]?.id || '');
  const [approverName, setApproverName] = useState('Ward In-charge Sister Evelyn');
  const [justification, setJustification] = useState('Destination bed prepared and receiving team ready for bedside transfer.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transfer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const bedId = assignedBedId || availableBeds[0]?.id;
    if (!bedId) {
      setError('Please assign an available destination bed.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        transferId: transfer.id,
        tenantId,
        approverName,
        assignedBedId: bedId,
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Approve Transfer — ${transfer.transferNumber}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Assign Destination Bed in {transfer.destinationWardName} *</label>
          <Select
            value={assignedBedId}
            onChange={(e) => setAssignedBedId(e.target.value)}
            options={availableBeds.length > 0 ? availableBeds.map((b) => ({ value: b.id, label: `${b.bedCode} (${b.bedClass})` })) : [{ value: '', label: 'No beds currently available in destination ward' }]}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Authorizing Nurse / Supervisor</label>
          <Input value={approverName} onChange={(e) => setApproverName(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Approval Notes *</label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || availableBeds.length === 0}>
            {isSubmitting ? 'Approving...' : 'Authorize Bed Transfer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};