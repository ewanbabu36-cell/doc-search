import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ReconcileCashierSessionRequest,
  BillingCashierSessionDto
} from '@docsearch/api-contracts';

export interface ReconcileCashierSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReconcileCashierSessionRequest) => Promise<void>;
  session: BillingCashierSessionDto | null;
  tenantId: string;
}

export const ReconcileCashierSessionDialog: React.FC<ReconcileCashierSessionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  tenantId
}) => {
  const [actualAmount, setActualAmount] = useState(session?.closingBalance ? session.closingBalance.toString() : '200.00');
  const [remarks, setRemarks] = useState('Audit verification matched physical drawer cash and electronic batch receipts.');
  const [justification, setJustification] = useState('End of day formal treasury reconciliation completed.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const actualNum = parseFloat(actualAmount) || 0;
  const variance = actualNum - session.expectedClosingBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(actualNum) || actualNum < 0) {
      setError('Actual amount must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        sessionId: session.id,
        actualAmount: actualNum,
        remarks: remarks.trim() || undefined,
        actorId: 'Finance Supervisor Alice Wong',
        actorRole: 'Finance Auditor',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reconcile Cashier Shift — ${session.sessionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Reconciling...' : 'Confirm Reconciliation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Cashier:</strong> {session.cashierName}</div>
            <div><strong>Expected Drawer:</strong> ${session.expectedClosingBalance.toFixed(2)}</div>
            <div><strong>Counted Cash:</strong> ${actualNum.toFixed(2)}</div>
            <div>
              <strong>Calculated Variance:</strong>{' '}
              <span style={{ color: Math.abs(variance) < 0.01 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Verified Actual Amount ($) *
          </label>
          <Input
            type="number"
            value={actualAmount}
            onChange={(e) => setActualAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Auditor Remarks / Variance Justification
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Small change rounding difference accepted"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Treasury clearance confirmation reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
