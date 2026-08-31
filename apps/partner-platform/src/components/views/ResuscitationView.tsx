import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyResuscitationEventDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  events: EmergencyResuscitationEventDto[];
  encounters: EmergencyEncounterDto[];
  onStartResus: (enc: EmergencyEncounterDto) => void;
  onRecordAction: (event: EmergencyResuscitationEventDto) => void;
}

export const ResuscitationView: React.FC<Props> = ({ events, encounters, onStartResus, onRecordAction }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Code Blue & Emergency Resuscitation (ACLS)</h1>
          <p className="text-sm text-gray-500">Cardiac arrest logs, defibrillation records, CPR durations, and ROSC outcomes</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active Emergency Cases</h2>
        <div className="space-y-2">
          {encounters.filter(e => e.currentStatus === 'RESUSCITATION' || e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION').map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-red-50/50">
              <div>
                <p className="font-bold text-red-900">{e.patientName} ({e.encounterNumber})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="danger" onClick={() => onStartResus(e)}>⚡ Initiate Code Blue Log</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Resuscitation Log Vault</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Event #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Leader</th>
              <th className="py-2">Initial Rhythm</th>
              <th className="py-2">CPR / Shocks</th>
              <th className="py-2">ROSC Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {events.map(ev => (
              <tr key={ev.id}>
                <td className="py-2 font-bold text-red-700">{ev.eventNumber}</td>
                <td className="py-2">{ev.patientName}</td>
                <td className="py-2 text-xs">{ev.teamLeaderName}</td>
                <td className="py-2 text-xs"><Badge variant="danger">{ev.initialRhythm}</Badge></td>
                <td className="py-2 text-xs">{ev.cprDurationMinutes} min • {ev.shocksDeliveredCount} shocks</td>
                <td className="py-2"><Badge variant={ev.roscAchieved ? 'success' : 'neutral'}>{ev.roscAchieved ? 'ROSC Achieved' : ev.finalOutcome}</Badge></td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onRecordAction(ev)}>Log Actions</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
