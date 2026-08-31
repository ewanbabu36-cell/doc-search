import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryAssessmentDto, DietaryOrderDto, DietarySafetyAlertDto } from '@docsearch/api-contracts';

interface Props {
  assessments: DietaryAssessmentDto[];
  orders: DietaryOrderDto[];
  safetyAlerts: DietarySafetyAlertDto[];
  onApproveOrder: (order: DietaryOrderDto) => void;
  onResolveAlert: (alert: DietarySafetyAlertDto) => void;
  onConductAssessment: () => void;
}

export const DietitianWorkbenchView: React.FC<Props> = ({
  assessments,
  orders,
  safetyAlerts,
  onApproveOrder,
  onResolveAlert,
  onConductAssessment
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'ORDERED' || o.status === 'UNDER_REVIEW');
  const highRiskAssessments = assessments.filter((a) => a.nutritionalRiskScore === 'HIGH_RISK' || a.nutritionalRiskScore === 'SEVERE_MALNUTRITION');
  const activeAlerts = safetyAlerts.filter((a) => !a.isResolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clinical Dietitian Clinical Workbench</h1>
          <p className="text-xs text-gray-500">Actionable clinical queue: pending diet reviews, high-risk nutritional assessments, allergy safety</p>
        </div>
        <Button variant="primary" size="sm" onClick={onConductAssessment}>+ New Patient Assessment</Button>
      </div>

      {/* Pending Diet Orders Queue */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Pending Diet Orders Awaiting Dietitian Review ({pendingOrders.length})</h2>
          <Badge variant={pendingOrders.length > 0 ? 'primary' : 'neutral'}>{pendingOrders.length} Pending</Badge>
        </div>
        {pendingOrders.length === 0 ? (
          <p className="text-xs text-gray-500">All diet orders have been verified and approved.</p>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((o) => (
              <div key={o.id} className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">{o.orderNumber} — {o.patientName} ({o.patientMrn})</p>
                  <p className="text-gray-600">{o.wardName} - {o.roomBedNumber} | Prescribed: <strong>{o.dietTypeName}</strong></p>
                  <p className="text-gray-500">Doctor: {o.orderingDoctor} | Priority: <Badge variant="primary">{o.priority}</Badge></p>
                </div>
                <Button variant="primary" size="sm" onClick={() => onApproveOrder(o)}>Verify & Approve</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* High-Risk Nutritional Inpatients */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">High Nutritional Risk Inpatients ({highRiskAssessments.length})</h2>
        <div className="space-y-2">
          {highRiskAssessments.map((a) => (
            <div key={a.id} className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-red-900">{a.patientName} ({a.patientMrn}) — {a.wardName} ({a.roomBedNumber})</p>
                <p className="text-red-700">Diagnosis: {a.clinicalCondition} | BMI: {a.bmi} | Route: {a.feedingRoute}</p>
                {a.foodAllergies.length > 0 && <p className="text-red-800 font-bold">Allergies: {a.foodAllergies.join(', ')}</p>}
              </div>
              <Badge variant="danger">{a.nutritionalRiskScore}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Allergy & Safety Alerts */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Active Allergy & Diet Change Intercepts ({activeAlerts.length})</h2>
        <div className="space-y-2">
          {activeAlerts.map((al) => (
            <div key={al.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-amber-900">{al.alertCode} — {al.patientName} ({al.wardBed})</p>
                <p className="text-amber-800">{al.description}</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => onResolveAlert(al)}>Resolve Alert</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
