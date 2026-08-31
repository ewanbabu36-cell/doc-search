import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ProcessRefundRequest,
  BillingRefundDto
} from '@docsearch/api-contracts';

export interface ProcessRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ProcessRefundRequest) => Promise<void>;
  refund: BillingRefundDto | null;
  tenantId: string;
}

export const ProcessRefundDialog: React.FC<ProcessRefundDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  refund,
  tenantId
}) => {
  const [paymentGatewayRef, setPaymentGatewayRef] = useState('TXN-REFUND-PAYPAL-88124');
  const [justification, setJustification] = useState('Payment gateway transaction reversed and funds returned to patient.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!refund) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        refundId: refund.id,
        paymentGatewayRef: paymentGatewayRef.trim() || undefined,
        actorId: 'Cashier John Cooper',
        actorRole: 'Settlement Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process refund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Process / Disburse Refund ${refund.refundNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : `Disburse $${refund.amount.toFixed(2)}`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {refund.patientName}</div>
            <div><strong>MRN:</strong> {refund.patientMrn}</div>
            <div><strong>Disbursement Amount:</strong> ${refund.amount.toFixed(2)}</div>
            <div><strong>Approved Status:</strong> {refund.status}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Payment Gateway / Bank ARN / Transaction Reference
          </label>
          <Input
            value={paymentGatewayRef}
            onChange={(e) => setPaymentGatewayRef(e.target.value)}
            placeholder="e.g. ARN-109284729182"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification & Settlement Confirmation *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Gateway settlement confirmation and verification notes"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
