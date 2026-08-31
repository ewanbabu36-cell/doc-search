import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type {
  DietaryOverviewMetricsDto,
  DietaryOrderDto,
  DietarySafetyAlertDto,
  DietaryKitchenDto
} from '@docsearch/api-contracts';

interface Props {
  metrics: DietaryOverviewMetricsDto;
  orders: DietaryOrderDto[];
  safetyAlerts: DietarySafetyAlertDto[];
  kitchens: DietaryKitchenDto[];
  onOpenNewOrder: () => void;
  onOpenSafetyAlerts: () => void;
  onOpenKitchenControl: () => void;
}

export const DietaryOverviewView: React.FC<Props> = ({
  metrics,
  orders,
  safetyAlerts,
  kitchens,
  onOpenNewOrder,
  onOpenSafetyAlerts,
  onOpenKitchenControl
}) => {
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dietary & Kitchen Operations Dashboard</h1>
          <p className="text-xs text-gray-500">Real-time clinical nutrition orders, batch culinary production, and bedside tray delivery</p>
        </div>
        <div className="flex items-center gap-2">
          {safetyAlerts.filter((a) => !a.isResolved).length > 0 && (
            <Button variant="danger" size="sm" onClick={onOpenSafetyAlerts}>
              🚨 {safetyAlerts.filter((a) => !a.isResolved).length} Active Safety Alerts
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onOpenKitchenControl}>Kitchen Control Center</Button>
          <Button variant="primary" size="sm" onClick={onOpenNewOrder}>+ Prescribe Diet Order</Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 font-medium">Active Inpatients on Diet</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalActiveDietaryPatients}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">{metrics.totalActiveDietOrders} Active Clinical Orders</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-500 font-medium">Meals Due / In-Prep Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.mealsDueToday}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">{metrics.mealsInPreparation} In Culinary Prep</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 font-medium">Meals Delivered Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.mealsDeliveredToday}</p>
          <p className="text-[11px] text-green-600 font-medium mt-1">{metrics.mealsReadyForDispatch} Ready for Dispatch</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500 font-medium">NPO (Fasting) & Alerts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.npoPatientCount}</p>
          <p className="text-[11px] text-red-600 font-medium mt-1">{metrics.activeSafetyAlerts} Intercepted Conflicts</p>
        </Card>
      </div>

      {/* Kitchen Facility Pulse */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Active Kitchen Production Facilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kitchens.map((k) => (
            <div key={k.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{k.kitchenName}</span>
                  <Badge variant="primary">{k.kitchenType}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{k.location} | Capacity: {k.dailyCapacity} Meals/Day</p>
                <p className="text-xs text-gray-600 mt-0.5">Manager: {k.responsibleManager} ({k.contactPhone})</p>
              </div>
              <Badge variant="primary">{k.foodSafetyStatus}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Diet Orders Feed */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Recent Inpatient Clinical Diet Orders</h2>
          <Badge variant="primary">{orders.length} Orders</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Patient Name / MRN</th>
                <th className="py-2.5 px-3">Ward & Bed</th>
                <th className="py-2.5 px-3">Prescribed Diet</th>
                <th className="py-2.5 px-3">Frequency</th>
                <th className="py-2.5 px-3">Ordering Doctor</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{o.orderNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-gray-900">{o.patientName}</p>
                    <p className="text-[11px] text-gray-500">{o.patientMrn}</p>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-700">{o.wardName} - {o.roomBedNumber}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-900">{o.dietTypeName}</span>
                    {o.isNpo && <Badge variant="danger" className="ml-1">NPO</Badge>}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{o.mealFrequency}</td>
                  <td className="py-2.5 px-3 text-gray-600">{o.orderingDoctor}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={o.status === 'ACTIVE' ? 'primary' : 'neutral'}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
