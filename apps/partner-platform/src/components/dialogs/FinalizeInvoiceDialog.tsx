import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  FinalizeInvoiceRequest,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface FinalizeInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: FinalizeInvoiceRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
}

export const FinalizeInvoiceDialog: React.FC<FinalizeInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId
}) => {
  const [justification, setJustification] = useState('Invoice approved and committed for patient collection and claims ledger.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        invoiceId: invoice.id,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalize & Issue Invoice ${invoice.invoiceNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Finalizing...' : 'Finalize & Lock Invoice'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="info">
          <strong>Fiscal Notice:</strong> Finalizing will transition this invoice from <strong>DRAFT</strong> to <strong>ISSUED</strong>. Its line items and pricing will become immutably locked against edits.
        </Alert>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {invoice.patientName}</div>
            <div><strong>MRN:</strong> {invoice.patientMrn}</div>
            <div><strong>Invoice Items:</strong> {invoice.items.length} line items</div>
            <div><strong>Total Payable:</strong> ${invoice.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Auditable reason for invoice finalization"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
