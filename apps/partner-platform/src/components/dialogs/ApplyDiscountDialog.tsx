import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  ApplyDiscountRequest,
  DiscountType,
  BillingInvoiceDto
} from '@docsearch/api-contracts';

export interface ApplyDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApplyDiscountRequest) => Promise<void>;
  invoice: BillingInvoiceDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
}

export const ApplyDiscountDialog: React.FC<ApplyDiscountDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [reason, setReason] = useState('Senior citizen healthcare concession waiver.');
  const [justification, setJustification] = useState('Authorized executive discount applied to invoice balance.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than zero.');
      return;
    }
    if (discountType === 'PERCENTAGE' && val > 100) {
      setError('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        invoiceId: invoice.id,
        discountType,
        discountValue: val,
        reason: reason.trim(),
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply discount.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply Authorized Discount — ${invoice.invoiceNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Applying...' : 'Apply Discount'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Patient:</strong> {invoice.patientName}</div>
            <div><strong>Total Amount:</strong> ${invoice.totalAmount.toFixed(2)}</div>
            <div><strong>Current Due:</strong> ${invoice.dueAmount.toFixed(2)}</div>
            <div><strong>Current Discounts:</strong> ${invoice.discountTotal.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Discount Type *
            </label>
            <Select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED_AMOUNT', label: 'Fixed Amount ($)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount ($) *'}
            </label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'PERCENTAGE' ? '10' : '25.00'}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Discount Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Senior Citizen, Staff Concession, Hardship Program"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Management Approval & Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Reason for concession approval"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
