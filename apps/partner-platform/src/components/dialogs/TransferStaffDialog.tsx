import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  StaffTransferType,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface TransferStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  organizations: { id: string; organizationName: string }[];
  facilities: { id: string; facilityName: string; organizationId: string }[];
  departments: { id: string; departmentName: string; organizationId: string }[];
  onTransferStaff: (req: CreateStaffTransferRequest) => Promise<void>;
}

export const TransferStaffDialog: React.FC<TransferStaffDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  organizations,
  facilities,
  departments,
  onTransferStaff
}) => {
  const [toOrgId, setToOrgId] = useState(staff.organizationId);
  const filteredFacilities = facilities.filter((f) => f.organizationId === toOrgId);
  const filteredDepartments = departments.filter((d) => d.organizationId === toOrgId);

  const [toBranchId, setToBranchId] = useState(filteredFacilities[0]?.id ?? staff.branchId);
  const [toDeptId, setToDeptId] = useState(filteredDepartments[0]?.id ?? staff.departmentId);
  const [transferType, setTransferType] = useState<StaffTransferType>('BRANCH_TRANSFER');
  const [reason, setReason] = useState('Operational staff relocation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgChange = (newOrgId: string) => {
    setToOrgId(newOrgId);
    const facs = facilities.filter((f) => f.organizationId === newOrgId);
    const depts = departments.filter((d) => d.organizationId === newOrgId);
    if (facs[0]) setToBranchId(facs[0].id);
    if (depts[0]) setToDeptId(depts[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBranchId) {
      setError('Destination facility branch is required.');
      return;
    }
    if (!toDeptId) {
      setError('Destination department is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onTransferStaff({
        actorId,
        actorRole,
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        staffId: staff.id,
        toOrganizationId: toOrgId,
        toBranchId,
        toDepartmentId: toDeptId,
        transferType,
        effectiveDate: new Date().toISOString(),
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Staff Member: ${staff.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Transfer
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Operational Staff Transfer">
          Transferring staff re-assigns the primary department and facility operational scope. All appointments and queue duties are updated accordingly.
        </Alert>

        {error && <Alert type="error" title="Transfer Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Current Assigned Location
          </label>
          <Input
            value={`${staff.branchName ?? 'Branch'} · ${staff.departmentName ?? 'Department'}`}
            readOnly
            disabled
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Transfer Classification *
          </label>
          <Select
            value={transferType}
            onChange={(e) => setTransferType(e.target.value as StaffTransferType)}
            options={[
              { value: 'BRANCH_TRANSFER', label: 'Branch Transfer (Inter-facility within organization)' },
              { value: 'DEPARTMENT_TRANSFER', label: 'Department Transfer (Intra-branch department change)' },
              { value: 'ORGANIZATION_TRANSFER', label: 'Organization Transfer (Cross-clinic relocation)' },
              { value: 'TEMPORARY_SECONDMENT', label: 'Temporary Secondment' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Destination Organization *
          </label>
          <Select
            value={toOrgId}
            onChange={(e) => handleOrgChange(e.target.value)}
            options={organizations.map((o) => ({
              value: o.id,
              label: o.organizationName
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Destination Facility Branch *
            </label>
            <Select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              options={filteredFacilities.map((f) => ({
                value: f.id,
                label: f.facilityName
              }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Destination Department *
            </label>
            <Select
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              options={filteredDepartments.map((d) => ({
                value: d.id,
                label: d.departmentName
              }))}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason & Clinical Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Assigned to Westside clinic to cover expanded cardiology morning shifts"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
