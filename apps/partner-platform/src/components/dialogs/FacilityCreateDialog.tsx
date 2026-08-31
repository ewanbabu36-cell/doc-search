import React, { useState } from 'react';
import type {
  FacilityType,
  CreateOperationalFacilityRequest,
  OperationalOrganizationDto
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface FacilityCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  organization: OperationalOrganizationDto;
  actorId: string;
  actorRole: string;
  onCreateFacility: (req: CreateOperationalFacilityRequest) => Promise<void>;
}

export const FacilityCreateDialog: React.FC<FacilityCreateDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  organization,
  actorId,
  actorRole,
  onCreateFacility
}) => {
  const [facilityCode, setFacilityCode] = useState(`FAC-${Math.floor(100 + Math.random() * 900)}`);
  const [facilityName, setFacilityName] = useState('');
  const [facilityType, setFacilityType] = useState<FacilityType>(
    organization.organizationType === 'HOSPITAL' ? 'INPATIENT_HOSPITAL' : 'OUTPATIENT_CLINIC'
  );
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('94102');
  const [contactEmail, setContactEmail] = useState(organization.contactEmail);
  const [contactPhone, setContactPhone] = useState(organization.contactPhone ?? '+1 (555) 019-0000');
  const [reason, setReason] = useState('Registering new physical facility branch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName || facilityName.trim().length < 2) {
      setError('Facility name must be at least 2 characters.');
      return;
    }
    if (!street || street.trim().length < 3) {
      setError('Street address is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateFacility({
        actorId,
        actorRole,
        tenantId,
        partnerId: organization.partnerId,
        organizationId: organization.id,
        facilityCode,
        facilityName,
        facilityType,
        addressStreet: street,
        addressCity: city,
        addressState: state,
        addressPostalCode: postalCode,
        addressCountry: 'US',
        contactEmail,
        contactPhone,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Register Facility Branch for ${organization.organizationName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Register Facility
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Physical Branch Binding">
          A facility branch represents a physical location where appointments, encounters, triage, and clinical care are delivered.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Facility Branch Code *
          </label>
          <Input
            value={facilityCode}
            onChange={(e) => setFacilityCode(e.target.value)}
            placeholder="e.g. FAC-BAY-MAIN"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Facility Branch Name *
          </label>
          <Input
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. Bay Health Downtown Clinic"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Facility Healthcare Type *
          </label>
          <Select
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value as FacilityType)}
            options={[
              { value: 'OUTPATIENT_CLINIC', label: 'Outpatient Clinic (OPD Consultations)' },
              { value: 'INPATIENT_HOSPITAL', label: 'Inpatient Hospital (Wards & ICUs)' },
              { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic Center (Imaging & Pathology)' },
              { value: 'SPECIALTY_CENTER', label: 'Specialty Care Center' },
              { value: 'AMBULATORY_SURGERY', label: 'Ambulatory Surgery Center' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Street Address *
          </label>
          <Input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. 500 Medical Center Way, Suite 200"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              City *
            </label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              State *
            </label>
            <Input value={state} onChange={(e) => setState(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Postal Code *
            </label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Contact Email *
            </label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Contact Phone *
            </label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physical facility launch authorization"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
