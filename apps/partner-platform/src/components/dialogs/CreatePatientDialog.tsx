import React, { useState } from 'react';
import type {
  Gender,
  BloodGroup,
  MaritalStatus,
  EmergencyRelationship,
  CreatePatientRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreatePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onCreatePatient: (req: CreatePatientRequest) => Promise<void>;
}

export const CreatePatientDialog: React.FC<CreatePatientDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onCreatePatient
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [gender, setGender] = useState<Gender>('MALE');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O_POSITIVE');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('SINGLE');
  const [primaryMobile, setPrimaryMobile] = useState('+1 (555) 000-1122');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('100 Main Street');
  const [city, setCity] = useState('Metro City');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('90210');
  const [emergencyName, setEmergencyName] = useState('Emergency Contact');
  const [emergencyRelation, setEmergencyRelation] = useState<EmergencyRelationship>('SPOUSE');
  const [emergencyPhone, setEmergencyPhone] = useState('+1 (555) 000-9988');
  const [insurancePayer, setInsurancePayer] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [reason, setReason] = useState('Standard outpatient clinic reception registration');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    if (!primaryMobile || primaryMobile.trim().length < 7) {
      setError('Primary mobile phone number is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreatePatient({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        nationality: 'American',
        preferredLanguage: 'English',
        registrationSource: 'RECEPTION_DESK',
        primaryMobile,
        addressLine1,
        city,
        state,
        country: 'USA',
        postalCode,
        emergencyRelationship: emergencyRelation,
        generalConsentGranted: true,
        reason,
        ...(email ? { email } : {}),
        ...(emergencyName ? { emergencyContactName: emergencyName } : {}),
        ...(emergencyPhone ? { emergencyPrimaryPhone: emergencyPhone } : {}),
        ...(insurancePayer ? { insurancePayerName: insurancePayer } : {}),
        ...(insurancePolicy ? { insurancePolicyNumber: insurancePolicy } : {})
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Patient (MPI Intake)"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Complete Registration & Issue MRN
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Deterministic MRN & Duplicate Check">
          Entering patient demographics executes an automated probabilistic duplicate check. If matching records exist, the profile is flagged for duplicate review to maintain master index integrity.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              First Name *
            </label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Last Name *
            </label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Date of Birth *
            </label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Gender *
            </label>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
                { value: 'UNKNOWN', label: 'Unknown' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Blood Group
            </label>
            <Select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              options={[
                { value: 'O_POSITIVE', label: 'O+' },
                { value: 'O_NEGATIVE', label: 'O-' },
                { value: 'A_POSITIVE', label: 'A+' },
                { value: 'A_NEGATIVE', label: 'A-' },
                { value: 'B_POSITIVE', label: 'B+' },
                { value: 'B_NEGATIVE', label: 'B-' },
                { value: 'AB_POSITIVE', label: 'AB+' },
                { value: 'AB_NEGATIVE', label: 'AB-' },
                { value: 'UNKNOWN', label: 'Unknown' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Marital Status
            </label>
            <Select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
              options={[
                { value: 'SINGLE', label: 'Single' },
                { value: 'MARRIED', label: 'Married' },
                { value: 'DIVORCED', label: 'Divorced' },
                { value: 'WIDOWED', label: 'Widowed' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Mobile Phone *
            </label>
            <Input value={primaryMobile} onChange={(e) => setPrimaryMobile(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Email Address
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Residential Address *
            </label>
            <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
          </div>
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

        <div style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Emergency Contact Details
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Name</label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Relationship</label>
              <Select
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value as EmergencyRelationship)}
                options={[
                  { value: 'SPOUSE', label: 'Spouse' },
                  { value: 'PARENT', label: 'Parent' },
                  { value: 'SIBLING', label: 'Sibling' },
                  { value: 'CHILD', label: 'Child' },
                  { value: 'GUARDIAN', label: 'Guardian' },
                  { value: 'FRIEND', label: 'Friend' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Phone</label>
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Insurance / Payer Information (Optional)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Insurance Provider / Payer</label>
              <Input value={insurancePayer} onChange={(e) => setInsurancePayer(e.target.value)} placeholder="e.g. Blue Cross Blue Shield" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Policy / Group Number</label>
              <Input value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} placeholder="e.g. POL-99281" />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Registered new patient for cardiology clinic appointment"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
