import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  CancelInvestigationOrderRequest
} from '@docsearch/api-contracts';

export interface CancelInvestigationOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CancelInvestigationOrderRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const CancelInvestigationOrderDialog: React.FC<CancelInvestigationOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [reasonCategory, setReasonCategory] = useState('ORDERED_IN_ERROR');
  const [customReason, setCustomReason] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required for order cancellation.');
      return;
    }

    const fullReason = `${reasonCategory}: ${customReason || 'Investigation order discontinued by clinician.'}`;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        orderId: order.id,
        cancellationReason: fullReason,
        actorId: 'dr.sarah.jenkins@docsearch.docsearch.health',
        actorRole: 'ATTENDING_DOCTOR',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to cancel investigation order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🚫 Cancel Investigation Order"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Cancelling...' : 'Confirm Order Cancellation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <Alert type="warning" title="Irreversible Action">
          Cancelling this order stops specimen collection and processing. A cancelled order cannot receive results.
        </Alert>

        <div style={{ padding: '10px 14px', backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Order #:</strong> {order.orderNumber} — {order.investigationName}</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
          <div><strong>Current Status:</strong> {order.status}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Cancellation Reason Category *
          </label>
          <Select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            options={[
              { label: 'Ordered in error / Duplicate order', value: 'ORDERED_IN_ERROR' },
              { label: 'Patient refusal / Left before collection', value: 'PATIENT_REFUSED' },
              { label: 'Clinical condition changed / Test no longer indicated', value: 'CONDITION_CHANGED' },
              { label: 'Test performed elsewhere recently', value: 'PERFORMED_RECENTLY' },
              { label: 'Contraindication identified', value: 'CONTRAINDICATION' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Detailed Explanation
          </label>
          <Input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Clinical details explaining cancellation reason..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document authorization for cancellation..."
          />
        </div>
      </form>
    </Dialog>
  );
};
