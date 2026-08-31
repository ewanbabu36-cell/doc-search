import React, { useState } from 'react';
import type { InternalEmployeeDto, EmploymentStatus } from '@docsearch/api-contracts';
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
import { EmployeeStatusDialog } from './EmployeeStatusDialog.js';

export interface EmployeeDirectoryViewProps {
  employees: InternalEmployeeDto[];
  onUpdateStatus: (employeeId: string, status: EmploymentStatus, reason: string) => Promise<void>;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  onUpdateStatus
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<InternalEmployeeDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Internal Staff & Employee Directory"
        subtitle="Corporate staff records, department affiliations, manager chains, and employment status"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Work Email</TableHead>
                <TableHead>Designation & Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {emp.employeeCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {emp.firstName} {emp.lastName}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.workEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {emp.designationTitle ?? 'Staff'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.departmentName ?? 'General'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{emp.employmentType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.managerName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        emp.employmentStatus === 'ACTIVE'
                          ? 'success'
                          : emp.employmentStatus === 'ON_LEAVE'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {emp.employmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedEmployee && (
        <EmployeeStatusDialog
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};
