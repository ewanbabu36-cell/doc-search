import React, { useState } from 'react';
import type {
  ConsultationDto,
  SaveConsultationDraftRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface SaveConsultationDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  draftData: Partial<SaveConsultationDraftRequest>;
  actorId: string;
  actorRole: string;
  onSaveDraft: (req: SaveConsultationDraftRequest) => Promise<void>;
}

export const SaveConsultationDraftDialog: React.FC<SaveConsultationDraftDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  draftData,
  actorId,
  actorRole,
  onSaveDraft
}) => {
  const [justification, setJustification] = useState('Saved interim consultation notes and diagnostic draft');
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
      await onSaveDraft({
        ...draftData,
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consultation draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`💾 Save Consultation Draft: ${consultation.patientName} (${consultation.consultationNumber})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <Alert type="info" title="Draft Persistence">
          Saving as draft preserves all examination observations, diagnoses, and prescriptions while keeping the record open for further clinician updates.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Audit explanation for draft update"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
