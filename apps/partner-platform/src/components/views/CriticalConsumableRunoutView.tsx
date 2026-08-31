import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { CriticalConsumableRunoutDto } from '@docsearch/api-contracts';

interface Props {
  consumables: CriticalConsumableRunoutDto[];
}

export const CriticalConsumableRunoutView: React.FC<Props> = ({ consumables }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Critical Life-Saving Consumable Stockout & Burn-Rate Forecast</h2>
        <p className="text-xs text-gray-500">Blood bank units, oxygen cylinders, inotropes, and implants runout velocity</p>
      </div>

      <div className="space-y-3">
        {consumables.map((c) => (
          <Card key={c.skuCode} className="p-4 flex justify-between items-center text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{c.itemName}</span>
                <Badge variant={c.urgencyLevel === 'CRITICAL_RUNOUT_24H' ? 'danger' : 'warning'}>{c.urgencyLevel}</Badge>
                <span className="text-gray-500">{c.category}</span>
              </div>
              <p className="text-gray-600">Stock: <strong>{c.currentStockUnits} units</strong> | Burn Rate: <strong>{c.dailyBurnRateUnits} units/day</strong></p>
              <p className="text-blue-900 font-semibold">Status: {c.autoReplenishmentStatus}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-700 block">{c.projectedRunoutDays} Days</span>
              <span className="text-gray-500">Projected Runout</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
