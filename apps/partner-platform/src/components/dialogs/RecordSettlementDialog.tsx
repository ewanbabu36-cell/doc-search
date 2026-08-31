import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  RecordSettlementRequest,
  InsuranceClaimDto,
  InsuranceSettlementDto
} from '@docsearch/api-contracts';

export interface RecordSettlementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RecordSettlementRequest) => Promise<InsuranceSettlementDto>;
  claim: InsuranceClaimDto | null;
  tenantId: string;
}

export const RecordSettlementDialog: React.FC<RecordSettlementDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
  tenantId
}) => {
  const [settlementReference, setSettlementReference] = useState(`EFT-${Date.now().toString().slice(-6)}`);
  const [eftTransactionNumber, setEftTransactionNumber] = useState(`TRX-ACH-${Math.floor(Math.random() * 89999 + 10000)}`);
  const [settlementAmount, setSettlementAmount] = useState(claim ? claim.approvedAmount.toString() : '0.00');
  const [paymentReference, setPaymentReference] = useState(`BANK-CR-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`);
  const [justification, setJustification] = useState('Electronic funds transfer (EFT) remittance credit received from payer bank.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(settlementAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Settlement amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId: claim.partnerId,
        organizationId: claim.organizationId,
        branchId: claim.branchId || undefined,
        payerId: claim.payerId,
        claimId: claim.id,
        settlementReference: settlementReference.trim(),
        eftTransactionNumber: eftTransactionNumber.trim() || undefined,
        settlementAmount: amt,
        settlementDate: new Date().toISOString(),
        paymentReference: paymentReference.trim() || undefined,
        actorId: 'Finance Officer Alice Wong',
        actorRole: 'Treasury & Settlement Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payer EFT Settlement — ${claim.claimNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payer Settlement'}
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
            <div><strong>Approved Amount:</strong> ${claim.approvedAmount.toFixed(2)}</div>
            <div><strong>Policy #:</strong> {claim.policyNumber}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Settlement Reference / Batch # *
            </label>
            <Input
              value={settlementReference}
              onChange={(e) => setSettlementReference(e.target.value)}
              placeholder="e.g. EFT-TPA-9901"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              EFT / Wire Transaction ID
            </label>
            <Input
              value={eftTransactionNumber}
              onChange={(e) => setEftTransactionNumber(e.target.value)}
              placeholder="e.g. TRX-ACH-88192"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Received Settlement Amount ($) *
            </label>
            <Input
              type="number"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Bank Ledger Reference
            </label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. BANK-CR-2026-8812"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Bank deposit voucher reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
