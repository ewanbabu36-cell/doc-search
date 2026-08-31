import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreatePurchaseInvoiceRequest,
  ProcurementVendorDto,
  PurchaseOrderDto
} from '@docsearch/api-contracts';

export interface CreatePurchaseInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreatePurchaseInvoiceRequest) => Promise<void>;
  vendors: ProcurementVendorDto[];
  purchaseOrders: PurchaseOrderDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreatePurchaseInvoiceDialog: React.FC<CreatePurchaseInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  purchaseOrders,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [purchaseOrderId, setPurchaseOrderId] = useState(purchaseOrders[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [totalAmount, setTotalAmount] = useState('1845.38');
  const [justification, setJustification] = useState('Supplier bill received and logged for accounts payable 3-way matching.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorInvoiceNumber.trim() || !vendorId) {
      setError('Vendor Invoice Number and Vendor selection are required.');
      return;
    }
    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Total amount must be greater than zero.');
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
        vendorInvoiceNumber: vendorInvoiceNumber.trim(),
        vendorId,
        purchaseOrderId: purchaseOrderId || undefined,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        subtotal: amt,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amt,
        actorId: 'Alice Wong',
        actorRole: 'Accounts Payable Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record supplier invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Record Supplier Invoice (AP)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Supplier Invoice # *
            </label>
            <Input
              value={vendorInvoiceNumber}
              onChange={(e) => setVendorInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-MEDP-78192"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor *
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendorCode} — {v.legalName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Linked Purchase Order
          </label>
          <select
            value={purchaseOrderId}
            onChange={(e) => setPurchaseOrderId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.poNumber} — {po.vendorName} (${po.totalNetAmount.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Invoice Date *
            </label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Due Date *
            </label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Invoice Total ($) *
            </label>
            <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Invoice'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
