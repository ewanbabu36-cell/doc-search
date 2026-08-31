import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CancelInvoiceRequest,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface CancelInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CancelInvoiceRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
}

export const CancelInvoiceDialog: React.FC<CancelInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId
}) => {
  const [reason, setReason] = useState('Erroneous encounter entry / duplicate draft invoice cancellation.');
  const [justification, setJustification] = useState('Invoice cancelled in draft stage before fiscal finalization.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Cancellation reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        invoiceId: invoice.id,
        reason: reason.trim(),
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel / Void Invoice ${invoice.invoiceNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Cancelling...' : 'Confirm Invoice Cancellation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          <strong>Fiscal Cancellation Notice:</strong> This action will mark invoice <strong>{invoice.invoiceNumber}</strong> as {invoice.status === 'DRAFT' ? 'CANCELLED' : 'VOIDED'}. Zero further payments will be accepted against this invoice reference.
        </Alert>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {invoice.patientName}</div>
            <div><strong>MRN:</strong> {invoice.patientMrn}</div>
            <div><strong>Invoice Amount:</strong> ${invoice.totalAmount.toFixed(2)}</div>
            <div><strong>Current Status:</strong> {invoice.status}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cancellation Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Test not performed, wrong patient file, draft superseded"
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
            placeholder="Auditable reason for voiding invoice"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
