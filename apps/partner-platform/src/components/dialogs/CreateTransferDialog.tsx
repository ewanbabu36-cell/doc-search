import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateTransferRequest, InpatientAdmissionDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface CreateTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateTransferRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  wards: InpatientWardDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateTransferDialog: React.FC<CreateTransferDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  wards,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const otherWards = wards.filter((w) => w.id !== admission?.wardId);
  const [destinationWardId, setDestinationWardId] = useState(otherWards[0]?.id || '');
  const [transferType, setTransferType] = useState('STEPDOWN');
  const [priority, setPriority] = useState('ROUTINE');
  const [transferReason, setTransferReason] = useState('Patient stabilized; transferring to general medical floor.');
  const [requestingDoctorName, setRequestingDoctorName] = useState(admission?.attendingConsultantName || 'Dr. Jonathan Reed, MD');
  const [transportRequirement, setTransportRequirement] = useState('WHEELCHAIR');
  const [nursingHandoffNotes, setNursingHandoffNotes] = useState('IV lines patent. Baseline vitals stable.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

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
        admissionId: admission.id,
        destinationWardId: destinationWardId || otherWards[0]?.id || '',
        transferType,
        priority,
        transferReason,
        requestingDoctorName,
        transportRequirement,
        nursingHandoffNotes
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Transfer Patient — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>Current Location:</strong> {admission.wardName} (Bed {admission.bedCode})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Destination Ward *</label>
            <Select value={destinationWardId} onChange={(e) => setDestinationWardId(e.target.value)} options={otherWards.map((w) => ({ value: w.id, label: w.wardName }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Transfer Type</label>
            <Select value={transferType} onChange={(e) => setTransferType(e.target.value)} options={[
              { value: 'STEPDOWN', label: 'Clinical Stepdown (ICU -> Floor)' },
              { value: 'CLINICAL_ESCALATION', label: 'Clinical Escalation (Floor -> ICU)' },
              { value: 'ISOLATION', label: 'Infection Control Isolation' },
              { value: 'PATIENT_REQUEST', label: 'Room Upgrade / Patient Request' }
            ]} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={[
              { value: 'ROUTINE', label: 'Routine' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'STAT_EMERGENCY', label: 'STAT' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Transport Method</label>
            <Select value={transportRequirement} onChange={(e) => setTransportRequirement(e.target.value)} options={[
              { value: 'WHEELCHAIR', label: 'Wheelchair Transport' },
              { value: 'STRETCHER', label: 'Stretcher / Gurney' },
              { value: 'CRITICAL_CARE_TRANSPORT', label: 'Critical Care Monitoring Escort' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Requesting Physician</label>
            <Input value={requestingDoctorName} onChange={(e) => setRequestingDoctorName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clinical Justification *</label>
          <Input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Handoff Notes</label>
          <Input value={nursingHandoffNotes} onChange={(e) => setNursingHandoffNotes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Requesting...' : 'Initiate Transfer'}</Button>
        </div>
      </form>
    </Dialog>
  );
};