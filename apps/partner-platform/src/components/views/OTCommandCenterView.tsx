import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OperationTheatreRoomDto, OTScheduleDto, PACURecoveryRecordDto } from '@docsearch/api-contracts';

interface Props {
  rooms: OperationTheatreRoomDto[];
  schedules: OTScheduleDto[];
  pacuRecords: PACURecoveryRecordDto[];
  onOpenSchedule: () => void;
  onOpenEmergency: () => void;
}

export const OTCommandCenterView: React.FC<Props> = ({
  rooms,
  schedules,
  pacuRecords,
  onOpenSchedule,
  onOpenEmergency
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Live OT Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry, surgeon workloads, and active theatre interventions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onOpenSchedule}>OT Roster</Button>
          <Button variant="danger" onClick={onOpenEmergency}>🚨 Fast-Track Emergency</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
            <span>Operating Rooms</span>
            <Badge variant="primary">{rooms.length}</Badge>
          </h2>
          <div className="space-y-2">
            {rooms.map((r) => (
              <div key={r.id} className="p-2.5 rounded border text-xs flex justify-between items-center bg-gray-50">
                <div>
                  <p className="font-bold text-gray-900">{r.roomNumber} - {r.roomName}</p>
                  <p className="text-gray-500">{r.primarySpecialty}</p>
                </div>
                <Badge variant={r.status === 'AVAILABLE' ? 'success' : r.status === 'OCCUPIED' ? 'danger' : 'warning'}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
            <span>Active Cases</span>
            <Badge variant="danger">{schedules.filter(s => s.status === 'IN_PROGRESS' || s.status === 'CONFIRMED').length}</Badge>
          </h2>
          <div className="space-y-2">
            {schedules.map((s) => (
              <div key={s.id} className="p-2.5 rounded border text-xs bg-gray-50 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{s.patientName}</span>
                  <Badge variant={s.status === 'IN_PROGRESS' ? 'danger' : 'neutral'}>{s.status}</Badge>
                </div>
                <p className="text-gray-600">{s.procedureName}</p>
                <p className="text-gray-500">Lead: {s.primarySurgeonName} | Anaesth: {s.leadAnaesthetistName}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
            <span>PACU Recovery Bays</span>
            <Badge variant="warning">{pacuRecords.length}</Badge>
          </h2>
          <div className="space-y-2">
            {pacuRecords.map((p) => (
              <div key={p.id} className="p-2.5 rounded border text-xs bg-gray-50 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{p.patientName} ({p.recoveryBedNumber})</span>
                  <Badge variant="success">Aldrete {p.currentAldreteScore}/10</Badge>
                </div>
                <p className="text-gray-600">SpO2: {p.spo2Percentage}% • BP: {p.systolicBpMmHg}/{p.diastolicBpMmHg} mmHg</p>
                <p className="text-gray-500">Destination: {p.authorizedTransferDestination}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
