import React, { useState } from 'react';
import type { CreateOperationalDepartmentRequest } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  existingDepartments: { id: string; departmentName: string }[];
  onCreateDepartment: (req: CreateOperationalDepartmentRequest) => Promise<void>;
}

export const CreateDepartmentDialog: React.FC<CreateDepartmentDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  existingDepartments,
  onCreateDepartment
}) => {
  const [deptCode, setDeptCode] = useState(`DEP-${Math.floor(100 + Math.random() * 900)}`);
  const [deptName, setDeptName] = useState('');
  const [parentDeptId, setParentDeptId] = useState<string>('');
  const [headName, setHeadName] = useState('');
  const [costCenter, setCostCenter] = useState('CC-OPS-100');
  const [reason, setReason] = useState('Creating clinical department entity');
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
      await onCreateDepartment({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        departmentCode: deptCode,
        departmentName: deptName,
        parentDepartmentId: parentDeptId ? parentDeptId : undefined,
        departmentHeadName: headName ? headName : undefined,
        costCenterCode: costCenter ? costCenter : undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Clinical / Operational Department"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Department
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Department Hierarchy Creation">
          Departments define clinical operational scopes (Cardiology, OPD, Laboratory, Pharmacy, Billing) and cost center boundaries.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Department Code *
          </label>
          <Input value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Department Name *
          </label>
          <Input
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="e.g. Cardiology & Vascular Medicine"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Parent Department (Optional Hierarchy)
          </label>
          <Select
            value={parentDeptId}
            onChange={(e) => setParentDeptId(e.target.value)}
            options={[
              { value: '', label: '— Root Department (No Parent) —' },
              ...existingDepartments.map((d) => ({
                value: d.id,
                label: d.departmentName
              }))
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Department Head Name
            </label>
            <Input value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder="e.g. Dr. Sarah Jenkins MD" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Cost Center Code
            </label>
            <Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} placeholder="e.g. CC-CARDIO-401" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Establishment of outpatient cardiology sub-department"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
