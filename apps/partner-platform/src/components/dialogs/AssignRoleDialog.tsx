import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  StaffRoleCode,
  StaffDataScope,
  AssignStaffRoleRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AssignRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  onAssignRole: (req: AssignStaffRoleRequest) => Promise<void>;
}

export const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  onAssignRole
}) => {
  const [roleCode, setRoleCode] = useState<StaffRoleCode>('ATTENDING_DOCTOR');
  const [dataScope, setDataScope] = useState<StaffDataScope>('DEPARTMENT');
  const [isPrimary, setIsPrimary] = useState(true);
  const [reason, setReason] = useState('Role and scope assignment');
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
      await onAssignRole({
        actorId,
        actorRole,
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        organizationId: staff.organizationId,
        branchId: staff.branchId,
        departmentId: staff.departmentId,
        staffId: staff.id,
        roleCode,
        dataScope,
        isPrimary,
        effectiveFrom: new Date().toISOString(),
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Operational Role & Scope: ${staff.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Assign Role
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Data Scope Hierarchy Binding">
          Role assignments bind the user's operational access to a specific level in the hierarchy:
          <code>COMPANY → PARTNER → ORGANIZATION → BRANCH → DEPARTMENT → ASSIGNED → SELF</code>
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Operational Role Code *
          </label>
          <Select
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value as StaffRoleCode)}
            options={[
              { value: 'CLINICAL_DIRECTOR', label: 'Clinical Director' },
              { value: 'CHIEF_MEDICAL_OFFICER', label: 'Chief Medical Officer' },
              { value: 'HEAD_OF_DEPARTMENT', label: 'Head of Department' },
              { value: 'ATTENDING_DOCTOR', label: 'Attending Doctor' },
              { value: 'CONSULTANT_PHYSICIAN', label: 'Consultant Physician' },
              { value: 'CHARGE_NURSE', label: 'Charge Nurse' },
              { value: 'STAFF_NURSE', label: 'Staff Nurse' },
              { value: 'FRONT_DESK_LEAD', label: 'Front Desk Lead' },
              { value: 'RECEPTIONIST', label: 'Receptionist' },
              { value: 'LAB_DIRECTOR', label: 'Laboratory Director' },
              { value: 'SENIOR_LAB_TECH', label: 'Senior Lab Technician' },
              { value: 'CHIEF_PHARMACIST', label: 'Chief Pharmacist' },
              { value: 'DISPENSING_PHARMACIST', label: 'Dispensing Pharmacist' },
              { value: 'BILLING_MANAGER', label: 'Billing Manager' },
              { value: 'CASHIER_BILLING_OFFICER', label: 'Cashier & Billing Officer' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Data Scope Boundary *
          </label>
          <Select
            value={dataScope}
            onChange={(e) => setDataScope(e.target.value as StaffDataScope)}
            options={[
              { value: 'ORGANIZATION', label: 'ORGANIZATION (Entire Clinic/Hospital entity)' },
              { value: 'BRANCH', label: 'BRANCH (Physical facility location)' },
              { value: 'DEPARTMENT', label: 'DEPARTMENT (Assigned clinical department)' },
              { value: 'ASSIGNED', label: 'ASSIGNED (Directly assigned patients/cases only)' },
              { value: 'SELF', label: 'SELF (Self records only)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Primary Assignment
          </label>
          <Select
            value={isPrimary ? 'TRUE' : 'FALSE'}
            onChange={(e) => setIsPrimary(e.target.value === 'TRUE')}
            options={[
              { value: 'TRUE', label: 'Primary Role (Default operational context)' },
              { value: 'FALSE', label: 'Secondary / Concurrent Role' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Authorized Department Head delegation for Cardiology"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
