import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BreakdownWorkOrderDto } from '@docsearch/api-contracts';

interface Props {
  workOrders: BreakdownWorkOrderDto[];
  onReportBreakdown: () => void;
  onAssignEngineer: (wo: BreakdownWorkOrderDto) => void;
  onCompleteRepair: (wo: BreakdownWorkOrderDto) => void;
  onVerifyClinician: (wo: BreakdownWorkOrderDto) => void;
}

export const BreakdownWorkOrdersView: React.FC<Props> = ({
  workOrders,
  onReportBreakdown,
  onAssignEngineer,
  onCompleteRepair,
  onVerifyClinician
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Corrective Maintenance & Breakdown Work Orders</h2>
          <p className="text-xs text-gray-500">Unscheduled repairs, clinical emergency tickets, and clinician sign-offs</p>
        </div>
        <Button variant="danger" onClick={onReportBreakdown}>🚨 Report Breakdown Ticket</Button>
      </div>

      <div className="space-y-3">
        {workOrders.map((wo) => (
          <Card key={wo.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{wo.workOrderNumber}</span>
                <Badge variant={wo.priority === 'EMERGENCY_STAT' ? 'danger' : wo.priority === 'URGENT' ? 'warning' : 'neutral'}>
                  {wo.priority}
                </Badge>
                <Badge variant={wo.status === 'CLOSED' ? 'success' : wo.status === 'COMPLETED' ? 'primary' : 'danger'}>
                  {wo.status}
                </Badge>
                <span className="text-xs text-gray-500">{wo.reportedTime.replace('T', ' ').substring(0, 16)}</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{wo.assetName} ({wo.assetCode})</p>
              <p className="text-xs text-gray-600"><strong>Problem:</strong> {wo.problemDescription}</p>
              <p className="text-xs text-gray-500">📍 {wo.departmentName} - {wo.roomBedLocation} | Reported by: {wo.reportedByClinician}</p>
              {wo.assignedEngineer && (
                <p className="text-xs text-blue-700">Assigned Engineer: {wo.assignedEngineer}</p>
              )}
            </div>

            <div className="text-right space-y-2">
              {wo.status === 'OPEN_REPORTED' && (
                <Button variant="primary" size="sm" onClick={() => onAssignEngineer(wo)}>Assign Engineer</Button>
              )}
              {wo.status === 'ASSIGNED' && (
                <Button variant="primary" size="sm" onClick={() => onCompleteRepair(wo)}>Complete Repair</Button>
              )}
              {wo.status === 'IN_PROGRESS' && (
                <Button variant="primary" size="sm" onClick={() => onCompleteRepair(wo)}>Finalize Service</Button>
              )}
              {wo.status === 'COMPLETED' && (
                <Button variant="outline" size="sm" onClick={() => onVerifyClinician(wo)}>Clinician Verification</Button>
              )}
              {wo.status === 'CLOSED' && (
                <div className="text-xs text-emerald-700 font-semibold">
                  ✓ Verified by {wo.verifiedByClinicianName}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
