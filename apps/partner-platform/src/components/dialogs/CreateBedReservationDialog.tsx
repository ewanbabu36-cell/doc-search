import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateBedReservationRequest, InpatientBedDto } from '@docsearch/api-contracts';

export interface CreateBedReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateBedReservationRequest) => Promise<void>;
  bed: InpatientBedDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateBedReservationDialog: React.FC<CreateBedReservationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bed,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [reservedFrom, setReservedFrom] = useState(new Date().toISOString().slice(0, 16));
  const [reservedUntil, setReservedUntil] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [priority, setPriority] = useState('ROUTINE');
  const [reservedBy, setReservedBy] = useState('ADT Coordinator Sarah Croft');
  const [notes, setNotes] = useState('Elective surgery reservation.');
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        patientId: 'pat-' + Math.random().toString(36).substring(2, 9),
        patientName,
        patientMrn,
        wardId: bed.wardId,
        bedId: bed.id,
        reservedFrom: new Date(reservedFrom).toISOString(),
        reservedUntil: new Date(reservedUntil).toISOString(),
        priority,
        reservedBy,
        notes
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reserve bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Reserve Bed — ${bed.bedCode}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Patient Full Name *</label>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>MRN Number *</label>
            <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-9021" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Reserved From</label>
            <Input type="datetime-local" value={reservedFrom} onChange={(e) => setReservedFrom(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Hold Until</label>
            <Input type="datetime-local" value={reservedUntil} onChange={(e) => setReservedUntil(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={[
              { value: 'ROUTINE', label: 'Routine Elective' },
              { value: 'URGENT', label: 'Urgent Pre-Op' },
              { value: 'STAT_EMERGENCY', label: 'Emergency Reserve' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Reserved By Officer</label>
            <Input value={reservedBy} onChange={(e) => setReservedBy(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Holding...' : 'Confirm Reservation'}</Button>
        </div>
      </form>
    </Dialog>
  );
};