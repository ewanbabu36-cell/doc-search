import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  IssueReceiptRequest,
  BillingPaymentDto
} from '@docsearch/api-contracts';

export interface IssueReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: IssueReceiptRequest) => Promise<void>;
  payment: BillingPaymentDto | null;
  tenantId: string;
}

export const IssueReceiptDialog: React.FC<IssueReceiptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payment,
  tenantId
}) => {
  const [justification, setJustification] = useState('Official numbered payment receipt generated for patient accounting record.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        paymentId: payment.id,
        invoiceId: payment.invoiceId || undefined,
        actorId: 'Cashier John Cooper',
        actorRole: 'Cashier Staff',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Formal Receipt for Payment ${payment.paymentNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Issuing Receipt...' : 'Generate & Print Receipt'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {payment.patientName}</div>
            <div><strong>MRN:</strong> {payment.patientMrn}</div>
            <div><strong>Payment Method:</strong> {payment.paymentMethod}</div>
            <div><strong>Amount Received:</strong> ${payment.amount.toFixed(2)}</div>
            {payment.invoiceNumber && <div><strong>Invoice Ref:</strong> {payment.invoiceNumber}</div>}
            {payment.referenceNumber && <div><strong>Gateway Ref:</strong> {payment.referenceNumber}</div>}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Receipt generation and handover confirmation"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
