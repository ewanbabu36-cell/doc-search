import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  ReconcileSettlementRequest,
  InsuranceSettlementDto,
  InsuranceReconciliationStatus,
  InsuranceReconciliationDto
} from '@docsearch/api-contracts';

export interface ReconcileSettlementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReconcileSettlementRequest) => Promise<InsuranceReconciliationDto>;
  settlement: InsuranceSettlementDto | null;
  tenantId: string;
}

export const ReconcileSettlementDialog: React.FC<ReconcileSettlementDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  settlement,
  tenantId
}) => {
  const [expectedAmount, setExpectedAmount] = useState(settlement ? settlement.settlementAmount.toString() : '0.00');
  const [receivedAmount, setReceivedAmount] = useState(settlement ? settlement.settlementAmount.toString() : '0.00');
  const [reconciliationStatus, setReconciliationStatus] = useState<InsuranceReconciliationStatus>('MATCHED');
  const [reason, setReason] = useState('Exact match between adjudicated claim amount and bank remittance credit.');
  const [justification, setJustification] = useState('End-of-period insurance ledger reconciliation completed.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!settlement) return null;

  const expNum = parseFloat(expectedAmount) || 0;
  const recNum = parseFloat(receivedAmount) || 0;
  const variance = recNum - expNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(expNum) || isNaN(recNum)) {
      setError('Amounts must be valid numbers.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        settlementId: settlement.id,
        claimId: settlement.claimId,
        expectedAmount: expNum,
        receivedAmount: recNum,
        reconciliationStatus,
        reason: reason.trim() || undefined,
        actorId: 'Finance Officer Alice Wong',
        actorRole: 'Senior Financial Auditor',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reconcile Settlement — ${settlement.settlementReference}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Reconciling...' : 'Confirm Reconciliation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Claim:</strong> {settlement.claimNumber}</div>
            <div><strong>Payer:</strong> {settlement.payerName}</div>
            <div><strong>Settlement Amount:</strong> ${settlement.settlementAmount.toFixed(2)}</div>
            <div>
              <strong>Calculated Variance:</strong>{' '}
              <span style={{ color: Math.abs(variance) < 0.01 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Expected Amount ($) *
            </label>
            <Input
              type="number"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Bank Remittance Received ($) *
            </label>
            <Input
              type="number"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Reconciliation Outcome *
          </label>
          <Select
            value={reconciliationStatus}
            onChange={(e) => setReconciliationStatus(e.target.value as InsuranceReconciliationStatus)}
            options={[
              { value: 'MATCHED', label: 'Exact Match ($0.00 Variance)' },
              { value: 'VARIANCE_ACCEPTED', label: 'Variance Accepted (Minor Withholding / Fee)' },
              { value: 'UNDERPAYMENT_DISPUTED', label: 'Underpayment Disputed with Payer' },
              { value: 'WRITE_OFF_AUTHORIZED', label: 'Write-Off Authorized by Management' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Auditor Variance Explanation
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Minor contractual withholding reconciled"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Treasury reconciliation voucher reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
