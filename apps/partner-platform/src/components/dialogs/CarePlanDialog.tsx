import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { RecordCarePlanRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface CarePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordCarePlanRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CarePlanDialog: React.FC<CarePlanDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [nursingDiagnosis, setNursingDiagnosis] = useState('Impaired Gas Exchange secondary to COPD');
  const [expectedOutcome, setExpectedOutcome] = useState('Patient maintains SpO2 >= 95% on room air with unlabored breathing.');
  const [interventions, setInterventions] = useState('1. Semi-Fowler positioning\n2. Nebulization Q6H\n3. Incentive spirometry Q2H');
  const [targetEvaluationDate, setTargetEvaluationDate] = useState(new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16));
  const [createdBy, setCreatedBy] = useState('Clinical Care Specialist Mary Green, RN');
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
        nursingDiagnosis,
        expectedOutcome,
        interventions,
        targetEvaluationDate: new Date(targetEvaluationDate).toISOString(),
        createdBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record care plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Establish Nursing Care Plan — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Diagnosis (NANDA) *</label>
          <Input value={nursingDiagnosis} onChange={(e) => setNursingDiagnosis(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Measurable Patient Outcome *</label>
          <Input value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Interventions *</label>
          <Input value={interventions} onChange={(e) => setInterventions(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Review / Evaluation Date</label>
            <Input type="datetime-local" value={targetEvaluationDate} onChange={(e) => setTargetEvaluationDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Care Coordinator</label>
            <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Establishing...' : 'Save Care Plan'}</Button>
        </div>
      </form>
    </Dialog>
  );
};