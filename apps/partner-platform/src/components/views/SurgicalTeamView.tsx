import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: OTScheduleDto[];
  onAssignTeam: (schedule: OTScheduleDto) => void;
}

export const SurgicalTeamView: React.FC<Props> = ({ schedules, onAssignTeam }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Surgical Team Rosters</h1>
        <p className="text-sm text-gray-500">Lead surgeons, assistant surgeons, anaesthetists, and scrub/circulating nurses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map(s => (
          <Card key={s.id} className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base text-gray-900">{s.procedureName}</span>
              <Badge variant="primary">{s.roomName}</Badge>
            </div>
            <p className="text-xs text-gray-600">Patient: <strong>{s.patientName}</strong> ({s.patientMrn})</p>
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded bg-gray-50 border">
              <div><span className="text-gray-500">Lead Surgeon:</span> <p className="font-semibold text-gray-900">{s.primarySurgeonName}</p></div>
              <div><span className="text-gray-500">Assistant Surgeon:</span> <p className="font-semibold text-gray-900">{s.assistantSurgeonName || 'None'}</p></div>
              <div><span className="text-gray-500">Lead Anaesthetist:</span> <p className="font-semibold text-gray-900">{s.leadAnaesthetistName}</p></div>
              <div><span className="text-gray-500">Scrub Nurse:</span> <p className="font-semibold text-gray-900">{s.scrubNurseName}</p></div>
              <div><span className="text-gray-500">Circulating Nurse:</span> <p className="font-semibold text-gray-900">{s.circulatingNurseName}</p></div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onAssignTeam(s)}>Modify Surgical Team</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
