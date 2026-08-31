import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyObservationCaseDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  cases: EmergencyObservationCaseDto[];
  encounters: EmergencyEncounterDto[];
  onAdmitToObservation: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyObservationView: React.FC<Props> = ({ cases, encounters, onAdmitToObservation }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Observation Unit</h1>
        <p className="text-sm text-gray-500">Clinical decision unit, serial enzymes, post-reduction monitoring, and stepdown decisions</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Admit ED Patient to Observation</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="primary" onClick={() => onAdmitToObservation(e)}>Transfer to Obs Bed</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active Observation Cases</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Bed #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Attending Doctor</th>
              <th className="py-2">Reason</th>
              <th className="py-2">Hours</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {cases.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold text-indigo-700">{c.observationBedNumber}</td>
                <td className="py-2 font-semibold">{c.patientName}</td>
                <td className="py-2 text-xs">{c.attendingDoctor}</td>
                <td className="py-2 text-xs text-gray-600">{c.admissionReason}</td>
                <td className="py-2 font-medium">{c.hoursInObservation} hrs</td>
                <td className="py-2"><Badge variant="success">{c.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
