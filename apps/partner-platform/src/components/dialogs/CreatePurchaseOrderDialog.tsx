import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreatePurchaseOrderRequest,
  ProcurementItemDto,
  ProcurementVendorDto,
  PurchaseRequisitionDto
} from '@docsearch/api-contracts';

export interface CreatePurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreatePurchaseOrderRequest) => Promise<void>;
  vendors: ProcurementVendorDto[];
  items: ProcurementItemDto[];
  requisition?: PurchaseRequisitionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  items,
  requisition,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vendorId, setVendorId] = useState(requisition?.suggestedVendorId || vendors[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState(requisition?.items[0]?.procurementItemId || items[0]?.id || '');
  const [orderedQuantity, setOrderedQuantity] = useState(requisition?.items[0]?.quantity.toString() || '50');
  const [deliveryLocation, setDeliveryLocation] = useState('Central Receiving Dock #2, DOC SEARCH General Hospital');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('Standard hospital dock delivery with cold-chain verification if applicable.');
  const [justification, setJustification] = useState('Official PO generated from approved departmental requisition.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVendor = vendors.find((v) => v.id === vendorId) || vendors[0];
  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !selectedItem) {
      setError('Vendor and Item selection are mandatory.');
      return;
    }
    const qty = parseInt(orderedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than zero.');
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
        requisitionId: requisition?.id || undefined,
        requisitionNumber: requisition?.requisitionNumber || undefined,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.legalName,
        deliveryLocation,
        expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
        paymentTerms: 'NET_' + selectedVendor.paymentTermsDays,
        shippingTerms: 'FOB_DESTINATION',
        isEmergency: requisition?.isEmergency || false,
        notes: notes.trim() || undefined,
        items: [
          {
            procurementItemId: selectedItem.id,
            itemCode: selectedItem.itemCode,
            itemName: selectedItem.itemName,
            orderedQuantity: qty,
            unit: selectedItem.unit,
            unitPrice: selectedItem.standardCost,
            discountAmount: 0,
            taxAmount: 0
          }
        ],
        actorId: 'James Vance',
        actorRole: 'Purchase Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Issue Official Purchase Order (PO)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

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

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Catalog Line Item *
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.itemCode} — {i.itemName} (${i.standardCost.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Ordered Quantity *
            </label>
            <Input type="number" value={orderedQuantity} onChange={(e) => setOrderedQuantity(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Expected Delivery Date *
            </label>
            <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Delivery Location & Dock *
          </label>
          <Input value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Purchase Order Notes
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            {isSubmitting ? 'Issuing...' : 'Generate & Issue PO'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
