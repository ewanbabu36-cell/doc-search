import React, { useState } from 'react';
import type {
  ConsultationDto,
  StartConsultationRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface StartConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onStart: (req: StartConsultationRequest) => Promise<void>;
}

export const StartConsultationDialog: React.FC<StartConsultationDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onStart
}) => {
  const [justification, setJustification] = useState('Attending physician initiated patient clinical consultation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onStart({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start consultation session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`🩺 Start Clinical Consultation: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Starting...' : 'Start Consultation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <Alert type="info" title="Consultation Context">
          <strong>Encounter:</strong> {consultation.encounterNumber} ({consultation.encounterType})<br />
          <strong>Doctor:</strong> {consultation.doctorName} ({consultation.doctorSpecialty})<br />
          <strong>Chief Complaint:</strong> {consultation.chiefComplaint}
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Action Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Audit rationale for starting this consultation session"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
