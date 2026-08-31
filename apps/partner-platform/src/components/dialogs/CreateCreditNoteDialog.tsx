import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateCreditNoteRequest,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface CreateCreditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateCreditNoteRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateCreditNoteDialog: React.FC<CreateCreditNoteDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [amount, setAmount] = useState('15.00');
  const [reason, setReason] = useState('Diagnostic panel package rate reconciliation credit.');
  const [justification, setJustification] = useState('Credit note issued with authorization to adjust patient balance.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const crAmt = parseFloat(amount);
    if (isNaN(crAmt) || crAmt <= 0) {
      setError('Credit amount must be greater than zero.');
      return;
    }
    if (crAmt > invoice.totalAmount) {
      setError(`Credit note amount ($${crAmt.toFixed(2)}) cannot exceed total invoice value ($${invoice.totalAmount.toFixed(2)}).`);
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
        amount: crAmt,
        reason: reason.trim(),
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue credit note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Credit Note — Invoice ${invoice.invoiceNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Issuing...' : `Issue $${(parseFloat(amount) || 0).toFixed(2)} Credit Note`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Patient:</strong> {invoice.patientName}</div>
            <div><strong>Total Invoice:</strong> ${invoice.totalAmount.toFixed(2)}</div>
            <div><strong>Balance Due:</strong> ${invoice.dueAmount.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Credit Note Amount ($) *
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
            Commercial Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Rate adjustment, promotional waiver, disputed item clearance"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Manager Authorization & Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Governance compliance reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
