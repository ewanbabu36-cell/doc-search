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
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('UPI');
  const [amount, setAmount] = useState(invoice ? Number(invoice.dueAmount || 0).toString() : '50.00');
  const [patientId] = useState(invoice ? invoice.patientId : '55555555-5555-4555-8555-555555555501');
  const [patientName, setPatientName] = useState(invoice ? invoice.patientName || 'Eleanor Vance' : 'Eleanor Vance');
  const [patientMrn, setPatientMrn] = useState(invoice ? invoice.patientMrn || 'MRN-2026-00891' : 'MRN-2026-00891');
  const [referenceNumber, setReferenceNumber] = useState(() => `UPI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [justification, setJustification] = useState('Patient clinical encounter payment settled at cashier desk.');
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
                { value: 'UPI', label: 'UPI / Online QR Scan (GooglePay / PhonePe / Paytm)' },
                { value: 'CASH', label: 'Cash Currency' },
                { value: 'CARD', label: 'Credit / Debit Card (POS Machine)' },
                { value: 'BANK_TRANSFER', label: 'Bank Wire Transfer / IMPS' },
                { value: 'INSURANCE', label: 'Insurance Direct TPA Settlement' },
                { value: 'CHEQUE', label: 'Bank Cheque / DD' },
                { value: 'WALLET', label: 'Digital Wallet' }
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

        {paymentMethod === 'UPI' && (
          <div
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1.5px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  Dynamic NPCI UPI QR (Amount: ₹{parseFloat(amount) || 0})
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '999px' }}>
                UPI 2.0 Live
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: '#070C16',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1.5px solid #06B6D4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    `upi://pay?pa=hospital.settlement@docsearch&pn=DocSearch%20Hospital&am=${(parseFloat(amount) || 0).toFixed(2)}&cu=INR&tn=Invoice%20${invoice?.invoiceNumber || 'Direct'}`
                  )}&color=06B6D4&bgcolor=0B132B`}
                  alt="UPI QR Code"
                  style={{ width: '100px', height: '100px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  UPI VPA: <strong style={{ color: '#38BDF8' }}>hospital.settlement@docsearch</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Supported Apps: <strong style={{ color: '#F1F5F9' }}>PhonePe, Google Pay, Paytm, BHIM</strong>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const simUtr = `UTR-RAZORPAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
                    setReferenceNumber(simUtr);
                    setJustification(`Instant UPI Payment confirmed via Razorpay/Cashfree Sandbox simulation (Ref: ${simUtr})`);
                  }}
                  style={{
                    marginTop: '4px',
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  ⚡ Simulate Instant Payment (Sandbox Test)
                </Button>
              </div>
            </div>
          </div>
        )}

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
