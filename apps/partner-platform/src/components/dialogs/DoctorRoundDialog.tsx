import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { RecordDoctorRoundRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface DoctorRoundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordDoctorRoundRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const DoctorRoundDialog: React.FC<DoctorRoundDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [doctorName, setDoctorName] = useState(admission?.attendingConsultantName || 'Dr. Jonathan Reed, MD');
  const [doctorSpecialty, setDoctorSpecialty] = useState(admission?.specialty || 'Cardiology');
  const [roundType, setRoundType] = useState('MORNING_PRIMARY_ROUND');
  const [subjectiveAssessment, setSubjectiveAssessment] = useState('Patient comfortable, resting well, pain controlled.');
  const [objectiveClinicalFindings, setObjectiveClinicalFindings] = useState('Chest clear, S1/S2 regular, surgical incisions clean and dry.');
  const [clinicalImpression, setClinicalImpression] = useState('Satisfactory post-intervention recovery.');
  const [treatmentPlanUpdates, setTreatmentPlanUpdates] = useState('Continue oral medications, encourage mobilization.');
  const [orderedInvestigationsSummary, setOrderedInvestigationsSummary] = useState('');
  const [medicationAdjustments, setMedicationAdjustments] = useState('');
  const [dischargeReadinessScore, setDischargeReadinessScore] = useState('75');
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
        doctorName,
        doctorSpecialty,
        roundType,
        subjectiveAssessment,
        objectiveClinicalFindings,
        clinicalImpression,
        treatmentPlanUpdates,
        orderedInvestigationsSummary: orderedInvestigationsSummary || undefined,
        medicationAdjustments: medicationAdjustments || undefined,
        dischargeReadinessScore: parseInt(dischargeReadinessScore, 10) || 50
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record doctor round');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Doctor Daily Round Note — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Attending Physician</label>
            <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Specialty</label>
            <Input value={doctorSpecialty} onChange={(e) => setDoctorSpecialty(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Round Type</label>
            <Select value={roundType} onChange={(e) => setRoundType(e.target.value)} options={[
              { value: 'MORNING_PRIMARY_ROUND', label: 'Morning Primary Clinical Round' },
              { value: 'EVENING_REVIEW', label: 'Evening Follow-up Round' },
              { value: 'CONSULTANT_SPECIALIST_ROUND', label: 'Specialist Consultation Round' }
            ]} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Subjective Assessment (Patient Complaints & Status) *</label>
          <Input value={subjectiveAssessment} onChange={(e) => setSubjectiveAssessment(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Objective Clinical Exam Findings *</label>
          <Input value={objectiveClinicalFindings} onChange={(e) => setObjectiveClinicalFindings(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clinical Impression & Assessment *</label>
          <Input value={clinicalImpression} onChange={(e) => setClinicalImpression(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Updated Treatment Plan & Orders *</label>
          <Input value={treatmentPlanUpdates} onChange={(e) => setTreatmentPlanUpdates(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>New Diagnostic Orders</label>
            <Input value={orderedInvestigationsSummary} onChange={(e) => setOrderedInvestigationsSummary(e.target.value)} placeholder="e.g. Repeat CBC" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Medication Adjustments</label>
            <Input value={medicationAdjustments} onChange={(e) => setMedicationAdjustments(e.target.value)} placeholder="e.g. Increase dosage" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Discharge Readiness (0-100)</label>
            <Input type="number" value={dischargeReadinessScore} onChange={(e) => setDischargeReadinessScore(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing...' : 'Sign & Submit Round'}</Button>
        </div>
      </form>
    </Dialog>
  );
};