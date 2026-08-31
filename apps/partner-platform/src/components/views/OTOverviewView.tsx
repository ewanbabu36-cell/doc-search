import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OTOverviewMetricsDto, OperationTheatreRoomDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  metrics: OTOverviewMetricsDto;
  rooms: OperationTheatreRoomDto[];
  schedules: OTScheduleDto[];
  onOpenCommandCenter: () => void;
  onOpenBooking: () => void;
  onOpenEmergency: () => void;
}

export const OTOverviewView: React.FC<Props> = ({
  metrics,
  rooms,
  schedules,
  onOpenCommandCenter,
  onOpenBooking,
  onOpenEmergency
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operation Theatre & Surgery Control</h1>
          <p className="text-sm text-gray-500">Real-time OT room availability, active surgical rosters, and recovery monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onOpenCommandCenter}>Command Center</Button>
          <Button variant="primary" onClick={onOpenBooking}>+ Book OT Schedule</Button>
          <Button variant="danger" onClick={onOpenEmergency}>🚨 Emergency Surgery</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total OT Rooms</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalOTRooms}</p>
          <p className="text-xs text-blue-600 mt-1">{metrics.activeOTRooms} Commissioned</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Available Suites</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.availableOTRooms}</p>
          <p className="text-xs text-gray-500 mt-1">Ready for case</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Occupied Suites</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.occupiedOTRooms}</p>
          <p className="text-xs text-purple-600 mt-1">Surgery in progress</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Surgeries Today</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.surgeriesToday}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.completedSurgeriesToday} Completed</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">PACU Recovery</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pacuPatientsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Post-op monitoring</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">OT Utilization</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{metrics.otUtilizationPercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">Avg turnaround: {metrics.averageTurnaroundTimeMinutes}m</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">OT Suite Status Board</h2>
            <Badge variant="neutral">{rooms.length} Suites</Badge>
          </div>
          <div className="space-y-3">
            {rooms.map((rm) => (
              <div key={rm.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{rm.roomNumber}</span>
                    <span className="text-sm text-gray-700">{rm.roomName}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{rm.primarySpecialty} • ₹{rm.hourlyRate}/hr</p>
                  {rm.currentPatientName && (
                    <p className="text-xs text-purple-700 font-semibold mt-0.5">Patient: {rm.currentPatientName}</p>
                  )}
                </div>
                <div>
                  <Badge variant={rm.status === 'AVAILABLE' ? 'success' : rm.status === 'OCCUPIED' ? 'danger' : 'warning'}>
                    {rm.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Today's Surgical Schedule</h2>
            <Badge variant="primary">{schedules.length} Cases</Badge>
          </div>
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">{s.procedureName}</span>
                  <Badge variant={s.status === 'IN_PROGRESS' ? 'danger' : s.status === 'COMPLETED' ? 'success' : 'neutral'}>
                    {s.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Patient: <strong className="text-gray-800">{s.patientName}</strong> ({s.patientMrn})</span>
                  <span>Room: <strong className="text-gray-800">{s.roomName}</strong></span>
                  <span>Surgeon: <strong className="text-gray-800">{s.primarySurgeonName}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
