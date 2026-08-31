import React from 'react';
import { Card, Table, Button } from '@docsearch/ui-kit';
import type { SurgicalImplantDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  implants: SurgicalImplantDto[];
  schedules: OTScheduleDto[];
  onLogImplant: (schedule: OTScheduleDto) => void;
}

export const ImplantManagementView: React.FC<Props> = ({ implants, schedules, onLogImplant }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgical Implants & Prosthesis Tracking</h1>
          <p className="text-sm text-gray-500">UDI barcodes, manufacturer lots, serial tracking, and patient implant passports</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Record Implant for Surgery</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} — {s.procedureName}</p>
                <p className="text-xs text-gray-500">{s.roomName}</p>
              </div>
              <Button variant="primary" onClick={() => onLogImplant(s)}>+ Register Implant</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Implanted Devices Registry</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Tracking #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Implant Name</th>
              <th className="py-2">Manufacturer / Lot</th>
              <th className="py-2">Placement Site</th>
              <th className="py-2">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {implants.map(imp => (
              <tr key={imp.id}>
                <td className="py-2 font-bold text-gray-900">{imp.implantTrackingNumber}</td>
                <td className="py-2">{imp.patientName}</td>
                <td className="py-2 font-semibold">{imp.implantName}</td>
                <td className="py-2 text-xs text-gray-500">{imp.manufacturerName} • {imp.serialOrLotNumber}</td>
                <td className="py-2">{imp.anatomicPlacementSite}</td>
                <td className="py-2 font-medium">₹{imp.unitCost}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
