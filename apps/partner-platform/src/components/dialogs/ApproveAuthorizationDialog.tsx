import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ApproveAuthorizationRequest,
  InsuranceAuthorizationDto
} from '@docsearch/api-contracts';

export interface ApproveAuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApproveAuthorizationRequest) => Promise<void>;
  authorization: InsuranceAuthorizationDto | null;
  tenantId: string;
}

export const ApproveAuthorizationDialog: React.FC<ApproveAuthorizationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  authorization,
  tenantId
}) => {
  const [approvedAmount, setApprovedAmount] = useState(authorization ? authorization.requestedAmount.toString() : '0.00');
  const [approvedUnits, setApprovedUnits] = useState(authorization ? authorization.approvedUnits.toString() : '1');
  const [validTo, setValidTo] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [payerRemarks, setPayerRemarks] = useState('Authorized in full per in-network institutional tariff schedule.');
  const [justification, setJustification] = useState('Payer authorization letter attached and recorded in authorization registry.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authorization) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appAmt = parseFloat(approvedAmount);
    const units = parseInt(approvedUnits, 10);
    if (isNaN(appAmt) || appAmt <= 0) {
      setError('Approved amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        authorizationId: authorization.id,
        approvedAmount: appAmt,
        approvedUnits: units || 1,
        validTo: validTo ? new Date(validTo).toISOString() : undefined,
        payerRemarks: payerRemarks.trim() || undefined,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve authorization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payer Approval — ${authorization.authorizationNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Confirm Payer Approval'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {authorization.patientName}</div>
            <div><strong>Payer:</strong> {authorization.payerName}</div>
            <div><strong>Requested Amount:</strong> ${authorization.requestedAmount.toFixed(2)}</div>
            <div><strong>Procedure:</strong> {authorization.requestedServices}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Approved Amount ($) *
            </label>
            <Input
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Approved Units
            </label>
            <Input
              type="number"
              value={approvedUnits}
              onChange={(e) => setApprovedUnits(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Approval Expiry Date
            </label>
            <Input
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Payer Approval Remarks / Conditions
          </label>
          <Input
            value={payerRemarks}
            onChange={(e) => setPayerRemarks(e.target.value)}
            placeholder="e.g. Approved for day-care outpatient endoscopy in network facility."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Payer approval letter reference ID"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
