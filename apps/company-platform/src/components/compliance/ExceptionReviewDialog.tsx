import React, { useState } from 'react';
import type { GovernanceExceptionDto } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface ExceptionReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exception: GovernanceExceptionDto;
  onReview: (
    exceptionId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CLOSED',
    closureNotes: string,
    reason: string
  ) => Promise<void>;
}

export const ExceptionReviewDialog: React.FC<ExceptionReviewDialogProps> = ({
  isOpen,
  onClose,
  exception,
  onReview
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'CLOSED'>('APPROVED');
  const [closureNotes, setClosureNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureNotes.trim() || !reason.trim()) {
      setError('Review findings / closure notes and a formal justification reason are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onReview(exception.id, decision, closureNotes.trim(), reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Exception review failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Governance Exception Formal Review"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={decision === 'APPROVED' ? 'primary' : decision === 'REJECTED' ? 'danger' : 'outline'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Submit Decision
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Privileged Governance Decision">
          Approving a compliance exception accepts operational risk against established security controls and mandates compensating control monitoring.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Exception Code: </span>
            <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{exception.exceptionCode}</code>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Title: </span>
            <strong>{exception.title}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Risk Level: </span>
            <Badge variant={exception.riskLevel === 'CRITICAL' ? 'danger' : exception.riskLevel === 'HIGH' ? 'warning' : 'neutral'}>
              {exception.riskLevel}
            </Badge>
          </div>
        </div>

        <FormField label="Review Decision" required>
          <Select
            options={[
              { label: 'Approve Exception (Time-Bounded)', value: 'APPROVED' },
              { label: 'Reject Request (Remediation Required)', value: 'REJECTED' },
              { label: 'Close / Retire Exception', value: 'CLOSED' }
            ]}
            value={decision}
            onChange={(e) => setDecision(e.target.value as 'APPROVED' | 'REJECTED' | 'CLOSED')}
          />
        </FormField>

        <FormField label="Review Findings & Closure Notes" required>
          <textarea
            required
            rows={3}
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            placeholder="Explain review analysis, compensating control validation, or remediation requirements..."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>

        <FormField label="Audited Justification Reason" required helperText="Mandatory reason written to audit trail.">
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Compensating controls verified by Data Protection Officer."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};
