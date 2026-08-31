import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: OTScheduleDto[];
  onOpenEmergency: () => void;
}

export const EmergencyOTView: React.FC<Props> = ({ schedules, onOpenEmergency }) => {
  const emergencies = schedules.filter(s => s.isEmergency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-950 text-white p-6 rounded-xl border border-red-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🚨 Emergency & Trauma OT Command</h1>
          <p className="text-xs text-red-200 mt-1">High-priority emergency surgery queue with fast-track bypass authorization</p>
        </div>
        <Button variant="danger" onClick={onOpenEmergency}>Deploy Stat Emergency Surgery</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencies.map(e => (
          <Card key={e.id} className="p-5 border-l-4 border-l-red-600 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base text-gray-900">{e.procedureName}</span>
              <Badge variant="danger">STAT EMERGENCY</Badge>
            </div>
            <p className="text-xs text-gray-600">Patient: <strong>{e.patientName}</strong> ({e.patientMrn})</p>
            <div className="text-xs p-3 rounded bg-red-50 text-red-900 space-y-1">
              <div>Room: <strong>{e.roomName}</strong></div>
              <div>Lead Trauma Surgeon: <strong>{e.primarySurgeonName}</strong></div>
              <div>Lead Anaesthetist: <strong>{e.leadAnaesthetistName}</strong></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
