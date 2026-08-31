import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { TraumaActivationDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  traumas: TraumaActivationDto[];
  encounters: EmergencyEncounterDto[];
  onActivateTrauma: (enc: EmergencyEncounterDto) => void;
  onRecordSecondary: (trauma: TraumaActivationDto) => void;
}

export const TraumaCommandView: React.FC<Props> = ({ traumas, encounters, onActivateTrauma, onRecordSecondary }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-900 text-white p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🚨 Level 1 / Level 2 Trauma Command</h1>
          <p className="text-xs text-red-200 mt-1">Structured ABCDE trauma protocol, FAST ultrasound, pelvic stabilization, and MTP activations</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Trauma Candidates in ED</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="danger" onClick={() => onActivateTrauma(e)}>Activate Trauma Team</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active & Closed Trauma Activations</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Activation #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Level</th>
              <th className="py-2">Mechanism</th>
              <th className="py-2">GCS</th>
              <th className="py-2">MTP / FAST</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {traumas.map(t => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-red-700">{t.activationNumber}</td>
                <td className="py-2">{t.patientName}</td>
                <td className="py-2"><Badge variant="danger">{t.activationLevel}</Badge></td>
                <td className="py-2 text-xs text-gray-600 truncate max-w-[200px]">{t.mechanismOfInjury}</td>
                <td className="py-2 font-bold">{t.disabilityGcs}/15</td>
                <td className="py-2 text-xs">
                  {t.massiveTransfusionActivated && <Badge variant="danger">MTP</Badge>}
                  {t.fastScanPositive && <Badge variant="warning">FAST+</Badge>}
                </td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onRecordSecondary(t)}>Secondary Survey</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
