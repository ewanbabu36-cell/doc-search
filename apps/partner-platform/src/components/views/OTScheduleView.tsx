import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: OTScheduleDto[];
  onBookSchedule: () => void;
  onReschedule: (schedule: OTScheduleDto) => void;
  onAssignTeam: (schedule: OTScheduleDto) => void;
  onStartSurgery: (schedule: OTScheduleDto) => void;
  onCancelSurgery: (schedule: OTScheduleDto) => void;
}

export const OTScheduleView: React.FC<Props> = ({
  schedules,
  onBookSchedule,
  onReschedule,
  onAssignTeam,
  onStartSurgery,
  onCancelSurgery
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = schedules.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OT Master Roster & Schedules</h1>
          <p className="text-sm text-gray-500">Active surgical calendar, room allocations, and team assignments</p>
        </div>
        <Button variant="primary" onClick={onBookSchedule}>+ Book New Schedule</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, procedure, room or surgeon..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Schedule #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Room</th>
              <th className="py-2">Procedure</th>
              <th className="py-2">Surgeon & Anaesthetist</th>
              <th className="py-2">Time</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="py-2 font-bold text-gray-900">{s.scheduleNumber}</td>
                <td className="py-2">
                  <div className="font-semibold">{s.patientName}</div>
                  <div className="text-xs text-gray-500">{s.patientMrn}</div>
                </td>
                <td className="py-2">{s.roomName}</td>
                <td className="py-2 font-medium">{s.procedureName}</td>
                <td className="py-2 text-xs">
                  <div>Surgeon: <strong>{s.primarySurgeonName}</strong></div>
                  <div>Anaesth: <strong>{s.leadAnaesthetistName}</strong></div>
                </td>
                <td className="py-2 text-xs text-gray-600">
                  {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.estimatedDurationMinutes}m)
                </td>
                <td className="py-2">
                  <Badge variant={s.status === 'IN_PROGRESS' ? 'danger' : s.status === 'CONFIRMED' ? 'primary' : 'neutral'}>
                    {s.status}
                  </Badge>
                </td>
                <td className="py-2 text-right space-x-1">
                  {s.status === 'CONFIRMED' && (
                    <>
                      <Button variant="primary" onClick={() => onStartSurgery(s)}>Start Incision</Button>
                      <Button variant="outline" onClick={() => onAssignTeam(s)}>Team</Button>
                      <Button variant="outline" onClick={() => onReschedule(s)}>Reschedule</Button>
                      <Button variant="danger" onClick={() => onCancelSurgery(s)}>Cancel</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
