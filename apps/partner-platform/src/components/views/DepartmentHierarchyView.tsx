import React, { useState } from 'react';
import type {
  OperationalDepartmentDto,
  CreateOperationalDepartmentRequest,
  UpdateOperationalDepartmentRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { CreateDepartmentDialog } from '../dialogs/CreateDepartmentDialog.js';
import { EditDepartmentDialog } from '../dialogs/EditDepartmentDialog.js';

export interface DepartmentHierarchyViewProps {
  departments: OperationalDepartmentDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  onCreateDepartment: (req: CreateOperationalDepartmentRequest) => Promise<void>;
  onUpdateDepartment: (req: UpdateOperationalDepartmentRequest) => Promise<void>;
}

export const DepartmentHierarchyView: React.FC<DepartmentHierarchyViewProps> = ({
  departments,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onCreateDepartment,
  onUpdateDepartment
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<OperationalDepartmentDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinical & Operational Department Hierarchy
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Clinical wards, outpatient consultation units, diagnostic laboratories, pharmacies, and billing centers
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          🏛️ Create Department
        </Button>
      </div>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dept Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Parent Department</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {d.departmentCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.departmentName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    {d.parentDepartmentName ?? '— Root —'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.departmentHeadName ?? 'Unassigned'}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                    {d.costCenterCode ?? '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {d.staffCount} staff
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setEditDept(d)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isCreateOpen && (
        <CreateDepartmentDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          existingDepartments={departments}
          onCreateDepartment={onCreateDepartment}
        />
      )}

      {editDept && (
        <EditDepartmentDialog
          isOpen={Boolean(editDept)}
          onClose={() => setEditDept(null)}
          department={editDept}
          actorId={actorId}
          actorRole={actorRole}
          onUpdateDepartment={onUpdateDepartment}
        />
      )}
    </div>
  );
};
