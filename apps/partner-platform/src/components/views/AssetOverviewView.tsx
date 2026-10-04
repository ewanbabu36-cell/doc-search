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
  const quarantinedAssets = assets.filter((a) => a.operationalStatus === 'CALIBRATION_OVERDUE' || a.calibrationStatus === 'DUE_OVERDUE');

  // Critical availability metrics
  const ventTotal = assets.filter((a) => a.assetCode.startsWith('BME-VENT')).length;
  const ventReady = assets.filter((a) => a.assetCode.startsWith('BME-VENT') && a.operationalStatus === 'IN_SERVICE').length;
  const ventPct = ventTotal > 0 ? Math.round((ventReady / ventTotal) * 100) : 100;

  const anesTotal = assets.filter((a) => a.assetCode.startsWith('BME-ANES')).length;
  const anesReady = assets.filter((a) => a.assetCode.startsWith('BME-ANES') && a.operationalStatus === 'IN_SERVICE').length;
  const anesPct = anesTotal > 0 ? Math.round((anesReady / anesTotal) * 100) : 100;

  const defibTotal = assets.filter((a) => a.assetCode.startsWith('BME-DEFIB')).length;
  const defibReady = assets.filter((a) => a.assetCode.startsWith('BME-DEFIB') && a.operationalStatus === 'IN_SERVICE').length;
  const defibPct = defibTotal > 0 ? Math.round((defibReady / defibTotal) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hospital Biomedical & Asset Command Center</h2>
          <p className="text-xs text-gray-500">Healthcare Technology Management (HTM) Fleet, PPM Hard-Gate & Live MTTR Telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onReportBreakdown} className="flex items-center gap-1.5">
            <span>📱</span> 1-Tap Machine QR Incident Desk
          </Button>
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
          <p className="text-xs font-semibold text-red-700">⛔ PPM Overdue Quarantined</p>
          <p className="text-2xl font-bold text-red-900">{quarantinedAssets.length || metrics.ppmOverdueCount}</p>
          <p className="text-xs text-red-600 mt-1">NABH Hard Gate Locked</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">Calibration Due (30d)</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.calibrationDueNext30Days}</p>
          <p className="text-xs text-purple-600 mt-1">NABL Metrology audit</p>
        </Card>
      </div>

      {/* Critical Equipment Availability Matrix Strip */}
      <Card className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/40 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <span>🩺</span> Critical Life-Support Real-Time Availability SLA
          </span>
          <span className="text-[11px] font-semibold text-blue-700">Live Hospital Telemetry</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-2.5 bg-white rounded-lg border flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Mechanical Ventilators (ICU)</p>
              <p className="font-bold text-gray-900">{ventReady} / {ventTotal} Operational</p>
            </div>
            <Badge variant={ventPct >= 80 ? 'success' : 'warning'}>{ventPct}%</Badge>
          </div>
          <div className="p-2.5 bg-white rounded-lg border flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Anesthesia Workstations (OT)</p>
              <p className="font-bold text-gray-900">{anesReady} / {anesTotal} Operational</p>
            </div>
            <Badge variant={anesPct >= 80 ? 'success' : 'warning'}>{anesPct}%</Badge>
          </div>
          <div className="p-2.5 bg-white rounded-lg border flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Biphasic Defibrillators (ED/ICU)</p>
              <p className="font-bold text-gray-900">{defibReady} / {defibTotal} Operational</p>
            </div>
            <Badge variant={defibPct === 100 ? 'success' : 'danger'}>{defibPct}%</Badge>
          </div>
        </div>
      </Card>

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
                <div key={wo.id} className="p-3 bg-red-50/50 rounded-lg border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{wo.workOrderNumber}</span>
                      <Badge variant={wo.priority === 'EMERGENCY_STAT' ? 'danger' : 'warning'}>{wo.priority}</Badge>
                      <Badge variant="neutral">{wo.status}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{wo.assetName} ({wo.assetCode})</p>
                    <p className="text-xs text-gray-500">{wo.departmentName} - {wo.problemDescription}</p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Assigned: {wo.assignedEngineer || 'Er. Suresh Pillai (OT Lead)'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              ⛔ Statutory PPM Overdue (Hard Gate Quarantined)
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
                      <Badge variant="danger">⛔ ALLOCATION LOCKED</Badge>
                      <span className="text-xs text-red-700 font-semibold">Overdue Since: {ppm.scheduledDueDate}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{ppm.assetName} ({ppm.assetCode})</p>
                    <p className="text-xs text-gray-500">{ppm.departmentName} | Assigned: {ppm.assignedEngineer}</p>
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">Patient bed attachment prohibited under NABH protocol.</p>
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
          <span className="text-xs text-gray-500">Continuous Fleet Telemetry</span>
        </div>
        <div className="divide-y">
          {assets.map((asset) => {
            const isQuarantined = asset.operationalStatus === 'CALIBRATION_OVERDUE' || asset.calibrationStatus === 'DUE_OVERDUE';
            return (
              <div
                key={asset.id}
                role="button"
                tabIndex={0}
                aria-label={`Select equipment asset ${asset.assetCode} ${asset.modelNumber}`}
                className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => onSelectAsset(asset)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectAsset(asset);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                    {asset.category.substring(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{asset.assetCode}</span>
                      <span className="text-xs text-gray-500 font-mono">({asset.qrCodeIdentifier})</span>
                      {isQuarantined ? (
                        <Badge variant="danger">⛔ PPM QUARANTINE</Badge>
                      ) : (
                        <Badge variant={asset.operationalStatus === 'IN_SERVICE' ? 'success' : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN' ? 'danger' : 'warning'}>
                          {asset.operationalStatus}
                        </Badge>
                      )}
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
                  <p className={`text-xs ${isQuarantined ? 'text-red-700 font-bold' : 'text-gray-500'}`}>
                    Next PPM: {asset.nextPpmDueDate}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">{asset.contractType}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
