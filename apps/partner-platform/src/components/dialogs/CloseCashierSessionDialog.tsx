import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CloseCashierSessionRequest,
  BillingCashierSessionDto
} from '@docsearch/api-contracts';

export interface CloseCashierSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CloseCashierSessionRequest) => Promise<void>;
  session: BillingCashierSessionDto | null;
  tenantId: string;
}

export const CloseCashierSessionDialog: React.FC<CloseCashierSessionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  tenantId
}) => {
  const [closingBalance, setClosingBalance] = useState(session ? session.expectedClosingBalance.toString() : '200.00');
  const [notes, setNotes] = useState('Physical cash counted and matched drawer receipts.');
  const [justification, setJustification] = useState('End of shift cash drawer closure and count submission.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const closeAmt = parseFloat(closingBalance);
    if (isNaN(closeAmt) || closeAmt < 0) {
      setError('Closing balance must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        sessionId: session.id,
        closingBalance: closeAmt,
        notes: notes.trim() || undefined,
        actorId: session.cashierName,
        actorRole: 'Cashier Staff',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close cashier session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Cashier Session ${session.sessionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Closing...' : 'Close & Submit Shift'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Cashier:</strong> {session.cashierName}</div>
            <div><strong>Opening Float:</strong> ${session.openingBalance.toFixed(2)}</div>
            <div><strong>Cash Collected:</strong> ${session.cashReceived.toFixed(2)}</div>
            <div><strong>Cash Refunded:</strong> ${session.cashRefunded.toFixed(2)}</div>
            <div><strong>Expected Drawer:</strong> ${session.expectedClosingBalance.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Actual Physical Cash Count ($) *
          </label>
          <Input
            type="number"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Closing Remarks / Shift Notes
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified by night shift supervisor"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Drawer lock and reconciliation handover reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
