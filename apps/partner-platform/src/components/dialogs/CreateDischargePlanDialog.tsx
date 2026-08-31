import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { CreateDischargePlanRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface CreateDischargePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateDischargePlanRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateDischargePlanDialog: React.FC<CreateDischargePlanDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [targetDischargeDate, setTargetDischargeDate] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [coordinatorName, setCoordinatorName] = useState('Discharge Coordinator Laura Croft, RN');
  const [transportArrangement, setTransportArrangement] = useState('SELF_TRANSPORT');
  const [patientEducationSummary, setPatientEducationSummary] = useState('Dietary management and medication schedule explained.');
  const [followUpInstructions, setFollowUpInstructions] = useState('OPD review in 1 week.');
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
        patientId: admission.patientId,
        targetDischargeDate: new Date(targetDischargeDate).toISOString(),
        coordinatorName,
        transportArrangement,
        patientEducationSummary,
        followUpInstructions
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create discharge plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Initiate Discharge Plan — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Target Discharge Date *</label>
            <Input type="datetime-local" value={targetDischargeDate} onChange={(e) => setTargetDischargeDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Coordinator Name</label>
            <Input value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Transport Arrangement</label>
          <Select value={transportArrangement} onChange={(e) => setTransportArrangement(e.target.value)} options={[
            { value: 'SELF_TRANSPORT', label: 'Self / Family Transport' },
            { value: 'AMBULANCE_BASIC', label: 'Basic Life Support (BLS) Ambulance' },
            { value: 'WHEELCHAIR_VAN', label: 'Specialist Wheelchair Van' }
          ]} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Patient & Caregiver Education</label>
          <Input value={patientEducationSummary} onChange={(e) => setPatientEducationSummary(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Follow-up Instructions</label>
          <Input value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Initialize Discharge Plan'}</Button>
        </div>
      </form>
    </Dialog>
  );
};