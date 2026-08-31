import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateAuthorizationRequest,
  InsurancePatientPolicyDto
} from '@docsearch/api-contracts';

export interface CreateAuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateAuthorizationRequest) => Promise<void>;
  policies: InsurancePatientPolicyDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  defaultPolicy?: InsurancePatientPolicyDto | null;
}

export const CreateAuthorizationDialog: React.FC<CreateAuthorizationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  policies,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  defaultPolicy
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState(defaultPolicy?.id || policies[0]?.id || '');
  const [requestedServices, setRequestedServices] = useState('Contrast Enhanced Brain MRI with DWI Sequence');
  const [diagnosisContext, setDiagnosisContext] = useState('G44.209 — Tension-type headache, intractable');
  const [requestedAmount, setRequestedAmount] = useState('450.00');
  const [approvedUnits, setApprovedUnits] = useState('1');
  const [justification, setJustification] = useState('Clinical prior-authorization requested ahead of specialized diagnostic scan.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || defaultPolicy || policies[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) {
      setError('An active insurance policy is required.');
      return;
    }
    const amount = parseFloat(requestedAmount);
    const units = parseInt(approvedUnits, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Requested amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        patientId: selectedPolicy.patientId,
        policyId: selectedPolicy.id,
        payerId: selectedPolicy.payerId,
        requestedServices: requestedServices.trim(),
        diagnosisContext: diagnosisContext.trim(),
        requestedAmount: amount,
        approvedUnits: units || 1,
        actorId: 'Dr. Sarah Jenkins',
        actorRole: 'Attending Physician',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request authorization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Request Clinical Prior-Authorization"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Requesting...' : 'Submit Pre-Auth Request'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Patient Policy *
          </label>
          <Select
            value={selectedPolicyId}
            onChange={(e) => setSelectedPolicyId(e.target.value)}
            options={policies.map((p) => ({
              value: p.id,
              label: `${p.patientName} (${p.patientMrn}) — ${p.payerName} [${p.policyNumber}]`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Requested Services / Planned Procedures *
          </label>
          <Input
            value={requestedServices}
            onChange={(e) => setRequestedServices(e.target.value)}
            placeholder="e.g. Diagnostic Upper GI Endoscopy with Biopsy"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            ICD-10 Clinical Diagnosis & Medical Justification *
          </label>
          <Input
            value={diagnosisContext}
            onChange={(e) => setDiagnosisContext(e.target.value)}
            placeholder="e.g. K29.70 — Gastritis without bleeding, refractory to oral therapy"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Estimated Tariff / Requested Amount ($) *
            </label>
            <Input
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Requested Units / Days
            </label>
            <Input
              type="number"
              value={approvedUnits}
              onChange={(e) => setApprovedUnits(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Physician order and urgency note"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
