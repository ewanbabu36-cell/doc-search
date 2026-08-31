import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyAmbulanceTransferDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  transfers: EmergencyAmbulanceTransferDto[];
  encounters: EmergencyEncounterDto[];
  onDispatchAmbulance: (enc: EmergencyEncounterDto) => void;
}

export const AmbulanceTransferView: React.FC<Props> = ({ transfers, encounters, onDispatchAmbulance }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ambulance Transit & Transfer Tracking</h1>
        <p className="text-sm text-gray-500">Inbound emergency ambulance tracking, paramedic handovers, and tertiary outbound transfers</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Dispatch Outbound Transfer</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="primary" onClick={() => onDispatchAmbulance(e)}>Dispatch Transfer</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Ambulance Transfer Log</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Transfer #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Ambulance</th>
              <th className="py-2">Route</th>
              <th className="py-2">Paramedic</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {transfers.map(t => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-gray-900">{t.transferCode}</td>
                <td className="py-2">{t.patientName}</td>
                <td className="py-2 font-semibold">{t.ambulanceNumber}</td>
                <td className="py-2 text-xs">{t.sendingFacility} → {t.receivingFacility}</td>
                <td className="py-2 text-xs">{t.accompanyingParamedic}</td>
                <td className="py-2"><Badge variant="success">{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
