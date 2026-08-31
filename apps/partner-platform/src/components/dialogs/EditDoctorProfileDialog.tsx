import React, { useState } from 'react';
import type {
  DoctorProfileDto,
  DoctorAvailabilityStatus,
  DoctorStatus,
  UpdateDoctorProfileRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EditDoctorProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileDto;
  actorId: string;
  actorRole: string;
  onUpdateDoctor: (req: UpdateDoctorProfileRequest) => Promise<void>;
}

export const EditDoctorProfileDialog: React.FC<EditDoctorProfileDialogProps> = ({
  isOpen,
  onClose,
  doctor,
  actorId,
  actorRole,
  onUpdateDoctor
}) => {
  const [qualification, setQualification] = useState(doctor.qualification);
  const [experienceYears, setExperienceYears] = useState(doctor.experienceYears);
  const [primarySpecialty, setPrimarySpecialty] = useState(doctor.primarySpecialty);
  const [telehealth, setTelehealth] = useState(doctor.telehealthEligible);
  const [availability, setAvailability] = useState<DoctorAvailabilityStatus>(doctor.availabilityStatus);
  const [status, setStatus] = useState<DoctorStatus>(doctor.status);
  const [bio, setBio] = useState(doctor.bioSummary ?? '');
  const [reason, setReason] = useState('Doctor profile details update');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateDoctor({
        actorId,
        actorRole,
        tenantId: doctor.tenantId,
        partnerId: doctor.partnerId,
        organizationId: doctor.organizationId,
        doctorId: doctor.id,
        qualification,
        experienceYears,
        primarySpecialty,
        telehealthEligible: telehealth,
        availabilityStatus: availability,
        status,
        bioSummary: bio || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update doctor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Doctor Profile: ${doctor.doctorCode}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Clinical Doctor Profile Update">
          Updates to doctor availability and qualifications update real-time appointment booking filters and patient-facing clinic schedules.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Qualifications & Degrees *
            </label>
            <Input value={qualification} onChange={(e) => setQualification(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Experience (Years) *
            </label>
            <Input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Primary Specialty *
          </label>
          <Input value={primarySpecialty} onChange={(e) => setPrimarySpecialty(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Availability Status *
            </label>
            <Select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as DoctorAvailabilityStatus)}
              options={[
                { value: 'AVAILABLE', label: 'Available (Accepting OPD Appointments)' },
                { value: 'BUSY', label: 'Busy (In Consultation / Rounds)' },
                { value: 'ON_LEAVE', label: 'On Leave (Schedule Blocked)' },
                { value: 'BLOCKED', label: 'Blocked (Administrative Hold)' },
                { value: 'TEMPORARILY_UNAVAILABLE', label: 'Temporarily Unavailable' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Clinical Status *
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DoctorStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active (Full Privileges)' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended (Privileges On Hold)' },
                { value: 'ON_LEAVE', label: 'On Leave' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Telehealth Eligible
            </label>
            <Select
              value={telehealth ? 'TRUE' : 'FALSE'}
              onChange={(e) => setTelehealth(e.target.value === 'TRUE')}
              options={[
                { value: 'TRUE', label: 'Yes (Authorized for virtual consults)' },
                { value: 'FALSE', label: 'No (In-person only)' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Bio / Clinical Summary
            </label>
            <Input value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Updated years of experience and availability state"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
