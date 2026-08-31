import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  ResolveClaimAppealRequest,
  InsuranceClaimAppealDto
} from '@docsearch/api-contracts';

export interface ResolveClaimAppealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ResolveClaimAppealRequest) => Promise<InsuranceClaimAppealDto>;
  appeal: InsuranceClaimAppealDto | null;
  tenantId: string;
}

export const ResolveClaimAppealDialog: React.FC<ResolveClaimAppealDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appeal,
  tenantId
}) => {
  const [status, setStatus] = useState<'APPROVED' | 'PARTIALLY_OVERTURNED' | 'UPHELD_DENIED'>('APPROVED');
  const [recoveredAmount, setRecoveredAmount] = useState('320.00');
  const [outcomeNotes, setOutcomeNotes] = useState('Payer medical board overturned denial upon review of emergency triage documentation.');
  const [justification, setJustification] = useState('Payer appeal resolution letter processed and ledger balance adjusted.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appeal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recAmt = parseFloat(recoveredAmount);
    if (isNaN(recAmt) || recAmt < 0) {
      setError('Recovered amount must be a non-negative number.');
      return;
    }
    if (!outcomeNotes.trim() || outcomeNotes.trim().length < 5) {
      setError('Outcome notes must be at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        appealId: appeal.id,
        claimId: appeal.claimId,
        status,
        recoveredAmount: recAmt,
        outcomeNotes: outcomeNotes.trim(),
        actorId: 'Finance Officer Alice Wong',
        actorRole: 'Appeals Coordinator',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve appeal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolve Appeal — ${appeal.appealNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Resolving...' : 'Confirm Appeal Decision'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Claim:</strong> {appeal.claimNumber}</div>
            <div><strong>Patient:</strong> {appeal.patientName}</div>
            <div><strong>Payer:</strong> {appeal.payerName}</div>
            <div><strong>Appeal Level:</strong> Level {appeal.appealLevel}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payer Committee Outcome *
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'APPROVED' | 'PARTIALLY_OVERTURNED' | 'UPHELD_DENIED')}
              options={[
                { value: 'APPROVED', label: 'Approved (Denial Fully Overturned)' },
                { value: 'PARTIALLY_OVERTURNED', label: 'Partially Overturned (Partial Recovery)' },
                { value: 'UPHELD_DENIED', label: 'Upheld (Denial Sustained)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Recovered Payer Amount ($) *
            </label>
            <Input
              type="number"
              value={recoveredAmount}
              onChange={(e) => setRecoveredAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Payer Decision Notes *
          </label>
          <Input
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Official resolution rationale provided by payer"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Payer resolution letter reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
