import React from 'react';
import type { DepartmentDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface DepartmentHierarchyViewProps {
  departments: DepartmentDto[];
}

export const DepartmentHierarchyView: React.FC<DepartmentHierarchyViewProps> = ({ departments }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Organizational Departments & Cost Centers"
        subtitle="Department structures, leadership allocations, cost center codes, and employee counts"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dept Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Legal Entity</TableHead>
                <TableHead>Lead Email</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {d.departmentCode}
                  </TableCell>
                  <TableCell style={{ maxWidth: '240px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                      {d.departmentName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {d.description}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    <Badge variant="neutral">{d.costCenterCode}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.legalEntityName ?? 'Doc Search Inc.'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.leadEmail ?? 'Unassigned'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {d.employeeCount} staff
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
