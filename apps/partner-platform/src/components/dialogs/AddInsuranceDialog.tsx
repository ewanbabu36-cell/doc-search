import React, { useState } from 'react';
import type {
  PatientDto,
  InsuranceCoverageType,
  AddPatientInsuranceRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddInsuranceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDto;
  actorId: string;
  actorRole: string;
  onAddInsurance: (req: AddPatientInsuranceRequest) => Promise<void>;
}

export const AddInsuranceDialog: React.FC<AddInsuranceDialogProps> = ({
  isOpen,
  onClose,
  patient,
  actorId,
  actorRole,
  onAddInsurance
}) => {
  const [payerName, setPayerName] = useState('Blue Cross Blue Shield');
  const [policyNumber, setPolicyNumber] = useState('POL-881290-SAMPLE');
  const [memberId, setMemberId] = useState('MEM-3321-SAMPLE');
  const [planName, setPlanName] = useState('Comprehensive Commercial Tier 1');
  const [tpaName, setTpaName] = useState('National Health TPA');
  const [coverageType, setCoverageType] = useState<InsuranceCoverageType>('PRIMARY');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [reason, setReason] = useState('Attaching verified patient insurance policy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim() || !policyNumber.trim() || !memberId.trim()) {
      setError('Payer name, policy number, and member ID are required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddInsurance({
        actorId,
        actorRole,
        tenantId: patient.tenantId,
        partnerId: patient.partnerId,
        organizationId: patient.organizationId,
        patientId: patient.id,
        payerName,
        policyNumber,
        memberId,
        planName,
        tpaName: tpaName || undefined,
        coverageType,
        coverageStartDate: new Date(startDate).toISOString(),
        coverageEndDate: endDate ? new Date(endDate).toISOString() : undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach insurance policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Insurance Policy: ${patient.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Attach Insurance Policy
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Third-Party Payer Foundation">
          Stores payer, policy, member, and TPA eligibility metadata for hospital billing and claims verification.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Insurance Provider / Payer Name *
          </label>
          <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Policy / Contract Number *
            </label>
            <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Subscriber / Member ID *
            </label>
            <Input value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Health Plan Name *
            </label>
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              TPA Administrator (Optional)
            </label>
            <Input value={tpaName} onChange={(e) => setTpaName(e.target.value)} placeholder="e.g. National Health TPA" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Coverage Tier
            </label>
            <Select
              value={coverageType}
              onChange={(e) => setCoverageType(e.target.value as InsuranceCoverageType)}
              options={[
                { value: 'PRIMARY', label: 'Primary Insurance' },
                { value: 'SECONDARY', label: 'Secondary Insurance' },
                { value: 'TERTIARY', label: 'Tertiary Insurance' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Effective Date *
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Expiration Date
            </label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verified active commercial insurance card with payer gateway"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
