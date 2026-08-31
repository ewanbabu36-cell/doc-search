import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyDispositionDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  dispositions: EmergencyDispositionDto[];
  encounters: EmergencyEncounterDto[];
  onAuthorizeDisposition: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyDispositionView: React.FC<Props> = ({ dispositions, encounters, onAuthorizeDisposition }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Dispositions & Handover Hub</h1>
        <p className="text-sm text-gray-500">Cross-domain routing into IPD Wards, Intensive Care (ICU), Stat OT Surgeries, and Discharges</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Pending Disposition Decisions</h2>
        <div className="space-y-2">
          {encounters.filter(e => !['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'DECEASED'].includes(e.currentStatus)).map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.encounterNumber})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint} • Current: {e.currentStatus}</p>
              </div>
              <Button variant="primary" onClick={() => onAuthorizeDisposition(e)}>Authorize Disposition</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Executed Dispositions</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Patient</th>
              <th className="py-2">Disposition Outcome</th>
              <th className="py-2">Destination</th>
              <th className="py-2">Authorizing Physician</th>
              <th className="py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {dispositions.map(d => (
              <tr key={d.id}>
                <td className="py-2 font-semibold">{d.patientName}</td>
                <td className="py-2"><Badge variant="primary">{d.outcome}</Badge></td>
                <td className="py-2 text-xs">{d.destinationWardOrFacility || 'Home'}</td>
                <td className="py-2 text-xs">{d.authorizingPhysician}</td>
                <td className="py-2 text-xs text-gray-500">{new Date(d.dispositionTimestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
