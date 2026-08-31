import React, { useState } from 'react';
import type {
  ConsultationDto,
  CompleteConsultationRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface CompleteConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  assessment: string;
  treatmentPlan: string;
  actorId: string;
  actorRole: string;
  onComplete: (req: CompleteConsultationRequest) => Promise<void>;
}

export const CompleteConsultationDialog: React.FC<CompleteConsultationDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  assessment,
  treatmentPlan,
  actorId,
  actorRole,
  onComplete
}) => {
  const [currentAssessment, setCurrentAssessment] = useState(assessment || consultation.clinicalAssessment || '');
  const [currentPlan, setCurrentPlan] = useState(treatmentPlan || consultation.treatmentPlan || '');
  const [justification, setJustification] = useState('Finalized and electronically signed clinical consultation dossier');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssessment.trim() || !currentPlan.trim()) {
      setError('Clinical assessment and treatment plan are mandatory before completing consultation.');
      return;
    }
    if (!confirmed) {
      setError('You must confirm that this completed record will become protected and immutable.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onComplete({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        clinicalAssessment: currentAssessment.trim(),
        treatmentPlan: currentPlan.trim(),
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`🔒 Complete & Finalize Clinical Consultation: ${consultation.patientName} (${consultation.consultationNumber})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !confirmed}>
            {isSubmitting ? 'Finalizing...' : 'Complete & Sign Consultation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <Alert type="warning" title="🛡️ Legal & EMR Immutability Notice">
          Completing this consultation locks the clinical record against direct editing. Any subsequent modifications will require a formal, audited clinical amendment.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Final Clinical Assessment *
          </label>
          <Input
            value={currentAssessment}
            onChange={(e) => setCurrentAssessment(e.target.value)}
            placeholder="Comprehensive clinical synthesis and conclusions"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Final Treatment & Management Plan *
          </label>
          <Input
            value={currentPlan}
            onChange={(e) => setCurrentPlan(e.target.value)}
            placeholder="Action plan, pharmacological therapies, and monitoring"
            required
          />
        </div>

        <div style={{ background: 'var(--ds-color-bg-secondary)', padding: '12px', borderRadius: '6px', fontSize: '0.8125rem' }}>
          <strong>Summary of Encounter:</strong><br />
          • Diagnoses: {consultation.diagnoses.length > 0 ? consultation.diagnoses.map((d) => d.diagnosisName).join(', ') : 'None'}<br />
          • Prescriptions: {consultation.medications.length > 0 ? consultation.medications.map((m) => `${m.medicationName} (${m.strength})`).join(', ') : 'None'}<br />
          • Follow-up: {consultation.followUpRequired ? 'Required' : 'As needed'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="confirmCompleteCheck"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <label htmlFor="confirmCompleteCheck" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            I confirm all documented clinical findings are verified and sign this record
          </label>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>
      </form>
    </Dialog>
  );
};
