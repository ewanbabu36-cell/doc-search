import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyBatchDto,
  StockAdjustmentReason,
  CreateStockAdjustmentRequest
} from '@docsearch/api-contracts';

export interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateStockAdjustmentRequest) => Promise<void>;
  batches: PharmacyBatchDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batches,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [reason, setReason] = useState<StockAdjustmentReason>('COUNT_CORRECTION');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || adjustmentQuantity === 0 || !justification) {
      setError('Please select a batch, a non-zero adjustment quantity, and a formal justification.');
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
        medicationId: selectedBatch.medicationId,
        batchId: selectedBatch.id,
        reason,
        adjustmentQuantity: Number(adjustmentQuantity),
        actorId: 'tech.inventory@docsearch.docsearch.health',
        actorRole: 'PHARMACY_INVENTORY_SPECIALIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stock adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Audited Stock Adjustment & Count Reconciliation"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adjusting...' : 'Commit Stock Adjustment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Target Inventory Batch *
          </label>
          <Select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            options={batches.map((b) => ({
              value: b.id,
              label: `${b.medicationName} — Batch ${b.batchNumber} (Current Qty: ${b.availableQuantity})`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Adjustment Reason *
            </label>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
              options={[
                { value: 'COUNT_CORRECTION', label: 'Physical Cycle Count Correction' },
                { value: 'DAMAGE', label: 'Damage in Storage' },
                { value: 'EXPIRY', label: 'Expired Product Write-off' },
                { value: 'LOSS', label: 'Loss / Unexplained Discrepancy' },
                { value: 'FOUND', label: 'Found Unrecorded Stock' },
                { value: 'SYSTEM_CORRECTION', label: 'Administrative System Correction' },
                { value: 'OTHER', label: 'Other Justified Reason' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Quantity Adjustment (+ / -) *
            </label>
            <Input
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              placeholder="e.g. -5 or +10"
              required
            />
          </div>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
          <div>Current Available Stock: <strong>{selectedBatch?.availableQuantity || 0}</strong></div>
          <div style={{ marginTop: '0.25rem' }}>
            Resulting Available Stock after Adjustment:{' '}
            <strong style={{ color: '#0369a1' }}>
              {Math.max(0, (selectedBatch?.availableQuantity || 0) + Number(adjustmentQuantity))}
            </strong>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Detailed Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document supervisor sign-off reference and physical audit date..."
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
