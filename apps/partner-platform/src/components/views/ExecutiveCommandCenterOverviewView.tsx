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

      {/* ENTERPRISE PILLAR 6: NABH STATUTORY LICENSE EXPIRY VAULT */}
      <Card className="p-4 space-y-3 border-amber-300 bg-gradient-to-r from-amber-50/40 to-slate-50">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="text-sm font-bold text-gray-900">NABH & Statutory License Expiry Radar (60-Day Critical Warning)</h3>
          </div>
          <Badge variant="warning">NABH 5th Ed. FMS.1 Mandatory</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* License 1: Fire NOC */}
          <div className="p-3 bg-white rounded-lg border-2 border-red-300 shadow-sm flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Fire Safety NOC</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">20 DAYS LEFT</span>
              </div>
              <p className="text-gray-500 mt-1">State Fire Service Directorate</p>
              <p className="text-gray-700 font-mono mt-0.5">Cert: FS-DL-2025-9011</p>
            </div>
            <div className="border-t pt-2 flex justify-between items-center text-[11px]">
              <span className="text-gray-600">Expires: 15 Nov 2026</span>
              <button type="button" className="text-blue-700 font-bold hover:underline">1-Click Renewal</button>
            </div>
          </div>

          {/* License 2: AERB X-Ray & CT */}
          <div className="p-3 bg-white rounded-lg border-2 border-amber-300 shadow-sm flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">AERB Radiation Shielding</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">42 DAYS LEFT</span>
              </div>
              <p className="text-gray-500 mt-1">eLORA Diagnostic X-Ray / CT</p>
              <p className="text-gray-700 font-mono mt-0.5">AERB-ND-2024-881</p>
            </div>
            <div className="border-t pt-2 flex justify-between items-center text-[11px]">
              <span className="text-gray-600">Expires: 07 Dec 2026</span>
              <button type="button" className="text-blue-700 font-bold hover:underline">Upload QA Report</button>
            </div>
          </div>

          {/* License 3: PCB Biomedical Waste */}
          <div className="p-3 bg-white rounded-lg border-2 border-amber-300 shadow-sm flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">SPCB Biomedical Waste</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">58 DAYS LEFT</span>
              </div>
              <p className="text-gray-500 mt-1">State Pollution Control Board</p>
              <p className="text-gray-700 font-mono mt-0.5">BMW-AUTH-2024-03</p>
            </div>
            <div className="border-t pt-2 flex justify-between items-center text-[11px]">
              <span className="text-gray-600">Expires: 23 Dec 2026</span>
              <button type="button" className="text-blue-700 font-bold hover:underline">Submit Manifest</button>
            </div>
          </div>

          {/* License 4: CDSCO Narcotic & Pharmacy */}
          <div className="p-3 bg-white rounded-lg border border-emerald-300 shadow-sm flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">CDSCO Narcotic & Pharmacy</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">180 DAYS</span>
              </div>
              <p className="text-gray-500 mt-1">State Drugs Control (Form 20B/21B)</p>
              <p className="text-gray-700 font-mono mt-0.5">DL-PHARM-9941-X</p>
            </div>
            <div className="border-t pt-2 flex justify-between items-center text-[11px]">
              <span className="text-gray-600">Valid till April 2027</span>
              <span className="text-emerald-700 font-bold">✓ Active</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ENTERPRISE PILLAR 6: LIVE ABDM MILESTONE SCORECARD */}
      <Card className="p-4 space-y-3 border-blue-300 bg-gradient-to-r from-blue-50/30 to-indigo-50/20">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇮🇳</span>
            <h3 className="text-sm font-bold text-gray-900">National Health Authority (NHA) ABDM 2.0 Telemetry Scorecard</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">ABDM Certified Level 3 HMIS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Milestone 1: ABHA Registration */}
          <div className="p-3 bg-white rounded-lg border shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Milestone 1: ABHA Linked Patients</span>
              <Badge variant="success">94.2% (Target: &gt;90%)</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
            </div>
            <p className="text-[11px] text-gray-600">
              1,418 of 1,505 registered patients mapped with 14-digit ABHA ID & digital QR token scan.
            </p>
          </div>

          {/* Milestone 2: NRCES FHIR e-Prescriptions */}
          <div className="p-3 bg-white rounded-lg border shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Milestone 2: NRCES FHIR e-Prescriptions</span>
              <Badge variant="success">88.6% (Target: &gt;85%)</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88.6%' }}></div>
            </div>
            <p className="text-[11px] text-gray-600">
              Digitally signed discharge summaries and OPD prescriptions with doctor Aadhaar DSC / OTP.
            </p>
          </div>

          {/* Milestone 3: NHCX 2.0 Auto-Adjudication */}
          <div className="p-3 bg-white rounded-lg border shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Milestone 3: NHCX Claims Auto-Adjudicated</span>
              <Badge variant="success">82.4% (Target: &gt;80%)</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '82.4%' }}></div>
            </div>
            <p className="text-[11px] text-gray-600">
              Cashless insurance pre-auth requests auto-settled via National Health Claims Exchange (NHCX).
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};
