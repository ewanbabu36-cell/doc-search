import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateClaimAppealRequest,
  InsuranceClaimDenialDto,
  InsuranceClaimAppealDto
} from '@docsearch/api-contracts';

export interface CreateClaimAppealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateClaimAppealRequest) => Promise<InsuranceClaimAppealDto>;
  denial: InsuranceClaimDenialDto | null;
  tenantId: string;
}

export const CreateClaimAppealDialog: React.FC<CreateClaimAppealDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  denial,
  tenantId
}) => {
  const [appealLevel, setAppealLevel] = useState('1');
  const [appealReason, setAppealReason] = useState('Emergency clinical presentation necessitated immediate scan to rule out acute hemorrhage.');
  const [supportingDocumentsSummary, setSupportingDocumentsSummary] = useState('Emergency department triage note, attending physician acute justification letter, radiologist report.');
  const [justification, setJustification] = useState('Formal dispute appeal submitted to payer appeals committee with clinical evidence.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!denial) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || appealReason.trim().length < 10) {
      setError('Appeal reason must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: denial.claimId,
        denialId: denial.id,
        appealLevel: parseInt(appealLevel, 10) || 1,
        appealReason: appealReason.trim(),
        supportingDocumentsSummary: supportingDocumentsSummary.trim() || undefined,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Appeals & Dispute Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to file appeal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Lodge Claim Appeal — Denial ${denial.denialNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Filing Appeal...' : 'Submit Formal Appeal'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Claim Number:</strong> {denial.claimNumber}</div>
            <div><strong>Patient:</strong> {denial.patientName}</div>
            <div><strong>Payer:</strong> {denial.payerName}</div>
            <div><strong>Denied Amount:</strong> ${denial.deniedAmount.toFixed(2)}</div>
            <div><strong>Denial Code:</strong> {denial.denialCode} ({denial.denialCategory})</div>
            <div><strong>Reason:</strong> {denial.denialReason}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Appeal Escalation Level *
          </label>
          <Select
            value={appealLevel}
            onChange={(e) => setAppealLevel(e.target.value)}
            options={[
              { value: '1', label: 'Level 1 — Initial Reconsideration Request' },
              { value: '2', label: 'Level 2 — Formal Administrative Review' },
              { value: '3', label: 'Level 3 — Independent External Medical Review' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Clinical Appeal Argument & Rebuttal *
          </label>
          <Input
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Detailed medical necessity arguments refuting denial"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Attached Supporting Documentation Summary
          </label>
          <Input
            value={supportingDocumentsSummary}
            onChange={(e) => setSupportingDocumentsSummary(e.target.value)}
            placeholder="e.g. Physician letter, vitals log, lab report"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Payer grievance reference number"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
