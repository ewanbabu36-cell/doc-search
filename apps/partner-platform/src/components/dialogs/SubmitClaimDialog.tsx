import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  SubmitClaimRequest,
  InsuranceClaimDto,
  InsuranceClaimSubmissionDto
} from '@docsearch/api-contracts';

export interface SubmitClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: SubmitClaimRequest) => Promise<InsuranceClaimSubmissionDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const SubmitClaimDialog: React.FC<SubmitClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [transmissionBatchId, setTransmissionBatchId] = useState(`BATCH-EDI-${Math.floor(Math.random() * 8999 + 1000)}`);
  const [justification, setJustification] = useState('Electronic claim batch submitted via ANSI X12 837 clearinghouse gateway.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: claim.id,
        transmissionBatchId: transmissionBatchId.trim() || undefined,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Transmit Claim ${claim.claimNumber} to Payer`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting...' : 'Confirm Electronic Submission'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {claim.patientName}</div>
            <div><strong>Payer:</strong> {claim.payerName}</div>
            <div><strong>Policy #:</strong> {claim.policyNumber}</div>
            <div><strong>Billed Amount:</strong> ${claim.totalClaimAmount.toFixed(2)}</div>
            <div><strong>Submission Mode:</strong> {claim.submissionMode}</div>
            <div><strong>Primary Diagnosis:</strong> {claim.primaryDiagnosisCode}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Transmission Batch Identifier
          </label>
          <Input
            value={transmissionBatchId}
            onChange={(e) => setTransmissionBatchId(e.target.value)}
            placeholder="e.g. BATCH-EDI-8910"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Transmission authorization reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
