import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateDebitAdjustmentRequest,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface CreateDebitAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateDebitAdjustmentRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateDebitAdjustmentDialog: React.FC<CreateDebitAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [amount, setAmount] = useState('25.00');
  const [reason, setReason] = useState('Specialized emergency after-hours laboratory processing surcharge.');
  const [justification, setJustification] = useState('Supplemental clinical service charge authorized by department head.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const drAmt = parseFloat(amount);
    if (isNaN(drAmt) || drAmt <= 0) {
      setError('Adjustment amount must be greater than zero.');
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
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: drAmt,
        reason: reason.trim(),
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply debit adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply Debit Adjustment — Invoice ${invoice.invoiceNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Applying...' : `Add $${(parseFloat(amount) || 0).toFixed(2)} to Invoice`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Patient:</strong> {invoice.patientName}</div>
            <div><strong>Original Total:</strong> ${invoice.totalAmount.toFixed(2)}</div>
            <div><strong>Current Due:</strong> ${invoice.dueAmount.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Debit Adjustment Amount ($) *
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
            Adjustment Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Surcharge, missed line item, equipment usage fee"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Manager Authorization & Audit Note *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Departmental approval reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
