import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryKitchenDto, DietaryProductionPlanDto } from '@docsearch/api-contracts';

interface Props {
  kitchen: DietaryKitchenDto;
  productionPlans: DietaryProductionPlanDto[];
  onBack: () => void;
  onEdit: () => void;
}

export const KitchenDetailView: React.FC<Props> = ({ kitchen, productionPlans, onBack, onEdit }) => {
  const plans = productionPlans.filter((p) => p.kitchenId === kitchen.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>← Back to Kitchens</Button>
        <Button variant="primary" size="sm" onClick={onEdit}>Edit Kitchen Info</Button>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{kitchen.kitchenName}</h1>
            <p className="text-xs text-gray-500">{kitchen.kitchenCode} | {kitchen.kitchenType} Facility</p>
          </div>
          <Badge variant="primary">{kitchen.foodSafetyStatus}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{kitchen.location}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Daily Capacity</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{kitchen.dailyCapacity} Meals/Day</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Operating Schedule</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{kitchen.operatingHours}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Responsible Chef/Manager</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{kitchen.responsibleManager}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Production Batches for this Facility ({plans.length})</h2>
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-900">{p.planNumber}</span>
                <span className="text-gray-500 ml-2">({p.productionDate} - {p.mealSlot})</span>
                <p className="text-gray-600 mt-0.5">Census: {p.totalPatientsCount} Total ({p.regularMealsCount} Reg, {p.therapeuticMealsCount} Ther, {p.npoCount} NPO)</p>
              </div>
              <Badge variant={p.status === 'READY' ? 'primary' : 'neutral'}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
