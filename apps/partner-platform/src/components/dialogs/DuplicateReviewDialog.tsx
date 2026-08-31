import React, { useState } from 'react';
import type {
  PatientDuplicateCandidateDto,
  DuplicateReviewStatus,
  ReviewDuplicatePatientRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert, Badge } from '@docsearch/ui-kit';

export interface DuplicateReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: PatientDuplicateCandidateDto;
  actorId: string;
  actorRole: string;
  onReviewCandidate: (req: ReviewDuplicatePatientRequest) => Promise<void>;
  onOpenMerge: () => void;
}

export const DuplicateReviewDialog: React.FC<DuplicateReviewDialogProps> = ({
  isOpen,
  onClose,
  candidate,
  actorId,
  actorRole,
  onReviewCandidate,
  onOpenMerge
}) => {
  const [reviewStatus, setReviewStatus] = useState<DuplicateReviewStatus>('RESOLVED_DISTINCT');
  const [notes, setNotes] = useState('Reviewed identity documents; determined records represent distinct patients.');
  const [reason, setReason] = useState('Completed duplicate identity adjudication review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes || notes.trim().length < 3) {
      setError('Review notes are required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onReviewCandidate({
        actorId,
        actorRole,
        tenantId: candidate.tenantId,
        candidateId: candidate.id,
        reviewStatus,
        reviewNotes: notes,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit duplicate review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Patient Adjudication Review"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="primary" size="sm" onClick={onOpenMerge}>
            🔀 Merge Into Canonical Patient
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Confirm Adjudication
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title={`Duplicate Match Confidence: ${candidate.confidenceScore}% (${candidate.matchCategory})`}>
          Review potential duplicate candidates to determine whether they represent the same individual or separate patients.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ border: '1px solid var(--ds-color-border)', borderRadius: '6px', padding: '12px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              SOURCE CANDIDATE (PENDING)
            </span>
            <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
              {candidate.sourcePatientName ?? 'Source Patient'}
            </strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              MRN: <code>{candidate.sourceMrn ?? 'N/A'}</code>
            </span>
          </div>

          <div style={{ border: '1px solid var(--ds-color-border)', borderRadius: '6px', padding: '12px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              MATCHED EXISTING RECORD
            </span>
            <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
              {candidate.matchedPatientName ?? 'Matched Patient'}
            </strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              MRN: <code>{candidate.matchedMrn ?? 'N/A'}</code>
            </span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '4px' }}>
            Identified Matching Signals
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {candidate.matchingSignals.map((sig) => (
              <Badge key={sig} variant="neutral">{sig}</Badge>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Adjudication Action *
          </label>
          <Select
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as DuplicateReviewStatus)}
            options={[
              { value: 'RESOLVED_DISTINCT', label: 'Mark as Distinct Patients (Separate Individuals)' },
              { value: 'DISMISSED', label: 'Dismiss Alert (No Action Needed)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Adjudication Findings & Notes *
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Adjudicated duplicate identity review after government ID verification"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
