import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { RequestDischargeRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface RequestDischargeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RequestDischargeRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RequestDischargeDialog: React.FC<RequestDischargeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [requestingDoctorName, setRequestingDoctorName] = useState(admission?.attendingConsultantName || 'Dr. Jonathan Reed, MD');
  const [dischargeType, setDischargeType] = useState('ROUTINE_HOME');
  const [conditionAtDischarge, setConditionAtDischarge] = useState('STABLE_IMPROVED');
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
        requestingDoctorName,
        dischargeType,
        conditionAtDischarge
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request discharge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Doctor Discharge Order — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Authorizing Doctor *</label>
          <Input value={requestingDoctorName} onChange={(e) => setRequestingDoctorName(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Discharge Disposition</label>
            <Select value={dischargeType} onChange={(e) => setDischargeType(e.target.value)} options={[
              { value: 'ROUTINE_HOME', label: 'Routine Discharge to Home' },
              { value: 'TRANSFER_TO_OTHER_HOSPITAL', label: 'Transfer to Higher Facility' },
              { value: 'DISCHARGE_AGAINST_MEDICAL_ADVICE', label: 'Discharge Against Medical Advice (DAMA)' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Condition at Discharge</label>
            <Select value={conditionAtDischarge} onChange={(e) => setConditionAtDischarge(e.target.value)} options={[
              { value: 'STABLE_IMPROVED', label: 'Stable & Improved' },
              { value: 'RECOVERED', label: 'Fully Recovered' },
              { value: 'UNCHANGED', label: 'Unchanged' }
            ]} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Sign Discharge Order'}</Button>
        </div>
      </form>
    </Dialog>
  );
};