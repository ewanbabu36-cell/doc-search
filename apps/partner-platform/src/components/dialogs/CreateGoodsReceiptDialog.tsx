import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto,
  CreateGoodsReceiptRequest
} from '@docsearch/api-contracts';

export interface CreateGoodsReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateGoodsReceiptRequest) => Promise<void>;
  purchaseOrder: PurchaseOrderDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateGoodsReceiptDialog: React.FC<CreateGoodsReceiptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [deliveryDocumentNumber, setDeliveryDocumentNumber] = useState('');
  const [invoiceReferenceNumber, setInvoiceReferenceNumber] = useState('');
  const [receivingDepartment, setReceivingDepartment] = useState('Central Receiving Dock');
  const [storeName, setStoreName] = useState('Main Pharmacy Store A');
  const [receivedBy, setReceivedBy] = useState('Receiving Officer Bob Rivera');
  const [batchNumber, setBatchNumber] = useState('LOT-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [receivedQuantity, setReceivedQuantity] = useState(purchaseOrder?.items[0]?.orderedQuantity.toString() || '50');
  const [justification, setJustification] = useState('Consignment physical delivery received at receiving bay.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchaseOrder) return null;
  const firstItem = purchaseOrder.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstItem) {
      setError('PO contains no line items to receive.');
      return;
    }
    const qty = parseInt(receivedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Received quantity must be greater than zero.');
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
        purchaseOrderId: purchaseOrder.id,
        deliveryDocumentNumber: deliveryDocumentNumber.trim() || undefined,
        invoiceReferenceNumber: invoiceReferenceNumber.trim() || undefined,
        receivedDate: new Date().toISOString(),
        receivingDepartment,
        storeName,
        receivedBy,
        items: [
          {
            purchaseOrderItemId: firstItem.id,
            procurementItemId: firstItem.procurementItemId,
            itemCode: firstItem.itemCode,
            itemName: firstItem.itemName,
            receivedQuantity: qty,
            unitPrice: firstItem.unitPrice,
            batchNumber: batchNumber.trim() || undefined,
            expiryDate: new Date(expiryDate).toISOString()
          }
        ],
        actorId: receivedBy,
        actorRole: 'Receiving Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create Goods Receipt Note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Receive Goods (GRN) for ${purchaseOrder.poNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Delivery Challan #
            </label>
            <Input
              value={deliveryDocumentNumber}
              onChange={(e) => setDeliveryDocumentNumber(e.target.value)}
              placeholder="e.g. DC-99102"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Supplier Invoice Reference #
            </label>
            <Input
              value={invoiceReferenceNumber}
              onChange={(e) => setInvoiceReferenceNumber(e.target.value)}
              placeholder="e.g. INV-88190"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Received Quantity ({firstItem?.unit || 'Unit'}) *
            </label>
            <Input type="number" value={receivedQuantity} onChange={(e) => setReceivedQuantity(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Manufacturer Batch # *
            </label>
            <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Expiry Date *
            </label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Receiving Department
            </label>
            <Input value={receivingDepartment} onChange={(e) => setReceivingDepartment(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Store Location
            </label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Received By
            </label>
            <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
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
            {isSubmitting ? 'Creating GRN...' : 'Generate GRN & Route to QC'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
