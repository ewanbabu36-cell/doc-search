import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyDispensingDto,
  ReverseDispensingRequest
} from '@docsearch/api-contracts';

export interface ReverseDispensingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReverseDispensingRequest) => Promise<void>;
  dispensing: PharmacyDispensingDto | null;
  tenantId: string;
}

export const ReverseDispensingDialog: React.FC<ReverseDispensingDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dispensing,
  tenantId
}) => {
  const [reversalReason, setReversalReason] = useState('Dispensing committed in error before patient payment confirmation / order recall.');
  const [justification, setJustification] = useState('Supervisor authorized complete transaction rollback and batch inventory restoration.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dispensing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalReason || !justification) {
      setError('Please provide a reversal reason and audit justification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        dispensingId: dispensing.id,
        reversalReason: reversalReason.trim(),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reverse dispensing transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reverse Dispensing Transaction — ${dispensing.dispensingNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Reversing...' : 'Execute Reversal & Restore Inventory'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
          <div style={{ fontWeight: 600, color: '#991b1b' }}>
            Patient: {dispensing.patientName} ({dispensing.patientMrn})
          </div>
          <div style={{ fontSize: '0.825rem', color: '#b91c1c', marginTop: '0.25rem' }}>
            Prescription: {dispensing.prescriptionNumber} | Mode: {dispensing.dispensingMode}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.5rem' }}>
            ⚠️ Reversing this transaction will restore stock to the original batches and record an audited ledger reversal entry.
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Reversal Reason *
          </label>
          <Input
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            placeholder="e.g. Dispensed wrong formulation, canceled before patient handover..."
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
