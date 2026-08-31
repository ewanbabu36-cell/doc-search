import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseInvoiceDto,
  MatchPurchaseInvoiceRequest
} from '@docsearch/api-contracts';

export interface MatchPurchaseInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: MatchPurchaseInvoiceRequest) => Promise<void>;
  invoice: PurchaseInvoiceDto | null;
  tenantId: string;
}

export const MatchPurchaseInvoiceDialog: React.FC<MatchPurchaseInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId
}) => {
  const [matchingType, setMatchingType] = useState<'TWO_WAY' | 'THREE_WAY'>('THREE_WAY');
  const [tolerancePercentage, setTolerancePercentage] = useState('1.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        purchaseInvoiceId: invoice.id,
        matchingType,
        tolerancePercentage: parseFloat(tolerancePercentage) || 1.0,
        actorId: 'Alice Wong',
        actorRole: 'Accounts Payable Specialist',
        justification: 'Automated 2-way / 3-way invoice matching executed.'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute invoice matching.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Run Match: ${invoice.invoiceNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Vendor:</strong> {invoice.vendorName}</div>
          <div><strong>Vendor Inv #:</strong> {invoice.vendorInvoiceNumber}</div>
          <div><strong>Linked PO:</strong> {invoice.poNumber || 'None'}</div>
          <div><strong>Total Billed:</strong> ${invoice.totalAmount.toFixed(2)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Matching Rule *
            </label>
            <Select
              value={matchingType}
              onChange={(e) => setMatchingType(e.target.value as 'TWO_WAY' | 'THREE_WAY')}
              options={[
                { value: 'THREE_WAY', label: '3-Way Match (PO ↔ GRN ↔ Invoice)' },
                { value: 'TWO_WAY', label: '2-Way Match (PO ↔ Invoice)' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Tolerance Variance Threshold (%)
            </label>
            <Input
              type="number"
              value={tolerancePercentage}
              onChange={(e) => setTolerancePercentage(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Matching...' : 'Execute Match Algorithm'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
