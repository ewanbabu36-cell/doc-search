import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type {
  RadiologyOverviewMetricsDto,
  RadiologyOrderDto,
  RadiologyCriticalFindingDto,
  RadiologyModalityDto
} from '@docsearch/api-contracts';

interface Props {
  metrics: RadiologyOverviewMetricsDto;
  orders: RadiologyOrderDto[];
  criticalFindings: RadiologyCriticalFindingDto[];
  modalities: RadiologyModalityDto[];
  onOpenNewOrder: () => void;
  onOpenCriticalAlerts: () => void;
}

export const RadiologyOverviewView: React.FC<Props> = ({
  metrics,
  orders,
  criticalFindings,
  modalities,
  onOpenNewOrder,
  onOpenCriticalAlerts
}) => {
  const pendingCritical = criticalFindings.filter((c) => c.status !== 'ACKNOWLEDGED_BY_CLINICIAN');

  return (
    <div className="space-y-6">
      {pendingCritical.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                CRITICAL IMAGING FINDINGS REQUIRING IMMEDIATE ATTENTION ({pendingCritical.length})
              </h3>
              <p className="text-xs text-red-700">
                Life-threatening or urgent acute findings flagged by Radiologists awaiting physician acknowledgement.
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={onOpenCriticalAlerts}>
            View & Acknowledge Critical Alerts
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Today's Orders</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{metrics.todaysOrdersCount}</div>
          <div className="text-xs text-blue-600 mt-1">Active requisitions</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Pending Studies</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingStudiesCount}</div>
          <div className="text-xs text-amber-700 mt-1">Awaiting scanner queue</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Completed Scans</div>
          <div className="text-2xl font-black text-green-600 mt-1">{metrics.completedScansCount}</div>
          <div className="text-xs text-green-700 mt-1">Transferred to PACS</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Avg Report TAT</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{metrics.averageTurnaroundMinutes}m</div>
          <div className="text-xs text-purple-700 mt-1">Ordered to verified report</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Modality Status Overview */}
        <Card className="col-span-2 p-5 bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Modality Live Status ({modalities.length} Units)</h3>
            <Badge variant="success">{metrics.modalityOnlinePercent}% Operational</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {modalities.map((m) => (
              <div key={m.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">{m.modalityCode}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{m.modalityName}</div>
                  <div className="text-[10px] text-gray-400">{m.roomNumber}</div>
                </div>
                <Badge variant={m.status === 'AVAILABLE' ? 'success' : m.status === 'BUSY' ? 'warning' : 'danger'}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions & Emergency Queue */}
        <Card className="p-5 bg-white border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="primary" className="w-full justify-start text-xs font-semibold" onClick={onOpenNewOrder}>
                ➕ Create Radiology Order
              </Button>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-700">Emergency STAT Queue</span>
                <Badge variant="danger">{metrics.emergencyQueueCount} STAT</Badge>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orders
                  .filter((o) => o.priority === 'STAT_EMERGENCY_IMMEDIATE')
                  .map((o) => (
                    <div key={o.id} className="p-2 rounded bg-red-50/60 border border-red-200 text-xs">
                      <div className="font-bold text-red-900">{o.patientName} ({o.patientMrn})</div>
                      <div className="text-[11px] text-red-700 truncate">{o.procedureName}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
