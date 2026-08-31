import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  encounters: EmergencyEncounterDto[];
  onTriage: (enc: EmergencyEncounterDto) => void;
  onReassess: (enc: EmergencyEncounterDto) => void;
  onAssign: (enc: EmergencyEncounterDto) => void;
  onDisposition: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyQueueView: React.FC<Props> = ({
  encounters,
  onTriage,
  onReassess,
  onAssign,
  onDisposition
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = encounters.filter(
    (e) =>
      e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.encounterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Priority Queue</h1>
        <p className="text-sm text-gray-500">Real-time acuity sorted triage queue with long-wait alerts and clinician assignment</p>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patient name, MRN, complaint or encounter..." />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Encounter #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Arrival Mode</th>
              <th className="py-2">ESI Acuity</th>
              <th className="py-2">Zone / Bed</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map((e) => (
              <tr key={e.id}>
                <td className="py-2 font-bold text-gray-900">{e.encounterNumber}</td>
                <td className="py-2">
                  <div className="font-semibold">{e.patientName}</div>
                  <div className="text-xs text-gray-500">{e.patientGender}, {e.patientAge || 'Unknown'} yrs</div>
                </td>
                <td className="py-2 text-xs">{e.arrivalMode}</td>
                <td className="py-2">
                  <Badge variant={e.triageEsiLevel?.includes('ESI_1') ? 'danger' : e.triageEsiLevel?.includes('ESI_2') ? 'warning' : 'primary'}>
                    {e.triageEsiLevel || 'Pending Triage'}
                  </Badge>
                </td>
                <td className="py-2 text-xs">{e.currentZoneName || 'Triage Area'} {e.currentBedNumber ? '(' + e.currentBedNumber + ')' : ''}</td>
                <td className="py-2">
                  <Badge variant={e.currentStatus === 'RESUSCITATION' ? 'danger' : 'neutral'}>{e.currentStatus}</Badge>
                </td>
                <td className="py-2 text-right space-x-1">
                  {!e.triageEsiLevel && <Button variant="primary" onClick={() => onTriage(e)}>Triage</Button>}
                  {e.triageEsiLevel && <Button variant="outline" onClick={() => onReassess(e)}>Re-Triage</Button>}
                  <Button variant="outline" onClick={() => onAssign(e)}>Assign</Button>
                  <Button variant="primary" onClick={() => onDisposition(e)}>Disposition</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
