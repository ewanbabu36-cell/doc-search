import React from 'react';
import type {
  StaffAdministrationOverviewDto,
  OperationalStaffDto,
  OperationalDepartmentDto
} from '@docsearch/api-contracts';
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

export interface StaffOverviewViewProps {
  overview: StaffAdministrationOverviewDto;
  staffList: OperationalStaffDto[];
  departments: OperationalDepartmentDto[];
  onSelectStaff: (staffId: string) => void;
}

export const StaffOverviewView: React.FC<StaffOverviewViewProps> = ({
  overview,
  staffList,
  departments,
  onSelectStaff
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Live Telemetry">
        Operational clinical staff rosters, medical credentials, department structures, and role assignments are sample development preview fixtures. <strong>Live staff administration integration is not connected.</strong>
      </Alert>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Total Clinical Staff
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalStaffCount} Personnel
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activeStaffCount} Active on Duty
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Staff Availability
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.activeStaffCount} / {overview.totalStaffCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.onLeaveStaffCount} On Leave · {overview.suspendedStaffCount} Suspended
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Clinical Departments
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.totalDepartmentsCount} Depts
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {departments.filter((d) => d.status === 'ACTIVE').length} Active Hierarchy Units
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Credential Health
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: overview.pendingVerificationsCount > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-success)' }}>
              {overview.pendingVerificationsCount} Pending
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.credentialExpiryAlertsCount} Expiry Alerts
            </span>
          </div>
        </Card>
      </div>

      {/* Staff Roster Snapshot */}
      <Card
        title="Operational Clinical Staff Roster"
        subtitle="Doctors, nurses, receptionists, lab scientists, pharmacists, and billing personnel"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Code</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Staff Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role & Data Scope</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((s) => (
                <TableRow
                  key={s.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectStaff(s.id)}
                >
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
                    <Badge variant="primary">{s.primaryRole}</Badge>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
