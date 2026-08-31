import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  MedicationCatalogDto,
  ReceiveStockRequest
} from '@docsearch/api-contracts';

export interface ReceiveStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReceiveStockRequest) => Promise<void>;
  medications: MedicationCatalogDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ReceiveStockDialog: React.FC<ReceiveStockDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  medications,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedMedicationId, setSelectedMedicationId] = useState(medications[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('2026-01-01');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [receivedQuantity, setReceivedQuantity] = useState<number>(100);
  const [unitCost, setUnitCost] = useState('1.50');
  const [purchaseReference, setPurchaseReference] = useState('');
  const [supplierReference, setSupplierReference] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicationId || !batchNumber || !manufacturer || !justification || receivedQuantity <= 0) {
      setError('Please provide all batch receiving fields and a valid audit justification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        medicationId: selectedMedicationId,
        batchNumber: batchNumber.trim(),
        manufacturer: manufacturer.trim(),
        manufacturingDate: new Date(manufacturingDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        receivedQuantity: Number(receivedQuantity),
        unitCost: unitCost.trim(),
        purchaseReference: purchaseReference.trim() || undefined,
        supplierReference: supplierReference.trim() || undefined,
        actorId: 'tech.inventory@docsearch.docsearch.health',
        actorRole: 'PHARMACY_INVENTORY_SPECIALIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to receive stock into batch ledger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Stock Batch (FEFO Inventory Intake)"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Receiving...' : 'Record Intake & Update Ledger'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Catalog Medication *
          </label>
          <Select
            value={selectedMedicationId}
            onChange={(e) => setSelectedMedicationId(e.target.value)}
            options={medications.map((m) => ({
              value: m.id,
              label: `${m.genericName} (${m.brandName}) — ${m.strength} [${m.dosageForm}]`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Batch / Lot Number *
            </label>
            <Input
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. AMX-2026-B02"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Manufacturer *
            </label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. Pfizer Inc."
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Manufacturing Date *
            </label>
            <Input
              type="date"
              value={manufacturingDate}
              onChange={(e) => setManufacturingDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Expiry Date (FEFO Key) *
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Received Quantity *
            </label>
            <Input
              type="number"
              value={receivedQuantity}
              onChange={(e) => setReceivedQuantity(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Unit Cost ($) *
            </label>
            <Input
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.50"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Purchase Order Ref
            </label>
            <Input
              value={purchaseReference}
              onChange={(e) => setPurchaseReference(e.target.value)}
              placeholder="PO-2026-XXXX"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Supplier Reference
            </label>
            <Input
              value={supplierReference}
              onChange={(e) => setSupplierReference(e.target.value)}
              placeholder="SUP-REF-XXXX"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Receiving Verification & Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document invoice number and physical pack integrity check..."
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
