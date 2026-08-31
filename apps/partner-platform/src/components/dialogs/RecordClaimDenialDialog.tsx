import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  RecordClaimDenialRequest,
  InsuranceClaimDto,
  DenialCategory,
  InsuranceClaimDenialDto
} from '@docsearch/api-contracts';

export interface RecordClaimDenialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RecordClaimDenialRequest) => Promise<InsuranceClaimDenialDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const RecordClaimDenialDialog: React.FC<RecordClaimDenialDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [denialCode, setDenialCode] = useState('CO-16');
  const [denialCategory, setDenialCategory] = useState<DenialCategory>('PRE_AUTH_MISSING');
  const [denialReason, setDenialReason] = useState('Claim lacks mandatory pre-authorization approval code for advanced radiological imaging.');
  const [deniedAmount, setDeniedAmount] = useState(claim ? claim.totalClaimAmount.toString() : '0.00');
  const [appealEligible, setAppealEligible] = useState(true);
  const [appealDeadlineDays, setAppealDeadlineDays] = useState('60');
  const [justification, setJustification] = useState('Payer formal denial letter processed and recorded in denial registry.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const denAmt = parseFloat(deniedAmount);
    const days = parseInt(appealDeadlineDays, 10);
    if (isNaN(denAmt) || denAmt <= 0) {
      setError('Denied amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: claim.id,
        denialCode: denialCode.trim().toUpperCase(),
        denialCategory,
        denialReason: denialReason.trim(),
        deniedAmount: denAmt,
        appealEligible,
        appealDeadlineDays: days || 60,
        actorId: 'Finance Officer Alice Wong',
        actorRole: 'Senior Claims Adjudicator',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record denial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payer Denial — ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Denial Entry'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          <strong>Payer Denial Filing:</strong> Recording this denial triggers root-cause classification and enables the dispute appeal workflow.
        </Alert>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Standard Denial Code (CARC/RARC) *
            </label>
            <Input
              value={denialCode}
              onChange={(e) => setDenialCode(e.target.value)}
              placeholder="e.g. CO-16, CO-50, PR-1"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Denial Category *
            </label>
            <Select
              value={denialCategory}
              onChange={(e) => setDenialCategory(e.target.value as DenialCategory)}
              options={[
                { value: 'PRE_AUTH_MISSING', label: 'Missing / Invalid Prior Authorization' },
                { value: 'MEDICAL_NECESSITY', label: 'Medical Necessity Lacking / Not Supported' },
                { value: 'ELIGIBILITY_EXPIRED', label: 'Patient Policy Inactive / Expired' },
                { value: 'TIMELY_FILING', label: 'Timely Filing Limit Exceeded' },
                { value: 'NON_COVERED_SERVICE', label: 'Service Excluded Under Policy Clause' },
                { value: 'CODING_DISCREPANCY', label: 'CPT / ICD-10 Mismatch or Unbundling' },
                { value: 'DUPLICATE_CLAIM', label: 'Duplicate Claim Submission' },
                { value: 'BENEFIT_EXHAUSTED', label: 'Annual Benefit Limit Exhausted' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Denied Amount ($) *
            </label>
            <Input
              type="number"
              value={deniedAmount}
              onChange={(e) => setDeniedAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Appeal Eligible? *
            </label>
            <Select
              value={appealEligible ? 'YES' : 'NO'}
              onChange={(e) => setAppealEligible(e.target.value === 'YES')}
              options={[
                { value: 'YES', label: 'Yes — Eligible for Dispute Appeal' },
                { value: 'NO', label: 'No — Final / Non-Appealable' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Appeal Window (Days)
            </label>
            <Input
              type="number"
              value={appealDeadlineDays}
              onChange={(e) => setAppealDeadlineDays(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Detailed Denial Reason *
          </label>
          <Input
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Official explanation given by payer"
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
            placeholder="EOB audit reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
