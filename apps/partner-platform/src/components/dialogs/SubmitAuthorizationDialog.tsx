import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  SubmitAuthorizationRequest,
  InsuranceAuthorizationDto
} from '@docsearch/api-contracts';

export interface SubmitAuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: SubmitAuthorizationRequest) => Promise<void>;
  authorization: InsuranceAuthorizationDto | null;
  tenantId: string;
}

export const SubmitAuthorizationDialog: React.FC<SubmitAuthorizationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  authorization,
  tenantId
}) => {
  const [justification, setJustification] = useState('Pre-authorization packet transmitted electronically to payer review desk.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authorization) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        authorizationId: authorization.id,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit authorization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Transmit Pre-Authorization ${authorization.authorizationNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting...' : 'Submit to Payer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {authorization.patientName}</div>
            <div><strong>MRN:</strong> {authorization.patientMrn}</div>
            <div><strong>Payer:</strong> {authorization.payerName}</div>
            <div><strong>Policy #:</strong> {authorization.policyNumber}</div>
            <div><strong>Requested Amount:</strong> ${authorization.requestedAmount.toFixed(2)}</div>
            <div><strong>Planned Service:</strong> {authorization.requestedServices}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Payer transmission portal reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
