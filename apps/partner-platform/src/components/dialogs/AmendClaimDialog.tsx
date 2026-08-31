import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  AmendClaimRequest,
  InsuranceClaimDto
} from '@docsearch/api-contracts';

export interface AmendClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: AmendClaimRequest) => Promise<InsuranceClaimDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const AmendClaimDialog: React.FC<AmendClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [amendmentReason, setAmendmentReason] = useState('Updated clinical diagnosis code per attending physician revised encounter note.');
  const [updatedDiagnosisCode, setUpdatedDiagnosisCode] = useState(claim?.primaryDiagnosisCode || 'I10');
  const [updatedDiagnosisDescription, setUpdatedDiagnosisDescription] = useState(claim?.primaryDiagnosisDescription || 'Essential (primary) hypertension');
  const [justification, setJustification] = useState('Claim amendment authorized prior to electronic resubmission.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || amendmentReason.trim().length < 5) {
      setError('Amendment reason must be at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: claim.id,
        amendmentReason: amendmentReason.trim(),
        updatedDiagnosisCode: updatedDiagnosisCode.trim().toUpperCase() || undefined,
        updatedDiagnosisDescription: updatedDiagnosisDescription.trim() || undefined,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to amend claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Amend Claim Dossier — ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Amending...' : 'Apply Amendment & Reset for Resubmission'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="info">
          <strong>Claim Amendment Notice:</strong> Applying an amendment transitions the claim back to <strong>READY_FOR_SUBMISSION</strong> and records an immutable audit delta trace.
        </Alert>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {claim.patientName}</div>
            <div><strong>Payer:</strong> {claim.payerName}</div>
            <div><strong>Total Claim:</strong> ${claim.totalClaimAmount.toFixed(2)}</div>
            <div><strong>Current Status:</strong> {claim.status}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Updated ICD-10 Code
            </label>
            <Input
              value={updatedDiagnosisCode}
              onChange={(e) => setUpdatedDiagnosisCode(e.target.value)}
              placeholder="e.g. I11.0"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Updated Diagnosis Description
            </label>
            <Input
              value={updatedDiagnosisDescription}
              onChange={(e) => setUpdatedDiagnosisDescription(e.target.value)}
              placeholder="e.g. Hypertensive heart disease with heart failure"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Detailed Amendment Rationale *
          </label>
          <Input
            value={amendmentReason}
            onChange={(e) => setAmendmentReason(e.target.value)}
            placeholder="Clinical reason for correcting claim dossier"
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
            placeholder="Physician addendum reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
