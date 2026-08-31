import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyMLCCaseDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  cases: EmergencyMLCCaseDto[];
  encounters: EmergencyEncounterDto[];
  onRegisterMLC: (enc: EmergencyEncounterDto) => void;
}

export const MLCWorkbenchView: React.FC<Props> = ({ cases, encounters, onRegisterMLC }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medico-Legal Case (MLC) Workbench</h1>
        <p className="text-sm text-gray-500">Police intimation, legal chain of custody, toxicological evidence, and statutory registers</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Register MLC Case</h2>
        <div className="space-y-2">
          {encounters.filter(e => !e.isMLC).map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.encounterNumber})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="outline" onClick={() => onRegisterMLC(e)}>⚖ Register as MLC Case</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Certified Medico-Legal Cases</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">MLC #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Incident Type</th>
              <th className="py-2">Police Station</th>
              <th className="py-2">Officer / FIR</th>
              <th className="py-2">Intimation</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {cases.map(m => (
              <tr key={m.id}>
                <td className="py-2 font-bold text-indigo-700">{m.mlcNumber}</td>
                <td className="py-2">{m.patientName}</td>
                <td className="py-2 text-xs font-medium">{m.caseType}</td>
                <td className="py-2 text-xs">{m.policeStation}</td>
                <td className="py-2 text-xs">{m.policeOfficerName} ({m.firNumber || 'No FIR'})</td>
                <td className="py-2"><Badge variant="success">Sent</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
