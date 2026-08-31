import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateProcurementItemRequest,
  ProcurementItemCategory
} from '@docsearch/api-contracts';

export interface CreateProcurementItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateProcurementItemRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateProcurementItemDialog: React.FC<CreateProcurementItemDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState<ProcurementItemCategory>('MEDICINE');
  const [subcategory, setSubcategory] = useState('Antibiotics');
  const [unit, setUnit] = useState('BOX');
  const [packSize, setPackSize] = useState('100');
  const [manufacturer, setManufacturer] = useState('MedPharma Labs');
  const [standardCost, setStandardCost] = useState('15.00');
  const [reorderLevel, setReorderLevel] = useState('50');
  const [safetyStock, setSafetyStock] = useState('20');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [justification, setJustification] = useState('New procurement catalog entry registered for clinical operations.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) {
      setError('Item Code and Item Name are mandatory.');
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
        itemCode: itemCode.trim().toUpperCase(),
        itemName: itemName.trim(),
        genericName: genericName.trim() || undefined,
        category,
        subcategory: subcategory.trim() || undefined,
        unit,
        packSize: parseInt(packSize, 10) || 1,
        manufacturer: manufacturer.trim() || undefined,
        standardCost: parseFloat(standardCost) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 50,
        safetyStock: parseInt(safetyStock, 10) || 20,
        minStock: 10,
        maxStock: 500,
        leadTimeDays: parseInt(leadTimeDays, 10) || 3,
        isControlled: false,
        isExpiryApplicable: true,
        isBatchApplicable: true,
        isSerialApplicable: false,
        actorId: 'James Vance',
        actorRole: 'Procurement Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add Procurement Catalog Item">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Item Code *
            </label>
            <Input
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="e.g. ITM-AMOX-500"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Product / Item Name *
            </label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Amoxicillin 500mg Oral Capsules (Box of 100)"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Generic Clinical Name
            </label>
            <Input
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Amoxicillin Trihydrate"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Subcategory
            </label>
            <Input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Antibiotics"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Manufacturer
            </label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. MedPharma Labs"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Category *
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProcurementItemCategory)}
              options={[
                { value: 'MEDICINE', label: 'Medicine / Therapeutic Rx' },
                { value: 'SURGICAL_CONSUMABLE', label: 'Surgical Consumable' },
                { value: 'LAB_REAGENT', label: 'Laboratory Reagent' },
                { value: 'MEDICAL_DEVICE', label: 'Medical Device / Equipment' },
                { value: 'PPE_SUPPLY', label: 'PPE & Safety' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Unit *
            </label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="BOX, VIAL, PCS" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Pack Size
            </label>
            <Input type="number" value={packSize} onChange={(e) => setPackSize(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Standard Cost ($)
            </label>
            <Input type="number" value={standardCost} onChange={(e) => setStandardCost(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Reorder Level
            </label>
            <Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Safety Buffer
            </label>
            <Input type="number" value={safetyStock} onChange={(e) => setSafetyStock(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Lead Time (Days)
            </label>
            <Input type="number" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
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
            {isSubmitting ? 'Adding...' : 'Add Catalog Item'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
