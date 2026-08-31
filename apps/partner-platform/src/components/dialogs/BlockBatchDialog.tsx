import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyBatchDto,
  BlockBatchRequest
} from '@docsearch/api-contracts';

export interface BlockBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: BlockBatchRequest) => Promise<void>;
  batch: PharmacyBatchDto | null;
  tenantId: string;
}

export const BlockBatchDialog: React.FC<BlockBatchDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batch,
  tenantId
}) => {
  const [blockReason, setBlockReason] = useState('Quality quarantine hold: manufacturer recall / packaging investigation.');
  const [justification, setJustification] = useState('Immediate safety quarantine hold engaged by supervising pharmacist.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReason || !justification) {
      setError('Please provide a quarantine block reason and audit justification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        batchId: batch.id,
        blockReason: blockReason.trim(),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Quarantine & Block Batch — ${batch.batchNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Blocking...' : 'Place Batch Under Quarantine'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
          <div style={{ fontWeight: 600, color: '#991b1b' }}>
            Medication: {batch.medicationName}
          </div>
          <div style={{ fontSize: '0.825rem', color: '#b91c1c', marginTop: '0.25rem' }}>
            Batch: {batch.batchNumber} | Available Units: {batch.availableQuantity} | Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.5rem' }}>
            ⚠️ Placing this batch on block will immediately prevent it from being allocated or dispensed.
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Quarantine Block Reason *
          </label>
          <Input
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="e.g. Temperature excursion during transit, manufacturer recall notice..."
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
