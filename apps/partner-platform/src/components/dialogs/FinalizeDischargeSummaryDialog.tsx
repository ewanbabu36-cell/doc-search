import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { FinalizeDischargeSummaryRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface FinalizeDischargeSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: FinalizeDischargeSummaryRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const FinalizeDischargeSummaryDialog: React.FC<FinalizeDischargeSummaryDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [attendingConsultantName, setAttendingConsultantName] = useState(admission?.attendingConsultantName || 'Dr. Sarah Connor, MD');
  const [finalPrimaryDiagnosis, setFinalPrimaryDiagnosis] = useState(admission?.primaryDiagnosis || 'Acute Calculous Cholecystitis');
  const [hospitalCourseSummary, setHospitalCourseSummary] = useState('Patient underwent laparoscopic cholecystectomy. Uneventful post-op recovery. Ambulating and tolerating oral diet.');
  const [treatmentGiven, setTreatmentGiven] = useState('IV Antibiotics, IV Analgesia, switched to oral discharge medications.');
  const [dischargeMedicationAdvice, setDischargeMedicationAdvice] = useState('Tab Paracetamol 1000mg TID PRN; Tab Pantoprazole 40mg daily.');
  const [dietAndActivityAdvice, setDietAndActivityAdvice] = useState('Low-fat diet, avoid lifting > 5kg for 2 weeks.');
  const [warningSignsToSeekImmediateCare, setWarningSignsToSeekImmediateCare] = useState('Fever > 38.5C, severe abdominal pain, persistent vomiting, jaundice.');
  const [finalizedBy, setFinalizedBy] = useState(admission?.attendingConsultantName || 'Dr. Sarah Connor, MD');
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
        attendingConsultantName,
        finalPrimaryDiagnosis,
        hospitalCourseSummary,
        treatmentGiven,
        dischargeMedicationAdvice,
        dietAndActivityAdvice,
        warningSignsToSeekImmediateCare,
        finalizedBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize summary');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Seal Discharge Summary — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Attending Consultant Name *</label>
          <Input value={attendingConsultantName} onChange={(e) => setAttendingConsultantName(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Final Primary Diagnosis *</label>
          <Input value={finalPrimaryDiagnosis} onChange={(e) => setFinalPrimaryDiagnosis(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Hospital Course & Clinical Summary *</label>
          <Input value={hospitalCourseSummary} onChange={(e) => setHospitalCourseSummary(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Treatment & Procedures Administered *</label>
          <Input value={treatmentGiven} onChange={(e) => setTreatmentGiven(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Discharge Medication Schedule *</label>
          <Input value={dischargeMedicationAdvice} onChange={(e) => setDischargeMedicationAdvice(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Dietary & Activity Advice *</label>
          <Input value={dietAndActivityAdvice} onChange={(e) => setDietAndActivityAdvice(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Red Flag Warning Signs *</label>
          <Input value={warningSignsToSeekImmediateCare} onChange={(e) => setWarningSignsToSeekImmediateCare(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Signing Consultant</label>
          <Input value={finalizedBy} onChange={(e) => setFinalizedBy(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sealing...' : 'Seal & Finalize Summary'}</Button>
        </div>
      </form>
    </Dialog>
  );
};