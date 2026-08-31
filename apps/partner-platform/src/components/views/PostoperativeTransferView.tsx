import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { PostoperativeTransferDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  transfers: PostoperativeTransferDto[];
  schedules: OTScheduleDto[];
  onOpenTransfer: (schedule: OTScheduleDto) => void;
}

export const PostoperativeTransferView: React.FC<Props> = ({ transfers, schedules, onOpenTransfer }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post-Operative Transfers & Handover</h1>
          <p className="text-sm text-gray-500">Step-down transfers from PACU to IPD Wards, HDUs, and ICUs</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Execute Handover</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} ({s.patientMrn})</p>
                <p className="text-xs text-gray-500">{s.procedureName}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenTransfer(s)}>Transfer Patient</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Step-Down Transfer Records</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Transfer #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Destination Unit</th>
              <th className="py-2">Bed</th>
              <th className="py-2">Handover Staff</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {transfers.map(t => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-gray-900">{t.transferNumber}</td>
                <td className="py-2 font-semibold">{t.patientName}</td>
                <td className="py-2">{t.destinationWardOrICU}</td>
                <td className="py-2 font-bold">{t.destinationBedNumber}</td>
                <td className="py-2 text-xs text-gray-500">{t.transferringNurse} → {t.receivingNurse}</td>
                <td className="py-2"><Badge variant="success">{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
