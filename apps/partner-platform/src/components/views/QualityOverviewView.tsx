import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { QualityOverviewMetricsDto, HospitalIncidentDto, QualityCapaDto, HaiSurveillanceDto } from '@docsearch/api-contracts';

interface Props {
  metrics: QualityOverviewMetricsDto;
  incidents: HospitalIncidentDto[];
  capas: QualityCapaDto[];
  hais: HaiSurveillanceDto[];
  onReportIncident: () => void;
  onLogHai: () => void;
  onSelectIncident: (inc: HospitalIncidentDto) => void;
}

export const QualityOverviewView: React.FC<Props> = ({
  metrics,
  incidents,
  capas,
  hais,
  onReportIncident,
  onLogHai,
  onSelectIncident
}) => {
  const activeIncidents = incidents.filter((i) => i.status !== 'CLOSED');
  const activeCapas = capas.filter((c) => c.status !== 'VERIFIED_EFFECTIVE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hospital Quality, Patient Safety & Infection Control (NABH / JCI)</h2>
          <p className="text-xs text-gray-500">Continuous clinical accreditation monitoring, adverse events, RCA/CAPA & HAI surveillance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onReportIncident}>🚨 Report Incident</Button>
          <Button variant="primary" onClick={onLogHai}>+ Log HAI Case</Button>
        </div>
      </div>

      {/* KPI Header Cards */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">NABH 5th Ed Compliance</p>
          <p className="text-2xl font-bold text-emerald-900">{metrics.overallNabhCompliancePct}%</p>
          <p className="text-xs text-emerald-600 mt-1">10 Chapters Audited</p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">Open Incidents</p>
          <p className="text-2xl font-bold text-red-900">{metrics.openIncidentsCount}</p>
          <p className="text-xs text-red-600 mt-1">{metrics.sentinelEventsCount} Sentinel Events</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Hand Hygiene Compliance</p>
          <p className="text-2xl font-bold text-blue-900">{metrics.handHygieneCompliancePct}%</p>
          <p className="text-xs text-blue-600 mt-1">WHO 5-Moments Audit</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">CLABSI / CAUTI Rates</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.clabsiRateFleet} / {metrics.cautiRateFleet}</p>
          <p className="text-xs text-purple-600 mt-1">Per 1,000 Device Days</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Active CAPA Items</p>
          <p className="text-2xl font-bold text-amber-900">{metrics.openCapaActionsCount}</p>
          <p className="text-xs text-amber-600 mt-1">{metrics.overdueCapaCount} Overdue</p>
        </Card>
      </div>

      {/* Real-time Triage & HAI Board */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Active Safety Incidents Requiring Triage & RCA ({activeIncidents.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between hover:bg-gray-100 cursor-pointer"
                onClick={() => onSelectIncident(inc)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{inc.incidentNumber}</span>
                    <Badge variant={inc.sacScore === 'SAC_1_EXTREME_SENTINEL' ? 'danger' : inc.sacScore === 'SAC_2_MAJOR' ? 'warning' : 'neutral'}>
                      {inc.sacScore}
                    </Badge>
                    <Badge variant="neutral">{inc.status}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{inc.briefSummary}</p>
                  <p className="text-xs text-gray-500">{inc.departmentName} ({inc.locationDetail}) | By: {inc.reportedByStaff}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Active Healthcare-Associated Infection (HAI) Surveillance ({hais.length})
            </h3>
          </div>
          <div className="space-y-2">
            {hais.map((hai) => (
              <div key={hai.id} className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-900">{hai.surveillanceCode}</span>
                    <Badge variant="danger">{hai.haiType}</Badge>
                    <span className="text-xs text-red-700">{hai.patientName} ({hai.patientMrn})</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{hai.pathogenIsolated}</p>
                  <p className="text-xs text-gray-500">{hai.departmentName} | {hai.invasiveDeviceName} (Day {hai.deviceDaysAtInfection})</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CAPA Progress Ledger */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900">Corrective & Preventive Action (CAPA) Implementation Progress</h3>
          <span className="text-xs text-gray-500">{activeCapas.length} In-Flight Action Plans</span>
        </div>
        <div className="divide-y text-xs">
          {capas.map((c) => (
            <div key={c.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{c.capaCode}</span>
                  <Badge variant="neutral">{c.actionType}</Badge>
                  <Badge variant={c.status === 'VERIFIED_EFFECTIVE' ? 'success' : 'warning'}>{c.status}</Badge>
                </div>
                <p className="font-semibold text-gray-800 mt-1">{c.title}</p>
                <p className="text-gray-500">Assigned: {c.assignedOwner} | Target: {c.targetCompletionDate}</p>
              </div>
              <div className="text-right max-w-xs">
                <span className="text-gray-600 block italic">Metric: {c.verificationMetric}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
