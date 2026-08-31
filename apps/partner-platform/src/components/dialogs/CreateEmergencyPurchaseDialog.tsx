import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateEmergencyPurchaseRequest,
  ProcurementItemDto,
  ProcurementVendorDto
} from '@docsearch/api-contracts';

export interface CreateEmergencyPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateEmergencyPurchaseRequest) => Promise<void>;
  vendors: ProcurementVendorDto[];
  items: ProcurementItemDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateEmergencyPurchaseDialog: React.FC<CreateEmergencyPurchaseDialogProps> = ({
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
  const [departmentName, setDepartmentName] = useState('Emergency Department (ED)');
  const [storeName, setStoreName] = useState('Emergency Crash Cart Vault');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [orderedQuantity, setOrderedQuantity] = useState('10');
  const [clinicalReason, setClinicalReason] = useState('Emergency trauma resuscitation surge depleted critical injectables.');
  const [justification, setJustification] = useState('Emergency bypass procurement authorized under clinical life-safety protocol.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !vendorId) {
      setError('Vendor and Item selection are required.');
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
        departmentName,
        storeName,
        vendorId,
        clinicalReason: clinicalReason.trim(),
        justification: justification.trim(),
        deliveryLocation: 'Emergency Department Bay 1, DOC SEARCH Hospital',
        items: [
          {
            procurementItemId: selectedItem.id,
            itemCode: selectedItem.itemCode,
            itemName: selectedItem.itemName,
            orderedQuantity: qty,
            unit: selectedItem.unit,
            unitPrice: selectedItem.standardCost
          }
        ],
        actorId: 'Dr. Robert Harrison',
        actorRole: 'Chief Medical Officer'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute emergency purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Emergency Clinical Purchase Protocol">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="error">
          <strong>CRITICAL PROTOCOL:</strong> Emergency procurement executes immediate expedited order transmission. All actions are logged to the High-Visibility Audit Vault.
        </Alert>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requesting Department *
            </label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Target Emergency Vault *
            </label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Emergency Vendor *
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vendorCode} — {v.legalName} (Lead Time: {v.leadTimeDays}d)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Critical Item *
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
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Quantity *
            </label>
            <Input type="number" value={orderedQuantity} onChange={(e) => setOrderedQuantity(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Clinical Life-Safety Reason *
          </label>
          <Input value={clinicalReason} onChange={(e) => setClinicalReason(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Post-Facto Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting...' : 'Authorize Emergency Purchase'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
