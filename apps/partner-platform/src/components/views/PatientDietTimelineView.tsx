import React, { useState } from 'react';
import { Card, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryOrderDto, DietaryMealDispatchDto, DietarySafetyAlertDto } from '@docsearch/api-contracts';

interface Props {
  orders: DietaryOrderDto[];
  dispatches: DietaryMealDispatchDto[];
  safetyAlerts: DietarySafetyAlertDto[];
}

export const PatientDietTimelineView: React.FC<Props> = ({ orders, dispatches, safetyAlerts }) => {
  const [selectedPatientMrn, setSelectedPatientMrn] = useState(orders[0]?.patientMrn || '');

  const patientOrders = orders.filter((o) => o.patientMrn.toLowerCase().includes(selectedPatientMrn.toLowerCase()));
  const patientDispatches = dispatches.filter((d) => d.patientMrn.toLowerCase().includes(selectedPatientMrn.toLowerCase()));
  const patientAlerts = safetyAlerts.filter((a) => a.patientMrn.toLowerCase().includes(selectedPatientMrn.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Patient Nutritional & Meal Timeline</h1>
        <p className="text-xs text-gray-500">Comprehensive longitudinal view of diet orders, meal deliveries, refusals, and allergy alerts</p>
      </div>

      <Card className="p-4">
        <Input placeholder="Filter by Patient MRN (e.g. MRN-2026-8801)..." value={selectedPatientMrn} onChange={(e) => setSelectedPatientMrn(e.target.value)} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diet Orders */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Prescribed Diets</h2>
          {patientOrders.map((o) => (
            <div key={o.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{o.orderNumber}</span>
                <Badge variant="primary">{o.status}</Badge>
              </div>
              <p className="font-medium text-blue-700">{o.dietTypeName}</p>
              <p className="text-gray-500">{o.wardName} - {o.roomBedNumber}</p>
              <p className="text-gray-500">Prescribed by {o.orderingDoctor}</p>
            </div>
          ))}
        </Card>

        {/* Meal Deliveries */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Meal Service History</h2>
          {patientDispatches.map((d) => (
            <div key={d.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{d.mealSlot}</span>
                <Badge variant={d.deliveryStatus === 'ACCEPTED' ? 'primary' : 'neutral'}>{d.deliveryStatus}</Badge>
              </div>
              <p className="text-gray-700">Tray: {d.trayBarcode}</p>
              <p className="text-gray-500">Delivered: {d.deliveredAt || 'In Transit'} by {d.deliveryPersonName}</p>
            </div>
          ))}
        </Card>

        {/* Safety & Allergy Alerts */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Safety & Intercepts</h2>
          {patientAlerts.map((a) => (
            <div key={a.id} className="p-3 bg-red-50 rounded-lg text-xs space-y-1 border border-red-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-red-900">{a.alertCode}</span>
                <Badge variant="danger">{a.severity}</Badge>
              </div>
              <p className="text-red-700">{a.description}</p>
              <p className="text-xs text-gray-500">Status: {a.isResolved ? '✅ Resolved' : '🚨 Active'}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};
