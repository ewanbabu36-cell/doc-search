import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { SurgicalConsumableUsageDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  consumables: SurgicalConsumableUsageDto[];
  schedules: OTScheduleDto[];
  onRecordUsage: (schedule: OTScheduleDto) => void;
}

export const SurgicalConsumablesView: React.FC<Props> = ({ consumables, schedules, onRecordUsage }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgical Consumables & Inventory</h1>
          <p className="text-sm text-gray-500">Real-time stock deduction, suture kits, and intraoperative supplies</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Record Consumption</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} ({s.procedureName})</p>
                <p className="text-xs text-gray-500">{s.roomName}</p>
              </div>
              <Button variant="primary" onClick={() => onRecordUsage(s)}>Record Consumables</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Inventory Deduction Audit</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Item</th>
              <th className="py-2">Batch</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Total Cost</th>
              <th className="py-2">Recorded By</th>
              <th className="py-2">Inventory Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {consumables.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-medium">{c.itemName} ({c.itemCode})</td>
                <td className="py-2 text-xs text-gray-500">{c.batchNumber}</td>
                <td className="py-2">{c.quantityUsed} {c.unitOfMeasure}</td>
                <td className="py-2 font-bold">₹{c.totalCost}</td>
                <td className="py-2 text-gray-600">{c.recordedBy}</td>
                <td className="py-2"><Badge variant="success">{c.inventoryDeductionStatus}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
