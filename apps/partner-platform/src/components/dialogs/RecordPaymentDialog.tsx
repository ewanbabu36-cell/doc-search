import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  RecordPaymentRequest,
  BillingPaymentMethod,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RecordPaymentRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('CARD');
  const [amount, setAmount] = useState(invoice ? invoice.dueAmount.toString() : '50.00');
  const [patientId] = useState(invoice ? invoice.patientId : '55555555-5555-4555-8555-555555555501');
  const [patientName, setPatientName] = useState(invoice ? invoice.patientName : 'Eleanor Vance');
  const [patientMrn, setPatientMrn] = useState(invoice ? invoice.patientMrn : 'MRN-2026-00891');
  const [referenceNumber, setReferenceNumber] = useState('TXN-POS-98172');
  const [justification, setJustification] = useState('Patient point-of-sale card transaction settled at cashier desk.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setError('Payment amount must be greater than zero.');
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
        invoiceId: invoice?.id,
        patientId: invoice?.patientId || patientId,
        amount: payAmt,
        currency: 'USD',
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        actorId: 'Cashier John Cooper',
        actorRole: 'Cashier Staff',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? `Collect Payment — Invoice ${invoice.invoiceNumber}` : 'Record Direct Patient Payment'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : `Collect $${(parseFloat(amount) || 0).toFixed(2)}`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        {invoice ? (
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>Patient:</strong> {invoice.patientName}</div>
              <div><strong>Total Billed:</strong> ${invoice.totalAmount.toFixed(2)}</div>
              <div><strong>Outstanding Due:</strong> ${invoice.dueAmount.toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Patient Full Name *
              </label>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Eleanor Vance"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Patient MRN *
              </label>
              <Input
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                placeholder="MRN-2026-00891"
                required
              />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payment Method *
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as BillingPaymentMethod)}
              options={[
                { value: 'CARD', label: 'Credit / Debit Card' },
                { value: 'CASH', label: 'Cash Currency' },
                { value: 'UPI', label: 'UPI / QR Code Scan' },
                { value: 'BANK_TRANSFER', label: 'Bank Wire Transfer' },
                { value: 'CHEQUE', label: 'Bank Cheque' },
                { value: 'WALLET', label: 'Digital Wallet' },
                { value: 'INSURANCE', label: 'Insurance Direct Settlement' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Amount to Collect ($) *
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50.00"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Gateway / POS Reference Number
          </label>
          <Input
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. TXN-POS-98172, UPI-Ref-00129"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Reason for payment collection"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
