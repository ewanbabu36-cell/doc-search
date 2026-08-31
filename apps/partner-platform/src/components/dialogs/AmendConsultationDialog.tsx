import React, { useState } from 'react';
import type {
  ConsultationDto,
  AmendConsultationRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface AmendConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onAmend: (req: AmendConsultationRequest) => Promise<void>;
}

export const AmendConsultationDialog: React.FC<AmendConsultationDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onAmend
}) => {
  const [reason, setReason] = useState('');
  const [amendedAssessment, setAmendedAssessment] = useState(consultation.clinicalAssessment ?? '');
  const [amendedPlan, setAmendedPlan] = useState(consultation.treatmentPlan ?? '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [justification, setJustification] = useState('Authorized clinical supervisor amendment to finalized EMR record');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Clinical reason for amendment is mandatory.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAmend({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        amendmentReason: reason.trim(),
        amendedAssessment: amendedAssessment || undefined,
        amendedPlan: amendedPlan || undefined,
        additionalNotes: additionalNotes || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to amend consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`📝 Formal Clinical Amendment (v${consultation.version + 1}): ${consultation.patientName} (${consultation.consultationNumber})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Amending...' : `Sign Version ${consultation.version + 1}`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <Alert type="info" title="Version Control & Traceability">
          All changes will increment the document version and permanently link previous snapshots in the immutable audit vault.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Clinical Reason for Amendment *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Updated dosage based on newly received lab results"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Amended Assessment
          </label>
          <Input
            value={amendedAssessment}
            onChange={(e) => setAmendedAssessment(e.target.value)}
            placeholder="Updated clinical synthesis"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Amended Treatment Plan
          </label>
          <Input
            value={amendedPlan}
            onChange={(e) => setAmendedPlan(e.target.value)}
            placeholder="Updated treatment steps"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Additional Clinical Addendum Notes
          </label>
          <Input
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Addendum notes appended to clinical instructions"
          />
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
