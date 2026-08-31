import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryMealDispatchDto } from '@docsearch/api-contracts';

interface Props {
  dispatches: DietaryMealDispatchDto[];
  onConfirmDelivery: (dispatch: DietaryMealDispatchDto) => void;
  onRefuseMeal: (dispatch: DietaryMealDispatchDto) => void;
  onMissedMeal: (dispatch: DietaryMealDispatchDto) => void;
}

export const MealDispatchView: React.FC<Props> = ({
  dispatches,
  onConfirmDelivery,
  onRefuseMeal,
  onMissedMeal
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ward Meal Dispatch & In-Transit Tracking</h1>
        <p className="text-xs text-gray-500">Track trolley runs, porter handovers, bedside delivery confirmation, and refusals</p>
      </div>

      <div className="space-y-3">
        {dispatches.map((d) => (
          <Card key={d.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">{d.patientName} ({d.patientMrn})</span>
                <Badge variant={d.deliveryStatus === 'ACCEPTED' ? 'primary' : 'neutral'}>{d.deliveryStatus}</Badge>
              </div>
              <p className="text-blue-600 font-semibold">{d.dispatchCode} | Tray: {d.trayBarcode} | {d.mealSlot} ({d.dietTypeName})</p>
              <p className="text-gray-600">Location: <strong>{d.wardName} - {d.roomBedNumber}</strong> | Porter: {d.deliveryPersonName}</p>
              {d.exceptionReason && (
                <p className="text-red-700 font-medium">Exception: {d.exceptionReason}</p>
              )}
            </div>
            {d.deliveryStatus === 'DISPATCHED' && (
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => onConfirmDelivery(d)}>Confirm Delivery</Button>
                <Button variant="danger" size="sm" onClick={() => onRefuseMeal(d)}>Refused</Button>
                <Button variant="outline" size="sm" onClick={() => onMissedMeal(d)}>Missed</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
