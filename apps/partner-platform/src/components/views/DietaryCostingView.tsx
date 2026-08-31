import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { DietaryCostRecordDto } from '@docsearch/api-contracts';

interface Props {
  costRecords: DietaryCostRecordDto[];
}

export const DietaryCostingView: React.FC<Props> = ({ costRecords }) => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dietary Costing & Ward Financial Analytics</h1>
        <p className="text-xs text-gray-500">Ingredient expenditure, labor allocation, waste financial loss, and average cost per inpatient meal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {costRecords.map((c) => (
          <Card key={c.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{c.wardName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{c.costCode} | {c.dietCategory}</p>
              </div>
              <span className="text-xs text-gray-500">{c.recordDate}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
              <p><strong>Meals Served:</strong> {c.totalMealsServed}</p>
              <p><strong>Ingredient Cost:</strong> ₹{c.ingredientCostTotal}</p>
              <p><strong>Labor Estimate:</strong> ₹{c.laborCostEstimate}</p>
              <p><strong>Waste Loss:</strong> ₹{c.wasteCostTotal}</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t text-xs font-bold text-blue-900">
              <span>Avg Cost / Meal:</span>
              <span className="text-sm">₹{c.costPerMealAverage}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
