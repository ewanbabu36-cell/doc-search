import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreatePayerRequest,
  PayerType,
  ClaimSubmissionMode
} from '@docsearch/api-contracts';

export interface CreatePayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreatePayerRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreatePayerDialog: React.FC<CreatePayerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [payerCode, setPayerCode] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerType, setPayerType] = useState<PayerType>('COMMERCIAL_INSURANCE');
  const [tpaName, setTpaName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [claimSubmissionMode, setClaimSubmissionMode] = useState<ClaimSubmissionMode>('EDI_ELECTRONIC');
  const [electronicPayerId, setElectronicPayerId] = useState('');
  const [settlementPeriodDays, setSettlementPeriodDays] = useState('30');
  const [justification, setJustification] = useState('Institutional credentialing and tariff agreement onboarded.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerCode.trim() || !payerName.trim()) {
      setError('Payer code and legal payer name are required.');
      return;
    }
    const days = parseInt(settlementPeriodDays, 10);
    if (isNaN(days) || days <= 0) {
      setError('Settlement period must be a positive number of days.');
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
        payerCode: payerCode.trim().toUpperCase(),
        payerName: payerName.trim(),
        payerType,
        tpaName: tpaName.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        claimSubmissionMode,
        electronicPayerId: electronicPayerId.trim() || undefined,
        settlementPeriodDays: days,
        actorId: 'Insurance Administrator Alice Wong',
        actorRole: 'Insurance Operations Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register insurance payer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register Insurance Company / TPA Payer"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register Payer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payer Code *
            </label>
            <Input
              value={payerCode}
              onChange={(e) => setPayerCode(e.target.value)}
              placeholder="e.g. PAYER-BLUESHIELD"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payer Classification *
            </label>
            <Select
              value={payerType}
              onChange={(e) => setPayerType(e.target.value as PayerType)}
              options={[
                { value: 'COMMERCIAL_INSURANCE', label: 'Commercial Private Insurance' },
                { value: 'TPA', label: 'Third-Party Administrator (TPA)' },
                { value: 'GOVERNMENT_HEALTHCARE', label: 'Government / Public Healthcare Scheme' },
                { value: 'CORPORATE_DIRECT', label: 'Corporate Direct Contract' },
                { value: 'CASH_SELFPAY', label: 'Self-Pay / Cashless Aggregator' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Legal Payer Name *
          </label>
          <Input
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="e.g. BlueShield National Healthcare Assurance Ltd"
            required
          />
        </div>

        {payerType === 'TPA' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Associated TPA Administration Entity
            </label>
            <Input
              value={tpaName}
              onChange={(e) => setTpaName(e.target.value)}
              placeholder="e.g. Apex TPA Claims Network Inc."
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Claim Submission Mode *
            </label>
            <Select
              value={claimSubmissionMode}
              onChange={(e) => setClaimSubmissionMode(e.target.value as ClaimSubmissionMode)}
              options={[
                { value: 'EDI_ELECTRONIC', label: 'ANSI ASC X12 / EDI (837)' },
                { value: 'PAYER_PORTAL', label: 'Direct Payer Web Portal' },
                { value: 'API_DIRECT', label: 'FHIR / Direct REST API' },
                { value: 'PHYSICAL_BATCH', label: 'Physical CMS-1500 / UB-04 Form' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Electronic Payer ID / NAIC
            </label>
            <Input
              value={electronicPayerId}
              onChange={(e) => setElectronicPayerId(e.target.value)}
              placeholder="e.g. EDI-BS-89100"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Person
            </label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Claims Desk"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Email
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="claims@payer.docsearch.health"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Phone
            </label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1-800-555-0199"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Settlement SLA (Days)
            </label>
            <Input
              type="number"
              value={settlementPeriodDays}
              onChange={(e) => setSettlementPeriodDays(e.target.value)}
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
            placeholder="Credentialing justification & agreement reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
