import React, { useState } from 'react';
import type { OperationalPartnerType, CreateOperationalPartnerRequest } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface PartnerCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  actorId: string;
  actorRole: string;
  onCreatePartner: (req: CreateOperationalPartnerRequest) => Promise<void>;
}

export const PartnerCreateDialog: React.FC<PartnerCreateDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  actorId,
  actorRole,
  onCreatePartner
}) => {
  const [partnerCode, setPartnerCode] = useState(`PART-${Math.floor(100 + Math.random() * 900)}`);
  const [legalName, setLegalName] = useState('');
  const [partnerType, setPartnerType] = useState<OperationalPartnerType>('CLINIC_NETWORK');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reason, setReason] = useState('Onboarding new partner healthcare network');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName || legalName.trim().length < 2) {
      setError('Legal business name must be at least 2 characters.');
      return;
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      setError('Valid contact email is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreatePartner({
        actorId,
        actorRole,
        tenantId,
        partnerCode,
        legalBusinessName: legalName,
        partnerType,
        contactEmail,
        contactPhone: contactPhone || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Healthcare Partner Network"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Onboard Partner
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Operational Partner Onboarding">
          Creating a partner establishes the top-level boundary for clinics, hospitals, and medical facilities. All operations are logged to the operational audit vault.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Partner Unique Code *
          </label>
          <Input
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value)}
            placeholder="e.g. PART-BAY-001"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Legal Business Name *
          </label>
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="e.g. Bay Health Medical Group LLC"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Partner Healthcare Type *
          </label>
          <Select
            value={partnerType}
            onChange={(e) => setPartnerType(e.target.value as OperationalPartnerType)}
            options={[
              { value: 'CLINIC_NETWORK', label: 'Clinic Network (Outpatient / Multi-site)' },
              { value: 'HOSPITAL_SYSTEM', label: 'Hospital System (Inpatient / Academic)' },
              { value: 'INTEGRATED_HEALTHCARE', label: 'Integrated Healthcare Delivery Network' },
              { value: 'ENTERPRISE', label: 'Enterprise Healthcare Partner' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Primary Contact Email *
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="operations@partner.com"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Contact Phone (Optional)
          </label>
          <Input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason / Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved partner contract execution"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
