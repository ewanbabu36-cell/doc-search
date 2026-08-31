import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyBatchDto,
  UnblockBatchRequest
} from '@docsearch/api-contracts';

export interface UnblockBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: UnblockBatchRequest) => Promise<void>;
  batch: PharmacyBatchDto | null;
  tenantId: string;
}

export const UnblockBatchDialog: React.FC<UnblockBatchDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batch,
  tenantId
}) => {
  const [unblockReason, setUnblockReason] = useState('Certificate of Analysis (COA) cleared by Quality Control.');
  const [justification, setJustification] = useState('Pharmacist verified laboratory clearance report.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unblockReason || !justification) {
      setError('Please provide unblock reason and audit justification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        batchId: batch.id,
        unblockReason: unblockReason.trim(),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unblock batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Release Batch from Quarantine — ${batch.batchNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Releasing...' : 'Release Batch to Active Stock'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem' }}>
          <div style={{ fontWeight: 600, color: '#166534' }}>
            Medication: {batch.medicationName}
          </div>
          <div style={{ fontSize: '0.825rem', color: '#15803d', marginTop: '0.25rem' }}>
            Batch: {batch.batchNumber} | Quantity to Release: {batch.availableQuantity} units
          </div>
          {batch.blockReason && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              Previous Block Reason: {batch.blockReason}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Unblock & Release Authorization Reason *
          </label>
          <Input
            value={unblockReason}
            onChange={(e) => setUnblockReason(e.target.value)}
            placeholder="Document QA certificate reference..."
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
