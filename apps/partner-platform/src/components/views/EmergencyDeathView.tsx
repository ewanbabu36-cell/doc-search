import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyDeathRecordDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  deaths: EmergencyDeathRecordDto[];
  encounters: EmergencyEncounterDto[];
  onCertifyDeath: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyDeathView: React.FC<Props> = ({ deaths, encounters, onCertifyDeath }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Death Registry & Mortuary Handover</h1>
        <p className="text-sm text-gray-500">Statutory death declarations, coroner notifications, and body transit logging</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Certify Emergency Death / BDOA</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="danger" onClick={() => onCertifyDeath(e)}>Declare & Certify Death</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Death Certificates Ledger</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Certificate #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Declaring Doctor</th>
              <th className="py-2">Cause of Death</th>
              <th className="py-2">BDOA</th>
              <th className="py-2">Police Informed</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {deaths.map(d => (
              <tr key={d.id}>
                <td className="py-2 font-bold text-slate-800">{d.deathCertificateNumber}</td>
                <td className="py-2 font-semibold">{d.patientName}</td>
                <td className="py-2 text-xs">{d.declaringPhysician}</td>
                <td className="py-2 text-xs text-gray-700">{d.primaryCauseOfDeath}</td>
                <td className="py-2"><Badge variant={d.isBroughtDead ? 'danger' : 'neutral'}>{d.isBroughtDead ? 'BDOA' : 'In-ED'}</Badge></td>
                <td className="py-2"><Badge variant={d.policeInformed ? 'warning' : 'neutral'}>{d.policeInformed ? 'Yes' : 'No'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
