import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseRequisitionDto,
  ApprovePurchaseRequisitionRequest
} from '@docsearch/api-contracts';

export interface ApprovePurchaseRequisitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApprovePurchaseRequisitionRequest) => Promise<void>;
  requisition: PurchaseRequisitionDto | null;
  tenantId: string;
}

export const ApprovePurchaseRequisitionDialog: React.FC<ApprovePurchaseRequisitionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  requisition,
  tenantId
}) => {
  const [comments, setComments] = useState('Approved following budget verification and store stock audit.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!requisition) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        requisitionId: requisition.id,
        tier: 1,
        comments: comments.trim(),
        actorId: 'James Vance',
        actorRole: 'Purchase Manager',
        justification: comments.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Approve Requisition: ${requisition.requisitionNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Department:</strong> {requisition.departmentName}</div>
          <div><strong>Requested By:</strong> {requisition.requestedBy}</div>
          <div><strong>Estimated Total:</strong> ${requisition.totalEstimatedAmount.toFixed(2)}</div>
          <div><strong>Priority:</strong> {requisition.priority}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Approval Comments & Allocation Authorization *
          </label>
          <Input value={comments} onChange={(e) => setComments(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Authorizing...' : 'Authorize & Approve PR'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
