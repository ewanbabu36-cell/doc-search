import React, { useState } from 'react';
import type {
  PatientDto,
  Gender,
  BloodGroup,
  MaritalStatus,
  PatientStatus,
  UpdatePatientRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EditPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDto;
  actorId: string;
  actorRole: string;
  onUpdatePatient: (req: UpdatePatientRequest) => Promise<void>;
}

export const EditPatientDialog: React.FC<EditPatientDialogProps> = ({
  isOpen,
  onClose,
  patient,
  actorId,
  actorRole,
  onUpdatePatient
}) => {
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [preferredName, setPreferredName] = useState(patient.preferredName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(patient.dateOfBirth);
  const [gender, setGender] = useState<Gender>(patient.gender);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(patient.bloodGroup ?? 'UNKNOWN');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(patient.maritalStatus ?? 'SINGLE');
  const [occupation, setOccupation] = useState(patient.occupation ?? '');
  const [status, setStatus] = useState<PatientStatus>(patient.status);
  const [reason, setReason] = useState('Patient demographic corrections');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdatePatient({
        actorId,
        actorRole,
        tenantId: patient.tenantId,
        partnerId: patient.partnerId,
        organizationId: patient.organizationId,
        patientId: patient.id,
        firstName,
        lastName,
        preferredName: preferredName || undefined,
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        occupation: occupation || undefined,
        status,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Patient Demographics: ${patient.mrn}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Demographics
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Patient MPI Modification">
          Modifying canonical demographics commits an immutable audit record and recalculates master index match signatures.
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
              Preferred / Alias Name
            </label>
            <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Date of Birth (YYYY-MM-DD) *
            </label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          </div>
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
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
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Lifecycle Status *
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as PatientStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active (Full Privileges)' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'DUPLICATE_REVIEW', label: 'Duplicate Review' },
                { value: 'BLOCKED', label: 'Blocked' },
                { value: 'DECEASED', label: 'Deceased' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Occupation
          </label>
          <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verified date of birth with national ID card"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
