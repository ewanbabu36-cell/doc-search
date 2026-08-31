import React, { useState } from 'react';
import type {
  OperationalStaffType,
  OperationalEmploymentType,
  CreateOperationalStaffRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  departments: { id: string; departmentName: string }[];
  onCreateStaff: (req: CreateOperationalStaffRequest) => Promise<void>;
}

export const CreateStaffDialog: React.FC<CreateStaffDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  departments,
  onCreateStaff
}) => {
  const [staffCode, setStaffCode] = useState(`STF-${Math.floor(100 + Math.random() * 900)}`);
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [staffType, setStaffType] = useState<OperationalStaffType>('DOCTOR');
  const [primaryRole, setPrimaryRole] = useState('ATTENDING_DOCTOR');
  const [employmentType, setEmploymentType] = useState<OperationalEmploymentType>('FULL_TIME');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');
  const [profileRef, setProfileRef] = useState('');
  const [reason, setReason] = useState('Onboarding new clinical staff member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!workEmail || !workEmail.includes('@')) {
      setError('Valid work email is required.');
      return;
    }
    if (!departmentId) {
      setError('Department selection is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateStaff({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        staffCode,
        fullName,
        workEmail,
        workPhone: workPhone || undefined,
        staffType,
        primaryRole,
        employmentType,
        joiningDate: new Date().toISOString(),
        professionalProfileRef: profileRef || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to onboard staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard Operational Healthcare Staff"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Onboard Staff
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Clinical Staff Registry">
          Registers doctors, nurses, receptionists, pharmacists, and lab personnel into the active branch and department hierarchy. Passwords and sensitive personal identifiers are strictly segregated.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Staff Code *
            </label>
            <Input value={staffCode} onChange={(e) => setStaffCode(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Full Name *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Emily Hayes MD"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Staff Type *
            </label>
            <Select
              value={staffType}
              onChange={(e) => {
                const val = e.target.value as OperationalStaffType;
                setStaffType(val);
                if (val === 'DOCTOR') setPrimaryRole('ATTENDING_DOCTOR');
                else if (val === 'NURSE') setPrimaryRole('STAFF_NURSE');
                else if (val === 'RECEPTIONIST') setPrimaryRole('FRONT_DESK_LEAD');
                else if (val === 'LAB_TECHNICIAN') setPrimaryRole('SENIOR_LAB_TECH');
                else if (val === 'PHARMACIST') setPrimaryRole('DISPENSING_PHARMACIST');
                else if (val === 'BILLING_OFFICER') setPrimaryRole('CASHIER_BILLING_OFFICER');
              }}
              options={[
                { value: 'DOCTOR', label: 'Doctor / Physician (Clinical OPD & Wards)' },
                { value: 'NURSE', label: 'Nurse (Triage, Inpatient & OPD)' },
                { value: 'RECEPTIONIST', label: 'Receptionist (Front Desk & Queue)' },
                { value: 'LAB_TECHNICIAN', label: 'Laboratory Technician (Diagnostic LIS)' },
                { value: 'PHARMACIST', label: 'Pharmacist (Dispensing & Stock)' },
                { value: 'BILLING_OFFICER', label: 'Billing Officer (Invoicing & Cashier)' },
                { value: 'ADMINISTRATIVE', label: 'Administrative Staff' },
                { value: 'OPERATIONAL_SUPPORT', label: 'Operational Support' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Role Code *
            </label>
            <Input value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Assigned Department *
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
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Employment Type *
            </label>
            <Select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as OperationalEmploymentType)}
              options={[
                { value: 'FULL_TIME', label: 'Full Time' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'CONTRACTOR', label: 'Contractor / Locum' },
                { value: 'VISITING_CONSULTANT', label: 'Visiting Consultant' },
                { value: 'INTERN', label: 'Clinical Resident / Intern' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Work Email *
            </label>
            <Input
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              placeholder="e.hayes@docsearch.com"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Work Phone
            </label>
            <Input value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Professional Profile Reference (Optional)
          </label>
          <Input
            value={profileRef}
            onChange={(e) => setProfileRef(e.target.value)}
            placeholder="e.g. docsearch://profiles/dr-emily-hayes"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Onboarded newly hired physician following credentialing approval"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
