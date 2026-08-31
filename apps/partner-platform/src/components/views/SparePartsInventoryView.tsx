import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { SparePartDto, SparePartUsageDto } from '@docsearch/api-contracts';

interface Props {
  spareParts: SparePartDto[];
  usages: SparePartUsageDto[];
  onAddPart: () => void;
  onConsumePart: () => void;
}

export const SparePartsInventoryView: React.FC<Props> = ({ spareParts, usages, onAddPart, onConsumePart }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Biomedical Spare Parts & Components Store</h2>
          <p className="text-xs text-gray-500">Critical life-support spare stock, minimum reorder thresholds, consumption logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onConsumePart}>- Consume Spare</Button>
          <Button variant="primary" onClick={onAddPart}>+ Register New SKU</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {spareParts.map((part) => (
          <Card key={part.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{part.partCode}</span>
              <Badge variant={part.quantityOnHand <= part.minimumThresholdQuantity ? 'danger' : 'success'}>
                Qty: {part.quantityOnHand}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{part.partName}</p>
              <p className="text-xs text-gray-500">Mfr: {part.manufacturer} | Bin: {part.storageBinLocation}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="text-gray-600">Unit Cost: ₹{part.unitCost.toLocaleString()}</p>
              <p className="text-gray-600">Min Threshold: {part.minimumThresholdQuantity} units</p>
              <p className="text-gray-500">Compatible: {part.compatibleModels.join(', ')}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Recent Parts Consumption Logs</h3>
        <div className="divide-y text-xs">
          {usages.map((u) => (
            <div key={u.id} className="py-2 flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-900">{u.usageCode}</span>: {u.quantityUsed}x {u.partName} ({u.partCode})
                <p className="text-gray-500">Installed on {u.assetCode} by {u.usedByEngineer} on {u.usageDate}</p>
              </div>
              <span className="font-bold text-gray-800">₹{u.totalCost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
