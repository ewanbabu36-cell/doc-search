import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreatePurchaseRequisitionRequest,
  ProcurementItemDto,
  ProcurementVendorDto,
  RequisitionPriority
} from '@docsearch/api-contracts';

export interface CreatePurchaseRequisitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreatePurchaseRequisitionRequest) => Promise<void>;
  items: ProcurementItemDto[];
  vendors: ProcurementVendorDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreatePurchaseRequisitionDialog: React.FC<CreatePurchaseRequisitionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  vendors,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [departmentName, setDepartmentName] = useState('Central Inpatient Pharmacy');
  const [storeName, setStoreName] = useState('Main Pharmacy Store A');
  const [requestedBy, setRequestedBy] = useState('Senior Pharmacist Helen Cho');
  const [requiredByDate, setRequiredByDate] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState<RequisitionPriority>('ROUTINE');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('20');
  const [reason, setReason] = useState('Monthly clinical replenishment based on inventory consumption trend.');
  const [suggestedVendorId, setSuggestedVendorId] = useState(vendors[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const selectedVendor = vendors.find((v) => v.id === suggestedVendorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select an item to procure.');
      return;
    }
    const qty = parseInt(quantity, 10);
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
        departmentName,
        storeName,
        requestedBy,
        requiredByDate: new Date(requiredByDate).toISOString(),
        priority,
        isEmergency: priority === 'EMERGENCY',
        reason: reason.trim(),
        suggestedVendorId: suggestedVendorId || undefined,
        suggestedVendorName: selectedVendor?.legalName || undefined,
        items: [
          {
            procurementItemId: selectedItem.id,
            itemCode: selectedItem.itemCode,
            itemName: selectedItem.itemName,
            quantity: qty,
            unit: selectedItem.unit,
            estimatedUnitPrice: selectedItem.standardCost
          }
        ],
        actorId: requestedBy,
        actorRole: 'Department Staff'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Raise Purchase Requisition (PR)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requesting Department *
            </label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Receiving Store / Vault *
            </label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requested By *
            </label>
            <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Required By Date *
            </label>
            <Input type="date" value={requiredByDate} onChange={(e) => setRequiredByDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Priority Tier *
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
              options={[
                { value: 'ROUTINE', label: 'Routine (Scheduled)' },
                { value: 'URGENT', label: 'Urgent (Low Buffer)' },
                { value: 'EMERGENCY', label: 'Emergency (Critical Stockout)' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Catalog Item to Procure *
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.itemCode} — {i.itemName} (${i.standardCost.toFixed(2)} / {i.unit})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requested Quantity ({selectedItem?.unit || 'Unit'}) *
            </label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Suggested Vendor
            </label>
            <select
              value={suggestedVendorId}
              onChange={(e) => setSuggestedVendorId(e.target.value)}
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
            Clinical & Operational Requisition Reason *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
