import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateVendorReturnRequest,
  ProcurementItemDto,
  ProcurementVendorDto
} from '@docsearch/api-contracts';

export interface CreateVendorReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateVendorReturnRequest) => Promise<void>;
  vendors: ProcurementVendorDto[];
  items: ProcurementItemDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateVendorReturnDialog: React.FC<CreateVendorReturnDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  items,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [returnQuantity, setReturnQuantity] = useState('10');
  const [batchNumber, setBatchNumber] = useState('LOT-DEFECT-01');
  const [reason, setReason] = useState('Damaged packaging seal on delivered lot.');
  const [requestedBy, setRequestedBy] = useState('Store Officer Bob Rivera');
  const [justification, setJustification] = useState('Return-to-vendor (RTV) initiated following QC rejection.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !vendorId) {
      setError('Vendor and Item selection are required.');
      return;
    }
    const qty = parseInt(returnQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Return quantity must be greater than zero.');
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
        vendorId,
        reason: reason.trim(),
        requestedBy,
        items: [
          {
            procurementItemId: selectedItem.id,
            itemCode: selectedItem.itemCode,
            itemName: selectedItem.itemName,
            returnQuantity: qty,
            unitCost: selectedItem.standardCost,
            batchNumber: batchNumber.trim() || undefined,
            reason: reason.trim()
          }
        ],
        actorId: requestedBy,
        actorRole: 'Store Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Initiate Return-to-Vendor (RTV)">
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
            Item to Return *
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.itemCode} — {i.itemName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Return Quantity *
            </label>
            <Input type="number" value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Batch Number *
            </label>
            <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requested By *
            </label>
            <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Audit Justification *
            </label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Defect Category & Rejection Reason *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
