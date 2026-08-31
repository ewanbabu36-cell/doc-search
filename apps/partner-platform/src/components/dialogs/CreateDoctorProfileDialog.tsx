import React, { useState } from 'react';
import type {
  ConsultationMode,
  CreateDoctorProfileRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateDoctorProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  staffMembers: { id: string; fullName: string; staffCode: string; departmentId: string }[];
  departments: { id: string; departmentName: string }[];
  specializations: { specialtyCode: string; specialtyName: string }[];
  onCreateDoctor: (req: CreateDoctorProfileRequest) => Promise<void>;
}

export const CreateDoctorProfileDialog: React.FC<CreateDoctorProfileDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  staffMembers,
  departments,
  specializations,
  onCreateDoctor
}) => {
  const [staffId, setStaffId] = useState(staffMembers[0]?.id ?? '');
  const [doctorCode, setDoctorCode] = useState(`DOC-${Math.floor(100 + Math.random() * 900)}`);
  const [licenseNumber, setLicenseNumber] = useState('MED-CA-2026-9912 — Sample Ref');
  const [qualification, setQualification] = useState('MD (Cardiology), FACC');
  const [experienceYears, setExperienceYears] = useState(10);
  const [specialty, setSpecialty] = useState(specializations[0]?.specialtyName ?? 'Adult & Interventional Cardiology');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('IN_PERSON');
  const [telehealth, setTelehealth] = useState(true);
  const [bio, setBio] = useState('Clinical specialist in outpatient consultation and diagnostic reviews.');
  const [reason, setReason] = useState('Creating operational doctor clinical profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setError('Staff member linkage is required.');
      return;
    }
    if (!doctorCode || doctorCode.trim().length < 2) {
      setError('Doctor code is required.');
      return;
    }
    if (!qualification || qualification.trim().length < 2) {
      setError('Medical qualification is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateDoctor({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId: departmentId || (departments[0]?.id ?? ''),
        staffId,
        doctorCode,
        medicalLicenseNumber: licenseNumber,
        qualification,
        experienceYears,
        primarySpecialty: specialty,
        subSpecialties: [],
        consultationModes: [consultationMode],
        telehealthEligible: telehealth,
        bioSummary: bio,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Doctor Clinical Profile"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Doctor Profile
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Doctor Clinical Registration">
          Links a credentialed medical staff member to active OPD consultation rosters, prescription templates, and fee schedules.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Staff Member Record Linkage *
          </label>
          <Select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            options={staffMembers.map((s) => ({
              value: s.id,
              label: `${s.fullName} (${s.staffCode})`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Doctor Identifier Code *
            </label>
            <Input value={doctorCode} onChange={(e) => setDoctorCode(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Medical License / NPI Reference *
            </label>
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Qualifications & Degrees *
            </label>
            <Input
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MD (Cardiology), FACC"
              required
            />
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Specialty *
            </label>
            <Select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              options={specializations.map((sp) => ({
                value: sp.specialtyName,
                label: sp.specialtyName
              }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Assigned Clinical Department *
            </label>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({
                value: d.id,
                label: d.departmentName
              }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Consultation Mode *
            </label>
            <Select
              value={consultationMode}
              onChange={(e) => setConsultationMode(e.target.value as ConsultationMode)}
              options={[
                { value: 'IN_PERSON', label: 'In-Person Clinic OPD' },
                { value: 'TELEHEALTH', label: 'Virtual Telehealth' },
                { value: 'HYBRID', label: 'Hybrid (In-Person & Virtual)' },
                { value: 'WALK_IN', label: 'Walk-In Urgent Clinic' }
              ]}
            />
          </div>
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
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Clinical Bio & Areas of Expertise
          </label>
          <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Summary of clinical focus areas..." />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Registered attending cardiologist for hospital OPD clinic roster"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
