import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyDisasterEventDto } from '@docsearch/api-contracts';

interface Props {
  events: EmergencyDisasterEventDto[];
  onActivateDisaster: () => void;
  onRegisterVictim: () => void;
}

export const DisasterManagementView: React.FC<Props> = ({ events, onActivateDisaster, onRegisterVictim }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-950 text-white p-6 rounded-xl border border-red-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mass Casualty Incident (MCI) & Disaster Hub</h1>
          <p className="text-xs text-red-200 mt-1">Multi-casualty triage tags (Red, Yellow, Green, Black), surge capacity, and incident command</p>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" onClick={onActivateDisaster}>🚨 Declare Disaster Mode</Button>
          <Button variant="primary" onClick={onRegisterVictim}>+ Fast-Tag Victim</Button>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">MCI Incident Log</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Incident Code</th>
              <th className="py-2">Disaster Type</th>
              <th className="py-2">Commander</th>
              <th className="py-2">Victims</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {events.map(ev => (
              <tr key={ev.id}>
                <td className="py-2 font-bold text-red-700">{ev.incidentCode}</td>
                <td className="py-2">{ev.disasterType}</td>
                <td className="py-2 text-xs">{ev.incidentCommanderName}</td>
                <td className="py-2 font-bold">{ev.totalVictimsCount} Total ({ev.criticalVictimsCount} Critical)</td>
                <td className="py-2"><Badge variant={ev.isDeactivated ? 'neutral' : 'danger'}>{ev.isDeactivated ? 'Deactivated' : 'ACTIVE MCI'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
