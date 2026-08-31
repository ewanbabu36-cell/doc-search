import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  DenyAuthorizationRequest,
  InsuranceAuthorizationDto
} from '@docsearch/api-contracts';

export interface DenyAuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: DenyAuthorizationRequest) => Promise<void>;
  authorization: InsuranceAuthorizationDto | null;
  tenantId: string;
}

export const DenyAuthorizationDialog: React.FC<DenyAuthorizationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  authorization,
  tenantId
}) => {
  const [payerRemarks, setPayerRemarks] = useState('Medical necessity documentation insufficient under policy clause 4.2.');
  const [justification, setJustification] = useState('Payer formal denial letter received and recorded in pre-authorization registry.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authorization) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerRemarks.trim()) {
      setError('Payer remarks / denial reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        authorizationId: authorization.id,
        payerRemarks: payerRemarks.trim(),
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record authorization denial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Pre-Authorization Denial — ${authorization.authorizationNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Denial'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="warning">
          <strong>Pre-Authorization Denial Notice:</strong> Recording this denial will transition pre-auth <strong>{authorization.authorizationNumber}</strong> to DENIED. The patient will be notified that the procedure is not covered cashless unless an appeal or alternative clinical justification is lodged.
        </Alert>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {authorization.patientName}</div>
            <div><strong>Payer:</strong> {authorization.payerName}</div>
            <div><strong>Requested Amount:</strong> ${authorization.requestedAmount.toFixed(2)}</div>
            <div><strong>Procedure:</strong> {authorization.requestedServices}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Payer Denial Reason / Policy Clause *
          </label>
          <Input
            value={payerRemarks}
            onChange={(e) => setPayerRemarks(e.target.value)}
            placeholder="e.g. Non-covered cosmetic procedure, prior conservative treatment required"
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
            placeholder="Payer official letter reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
