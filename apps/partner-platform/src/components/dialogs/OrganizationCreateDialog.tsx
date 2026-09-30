import React, { useState } from 'react';
import type {
  OrganizationType,
  CreateOperationalOrganizationRequest,
  OperationalPartnerDto
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface OrganizationCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partner: OperationalPartnerDto;
  actorId: string;
  actorRole: string;
  onCreateOrganization: (req: CreateOperationalOrganizationRequest) => Promise<void>;
}

export const OrganizationCreateDialog: React.FC<OrganizationCreateDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partner,
  actorId,
  actorRole,
  onCreateOrganization
}) => {
  const [orgCode, setOrgCode] = useState(`ORG-${Math.floor(100 + Math.random() * 900)}`);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('CLINIC');
  const [legalRef, setLegalRef] = useState(`le-${partner.partnerCode.toLowerCase()}`);
  const [contactEmail, setContactEmail] = useState(partner.contactEmail);
  const [contactPhone, setContactPhone] = useState(partner.contactPhone ?? '');
  const [reason, setReason] = useState('Adding operational clinic/hospital entity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || orgName.trim().length < 2) {
      setError('Organization name must be at least 2 characters.');
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
      await onCreateOrganization({
        actorId,
        actorRole,
        tenantId,
        partnerId: partner.id,
        organizationCode: orgCode,
        organizationName: orgName,
        organizationType: orgType,
        legalEntityReference: legalRef || undefined,
        contactEmail,
        contactPhone: contactPhone || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Organization to ${partner.legalBusinessName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            Create Organization
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Organization Scope Binding">
          An operational organization represents an independent Clinic or Hospital operating under the parent Partner scope.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Parent Partner
          </label>
          <Input value={`${partner.partnerCode} — ${partner.legalBusinessName}`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Organization Code *
          </label>
          <Input
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value)}
            placeholder="e.g. ORG-APEX-CENTRAL"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Organization Name *
          </label>
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Apex Central Outpatient Clinic"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Organization Type *
          </label>
          <Select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value as OrganizationType)}
            options={[
              { value: 'CLINIC', label: 'Clinic (Outpatient / Ambulatory Care)' },
              { value: 'HOSPITAL', label: 'Hospital (Inpatient / Multi-department)' }
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Legal Entity Reference
            </label>
            <Input
              value={legalRef}
              onChange={(e) => setLegalRef(e.target.value)}
              placeholder="e.g. le-corp-apex"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Contact Phone (10-Digit Mobile)
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRight: 'none',
                  borderRadius: '6px 0 0 6px',
                  color: '#38BDF8',
                  fontSize: '0.8125rem',
                  fontWeight: 700
                }}
              >
                +91
              </span>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setContactPhone(digits.slice(0, 10));
                }}
                maxLength={10}
                placeholder="98765 43210"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '0 6px 6px 0',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Contact Email *
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Authorized new clinic location onboarding"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
