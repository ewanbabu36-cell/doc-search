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
  TransferStockRequest
} from '@docsearch/api-contracts';

export interface TransferStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: TransferStockRequest) => Promise<void>;
  batches: PharmacyBatchDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  sourceBranchId: string;
}

export const TransferStockDialog: React.FC<TransferStockDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batches,
  tenantId,
  partnerId,
  organizationId,
  sourceBranchId
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [destinationBranchId, setDestinationBranchId] = useState('88888888-2222-4888-8888-222222222202');
  const [quantity, setQuantity] = useState<number>(10);
  const [justification, setJustification] = useState('Inter-facility transfer to replenish emergency buffer.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || quantity <= 0 || !destinationBranchId || !justification) {
      setError('Please provide all mandatory transfer attributes.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        sourceBranchId,
        destinationBranchId,
        medicationId: selectedBatch.medicationId,
        batchId: selectedBatch.id,
        quantity: Number(quantity),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inter-facility transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Inter-Facility Stock Transfer"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Transferring...' : 'Execute Stock Transfer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Source Batch to Transfer *
          </label>
          <Select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            options={batches.map((b) => ({
              value: b.id,
              label: `${b.medicationName} — Batch ${b.batchNumber} (Available: ${b.availableQuantity})`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Destination Branch Facility *
            </label>
            <Select
              value={destinationBranchId}
              onChange={(e) => setDestinationBranchId(e.target.value)}
              options={[
                { value: '88888888-2222-4888-8888-222222222202', label: 'Apex North Suburban Clinic' },
                { value: '88888888-3333-4888-8888-333333333303', label: 'Apex West Emergency Outpost' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Transfer Quantity *
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              max={selectedBatch?.availableQuantity || 1}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Transfer Request Justification *
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
