import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto,
  CancelPurchaseOrderRequest
} from '@docsearch/api-contracts';

export interface CancelPurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CancelPurchaseOrderRequest) => Promise<void>;
  purchaseOrder: PurchaseOrderDto | null;
  tenantId: string;
}

export const CancelPurchaseOrderDialog: React.FC<CancelPurchaseOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  tenantId
}) => {
  const [reason, setReason] = useState('Requisition requirements amended by clinical department.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchaseOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        purchaseOrderId: purchaseOrder.id,
        reason: reason.trim(),
        actorId: 'James Vance',
        actorRole: 'Purchase Manager',
        justification: reason.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Cancel Purchase Order: ${purchaseOrder.poNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          Cancelling PO <strong>{purchaseOrder.poNumber}</strong> (${purchaseOrder.totalNetAmount.toFixed(2)}) will release the financial commitment.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cancellation Justification *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Keep Active
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Cancelling...' : 'Confirm PO Cancellation'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
