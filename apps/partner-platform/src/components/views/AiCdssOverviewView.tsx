import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type {
  CdssOverviewMetricsDto,
  SepsisNews2AlertDto,
  DdiInteractionAssessmentDto,
  DiagnosticPanicValueAlertDto
} from '@docsearch/api-contracts';

interface Props {
  metrics: CdssOverviewMetricsDto;
  sepsisAlerts: SepsisNews2AlertDto[];
  ddiAssessments: DdiInteractionAssessmentDto[];
  panicValues: DiagnosticPanicValueAlertDto[];
  onEvaluateDdi: () => void;
  onLaunchAmbientScribe: () => void;
}

export const AiCdssOverviewView: React.FC<Props> = ({
  metrics,
  sepsisAlerts,
  ddiAssessments,
  panicValues,
  onEvaluateDdi,
  onLaunchAmbientScribe
}) => {
  const activeSepsis = sepsisAlerts.filter((s) => s.alertStatus === 'TRIGGERED_ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-950 via-slate-900 to-blue-950 text-white rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">AI Clinical Co-Pilot & Intelligent CDSS Engine</h2>
              <Badge variant="success">CDS Hooks Active</Badge>
            </div>
            <p className="text-xs text-slate-300">Real-time Sepsis (NEWS2), Smart Rx DDI Guards, Ambient Medical Scribe & Diagnostic Panic Triage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onEvaluateDdi}>💊 Screen Drug Interactions (DDI)</Button>
          <Button variant="outline" onClick={onLaunchAmbientScribe}>🎙️ Ambient Voice Scribe</Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-red-50 border-red-200">
          <span className="text-xs font-semibold text-red-700">Active Sepsis NEWS2 Alerts</span>
          <p className="text-2xl font-bold text-red-900">{metrics.activeSepsisAlertsCount}</p>
          <p className="text-xs text-red-600 mt-1">1-Hour Bundle Compliance: {metrics.averageSepsisBundleCompliancePct}%</p>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <span className="text-xs font-semibold text-amber-700">DDI Interactions Prevented</span>
          <p className="text-2xl font-bold text-amber-900">{metrics.ddiInteractionsBlockedMonth}</p>
          <p className="text-xs text-amber-600 mt-1">Physician Override Rate: {metrics.physicianOverrideRatePct}%</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <span className="text-xs font-semibold text-purple-700">Ambient AI SOAP Notes Drafted</span>
          <p className="text-2xl font-bold text-purple-900">{metrics.ambientSoapNotesDraftedMonth}</p>
          <p className="text-xs text-purple-600 mt-1">AI Diagnostic Accuracy: {metrics.aiModelAccuracyPct}%</p>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <span className="text-xs font-semibold text-blue-700">Critical Panic Values Today</span>
          <p className="text-2xl font-bold text-blue-900">{metrics.criticalPanicValuesToday}</p>
          <p className="text-xs text-blue-600 mt-1">Direct Consultant Escalation Active</p>
        </Card>
      </div>

      {/* Critical Radar Grids */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sepsis Alerts Radar */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Sepsis & Deterioration Radar ({activeSepsis.length} Active Alerts)
            </h3>
            <span className="text-xs text-gray-500">qSOFA / NEWS2 Real-Time</span>
          </div>
          <div className="space-y-2">
            {sepsisAlerts.map((s) => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{s.patientName} ({s.patientMrn})</span>
                  <Badge variant={s.news2Score >= 7 ? 'danger' : 'warning'}>NEWS2: {s.news2Score}/20</Badge>
                </div>
                <p className="text-gray-600">{s.bedNumber} ({s.wardName}) | SpO2: {s.spO2Pct}% | RR: {s.respiratoryRate} | BP: {s.systolicBp} mmHg</p>
                <p className="text-red-700 font-semibold mt-1">Lactate: {s.serumLactateMmolL} mmol/L | Status: {s.alertStatus}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Diagnostic Panic Values */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Critical Diagnostic Panic Values ({panicValues.length} Reported)
            </h3>
            <span className="text-xs text-gray-500">Laboratory & Radiology</span>
          </div>
          <div className="space-y-2">
            {panicValues.map((p) => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{p.testName}: <strong className="text-red-700">{p.measuredValue}</strong></span>
                  <Badge variant="danger">{p.urgencyLevel}</Badge>
                </div>
                <p className="text-gray-600">{p.patientName} ({p.patientMrn}) — {p.location}</p>
                <p className="text-gray-800 font-medium">{p.clinicalRiskSummary}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* DDI Safety Guard Feed */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Smart Rx Drug-Drug Interaction CDSS Guard (Lexicomp / Micromedex)</h3>
        <div className="divide-y text-xs">
          {ddiAssessments.map((d) => (
            <div key={d.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{d.drugA} + {d.drugB}</span>
                  <Badge variant={d.severityLevel === 'CONTRAINDICATED_FATAL' ? 'danger' : 'warning'}>{d.severityLevel}</Badge>
                </div>
                <p className="text-gray-700 mt-1 font-medium">{d.clinicalConsequence}</p>
                <p className="text-blue-900 font-semibold mt-0.5">💡 Recommended Action: {d.recommendedManagement}</p>
              </div>
              <span className="text-gray-400 text-[11px] whitespace-nowrap">{d.evidenceReference}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
