import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryProductionPlanDto } from '@docsearch/api-contracts';

interface Props {
  plans: DietaryProductionPlanDto[];
  onNewProductionPlan: () => void;
  onReleasePlan: (plan: DietaryProductionPlanDto) => void;
}

export const KitchenProductionView: React.FC<Props> = ({ plans, onNewProductionPlan, onReleasePlan }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kitchen Batch Production Planning</h1>
          <p className="text-xs text-gray-500">Calculated batch meal census, dietary category aggregations, and chef release authorization</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewProductionPlan}>+ Generate Production Plan</Button>
      </div>

      <div className="space-y-3">
        {plans.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">{p.planNumber}</span>
                <Badge variant={p.status === 'READY' ? 'primary' : 'neutral'}>{p.status}</Badge>
              </div>
              <p className="text-xs text-gray-500">{p.kitchenName} | Date: {p.productionDate} ({p.mealSlot})</p>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-700 mt-2">
                <span>Total Patients: {p.totalPatientsCount}</span>
                <span className="text-blue-600">Regular: {p.regularMealsCount}</span>
                <span className="text-green-600">Therapeutic: {p.therapeuticMealsCount}</span>
                <span className="text-red-600">NPO Fasting: {p.npoCount}</span>
                <span className="text-amber-600">Allergy Alerts: {p.specialAllergyCount}</span>
              </div>
            </div>
            {p.status === 'PLANNED' && (
              <Button variant="primary" size="sm" onClick={() => onReleasePlan(p)}>Release to Chefs</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
