import React, { useState } from 'react';
import type {
  OperationalDepartmentDto,
  OperationalDepartmentStatus,
  UpdateOperationalDepartmentRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EditDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  department: OperationalDepartmentDto;
  actorId: string;
  actorRole: string;
  onUpdateDepartment: (req: UpdateOperationalDepartmentRequest) => Promise<void>;
}

export const EditDepartmentDialog: React.FC<EditDepartmentDialogProps> = ({
  isOpen,
  onClose,
  department,
  actorId,
  actorRole,
  onUpdateDepartment
}) => {
  const [deptName, setDeptName] = useState(department.departmentName);
  const [headName, setHeadName] = useState(department.departmentHeadName ?? '');
  const [costCenter, setCostCenter] = useState(department.costCenterCode ?? '');
  const [status, setStatus] = useState<OperationalDepartmentStatus>(department.status);
  const [reason, setReason] = useState('Department metadata update');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || deptName.trim().length < 2) {
      setError('Department name must be at least 2 characters.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateDepartment({
        actorId,
        actorRole,
        tenantId: department.tenantId,
        partnerId: department.partnerId,
        organizationId: department.organizationId,
        departmentId: department.id,
        departmentName: deptName,
        departmentHeadName: headName || undefined,
        costCenterCode: costCenter || undefined,
        status,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Department: ${department.departmentCode}`}
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
        <Alert type="warning" title="Audited Department Restructuring">
          Changes to department status or cost center codes impact child staff rosters and billing center allocations.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Department Name *
          </label>
          <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Department Head
            </label>
            <Input value={headName} onChange={(e) => setHeadName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Cost Center Code
            </label>
            <Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Department Status *
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as OperationalDepartmentStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active (Fully operational)' },
              { value: 'INACTIVE', label: 'Inactive (No appointments/rosters allowed)' },
              { value: 'RESTRUCTURED', label: 'Restructured (Reassigned sub-departments)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Assigned new Department Head and updated cost center"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
