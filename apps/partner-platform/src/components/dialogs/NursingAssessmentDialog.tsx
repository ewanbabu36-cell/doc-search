import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { RecordNursingAssessmentRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface NursingAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordNursingAssessmentRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const NursingAssessmentDialog: React.FC<NursingAssessmentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [assessedBy, setAssessedBy] = useState('Staff Nurse Kevin O\'Connor, RN');
  const [shiftType, setShiftType] = useState('MORNING_SHIFT');
  const [assessmentType, setAssessmentType] = useState('SHIFT_HANDOVER');
  const [fallRiskScore, setFallRiskScore] = useState('25');
  const [pressureInjuryRiskScore, setPressureInjuryRiskScore] = useState('18');
  const [painScore, setPainScore] = useState('1');
  const [consciousnessLevel, setConsciousnessLevel] = useState('ALERT');
  const [mobilityStatus, setMobilityStatus] = useState('INDEPENDENT');
  const [dietaryIntakeLevel, setDietaryIntakeLevel] = useState('NORMAL_ORAL');
  const [nursingSummary, setNursingSummary] = useState('Patient comfortable, vitals stable, IV site clean and patent.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const fScore = parseInt(fallRiskScore, 10) || 0;
      const pScore = parseInt(pressureInjuryRiskScore, 10) || 20;
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: admission.id,
        patientId: admission.patientId,
        assessedBy,
        shiftType,
        assessmentType,
        fallRiskScore: fScore,
        fallRiskLevel: fScore > 45 ? 'HIGH' : fScore > 24 ? 'MEDIUM' : 'LOW',
        pressureInjuryRiskScore: pScore,
        pressureInjuryRiskLevel: pScore < 15 ? 'HIGH' : 'LOW',
        painScore: parseInt(painScore, 10) || 0,
        consciousnessLevel,
        mobilityStatus,
        dietaryIntakeLevel,
        nursingSummary
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record nursing assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Inpatient Nursing Assessment — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nurse Name</label>
            <Input value={assessedBy} onChange={(e) => setAssessedBy(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Shift</label>
            <Select value={shiftType} onChange={(e) => setShiftType(e.target.value)} options={[
              { value: 'MORNING_SHIFT', label: 'Morning Shift' },
              { value: 'EVENING_SHIFT', label: 'Evening Shift' },
              { value: 'NIGHT_SHIFT', label: 'Night Shift' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Assessment Context</label>
            <Select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} options={[
              { value: 'INITIAL_ADMISSION', label: 'Initial ADT Admission Assessment' },
              { value: 'SHIFT_HANDOVER', label: 'Periodic Shift Handover' },
              { value: 'POST_PROCEDURE', label: 'Post-Procedure Assessment' },
              { value: 'CLINICAL_DETERIORATION', label: 'Acute Clinical Deterioration' }
            ]} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Morse Fall Score</label>
            <Input type="number" value={fallRiskScore} onChange={(e) => setFallRiskScore(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Braden Pressure Score</label>
            <Input type="number" value={pressureInjuryRiskScore} onChange={(e) => setPressureInjuryRiskScore(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Pain Score (0-10)</label>
            <Input type="number" value={painScore} onChange={(e) => setPainScore(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Consciousness (AVPU)</label>
            <Select value={consciousnessLevel} onChange={(e) => setConsciousnessLevel(e.target.value)} options={[
              { value: 'ALERT', label: 'Alert & Oriented' },
              { value: 'VOICE_RESPONSIVE', label: 'Responds to Voice' },
              { value: 'PAIN_RESPONSIVE', label: 'Responds to Pain' },
              { value: 'UNRESPONSIVE', label: 'Unresponsive' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Mobility Status</label>
            <Select value={mobilityStatus} onChange={(e) => setMobilityStatus(e.target.value)} options={[
              { value: 'INDEPENDENT', label: 'Independent Ambulation' },
              { value: 'ASSISTED_1_PERSON', label: 'Assisted by 1 Person' },
              { value: 'BED_BOUND', label: 'Strict Bed Bound' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Dietary Intake</label>
            <Select value={dietaryIntakeLevel} onChange={(e) => setDietaryIntakeLevel(e.target.value)} options={[
              { value: 'NORMAL_ORAL', label: 'Normal Oral' },
              { value: 'FLUIDS_ONLY', label: 'Fluids Only' },
              { value: 'NIL_BY_MOUTH', label: 'NPO / Nil by mouth' },
              { value: 'ENTERAL_FEEDING', label: 'Enteral Tube' }
            ]} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nursing Clinical Observations *</label>
          <Input value={nursingSummary} onChange={(e) => setNursingSummary(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Chart Assessment'}</Button>
        </div>
      </form>
    </Dialog>
  );
};