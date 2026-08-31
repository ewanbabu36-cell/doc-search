import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { DietaryMealDispatchDto } from '@docsearch/api-contracts';

interface Props {
  dispatches: DietaryMealDispatchDto[];
}

export const MealDeliveryView: React.FC<Props> = ({ dispatches }) => {
  const delivered = dispatches.filter((d) => d.deliveryStatus === 'ACCEPTED' || d.deliveryStatus === 'DELIVERED');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bedside Meal Delivery Confirmations</h1>
        <p className="text-xs text-gray-500">Audited receipt confirmations from patients, attendants, and ward nursing staff</p>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Dispatch Code</th>
                <th className="py-2.5 px-3">Patient Name / MRN</th>
                <th className="py-2.5 px-3">Ward & Bed</th>
                <th className="py-2.5 px-3">Meal Slot & Diet</th>
                <th className="py-2.5 px-3">Delivered Time</th>
                <th className="py-2.5 px-3">Received By</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {delivered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{d.dispatchCode}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{d.patientName} ({d.patientMrn})</td>
                  <td className="py-2.5 px-3 text-gray-700">{d.wardName} - {d.roomBedNumber}</td>
                  <td className="py-2.5 px-3 text-gray-900">{d.mealSlot} ({d.dietTypeName})</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.deliveredAt || 'Recorded'}</td>
                  <td className="py-2.5 px-3 font-medium text-green-800">{d.receivedBy || 'Patient'}</td>
                  <td className="py-2.5 px-3"><Badge variant="primary">{d.deliveryStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
