import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  OpenCashierSessionRequest
} from '@docsearch/api-contracts';

export interface OpenCashierSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: OpenCashierSessionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const OpenCashierSessionDialog: React.FC<OpenCashierSessionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [cashierId, setCashierId] = useState('STAFF-CASHIER-01');
  const [cashierName, setCashierName] = useState('John Cooper');
  const [openingBalance, setOpeningBalance] = useState('150.00');
  const [justification, setJustification] = useState('Workstation cash drawer float verified and shift opened.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmt = parseFloat(openingBalance);
    if (isNaN(floatAmt) || floatAmt < 0) {
      setError('Opening balance must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        cashierId: cashierId.trim(),
        cashierName: cashierName.trim(),
        openingBalance: floatAmt,
        actorId: cashierName.trim(),
        actorRole: 'Cashier Staff',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to open cashier session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Open Cashier Workstation Shift Session"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Opening Session...' : 'Open Workstation Shift'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Cashier Staff ID *
            </label>
            <Input
              value={cashierId}
              onChange={(e) => setCashierId(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Cashier Full Name *
            </label>
            <Input
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Opening Cash Float ($) *
          </label>
          <Input
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="150.00"
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
            placeholder="Shift opening handover reference and physical float confirmation"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
