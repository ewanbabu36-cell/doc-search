import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { OTTransferDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  transfers: OTTransferDto[];
  schedules: OTScheduleDto[];
  onOpenTransfer: (schedule: OTScheduleDto) => void;
}

export const OTTransferView: React.FC<Props> = ({ transfers, schedules, onOpenTransfer }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Transfers to OT</h1>
        <p className="text-sm text-gray-500">Ward and ICU patient transit into the operating theatre complex</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Initiate Patient Transfer</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} ({s.patientMrn})</p>
                <p className="text-xs text-gray-500">Destination: {s.roomName}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenTransfer(s)}>Transfer to OT Holding</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Transfer Log</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Transfer #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Source</th>
              <th className="py-2">Destination</th>
              <th className="py-2">Handover Received By</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {transfers.map(t => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-gray-900">{t.transferNumber}</td>
                <td className="py-2">{t.patientName}</td>
                <td className="py-2 text-gray-500">{t.sourceLocation}</td>
                <td className="py-2 font-medium">{t.destinationRoomName}</td>
                <td className="py-2">{t.handoverReceivedBy}</td>
                <td className="py-2"><Badge variant="success">{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
