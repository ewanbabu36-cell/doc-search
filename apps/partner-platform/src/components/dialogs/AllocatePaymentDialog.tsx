import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  AllocatePaymentRequest,
  BillingPaymentDto,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface AllocatePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: AllocatePaymentRequest) => Promise<void>;
  payment: BillingPaymentDto | null;
  openInvoices: BillingInvoiceDto[];
  tenantId: string;
}

export const AllocatePaymentDialog: React.FC<AllocatePaymentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payment,
  openInvoices,
  tenantId
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(openInvoices[0]?.id || '');
  const [allocationAmount, setAllocationAmount] = useState('50.00');
  const [justification, setJustification] = useState('Advance/unallocated payment mapped against outstanding patient invoice.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  const allocatedTotal = payment.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const unallocatedBalance = payment.amount - allocatedTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setError('Please select an invoice to allocate payment against.');
      return;
    }
    const amt = parseFloat(allocationAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Allocation amount must be greater than zero.');
      return;
    }
    if (amt > unallocatedBalance) {
      setError(`Allocation amount ($${amt.toFixed(2)}) exceeds available unallocated payment balance ($${unallocatedBalance.toFixed(2)}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        paymentId: payment.id,
        invoiceId: selectedInvoiceId,
        amount: amt,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to allocate payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Funds from Payment ${payment.paymentNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Total Paid:</strong> ${payment.amount.toFixed(2)}</div>
            <div><strong>Already Allocated:</strong> ${allocatedTotal.toFixed(2)}</div>
            <div><strong>Available Unallocated:</strong> ${unallocatedBalance.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Target Outstanding Invoice *
          </label>
          <Select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            options={openInvoices.map((inv) => ({
              value: inv.id,
              label: `${inv.invoiceNumber} — ${inv.patientName} (Due: $${inv.dueAmount.toFixed(2)})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Amount to Allocate ($) *
          </label>
          <Input
            type="number"
            value={allocationAmount}
            onChange={(e) => setAllocationAmount(e.target.value)}
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
            placeholder="Reason for payment allocation and ledger mapping"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
