import React from 'react';
import type {
  DoctorRosterOverviewDto,
  DoctorProfileDto,
  DoctorScheduleDto
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

export interface DoctorOverviewViewProps {
  overview: DoctorRosterOverviewDto;
  doctors: DoctorProfileDto[];
  schedules: DoctorScheduleDto[];
  onSelectDoctor: (doctorId: string) => void;
}

export const DoctorOverviewView: React.FC<DoctorOverviewViewProps> = ({
  overview,
  doctors,
  schedules,
  onSelectDoctor
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Live Telemetry">
        Doctor clinical profiles, OPD consultation rosters, weekly recurring schedules, and fee matrices are sample development preview fixtures. <strong>Live OPD clinical integration is not connected.</strong>
      </Alert>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Active Doctors
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.activeDoctorsCount} Physicians
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.totalDoctorsCount} Registered in Network
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Today's OPD Coverage
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.doctorsOnDutyTodayCount} on Duty
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.doctorsOnLeaveCount} on Approved Leave
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Today's OPD Slots
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.todayAvailableSlotsCount} / {overview.todaySlotsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.todayBookedSlotsCount} Booked · {overview.todayBlockedSlotsCount} Blocked
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Roster Health
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: overview.scheduleConflictsCount > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-success)' }}>
              {overview.totalWeeklySchedulesCount} Sessions
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.pendingLeaveRequestsCount} Pending Leave Requests
            </span>
          </div>
        </Card>
      </div>

      {/* Doctor Availability Matrix */}
      <Card
        title="Attending Physician OPD Roster"
        subtitle="Specialty coverage, active consultation modes, and current availability state"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Code</TableHead>
                <TableHead>Doctor Name & Qualification</TableHead>
                <TableHead>Primary Specialty</TableHead>
                <TableHead>Consultation Modes</TableHead>
                <TableHead>Weekly Sessions</TableHead>
                <TableHead>Telehealth</TableHead>
                <TableHead>Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((d) => {
                const docSchedules = schedules.filter((s) => s.doctorId === d.id && s.isActive);
                return (
                  <TableRow
                    key={d.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectDoctor(d.id)}
                  >
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {d.doctorCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.fullName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {d.qualification} · {d.experienceYears} yrs exp
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {d.primarySpecialty}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {d.consultationModes.map((m) => (
                          <Badge key={m} variant="neutral">{m}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {docSchedules.length} recurring
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.telehealthEligible ? 'success' : 'neutral'}>
                        {d.telehealthEligible ? 'ELIGIBLE' : 'NO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.availabilityStatus === 'AVAILABLE' ? 'success' : d.availabilityStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                        {d.availabilityStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
