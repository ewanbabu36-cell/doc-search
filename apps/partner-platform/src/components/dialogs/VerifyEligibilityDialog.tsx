import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  VerifyInsuranceEligibilityRequest,
  InsurancePatientPolicyDto
} from '@docsearch/api-contracts';

export interface VerifyEligibilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: VerifyInsuranceEligibilityRequest) => Promise<void>;
  policy: InsurancePatientPolicyDto | null;
  tenantId: string;
}

export const VerifyEligibilityDialog: React.FC<VerifyEligibilityDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  policy,
  tenantId
}) => {
  const [justification, setJustification] = useState('Point-of-care ANSI 270 real-time electronic eligibility inquiry dispatched.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!policy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId: policy.partnerId,
        organizationId: policy.organizationId,
        branchId: policy.branchId || undefined,
        patientId: policy.patientId,
        policyId: policy.id,
        payerId: policy.payerId,
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query real-time eligibility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Electronic Eligibility & Benefit Verification (270/271)"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Inquiring Payer...' : 'Run Real-Time Eligibility Query'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Patient:</strong> {policy.patientName}</div>
            <div><strong>MRN:</strong> {policy.patientMrn}</div>
            <div><strong>Payer:</strong> {policy.payerName}</div>
            <div><strong>Plan:</strong> {policy.planName}</div>
            <div><strong>Member ID:</strong> {policy.memberId}</div>
            <div><strong>Policy #:</strong> {policy.policyNumber}</div>
          </div>
        </div>

        <Alert type="info">
          Dispatching an ANSI X12 270 benefit request to <strong>{policy.payerName}</strong>. This inquiry checks active policy enrollment, deductible remaining, copay percentages, and procedure pre-authorization requirements.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Clinical encounter reason or check reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
