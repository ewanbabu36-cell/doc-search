import React, { useState } from 'react';
import type {
  DoctorScheduleDto,
  DoctorProfileDto,
  CreateDoctorScheduleRequest
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
import { CreateScheduleDialog } from '../dialogs/CreateScheduleDialog.js';

export interface ScheduleManagerViewProps {
  schedules: DoctorScheduleDto[];
  doctors: DoctorProfileDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onCreateSchedule: (req: CreateDoctorScheduleRequest) => Promise<void>;
}

export const ScheduleManagerView: React.FC<ScheduleManagerViewProps> = ({
  schedules,
  doctors,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onCreateSchedule
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Recurring OPD Schedule Templates
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Weekly shift rules, consultation durations, break intervals, and room allocations
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          ➕ Add OPD Schedule Template
        </Button>
      </div>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Day of Week</TableHead>
                <TableHead>Shift Name</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Slot Duration</TableHead>
                <TableHead>Breaks</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => {
                const doc = doctors.find((d) => d.id === s.doctorId);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {doc?.fullName ?? s.doctorName ?? 'Doctor'}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontWeight: '700' }}>{s.dayOfWeek}</TableCell>
                    <TableCell style={{ fontWeight: '600' }}>{s.shiftName}</TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                      {s.startTime} — {s.endTime}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {s.slotDurationMinutes} mins / slot
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {s.breaks.length === 0 ? (
                        <span style={{ color: 'var(--ds-color-text-muted)' }}>None</span>
                      ) : (
                        s.breaks.map((b) => (
                          <div key={b.id}>
                            {b.breakName} ({b.startTime} - {b.endTime})
                          </div>
                        ))
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{s.roomNumber ?? 'Room 101'}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'warning'}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isCreateOpen && (
        <CreateScheduleDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          doctors={doctors}
          onCreateSchedule={onCreateSchedule}
        />
      )}
    </div>
  );
};
