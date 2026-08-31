import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  RegisterPatientPolicyRequest,
  InsurancePayerDto,
  InsurancePlanDto,
  SubscriberRelationship,
  PolicyPriority
} from '@docsearch/api-contracts';

export interface RegisterPatientPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RegisterPatientPolicyRequest) => Promise<void>;
  payers: InsurancePayerDto[];
  plans: InsurancePlanDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  defaultPatient?: { id: string; name: string; mrn: string };
}

export const RegisterPatientPolicyDialog: React.FC<RegisterPatientPolicyDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payers,
  plans,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  defaultPatient
}) => {
  const [patientId] = useState(defaultPatient?.id || '55555555-5555-4555-8555-555555555501');
  const [patientName, setPatientName] = useState(defaultPatient?.name || 'Eleanor Vance');
  const [patientMrn, setPatientMrn] = useState(defaultPatient?.mrn || 'MRN-2026-00891');
  const [payerId, setPayerId] = useState(payers[0]?.id || '');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [memberId, setMemberId] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [subscriberName, setSubscriberName] = useState(defaultPatient?.name || 'Eleanor Vance');
  const [subscriberRelationship, setSubscriberRelationship] = useState<SubscriberRelationship>('SELF');
  const [priority, setPriority] = useState<PolicyPriority>('PRIMARY');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [justification, setJustification] = useState('Patient insurance card verified and policy registered at front desk.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPlans = plans.filter((p) => !payerId || p.payerId === payerId);

  const handlePayerChange = (newPayerId: string) => {
    setPayerId(newPayerId);
    const related = plans.filter((p) => p.payerId === newPayerId);
    if (related.length > 0 && related[0]) {
      setPlanId(related[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerId || !planId || !memberId.trim() || !policyNumber.trim() || !subscriberName.trim()) {
      setError('Payer, Plan, Member ID, Policy Number, and Subscriber Name are required.');
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
        patientId,
        patientName: patientName.trim(),
        patientMrn: patientMrn.trim(),
        payerId,
        planId,
        memberId: memberId.trim().toUpperCase(),
        policyNumber: policyNumber.trim().toUpperCase(),
        groupNumber: groupNumber.trim() || undefined,
        subscriberName: subscriberName.trim(),
        subscriberRelationship,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
        priority,
        actorId: 'Registration Officer Bob Rivera',
        actorRole: 'Patient Access Coordinator',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register patient policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Patient Insurance Policy"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enrolling...' : 'Register Policy'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient MRN *
            </label>
            <Input
              value={patientMrn}
              onChange={(e) => setPatientMrn(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Insurance Company / Payer *
            </label>
            <Select
              value={payerId}
              onChange={(e) => handlePayerChange(e.target.value)}
              options={payers.map((p) => ({ value: p.id, label: p.payerName }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Benefit Plan *
            </label>
            <Select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              options={filteredPlans.map((pl) => ({ value: pl.id, label: pl.planName }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Member ID / Beneficiary ID *
            </label>
            <Input
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. MEM-BS-99081"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Policy / Certificate Number *
            </label>
            <Input
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g. POL-BS-2026-8819"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Group / Corporate Number
            </label>
            <Input
              value={groupNumber}
              onChange={(e) => setGroupNumber(e.target.value)}
              placeholder="e.g. GRP-TECH-770"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Subscriber Name *
            </label>
            <Input
              value={subscriberName}
              onChange={(e) => setSubscriberName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Relationship to Subscriber *
            </label>
            <Select
              value={subscriberRelationship}
              onChange={(e) => setSubscriberRelationship(e.target.value as SubscriberRelationship)}
              options={[
                { value: 'SELF', label: 'Self (Policy Holder)' },
                { value: 'SPOUSE', label: 'Spouse' },
                { value: 'CHILD', label: 'Child / Dependent' },
                { value: 'PARENT', label: 'Parent' },
                { value: 'EMPLOYEE', label: 'Corporate Employee' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Coverage Priority *
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PolicyPriority)}
              options={[
                { value: 'PRIMARY', label: 'Primary Payer' },
                { value: 'SECONDARY', label: 'Secondary / COB' },
                { value: 'TERTIARY', label: 'Tertiary Coverage' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Effective Start Date *
            </label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Policy Expiry Date
            </label>
            <Input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
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
            placeholder="Physical card verification audit notes"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
