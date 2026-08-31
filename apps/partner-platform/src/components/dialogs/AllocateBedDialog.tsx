import React, { useState } from 'react';
import { Dialog, Button, Select, Input, Alert } from '@docsearch/ui-kit';
import type { AllocateBedRequest, InpatientAdmissionDto, InpatientWardDto, InpatientBedDto } from '@docsearch/api-contracts';

export interface AllocateBedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: AllocateBedRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  wards: InpatientWardDto[];
  beds: InpatientBedDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const AllocateBedDialog: React.FC<AllocateBedDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  wards,
  beds,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedWardId, setSelectedWardId] = useState(wards[0]?.id || '');
  const availableBeds = beds.filter((b) => b.wardId === selectedWardId && (b.status === 'AVAILABLE' || b.status === 'RESERVED'));
  const [selectedBedId, setSelectedBedId] = useState(availableBeds[0]?.id || '');
  const [allocatedBy, setAllocatedBy] = useState('Floor Nurse Supervisor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const bedIdToAssign = selectedBedId || availableBeds[0]?.id;
    if (!bedIdToAssign) {
      setError('Please select an available bed in this ward.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: admission.id,
        wardId: selectedWardId,
        bedId: bedIdToAssign,
        allocatedBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to allocate bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Allocate Bed — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Select Ward</label>
            <Select
              value={selectedWardId}
              onChange={(e) => {
                setSelectedWardId(e.target.value);
                const av = beds.filter((b) => b.wardId === e.target.value && (b.status === 'AVAILABLE' || b.status === 'RESERVED'));
                setSelectedBedId(av[0]?.id || '');
              }}
              options={wards.map((w) => ({ value: w.id, label: w.wardName }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Select Available Bed</label>
            <Select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              options={availableBeds.length > 0 ? availableBeds.map((b) => ({ value: b.id, label: b.bedCode })) : [{ value: '', label: 'No beds available' }]}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Allocated By</label>
          <Input value={allocatedBy} onChange={(e) => setAllocatedBy(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || availableBeds.length === 0}>
            {isSubmitting ? 'Allocating...' : 'Assign Bed'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};