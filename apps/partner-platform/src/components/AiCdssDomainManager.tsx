import React, { useState, useEffect, useCallback } from 'react';
import type {
  CdssOverviewMetricsDto,
  SepsisNews2AlertDto,
  DdiInteractionAssessmentDto,
  RenalDoseAdjustmentDto,
  AmbientAiSoapTranscriptDto,
  DiagnosticPanicValueAlertDto,
  CdssAuditTraceDto,
  AcknowledgeSepsisAlertRequest,
  EvaluateDdiRequest,
  OverrideDdiWarningRequest,
  GenerateAmbientSoapRequest,
  AcknowledgePanicValueRequest
} from '@docsearch/api-contracts';

import { aiCdssService } from '../services/ai-cdss-service.js';

// Views
import { AiCdssOverviewView } from './views/AiCdssOverviewView.js';
import { SepsisEarlyWarningView } from './views/SepsisEarlyWarningView.js';
import { DrugInteractionGuardView } from './views/DrugInteractionGuardView.js';
import { AmbientAiScribeView } from './views/AmbientAiScribeView.js';
import { DiagnosticPanicValuesView } from './views/DiagnosticPanicValuesView.js';
import { RenalDosageCalculatorView } from './views/RenalDosageCalculatorView.js';
import { CdsHooksRulesEngineView } from './views/CdsHooksRulesEngineView.js';
import { CdssAuditVaultView } from './views/CdssAuditVaultView.js';

// Dialogs
import { AcknowledgeSepsisAlertDialog } from './dialogs/AcknowledgeSepsisAlertDialog.js';
import { EvaluateDdiInteractionsDialog } from './dialogs/EvaluateDdiInteractionsDialog.js';
import { OverrideDdiWarningDialog } from './dialogs/OverrideDdiWarningDialog.js';
import { GenerateAmbientSoapDialog } from './dialogs/GenerateAmbientSoapDialog.js';
import { AcknowledgePanicValueDialog } from './dialogs/AcknowledgePanicValueDialog.js';

type CdssTab =
  | 'OVERVIEW'
  | 'SEPSIS_RADAR'
  | 'DRUG_INTERACTIONS'
  | 'AMBIENT_SCRIBE'
  | 'PANIC_VALUES'
  | 'RENAL_ADJUSTMENTS'
  | 'CDS_HOOKS'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
}

