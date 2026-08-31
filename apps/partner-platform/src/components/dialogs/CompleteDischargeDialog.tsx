import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CompleteDischargeRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface CompleteDischargeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CompleteDischargeRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
}

export const CompleteDischargeDialog: React.FC<CompleteDischargeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId
}) => {
  const [dischargedBy, setDischargedBy] = useState('Floor Discharge Nurse Laura Croft');
  const [dischargeDisposition, setDischargeDisposition] = useState('HOME_ROUTINE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        admissionId: admission.id,
        tenantId,
        dischargedBy,
        dischargeDisposition
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize discharge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Finalize Discharge & Release Bed — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <Alert type="info">Finalizing discharge will close the inpatient encounter, release bed {admission.bedCode}, and route it to terminal sanitization.</Alert>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Discharge Final Officer</label>
          <Input value={dischargedBy} onChange={(e) => setDischargedBy(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Final Disposition</label>
          <Select value={dischargeDisposition} onChange={(e) => setDischargeDisposition(e.target.value)} options={[
            { value: 'HOME_ROUTINE', label: 'Discharged Home with Prescription' },
            { value: 'TRANSFERRED_FACILITY', label: 'Transferred to Specialized Facility' },
            { value: 'AMA_LEFT_AGAINST_ADVICE', label: 'Discharged AMA' }
          ]} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Finalizing...' : 'Finalize Discharge & Release Bed'}</Button>
        </div>
      </form>
    </Dialog>
  );
};