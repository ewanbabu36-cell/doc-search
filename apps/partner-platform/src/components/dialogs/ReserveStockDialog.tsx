import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyPrescriptionDto,
  PharmacyBatchDto,
  ReserveStockRequest
} from '@docsearch/api-contracts';

export interface ReserveStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReserveStockRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  batches: PharmacyBatchDto[];
  tenantId: string;
}

export const ReserveStockDialog: React.FC<ReserveStockDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  batches,
  tenantId
}) => {
  const [selectedItemId, setSelectedItemId] = useState(prescription?.items[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [justification, setJustification] = useState('Stock pre-allocation prior to patient arrival at outpatient dispensary counter.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!prescription) return null;

  const selectedItem = prescription.items.find((i) => i.id === selectedItemId) || prescription.items[0];
  const eligibleBatches = batches.filter(
    (b) => b.medicationId === selectedItem?.medicationId && b.availableQuantity > 0 && b.status !== 'BLOCKED' && b.status !== 'EXPIRED'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedBatchId || quantity <= 0) {
      setError('Please select an item, an eligible stock batch, and valid reservation quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        prescriptionId: prescription.id,
        prescriptionItemId: selectedItem.id,
        medicationId: selectedItem.medicationId,
        batchId: selectedBatchId,
        quantity: Number(quantity),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reserve stock batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Pre-Reserve Batch Stock — ${prescription.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Reserving...' : 'Commit Stock Reservation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Prescription Line Item *
          </label>
          <Select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              setSelectedBatchId('');
            }}
            options={prescription.items.map((i) => ({
              value: i.id,
              label: `${i.medicationName} (Prescribed: ${i.prescribedQuantity} ${i.unit} | Remaining: ${i.remainingQuantity})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            FEFO Stock Batch Allocation *
          </label>
          <Select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            options={[
              { value: '', label: '-- Select Batch (Ordered by Earliest Expiry) --' },
              ...eligibleBatches.map((b) => ({
                value: b.id,
                label: `Batch ${b.batchNumber} (Available: ${b.availableQuantity} | Exp: ${new Date(b.expiryDate).toLocaleDateString()} — ${b.daysToExpiry}d remaining)`
              }))
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Reservation Quantity *
          </label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            max={selectedItem?.remainingQuantity || 100}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