export const AiCdssDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<CdssTab>('OVERVIEW');

  // Active targets for modals
  const [targetSepsisAlert, setTargetSepsisAlert] = useState<SepsisNews2AlertDto | null>(null);
  const [targetDdiForOverride, setTargetDdiForOverride] = useState<DdiInteractionAssessmentDto | null>(null);
  const [targetPanicAlert, setTargetPanicAlert] = useState<DiagnosticPanicValueAlertDto | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<CdssOverviewMetricsDto | null>(null);
  const [sepsisAlerts, setSepsisAlerts] = useState<SepsisNews2AlertDto[]>([]);
  const [ddiAssessments, setDdiAssessments] = useState<DdiInteractionAssessmentDto[]>([]);
  const [renalAdjustments, setRenalAdjustments] = useState<RenalDoseAdjustmentDto[]>([]);
  const [soapTranscripts, setSoapTranscripts] = useState<AmbientAiSoapTranscriptDto[]>([]);
  const [panicValues, setPanicValues] = useState<DiagnosticPanicValueAlertDto[]>([]);
  const [traces, setTraces] = useState<CdssAuditTraceDto[]>([]);

  // Dialog toggles
  const [showEvaluateDdi, setShowEvaluateDdi] = useState(false);
  const [showGenerateSoap, setShowGenerateSoap] = useState(false);

  const loadData = useCallback(async () => {
    const [
      m,
      sep,
      ddi,
      ren,
      soap,
      panic,
      tr
    ] = await Promise.all([
      aiCdssService.getOverviewMetrics(tenantId),
      aiCdssService.getSepsisAlerts(tenantId),
      aiCdssService.getDdiAssessments(tenantId),
      aiCdssService.getRenalDoseAdjustments(tenantId),
      aiCdssService.getAmbientSoapTranscripts(tenantId),
      aiCdssService.getPanicValues(tenantId),
      aiCdssService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setSepsisAlerts(sep);
    setDdiAssessments(ddi);
    setRenalAdjustments(ren);
    setSoapTranscripts(soap);
    setPanicValues(panic);
    setTraces(tr);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-gray-500">Initializing AI Clinical Co-Pilot Engine...</div>;
  }

  // Handlers
  const handleAcknowledgeSepsis = async (data: AcknowledgeSepsisAlertRequest) => {
    await aiCdssService.acknowledgeSepsisAlert(tenantId, data);
    await loadData();
  };

  const handleEvaluateDdi = async (data: EvaluateDdiRequest) => {
    const results = await aiCdssService.evaluateDdi(tenantId, data);
    setDdiAssessments(results);
    setActiveTab('DRUG_INTERACTIONS');
  };

  const handleOverrideDdi = async (data: OverrideDdiWarningRequest) => {
    await aiCdssService.overrideDdiWarning(tenantId, data);
    await loadData();
  };

  const handleGenerateSoap = async (data: GenerateAmbientSoapRequest) => {
    await aiCdssService.generateAmbientSoap(tenantId, data);
    await loadData();
    setActiveTab('AMBIENT_SCRIBE');
  };

  const handleAcknowledgePanic = async (data: AcknowledgePanicValueRequest) => {
    await aiCdssService.acknowledgePanicValue(tenantId, data);
    await loadData();
  };

  return (
    <div className="space-y-4">
      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🧠 AI CDSS Overview
        </button>
        <button
          onClick={() => setActiveTab('SEPSIS_RADAR')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'SEPSIS_RADAR' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🚨 Sepsis Early Warning (NEWS2)
        </button>
        <button
          onClick={() => setActiveTab('DRUG_INTERACTIONS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'DRUG_INTERACTIONS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          💊 Drug Interactions (DDI)
        </button>
        <button
          onClick={() => setActiveTab('AMBIENT_SCRIBE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AMBIENT_SCRIBE' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🎙️ Ambient Voice Scribe
        </button>
        <button
          onClick={() => setActiveTab('PANIC_VALUES')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'PANIC_VALUES' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ⚠️ Diagnostic Panic Values
        </button>
        <button
          onClick={() => setActiveTab('RENAL_ADJUSTMENTS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'RENAL_ADJUSTMENTS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🫘 Renal eGFR Adjuster
        </button>
        <button
          onClick={() => setActiveTab('CDS_HOOKS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CDS_HOOKS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ⚙️ CDS Hooks Engine
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 CDSS Audit Vault
        </button>
      </div>

      {/* Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <AiCdssOverviewView
          metrics={metrics}
          sepsisAlerts={sepsisAlerts}
          ddiAssessments={ddiAssessments}
          panicValues={panicValues}
          onEvaluateDdi={() => setShowEvaluateDdi(true)}
          onLaunchAmbientScribe={() => setShowGenerateSoap(true)}
        />
      )}

      {activeTab === 'SEPSIS_RADAR' && (
        <SepsisEarlyWarningView
          alerts={sepsisAlerts}
          onAcknowledge={(alert) => setTargetSepsisAlert(alert)}
        />
      )}

      {activeTab === 'DRUG_INTERACTIONS' && (
        <DrugInteractionGuardView
          assessments={ddiAssessments}
          onEvaluate={() => setShowEvaluateDdi(true)}
          onOverride={(d) => setTargetDdiForOverride(d)}
        />
      )}

      {activeTab === 'AMBIENT_SCRIBE' && (
        <AmbientAiScribeView
          transcripts={soapTranscripts}
          onGenerateSoap={() => setShowGenerateSoap(true)}
        />
      )}

      {activeTab === 'PANIC_VALUES' && (
        <DiagnosticPanicValuesView
          panicValues={panicValues}
          onAcknowledge={(p) => setTargetPanicAlert(p)}
        />
      )}

      {activeTab === 'RENAL_ADJUSTMENTS' && <RenalDosageCalculatorView adjustments={renalAdjustments} />}
      {activeTab === 'CDS_HOOKS' && <CdsHooksRulesEngineView />}
      {activeTab === 'AUDIT_VAULT' && <CdssAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      {targetSepsisAlert && (
        <AcknowledgeSepsisAlertDialog
          isOpen={!!targetSepsisAlert}
          alertId={targetSepsisAlert.id}
          patientName={targetSepsisAlert.patientName}
          news2Score={targetSepsisAlert.news2Score}
          onClose={() => setTargetSepsisAlert(null)}
          onSubmit={handleAcknowledgeSepsis}
        />
      )}

      <EvaluateDdiInteractionsDialog
        isOpen={showEvaluateDdi}
        onClose={() => setShowEvaluateDdi(false)}
        onSubmit={handleEvaluateDdi}
      />

      {targetDdiForOverride && (
        <OverrideDdiWarningDialog
          isOpen={!!targetDdiForOverride}
          interactionId={targetDdiForOverride.id}
          drugA={targetDdiForOverride.drugA}
          drugB={targetDdiForOverride.drugB}
          onClose={() => setTargetDdiForOverride(null)}
          onSubmit={handleOverrideDdi}
        />
      )}

      <GenerateAmbientSoapDialog
        isOpen={showGenerateSoap}
        onClose={() => setShowGenerateSoap(false)}
        onSubmit={handleGenerateSoap}
      />

      {targetPanicAlert && (
        <AcknowledgePanicValueDialog
          isOpen={!!targetPanicAlert}
          panicAlertId={targetPanicAlert.id}
          testName={targetPanicAlert.testName}
          measuredValue={targetPanicAlert.measuredValue}
          onClose={() => setTargetPanicAlert(null)}
          onSubmit={handleAcknowledgePanic}
        />
      )}
    </div>
  );
};
