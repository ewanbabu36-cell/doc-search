import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryWasteRecordDto } from '@docsearch/api-contracts';

interface Props {
  wasteRecords: DietaryWasteRecordDto[];
  onLogWaste: () => void;
}

export const DietaryWasteView: React.FC<Props> = ({ wasteRecords, onLogWaste }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Food Waste & Loss Analytics Management</h1>
          <p className="text-xs text-gray-500">Track overproduction, spoilage, last-minute diet change disposals, and financial loss metrics</p>
        </div>
        <Button variant="primary" size="sm" onClick={onLogWaste}>+ Log Waste Record</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wasteRecords.map((w) => (
          <Card key={w.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{w.kitchenName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{w.wasteCode} | {w.mealDate} ({w.mealSlot})</p>
              </div>
              <Badge variant="danger">{w.reason}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg text-center">
              <div><p className="text-gray-500 text-[10px]">Prepared</p><p className="font-bold text-gray-900">{w.preparedQuantity} {w.unit}</p></div>
              <div><p className="text-gray-500 text-[10px]">Served</p><p className="font-bold text-green-700">{w.servedQuantity} {w.unit}</p></div>
              <div><p className="text-gray-500 text-[10px]">Wasted</p><p className="font-bold text-red-700">{w.wastedQuantity} {w.unit}</p></div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-gray-500">Reported by {w.reportedBy}</span>
              <span className="font-bold text-red-800">Loss: ₹{w.estimatedCostLoss}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
