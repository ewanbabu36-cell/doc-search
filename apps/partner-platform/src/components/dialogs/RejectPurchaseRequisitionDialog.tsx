import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseRequisitionDto,
  RejectPurchaseRequisitionRequest
} from '@docsearch/api-contracts';

export interface RejectPurchaseRequisitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RejectPurchaseRequisitionRequest) => Promise<void>;
  requisition: PurchaseRequisitionDto | null;
  tenantId: string;
}

export const RejectPurchaseRequisitionDialog: React.FC<RejectPurchaseRequisitionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  requisition,
  tenantId
}) => {
  const [reason, setReason] = useState('Existing store stock is sufficient for the current billing cycle.');
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
        reason: reason.trim(),
        actorId: 'James Vance',
        actorRole: 'Purchase Manager'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Reject Requisition: ${requisition.requisitionNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          Rejecting this requisition will prevent purchase order conversion and notify the requesting department.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Rejection Reason & Auditor Notes *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
