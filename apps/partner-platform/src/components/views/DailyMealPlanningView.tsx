import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryDietPlanDto, DietaryOrderDto } from '@docsearch/api-contracts';

interface Props {
  dietPlans: DietaryDietPlanDto[];
  orders: DietaryOrderDto[];
  onNewPlan: () => void;
}

export const DailyMealPlanningView: React.FC<Props> = ({ dietPlans, onNewPlan }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Inpatient Meal Planning</h1>
          <p className="text-xs text-gray-500">Formulate breakfast, lunch, snack, and dinner meal allocations for admitted patients</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewPlan}>+ Formulate Meal Plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dietPlans.map((p) => (
          <Card key={p.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{p.patientName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{p.planCode} | {p.wardBed}</p>
              </div>
              <Badge variant="primary">{p.planDate}</Badge>
            </div>
            <p className="text-xs text-gray-700 font-medium">Diet Profile: {p.dietTypeName}</p>
            <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-lg">
              <p><strong>Breakfast:</strong> {p.breakfastItems}</p>
              <p><strong>Lunch:</strong> {p.lunchItems}</p>
              <p><strong>Dinner:</strong> {p.dinnerItems}</p>
              {p.midMorningItems && <p><strong>Mid-Morning:</strong> {p.midMorningItems}</p>}
              {p.eveningSnackItems && <p><strong>Evening Snack:</strong> {p.eveningSnackItems}</p>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t text-xs font-bold text-blue-900">
              <span>Calories: {p.totalEstimatedCalories} kcal</span>
              <span>Protein: {p.totalEstimatedProtein}g</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
