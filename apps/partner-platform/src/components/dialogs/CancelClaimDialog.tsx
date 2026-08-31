import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CancelClaimRequest,
  InsuranceClaimDto
} from '@docsearch/api-contracts';

export interface CancelClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CancelClaimRequest) => Promise<InsuranceClaimDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const CancelClaimDialog: React.FC<CancelClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [reason, setReason] = useState('Erroneous claim submission draft cancelled / patient converted to direct self-pay settlement.');
  const [justification, setJustification] = useState('Claim voided prior to fiscal settlement.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Cancellation reason is required (min 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: claim.id,
        reason: reason.trim(),
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Insurance Claim ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Cancelling...' : 'Confirm Claim Cancellation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          <strong>Claim Cancellation Notice:</strong> This action will mark claim <strong>{claim.claimNumber}</strong> as CANCELLED. No further submissions or adjudications will be accepted for this insurance claim reference.
        </Alert>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {claim.patientName}</div>
            <div><strong>Payer:</strong> {claim.payerName}</div>
            <div><strong>Claim Amount:</strong> ${claim.totalClaimAmount.toFixed(2)}</div>
            <div><strong>Current Status:</strong> {claim.status}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cancellation Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate claim created, wrong insurance policy selected"
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
            placeholder="Auditable reason for voiding insurance claim"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
