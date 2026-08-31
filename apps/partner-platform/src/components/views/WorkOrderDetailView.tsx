import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BreakdownWorkOrderDto } from '@docsearch/api-contracts';

interface Props {
  workOrder: BreakdownWorkOrderDto;
  onBack: () => void;
  onAssign: () => void;
  onComplete: () => void;
  onVerify: () => void;
}

export const WorkOrderDetailView: React.FC<Props> = ({ workOrder, onBack, onAssign, onComplete, onVerify }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Work Orders</Button>
          <h2 className="text-lg font-bold text-gray-900">{workOrder.workOrderNumber} — Breakdown Details</h2>
        </div>
        <div className="flex items-center gap-2">
          {workOrder.status === 'OPEN_REPORTED' && <Button variant="primary" onClick={onAssign}>Assign Engineer</Button>}
          {(workOrder.status === 'ASSIGNED' || workOrder.status === 'IN_PROGRESS') && <Button variant="primary" onClick={onComplete}>Complete Repair</Button>}
          {workOrder.status === 'COMPLETED' && <Button variant="outline" onClick={onVerify}>Clinician Sign-off</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Ticket Summary</h3>
          <div className="space-y-2 text-xs">
            <div><span className="text-gray-500">Equipment:</span> <strong>{workOrder.assetName} ({workOrder.assetCode})</strong></div>
            <div><span className="text-gray-500">Location:</span> {workOrder.departmentName} - {workOrder.roomBedLocation}</div>
            <div><span className="text-gray-500">Priority:</span> <Badge variant="danger">{workOrder.priority}</Badge></div>
            <div><span className="text-gray-500">Status:</span> <Badge variant="neutral">{workOrder.status}</Badge></div>
            <div><span className="text-gray-500">Reported By:</span> {workOrder.reportedByClinician} ({workOrder.reportedTime})</div>
            <div><span className="text-gray-500">Problem Description:</span> <p className="p-2 bg-gray-50 rounded mt-1">{workOrder.problemDescription}</p></div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Technical Repair & Cost Log</h3>
          <div className="space-y-2 text-xs">
            <div><span className="text-gray-500">Assigned Engineer:</span> {workOrder.assignedEngineer || 'Unassigned'}</div>
            <div><span className="text-gray-500">Root Cause Analysis:</span> <p className="p-2 bg-gray-50 rounded mt-1">{workOrder.rootCauseAnalysis || 'Pending diagnosis'}</p></div>
            <div><span className="text-gray-500">Corrective Action Taken:</span> <p className="p-2 bg-gray-50 rounded mt-1">{workOrder.correctiveActionTaken || 'Pending repair'}</p></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div><span className="text-gray-500">Labor Hours:</span> <strong>{workOrder.laborHours} hrs</strong></div>
              <div><span className="text-gray-500">Spare Parts Cost:</span> <strong>₹{workOrder.sparePartsCost.toLocaleString()}</strong></div>
            </div>
            {workOrder.verifiedByClinicianName && (
              <div className="p-2 bg-green-50 text-green-800 rounded border border-green-200 mt-2">
                ✓ Clinician Verification: Signed by {workOrder.verifiedByClinicianName}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
