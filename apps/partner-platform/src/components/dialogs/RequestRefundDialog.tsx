import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  RequestRefundRequest,
  BillingPaymentDto
} from '@docsearch/api-contracts';

export interface RequestRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RequestRefundRequest) => Promise<void>;
  payment: BillingPaymentDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RequestRefundDialog: React.FC<RequestRefundDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payment,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [amount, setAmount] = useState('20.00');
  const [reason, setReason] = useState('Service order cancellation / duplicate clinical fee adjustment.');
  const [justification, setJustification] = useState('Clinical doctor requested cancellation of unperformed diagnostic test.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmt = parseFloat(amount);
    if (isNaN(refundAmt) || refundAmt <= 0) {
      setError('Refund amount must be greater than zero.');
      return;
    }
    if (refundAmt > payment.amount) {
      setError(`Refund amount ($${refundAmt.toFixed(2)}) cannot exceed paid payment amount ($${payment.amount.toFixed(2)}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        paymentId: payment.id,
        invoiceId: payment.invoiceId || undefined,
        patientId: payment.patientId,
        amount: refundAmt,
        reason: reason.trim(),
        actorId: 'Cashier John Cooper',
        actorRole: 'Cashier Staff',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit refund request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Request Refund against Payment ${payment.paymentNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#fef2f2', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Patient:</strong> {payment.patientName}</div>
            <div><strong>Original Payment:</strong> ${payment.amount.toFixed(2)}</div>
            <div><strong>Method:</strong> {payment.paymentMethod}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Refund Amount Requested ($) *
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Reason for Refund *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Test cancelled, double billing, patient discharge discrepancy"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification & Clinical Authorization *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Clinical supervisor approval reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
