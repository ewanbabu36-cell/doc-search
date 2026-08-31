import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type {
  ExecutiveCommandSnapshotDto,
  PredictiveBedForecastDto,
  PatientAcuityHeatmapItemDto,
  RcmLeakageRiskItemDto
} from '@docsearch/api-contracts';

interface Props {
  snapshot: ExecutiveCommandSnapshotDto;
  bedForecasts: PredictiveBedForecastDto[];
  acuityHeatmap: PatientAcuityHeatmapItemDto[];
  rcmRisks: RcmLeakageRiskItemDto[];
  onDeclareSurge: () => void;
  onResolveSurge: () => void;
  onRunSimulation: () => void;
}

export const ExecutiveCommandCenterOverviewView: React.FC<Props> = ({
  snapshot,
  bedForecasts,
  acuityHeatmap,
  rcmRisks,
  onDeclareSurge,
  onResolveSurge,
  onRunSimulation
}) => {
  const criticalAcuityCount = acuityHeatmap.filter((p) => p.acuityLevel === 'CRITICAL_DETERIORATING_RED').length;
  const criticalBedBottlenecks = bedForecasts.filter((b) => b.predictedBottleneckLevel === 'CRITICAL_BLOCKER').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Surge Alert & Actions */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl">🏥</span>
            <div>
              <h2 className="text-lg font-bold">{snapshot.hospitalName}</h2>
              <p className="text-xs text-slate-400">Hospital Real-Time Operating System (HOS) & Predictive AI Command Center</p>
            </div>
            <Badge variant={snapshot.surgeLevel === 'NORMAL_GREEN' ? 'success' : snapshot.surgeLevel === 'CRITICAL_SURGE_RED' ? 'danger' : 'warning'}>
              {snapshot.surgeLevel}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.surgeLevel !== 'NORMAL_GREEN' ? (
            <Button variant="outline" onClick={onResolveSurge}>De-escalate Surge Alert</Button>
          ) : (
            <Button variant="danger" onClick={onDeclareSurge}>🚨 Declare Surge / Red Alert</Button>
          )}
          <Button variant="primary" onClick={onRunSimulation}>🤖 Run What-If AI Simulation</Button>
        </div>
      </div>

      {/* Fleet Telemetry Dashboard */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Bed Occupancy</p>
          <p className="text-2xl font-bold text-blue-900">{snapshot.bedOccupancyPct}%</p>
          <p className="text-xs text-blue-600 mt-1">{snapshot.occupiedBeds} / {snapshot.totalBeds} ({snapshot.availableBedsCount} open)</p>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">ICU & Ventilators</p>
          <p className="text-2xl font-bold text-red-900">{snapshot.icuOccupancyPct}% / {snapshot.ventilatorUtilizationPct}%</p>
          <p className="text-xs text-red-600 mt-1">{snapshot.icuBedsOccupied}/{snapshot.icuBedsTotal} ICU | {snapshot.ventilatorsInUse}/{snapshot.ventilatorsTotal} Vents</p>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">ED NEDOCS Score</p>
          <p className="text-2xl font-bold text-amber-900">{snapshot.edNedocsScore}</p>
          <p className="text-xs text-amber-700 mt-1 truncate" title={snapshot.edNedocsStatus}>{snapshot.edNedocsStatus}</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">OT Surgical Suites</p>
          <p className="text-2xl font-bold text-purple-900">{snapshot.otUtilizationPct}%</p>
          <p className="text-xs text-purple-600 mt-1">{snapshot.otSuitesActive}/{snapshot.otSuitesTotal} Active | {snapshot.surgeriesInProgressCount} In Progress</p>
        </Card>

        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Daily Revenue Velocity</p>
          <p className="text-2xl font-bold text-emerald-900">₹{(snapshot.dailyRevenueVelocityInr / 100000).toFixed(1)}L</p>
          <p className="text-xs text-emerald-600 mt-1">₹{(snapshot.unbilledChargesRiskInr / 1000).toFixed(0)}k at risk</p>
        </Card>
      </div>

      {/* Real-Time Operational Grids */}
      <div className="grid grid-cols-2 gap-4">
        {/* Predictive Bed Bottlenecks */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              AI Forward Bed Capacity & Bottleneck Radar ({criticalBedBottlenecks} Critical)
            </h3>
            <span className="text-xs text-gray-500">24-Hour Horizon</span>
          </div>
          <div className="space-y-2">
            {bedForecasts.map((b) => (
              <div key={b.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{b.specialtyName}</span>
                  <Badge variant={b.predictedBottleneckLevel === 'CRITICAL_BLOCKER' ? 'danger' : b.predictedBottleneckLevel === 'MODERATE' ? 'warning' : 'success'}>
                    {b.projectedOccupancyPct}% Projected
                  </Badge>
                </div>
                <p className="text-gray-600">Current: {b.currentOccupied}/{b.capacityLimit} | In: +{b.predictedAdmissions} / Out: -{b.predictedDischarges} (Net: {b.netProjectedDemand})</p>
                <p className="text-blue-900 font-semibold mt-1">💡 AI Recommendation: {b.recommendedAction}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Clinical Deterioration Heatmap */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Clinical Acuity & Deterioration Radar ({criticalAcuityCount} High Risk)
            </h3>
            <span className="text-xs text-gray-500">Live Vitals Sync</span>
          </div>
          <div className="space-y-2">
            {acuityHeatmap.map((item) => (
              <div key={item.bedId} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{item.bedNumber} ({item.wardName})</span>
                    <Badge variant={item.acuityLevel === 'CRITICAL_DETERIORATING_RED' ? 'danger' : item.acuityLevel === 'HIGH_RISK_AMBER' ? 'warning' : 'neutral'}>
                      MEWS: {item.deteriorationScore}
                    </Badge>
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">{item.patientName} ({item.patientMrn})</p>
                  <p className="text-red-700 font-medium">{item.primaryRiskTrigger}</p>
                </div>
                <div className="text-right">
                  <span className="text-red-900 font-bold block">{item.icuTransferProbabilityPct}% ICU Transfer Risk</span>
                  <span className="text-gray-500">{item.attendingPhysician}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RCM Revenue Leakage Radar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900">AI Revenue Cycle Leakage & Denial Mitigation Radar</h3>
          <span className="text-xs text-red-700 font-semibold">₹{(snapshot.unbilledChargesRiskInr / 1000).toFixed(0)}k Projected Revenue at Risk</span>
        </div>
        <div className="divide-y text-xs">
          {rcmRisks.map((risk) => (
            <div key={risk.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{risk.patientName} ({risk.patientMrn})</span>
                  <Badge variant="warning">{risk.potentialLeakageType}</Badge>
                  <span className="text-gray-500">{risk.departmentName}</span>
                </div>
                <p className="text-gray-700 mt-1 font-medium">{risk.suggestedCorrection}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-red-700 block">₹{risk.estimatedRiskAmountInr.toLocaleString('en-IN')}</span>
                <span className="text-gray-500 text-[11px]">{risk.riskProbabilityPct}% Risk Probability</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
