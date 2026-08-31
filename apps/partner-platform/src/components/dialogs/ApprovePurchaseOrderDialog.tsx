import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto,
  ApprovePurchaseOrderRequest
} from '@docsearch/api-contracts';

export interface ApprovePurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApprovePurchaseOrderRequest) => Promise<void>;
  purchaseOrder: PurchaseOrderDto | null;
  tenantId: string;
}

export const ApprovePurchaseOrderDialog: React.FC<ApprovePurchaseOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  tenantId
}) => {
  const [comments, setComments] = useState('PO financial commitments verified within departmental budget cap.');
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
        comments: comments.trim(),
        actorId: 'Alice Wong',
        actorRole: 'Finance Controller',
        justification: comments.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Approve Purchase Order: ${purchaseOrder.poNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Vendor:</strong> {purchaseOrder.vendorName}</div>
          <div><strong>Net PO Value:</strong> ${purchaseOrder.totalNetAmount.toFixed(2)}</div>
          <div><strong>Expected Delivery:</strong> {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Approval Comments *
          </label>
          <Input value={comments} onChange={(e) => setComments(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Approving...' : 'Confirm PO Approval'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
