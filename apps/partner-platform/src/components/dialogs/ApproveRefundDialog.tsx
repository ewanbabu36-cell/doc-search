import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ApproveRefundRequest,
  BillingRefundDto
} from '@docsearch/api-contracts';

export interface ApproveRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApproveRefundRequest) => Promise<void>;
  refund: BillingRefundDto | null;
  tenantId: string;
}

export const ApproveRefundDialog: React.FC<ApproveRefundDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  refund,
  tenantId
}) => {
  const [justification, setJustification] = useState('Refund request reviewed and approved according to clinical financial policy.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!refund) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        refundId: refund.id,
        actorId: 'Finance Supervisor Alice Wong',
        actorRole: 'Finance Director',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve refund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Refund ${refund.refundNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Approving...' : `Authorize $${refund.amount.toFixed(2)} Refund`}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {refund.patientName}</div>
            <div><strong>MRN:</strong> {refund.patientMrn}</div>
            <div><strong>Refund Amount:</strong> ${refund.amount.toFixed(2)}</div>
            <div><strong>Status:</strong> {refund.status}</div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <strong>Reason:</strong> {refund.reason}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Financial Approval & Audit Note *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Governance compliance verification and approval notes"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
