import React from 'react';
import type { StaffRoleAssignmentDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface RoleScopeViewProps {
  roleAssignments: StaffRoleAssignmentDto[];
}

export const RoleScopeView: React.FC<RoleScopeViewProps> = ({ roleAssignments }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Role & Data Scope Hierarchy">
        Role assignments enforce data isolation across the hierarchy:
        <code>COMPANY → PARTNER → ORGANIZATION → BRANCH → DEPARTMENT → ASSIGNED → SELF</code>.
        Clinical prescriptions, chart edits, order sets, and patient queue management strictly obey these boundaries.
      </Alert>

      <Card
        title="Active Staff Role & Scope Bindings"
        subtitle="Role privileges and data scope isolation levels across partner clinics and hospitals"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Operational Role Code</TableHead>
                <TableHead>Data Scope Isolation</TableHead>
                <TableHead>Primary Status</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead>Assigned By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleAssignments.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {r.staffName ?? 'Staff Member'}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontWeight: '600' }}>
                    {r.roleCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.dataScope === 'ORGANIZATION' ? 'primary' : r.dataScope === 'BRANCH' ? 'success' : 'neutral'}>
                      {r.dataScope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.isPrimary ? (
                      <Badge variant="success">PRIMARY</Badge>
                    ) : (
                      <Badge variant="neutral">SECONDARY</Badge>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {new Date(r.effectiveFrom).toLocaleDateString()}
                    {r.effectiveTo ? ` — ${new Date(r.effectiveTo).toLocaleDateString()}` : ' (Indefinite)'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {r.assignedBy}
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
