import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietarySafetyAlertDto, DietaryOrderDto, DietaryProductionPlanDto } from '@docsearch/api-contracts';

interface Props {
  safetyAlerts: DietarySafetyAlertDto[];
  orders: DietaryOrderDto[];
  productionPlans: DietaryProductionPlanDto[];
  onResolveAlert: (alert: DietarySafetyAlertDto) => void;
  onReleaseProduction: (plan: DietaryProductionPlanDto) => void;
}

export const DietaryControlCenterView: React.FC<Props> = ({
  safetyAlerts,
  orders,
  productionPlans,
  onResolveAlert,
  onReleaseProduction
}) => {
  const unresolvedAlerts = safetyAlerts.filter((a) => !a.isResolved);
  const npoOrders = orders.filter((o) => o.isNpo && o.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dietary & Kitchen Control Center</h1>
          <p className="text-xs text-gray-500">Live operational command: safety alert intercepts, NPO enforcement, batch releases</p>
        </div>
        <Badge variant={unresolvedAlerts.length > 0 ? 'danger' : 'primary'}>
          {unresolvedAlerts.length > 0 ? `${unresolvedAlerts.length} Active Safety Conflicts` : 'All Safety Intercepts Clear'}
        </Badge>
      </div>

      {/* Safety Alert Stream */}
      <Card className="p-5 border-l-4 border-l-red-500">
        <h2 className="text-sm font-bold text-red-800 mb-3">Live Safety Intercepts & Allergy Alerts</h2>
        {unresolvedAlerts.length === 0 ? (
          <p className="text-xs text-gray-500">No open safety alerts or diet conflicts detected.</p>
        ) : (
          <div className="space-y-3">
            {unresolvedAlerts.map((a) => (
              <div key={a.id} className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-red-900">{a.alertCode} — {a.patientName}</span>
                    <Badge variant="danger">{a.severity}</Badge>
                    <span className="text-xs text-gray-500">({a.wardBed})</span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">{a.description}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => onResolveAlert(a)}>Resolve & Clear</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Strict NPO Patients Monitor */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Strict Nil Per Os (NPO) Fasting Census ({npoOrders.length} Inpatients)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {npoOrders.map((o) => (
            <div key={o.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-gray-900">{o.patientName} ({o.patientMrn})</p>
                <p className="text-xs text-gray-500">{o.wardName} - {o.roomBedNumber}</p>
                <p className="text-[11px] text-red-600 font-medium mt-0.5">{o.specialInstructions || 'Strict NPO'}</p>
              </div>
              <Badge variant="danger">ZERO ORAL INTAKE</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Kitchen Production Batches */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Active Kitchen Batch Releases</h2>
        <div className="space-y-3">
          {productionPlans.map((p) => (
            <div key={p.id} className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">{p.planNumber}</span>
                  <Badge variant={p.status === 'READY' ? 'primary' : 'neutral'}>{p.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.kitchenName} | {p.productionDate} ({p.mealSlot})</p>
                <p className="text-xs text-gray-600 mt-0.5">Census: {p.totalPatientsCount} Total | {p.regularMealsCount} Regular | {p.therapeuticMealsCount} Therapeutic | {p.npoCount} NPO</p>
              </div>
              {p.status === 'PLANNED' && (
                <Button variant="primary" size="sm" onClick={() => onReleaseProduction(p)}>Release to Chefs</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
