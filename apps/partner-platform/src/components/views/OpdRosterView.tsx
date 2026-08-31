import React, { useState } from 'react';
import type {
  DoctorScheduleDto,
  DoctorProfileDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface OpdRosterViewProps {
  schedules: DoctorScheduleDto[];
  doctors: DoctorProfileDto[];
  onSelectDoctor: (doctorId: string) => void;
}

export const OpdRosterView: React.FC<OpdRosterViewProps> = ({
  schedules,
  doctors,
  onSelectDoctor
}) => {
  const [dayFilter, setDayFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');

  const filteredSchedules = schedules.filter((s) => {
    if (dayFilter !== 'ALL' && s.dayOfWeek !== dayFilter) return false;
    if (modeFilter !== 'ALL' && s.consultationMode !== modeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            OPD Clinical Roster Matrix
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Weekly recurring outpatient clinic sessions, doctor room allocations, and capacity coverage
          </span>
        </div>
      </div>

      {/* Roster Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Day of Week
            </label>
            <Select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Days (Full Week Matrix)' },
                { value: 'MONDAY', label: 'Monday' },
                { value: 'TUESDAY', label: 'Tuesday' },
                { value: 'WEDNESDAY', label: 'Wednesday' },
                { value: 'THURSDAY', label: 'Thursday' },
                { value: 'FRIDAY', label: 'Friday' },
                { value: 'SATURDAY', label: 'Saturday' },
                { value: 'SUNDAY', label: 'Sunday' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Consultation Mode
            </label>
            <Select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Modes' },
                { value: 'IN_PERSON', label: 'In-Person OPD' },
                { value: 'TELEHEALTH', label: 'Telehealth Virtual' },
                { value: 'HYBRID', label: 'Hybrid' },
                { value: 'WALK_IN', label: 'Walk-In' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Roster Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Shift / Session Name</TableHead>
                <TableHead>Attending Doctor</TableHead>
                <TableHead>Clinic Hours</TableHead>
                <TableHead>Slot Configuration</TableHead>
                <TableHead>Room / Clinic</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero OPD sessions scheduled for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((s) => {
                  const doc = doctors.find((d) => d.id === s.doctorId);
                  return (
                    <TableRow
                      key={s.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectDoctor(s.doctorId)}
                    >
                      <TableCell style={{ fontWeight: '700', fontSize: '0.8125rem' }}>
                        {s.dayOfWeek}
                      </TableCell>
                      <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                        {s.shiftName}
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                          {doc?.fullName ?? s.doctorName ?? 'Doctor'}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {doc?.primarySpecialty ?? 'Specialty'}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                        {s.startTime} — {s.endTime}
                      </TableCell>
                      <TableCell style={{ fontSize: '0.75rem' }}>
                        {s.slotDurationMinutes} mins / slot ({s.maxPatientsPerSlot} pt)
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        {s.roomNumber ?? 'Room 101'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{s.consultationMode}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? 'success' : 'warning'}>
                          {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
