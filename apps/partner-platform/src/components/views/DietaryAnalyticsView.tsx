import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { DietaryAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: DietaryAnalyticsDto;
}

export const DietaryAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dietary Department Executive BI & Analytics</h1>
        <p className="text-xs text-gray-500">Meal delivery turnaround times, dietary category distributions, and waste cost KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 font-medium">Meal Delivery Success Rate</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{analytics.dailyMealDeliverySuccessRatePct}%</p>
          <p className="text-xs text-gray-500 mt-1">Average Turnaround: <strong>{analytics.averageTurnaroundMins} mins</strong></p>
        </Card>
        <Card className="p-5 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 font-medium">Monthly Ingredient Spend</p>
          <p className="text-3xl font-bold text-blue-700 mt-2">₹{analytics.monthlyExpenditureVsBudget.ingredientCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Budget: ₹{analytics.monthlyExpenditureVsBudget.budgetAllocated.toLocaleString()}</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500 font-medium">Monthly Food Waste Loss</p>
          <p className="text-3xl font-bold text-red-700 mt-2">₹{analytics.monthlyExpenditureVsBudget.wasteLoss.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Controlled within 2.4% threshold</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Meals Served by Diet Category</h2>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.mealsServedByDietCategory).map(([cat, count]) => (
              <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">{cat}</span>
                <span className="font-bold text-gray-900">{count} meals</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Ward Distribution Census</h2>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.mealsDeliveredByWard).map(([ward, count]) => (
              <div key={ward} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">{ward}</span>
                <span className="font-bold text-blue-700">{count} meals</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
