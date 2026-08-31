import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { AnaesthesiaRecordDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  records: AnaesthesiaRecordDto[];
  schedules: OTScheduleDto[];
  onOpenRecord: (schedule: OTScheduleDto) => void;
}

export const AnaesthesiaWorkbenchView: React.FC<Props> = ({ records, schedules, onOpenRecord }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anaesthesia Care Workbench</h1>
        <p className="text-sm text-gray-500">Intraoperative anaesthesia records, vital telemetry, and agent administration logs</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active Schedules Pending Record</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} — {s.procedureName}</p>
                <p className="text-xs text-gray-500">Lead: {s.leadAnaesthetistName} • {s.roomName}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenRecord(s)}>Record Anaesthesia Log</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Anaesthesia Records</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Lead Anaesthetist</th>
              <th className="py-2">Anaesthesia Type</th>
              <th className="py-2">Airway Device</th>
              <th className="py-2">IV Fluids</th>
              <th className="py-2">Stability</th>
              <th className="py-2">Aldrete Score</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {records.map(r => (
              <tr key={r.id}>
                <td className="py-2 font-semibold">{r.leadAnaesthetist}</td>
                <td className="py-2">{r.anaesthesiaType}</td>
                <td className="py-2 text-gray-600">{r.airwayDeviceUsed}</td>
                <td className="py-2">{r.ivFluidsAdministeredMl} ml</td>
                <td className="py-2"><Badge variant="success">{r.intraopVitalsStability}</Badge></td>
                <td className="py-2 font-bold">{r.postAnaesthesiaAldreteScore}/10</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
