import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryPreparationRecordDto, DietaryProductionPlanDto } from '@docsearch/api-contracts';

interface Props {
  prepRecords: DietaryPreparationRecordDto[];
  productionPlans: DietaryProductionPlanDto[];
  onLogPreparation: () => void;
}

export const MealPreparationView: React.FC<Props> = ({ prepRecords, onLogPreparation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Culinary Meal Preparation & Batch Cooking</h1>
          <p className="text-xs text-gray-500">Core cooking temperatures, hot holding logs, chef assignments, and completion timestamps</p>
        </div>
        <Button variant="primary" size="sm" onClick={onLogPreparation}>+ Log Prepared Batch</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prepRecords.map((r) => (
          <Card key={r.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{r.foodItemName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{r.batchNumber} | {r.dietCategory}</p>
              </div>
              <Badge variant="primary">{r.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
              <p><strong>Quantity:</strong> {r.quantityPrepared} {r.unit}</p>
              <p><strong>Head Chef:</strong> {r.headChef}</p>
              <p><strong>Cooking Temp:</strong> {r.cookingTemperatureC}°C</p>
              <p><strong>Holding Temp:</strong> {r.holdingTemperatureC}°C</p>
            </div>
            <p className="text-xs text-gray-500">Start Time: {r.startTime} | Finished: {r.completionTime || 'In progress'}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
