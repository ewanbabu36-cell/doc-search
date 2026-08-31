import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  OperationalEmploymentType,
  UpdateOperationalStaffRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EditStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  onUpdateStaff: (req: UpdateOperationalStaffRequest) => Promise<void>;
}

export const EditStaffDialog: React.FC<EditStaffDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  onUpdateStaff
}) => {
  const [fullName, setFullName] = useState(staff.fullName);
  const [workEmail, setWorkEmail] = useState(staff.workEmail);
  const [workPhone, setWorkPhone] = useState(staff.workPhone ?? '');
  const [primaryRole, setPrimaryRole] = useState(staff.primaryRole);
  const [employmentType, setEmploymentType] = useState<OperationalEmploymentType>(staff.employmentType);
  const [profileRef, setProfileRef] = useState(staff.professionalProfileRef ?? '');
  const [reason, setReason] = useState('Staff profile details update');
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
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateStaff({
        actorId,
        actorRole,
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        organizationId: staff.organizationId,
        staffId: staff.id,
        fullName,
        workEmail,
        workPhone: workPhone || undefined,
        primaryRole,
        employmentType,
        professionalProfileRef: profileRef || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Staff Profile: ${staff.staffCode}`}
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
        <Alert type="info" title="Audited Profile Edit">
          Updates to work email, contact numbers, or employment classification are recorded to the immutable audit vault.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Full Name *
          </label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Work Email *
            </label>
            <Input type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Work Phone
            </label>
            <Input value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Primary Role Code
            </label>
            <Input value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Employment Type
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

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Professional Profile Reference
          </label>
          <Input value={profileRef} onChange={(e) => setProfileRef(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Updated work contact telephone and profile URI"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
