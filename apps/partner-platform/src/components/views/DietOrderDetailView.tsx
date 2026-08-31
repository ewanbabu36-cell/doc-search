import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryOrderDto, DietaryDietPlanDto } from '@docsearch/api-contracts';

interface Props {
  order: DietaryOrderDto;
  dietPlan?: DietaryDietPlanDto | undefined;
  onBack: () => void;
  onApprove: () => void;
  onModify: () => void;
  onNPO: () => void;
  onCreatePlan: () => void;
}

export const DietOrderDetailView: React.FC<Props> = ({
  order,
  dietPlan,
  onBack,
  onApprove,
  onModify,
  onNPO,
  onCreatePlan
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>← Back to Orders</Button>
        <div className="flex items-center gap-2">
          {!order.isNpo && (
            <Button variant="danger" size="sm" onClick={onNPO}>Declare Strict NPO</Button>
          )}
          {order.status === 'ORDERED' && (
            <Button variant="primary" size="sm" onClick={onApprove}>Approve Diet Order</Button>
          )}
          <Button variant="outline" size="sm" onClick={onModify}>Modify Diet</Button>
          {!dietPlan && (
            <Button variant="primary" size="sm" onClick={onCreatePlan}>+ Formulate Daily Meal Plan</Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber} — {order.patientName}</h1>
            <p className="text-xs text-gray-500">{order.patientMrn} | {order.wardName} - {order.roomBedNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.isNpo && <Badge variant="danger">STRICT NPO</Badge>}
            <Badge variant={order.status === 'ACTIVE' ? 'primary' : 'neutral'}>{order.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Diet Prescription</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{order.dietTypeName}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Diet Category / Route</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{order.dietCategory} ({order.feedingRoute})</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Meal Frequency</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{order.mealFrequency}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Ordering Physician</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{order.orderingDoctor}</p>
          </div>
        </div>

        {order.specialInstructions && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <p className="font-bold text-amber-900">Special Clinical Instructions:</p>
            <p className="text-amber-800 mt-0.5">{order.specialInstructions}</p>
          </div>
        )}
      </Card>

      {/* Associated Daily Meal Plan */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Daily Meal Plan Formulation</h2>
        {dietPlan ? (
          <div className="space-y-2 text-xs">
            <p><strong>Plan Code:</strong> {dietPlan.planCode} | <strong>Date:</strong> {dietPlan.planDate}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">Breakfast:</p>
                <p className="text-gray-600">{dietPlan.breakfastItems}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">Lunch:</p>
                <p className="text-gray-600">{dietPlan.lunchItems}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">Dinner:</p>
                <p className="text-gray-600">{dietPlan.dinnerItems}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">Snacks / Bedtime:</p>
                <p className="text-gray-600">{dietPlan.midMorningItems || 'None'} / {dietPlan.eveningSnackItems || 'None'}</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 font-bold mt-2">Target Calories: {dietPlan.totalEstimatedCalories} kcal | Protein: {dietPlan.totalEstimatedProtein}g</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No daily meal plan formulated yet for this order.</p>
        )}
      </Card>
    </div>
  );
};
