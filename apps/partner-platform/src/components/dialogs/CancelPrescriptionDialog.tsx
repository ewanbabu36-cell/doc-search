import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyPrescriptionDto,
  CancelPrescriptionRequest
} from '@docsearch/api-contracts';

export interface CancelPrescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CancelPrescriptionRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  tenantId: string;
}

export const CancelPrescriptionDialog: React.FC<CancelPrescriptionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  tenantId
}) => {
  const [cancellationReason, setCancellationReason] = useState('Order canceled by physician / patient request.');
  const [justification, setJustification] = useState('Clinical order cancellation logged with release of reserved stock.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!prescription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason || !justification) {
      setError('Please provide a cancellation reason and audit justification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        prescriptionId: prescription.id,
        cancellationReason: cancellationReason.trim(),
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel prescription order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Prescription Order — ${prescription.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Canceling...' : 'Confirm Order Cancellation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
          <div style={{ fontWeight: 600, color: '#991b1b' }}>
            Patient: {prescription.patientName} ({prescription.patientMrn})
          </div>
          <div style={{ fontSize: '0.825rem', color: '#b91c1c', marginTop: '0.25rem' }}>
            Prescribing Doctor: {prescription.prescribingDoctorName} | Status: {prescription.status}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cancellation Reason *
          </label>
          <Input
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Inpatient discharge changed, duplicate electronic order..."
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
