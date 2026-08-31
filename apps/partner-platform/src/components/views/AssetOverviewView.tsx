import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AssetOverviewMetricsDto, BiomedicalAssetDto, BreakdownWorkOrderDto, PpmScheduleDto } from '@docsearch/api-contracts';

interface Props {
  metrics: AssetOverviewMetricsDto;
  assets: BiomedicalAssetDto[];
  workOrders: BreakdownWorkOrderDto[];
  ppmSchedules: PpmScheduleDto[];
  onRegisterAsset: () => void;
  onReportBreakdown: () => void;
  onSelectAsset: (asset: BiomedicalAssetDto) => void;
}

export const AssetOverviewView: React.FC<Props> = ({
  metrics,
  assets,
  workOrders,
  ppmSchedules,
  onRegisterAsset,
  onReportBreakdown,
  onSelectAsset
}) => {
  const activeBreakdowns = workOrders.filter((w) => w.status !== 'CLOSED');
  const overduePpm = ppmSchedules.filter((p) => p.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hospital Biomedical & Asset Command Center</h2>
          <p className="text-xs text-gray-500">Healthcare Technology Management (HTM) Fleet & Maintenance Lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onReportBreakdown}>🚨 Report Breakdown</Button>
          <Button variant="primary" onClick={onRegisterAsset}>+ Commission Asset</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Total Asset Fleet</p>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalAssetsCount}</p>
          <p className="text-xs text-blue-600 mt-1">{metrics.inServiceCount} Active in Service</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Fleet Uptime %</p>
          <p className="text-2xl font-bold text-emerald-900">{metrics.overallFleetUptimePercentage}%</p>
          <p className="text-xs text-emerald-600 mt-1">{metrics.criticalLifeSupportCount} Life-Support Units</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Open Breakdown WOs</p>
          <p className="text-2xl font-bold text-amber-900">{metrics.openWorkOrdersCount}</p>
          <p className="text-xs text-amber-600 mt-1">{metrics.emergencyWorkOrdersCount} STAT Emergency</p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">PPM Overdue</p>
          <p className="text-2xl font-bold text-red-900">{metrics.ppmOverdueCount}</p>
          <p className="text-xs text-red-600 mt-1">Requires immediate service</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">Calibration Due (30d)</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.calibrationDueNext30Days}</p>
          <p className="text-xs text-purple-600 mt-1">NABL Metrology audit</p>
        </Card>
      </div>

      {/* Real-time Alerts */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Active Breakdown Work Orders ({activeBreakdowns.length})
            </h3>
          </div>
          {activeBreakdowns.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">Zero active breakdowns across all units.</p>
          ) : (
            <div className="space-y-2">
              {activeBreakdowns.map((wo) => (
                <div key={wo.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{wo.workOrderNumber}</span>
                      <Badge variant={wo.priority === 'EMERGENCY_STAT' ? 'danger' : 'warning'}>{wo.priority}</Badge>
                      <Badge variant="neutral">{wo.status}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{wo.assetName}</p>
                    <p className="text-xs text-gray-500">{wo.departmentName} - {wo.problemDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Preventive Maintenance (PPM) Overdue & Scheduled
            </h3>
          </div>
          {overduePpm.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">All preventive maintenance schedules up to date.</p>
          ) : (
            <div className="space-y-2">
              {overduePpm.map((ppm) => (
                <div key={ppm.id} className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-900">{ppm.scheduleCode}</span>
                      <Badge variant="danger">OVERDUE</Badge>
                      <span className="text-xs text-red-700">Due: {ppm.scheduledDueDate}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{ppm.assetName}</p>
                    <p className="text-xs text-gray-500">{ppm.departmentName} | Assigned: {ppm.assignedEngineer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Critical Life-Support Fleet Roster */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900">Critical Life-Support & High-Risk Equipment Roster</h3>
          <span className="text-xs text-gray-500">Continuous Monitoring</span>
        </div>
        <div className="divide-y">
          {assets.map((asset) => (
            <div key={asset.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer" onClick={() => onSelectAsset(asset)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                  {asset.category.substring(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{asset.assetCode}</span>
                    <span className="text-xs text-gray-500 font-medium">({asset.modelNumber})</span>
                    <Badge variant={asset.operationalStatus === 'IN_SERVICE' ? 'success' : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN' ? 'danger' : 'warning'}>
                      {asset.operationalStatus}
                    </Badge>
                    <Badge variant={asset.riskCriticality === 'CRITICAL_LIFE_SUPPORT' ? 'danger' : 'neutral'}>
                      {asset.riskCriticality}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{asset.assetName}</p>
                  <p className="text-xs text-gray-500">{asset.departmentName} ({asset.physicalLocation}) | S/N: {asset.serialNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-700">{asset.uptimePercentage}% Uptime</p>
                <p className="text-xs text-gray-500">Next PPM: {asset.nextPpmDueDate}</p>
                <p className="text-xs text-blue-600 font-medium">{asset.contractType}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
