import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  OperationalDepartmentDto,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { CreateStaffDialog } from '../dialogs/CreateStaffDialog.js';
import { EditStaffDialog } from '../dialogs/EditStaffDialog.js';
import { ChangeStaffStatusDialog } from '../dialogs/ChangeStaffStatusDialog.js';
import { AssignRoleDialog } from '../dialogs/AssignRoleDialog.js';
import { AddCredentialDialog } from '../dialogs/AddCredentialDialog.js';
import { TransferStaffDialog } from '../dialogs/TransferStaffDialog.js';

export interface StaffDirectoryViewProps {
  staffList: OperationalStaffDto[];
  departments: OperationalDepartmentDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  organizations: { id: string; organizationName: string }[];
  facilities: { id: string; facilityName: string; organizationId: string }[];
  onSelectStaff: (staffId: string) => void;
  onCreateStaff: (req: CreateOperationalStaffRequest) => Promise<void>;
  onUpdateStaff: (req: UpdateOperationalStaffRequest) => Promise<void>;
  onChangeStatus: (req: ChangeStaffStatusRequest) => Promise<void>;
  onAssignRole: (req: AssignStaffRoleRequest) => Promise<void>;
  onAddCredential: (req: AddStaffCredentialRequest) => Promise<void>;
  onTransferStaff: (req: CreateStaffTransferRequest) => Promise<void>;
}

export const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  staffList,
  departments,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  organizations,
  facilities,
  onSelectStaff,
  onCreateStaff,
  onUpdateStaff,
  onChangeStatus,
  onAssignRole,
  onAddCredential,
  onTransferStaff
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<OperationalStaffDto | null>(null);
  const [statusStaff, setStatusStaff] = useState<OperationalStaffDto | null>(null);
  const [roleStaff, setRoleStaff] = useState<OperationalStaffDto | null>(null);
  const [credentialStaff, setCredentialStaff] = useState<OperationalStaffDto | null>(null);
  const [transferStaff, setTransferStaff] = useState<OperationalStaffDto | null>(null);

  const filteredStaff = staffList.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        s.fullName.toLowerCase().includes(term) ||
        s.staffCode.toLowerCase().includes(term) ||
        s.workEmail.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (typeFilter !== 'ALL' && s.staffType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && s.employmentStatus !== statusFilter) return false;
    if (deptFilter !== 'ALL' && s.departmentId !== deptFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Operational Healthcare Staff Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Credentialed doctors, clinical nurses, receptionists, lab technicians, pharmacists, and billing personnel
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          🩺 Onboard New Staff Member
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Personnel
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or email..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Staff Classification
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Classifications' },
                { value: 'DOCTOR', label: 'Doctors / Physicians' },
                { value: 'NURSE', label: 'Nurses' },
                { value: 'RECEPTIONIST', label: 'Receptionists' },
                { value: 'LAB_TECHNICIAN', label: 'Lab Technicians' },
                { value: 'PHARMACIST', label: 'Pharmacists' },
                { value: 'BILLING_OFFICER', label: 'Billing Officers' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Department
            </label>
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Departments' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: d.departmentName
                }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Lifecycle Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'TERMINATED', label: 'Terminated' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Full Name & Contact</TableHead>
                <TableHead>Staff Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Primary Role & Scope</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operational Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero staff members found matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {s.staffCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.fullName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {s.workEmail}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{s.staffType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {s.departmentName ?? 'Department'}
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{s.primaryRole}</span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        Scope: {s.activeRoleScope}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.credentialStatus === 'VERIFIED' ? 'success' : s.credentialStatus === 'PENDING' ? 'warning' : 'danger'}>
                        {s.credentialStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.employmentStatus === 'ACTIVE' ? 'success' : s.employmentStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                        {s.employmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => onSelectStaff(s.id)}>
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditStaff(s)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setStatusStaff(s)}>
                          Status
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRoleStaff(s)}>
                          Role
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCredentialStaff(s)}>
                          License
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setTransferStaff(s)}>
                          Transfer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Modals */}
      {isCreateOpen && (
        <CreateStaffDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          departments={departments}
          onCreateStaff={onCreateStaff}
        />
      )}

      {editStaff && (
        <EditStaffDialog
          isOpen={Boolean(editStaff)}
          onClose={() => setEditStaff(null)}
          staff={editStaff}
          actorId={actorId}
          actorRole={actorRole}
          onUpdateStaff={onUpdateStaff}
        />
      )}

      {statusStaff && (
        <ChangeStaffStatusDialog
          isOpen={Boolean(statusStaff)}
          onClose={() => setStatusStaff(null)}
          staff={statusStaff}
          actorId={actorId}
          actorRole={actorRole}
          onChangeStatus={onChangeStatus}
        />
      )}

      {roleStaff && (
        <AssignRoleDialog
          isOpen={Boolean(roleStaff)}
          onClose={() => setRoleStaff(null)}
          staff={roleStaff}
          actorId={actorId}
          actorRole={actorRole}
          onAssignRole={onAssignRole}
        />
      )}

      {credentialStaff && (
        <AddCredentialDialog
          isOpen={Boolean(credentialStaff)}
          onClose={() => setCredentialStaff(null)}
          staff={credentialStaff}
          actorId={actorId}
          actorRole={actorRole}
          onAddCredential={onAddCredential}
        />
      )}

      {transferStaff && (
        <TransferStaffDialog
          isOpen={Boolean(transferStaff)}
          onClose={() => setTransferStaff(null)}
          staff={transferStaff}
          actorId={actorId}
          actorRole={actorRole}
          organizations={organizations}
          facilities={facilities}
          departments={departments}
          onTransferStaff={onTransferStaff}
        />
      )}
    </div>
  );
};
