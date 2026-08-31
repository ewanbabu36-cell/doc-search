import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  AdjudicateClaimRequest,
  InsuranceClaimDto,
  InsuranceClaimAdjudicationDto
} from '@docsearch/api-contracts';

export interface AdjudicateClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: AdjudicateClaimRequest) => Promise<InsuranceClaimAdjudicationDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const AdjudicateClaimDialog: React.FC<AdjudicateClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [adjudicationStatus, setAdjudicationStatus] = useState<'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED'>('APPROVED');
  const [approvedAmount, setApprovedAmount] = useState(claim ? (claim.totalClaimAmount * 0.9).toFixed(2) : '0.00');
  const [deniedAmount, setDeniedAmount] = useState('0.00');
  const [patientResponsibility, setPatientResponsibility] = useState(claim ? (claim.totalClaimAmount * 0.1).toFixed(2) : '0.00');
  const [contractualAdjustment, setContractualAdjustment] = useState('0.00');
  const [payerRemarks, setPayerRemarks] = useState('Electronic remittance advice adjudicated per tariff contract.');
  const [justification, setJustification] = useState('Payer EOB remittance advice processed and reconciled against billed lines.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appAmt = parseFloat(approvedAmount);
    const denAmt = parseFloat(deniedAmount);
    const patResp = parseFloat(patientResponsibility);
    const adjAmt = parseFloat(contractualAdjustment);

    if (isNaN(appAmt) || isNaN(denAmt) || isNaN(patResp) || isNaN(adjAmt)) {
      setError('All monetary values must be valid numbers.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        claimId: claim.id,
        adjudicationStatus,
        approvedAmount: appAmt,
        deniedAmount: denAmt,
        patientResponsibility: patResp,
        contractualAdjustment: adjAmt,
        payerRemarks: payerRemarks.trim() || undefined,
        actorId: 'Finance Officer Alice Wong',
        actorRole: 'Senior Claims Adjudicator',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to adjudicate claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjudicate Claim — ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adjudicating...' : 'Confirm Adjudication'}
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
            <div><strong>Total Billed:</strong> ${claim.totalClaimAmount.toFixed(2)}</div>
            <div><strong>Policy #:</strong> {claim.policyNumber}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Adjudication Outcome *
          </label>
          <Select
            value={adjudicationStatus}
            onChange={(e) => setAdjudicationStatus(e.target.value as 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED')}
            options={[
              { value: 'APPROVED', label: 'Approved in Full' },
              { value: 'PARTIALLY_APPROVED', label: 'Partially Approved (Partial Denial / Deductible)' },
              { value: 'DENIED', label: 'Denied in Full' }
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Approved Payer Amount ($) *
            </label>
            <Input
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              required
            />
          </div>

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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient Responsibility / Copay ($) *
            </label>
            <Input
              type="number"
              value={patientResponsibility}
              onChange={(e) => setPatientResponsibility(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contractual Tariff Adjustment ($)
            </label>
            <Input
              type="number"
              value={contractualAdjustment}
              onChange={(e) => setContractualAdjustment(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Payer Remarks / Remittance Advice
          </label>
          <Input
            value={payerRemarks}
            onChange={(e) => setPayerRemarks(e.target.value)}
            placeholder="e.g. 10% copay applied per member contract"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="EOB remittance reference number"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
