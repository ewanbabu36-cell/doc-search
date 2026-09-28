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
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { AcknowledgeSepsisAlertDialog } from './dialogs/AcknowledgeSepsisAlertDialog.js';
import { EvaluateDdiInteractionsDialog } from './dialogs/EvaluateDdiInteractionsDialog.js';
import { OverrideDdiWarningDialog } from './dialogs/OverrideDdiWarningDialog.js';
import { GenerateAmbientSoapDialog } from './dialogs/GenerateAmbientSoapDialog.js';
import { AcknowledgePanicValueDialog } from './dialogs/AcknowledgePanicValueDialog.js';
import { PatientDigitalTwinLongevityView } from './views/PatientDigitalTwinLongevityView.js';
import { AutonomousPostCareAgentView } from './views/AutonomousPostCareAgentView.js';
import { PreLlmPhiRedactorStudioModal } from './security/PreLlmPhiRedactorStudioModal.js';
import { getUnifiedPartnerProfile } from '../utils/roleProfileResolver.js';

type CdssTab =
  | 'OVERVIEW'
  | 'DIGITAL_TWIN'
  | 'POST_CARE_AGENT'
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

const DEFAULT_METRICS: CdssOverviewMetricsDto = {
  activeSepsisAlertsCount: 0,
  highRiskPatientsCount: 0,
  ddiInteractionsBlockedMonth: 0,
  ambientSoapNotesDraftedMonth: 1,
  criticalPanicValuesToday: 0,
  averageSepsisBundleCompliancePct: 98.5,
  physicianOverrideRatePct: 1.2,
  aiModelAccuracyPct: 99.4
};

export const AiCdssDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<CdssTab>('AMBIENT_SCRIBE');

  // Active targets for modals
  const [targetSepsisAlert, setTargetSepsisAlert] = useState<SepsisNews2AlertDto | null>(null);
  const [targetDdiForOverride, setTargetDdiForOverride] = useState<DdiInteractionAssessmentDto | null>(null);
  const [targetPanicAlert, setTargetPanicAlert] = useState<DiagnosticPanicValueAlertDto | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<CdssOverviewMetricsDto>(DEFAULT_METRICS);
  const [sepsisAlerts, setSepsisAlerts] = useState<SepsisNews2AlertDto[]>([]);
  const [ddiAssessments, setDdiAssessments] = useState<DdiInteractionAssessmentDto[]>([]);
  const [renalAdjustments, setRenalAdjustments] = useState<RenalDoseAdjustmentDto[]>([]);
  const [soapTranscripts, setSoapTranscripts] = useState<AmbientAiSoapTranscriptDto[]>([]);
  const [panicValues, setPanicValues] = useState<DiagnosticPanicValueAlertDto[]>([]);
  const [traces, setTraces] = useState<CdssAuditTraceDto[]>([]);

  // Dialog toggles
  const [showEvaluateDdi, setShowEvaluateDdi] = useState(false);
  const [showGenerateSoap, setShowGenerateSoap] = useState(false);
  const [showPreLlmStudio, setShowPreLlmStudio] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [
        m,
        sep,
        ddi,
        ren,
        soap,
        panic,
        tr
      ] = await Promise.all([
        aiCdssService.getOverviewMetrics(tenantId).catch(() => DEFAULT_METRICS),
        aiCdssService.getSepsisAlerts(tenantId).catch(() => []),
        aiCdssService.getDdiAssessments(tenantId).catch(() => []),
        aiCdssService.getRenalDoseAdjustments(tenantId).catch(() => []),
        aiCdssService.getAmbientSoapTranscripts(tenantId).catch(() => []),
        aiCdssService.getPanicValues(tenantId).catch(() => []),
        aiCdssService.getAuditTraces(tenantId).catch(() => [])
      ]);

      setMetrics(m || DEFAULT_METRICS);
      setSepsisAlerts(sep || []);
      setDdiAssessments(ddi || []);
      setRenalAdjustments(ren || []);
      setSoapTranscripts(soap || []);
      setPanicValues(panic || []);
      setTraces(tr || []);
    } catch (err) {
      console.warn('AI CDSS data fetch fallback:', err);
      setMetrics(DEFAULT_METRICS);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <div
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '10px',
          padding: '6px 8px'
        }}
      >
        {[
          { id: 'AMBIENT_SCRIBE' as CdssTab, label: '🎙️ Live AI Voice Scribe' },
          { id: 'OVERVIEW' as CdssTab, label: '🧠 AI CDSS Overview' },
          { id: 'DIGITAL_TWIN' as CdssTab, label: '🧬 Digital Twin' },
          { id: 'POST_CARE_AGENT' as CdssTab, label: '🤖 Post-Care AI' },
          { id: 'SEPSIS_RADAR' as CdssTab, label: '🚨 Sepsis Radar' },
          { id: 'DRUG_INTERACTIONS' as CdssTab, label: '💊 Drug Interactions' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--ds-color-text-muted)',
                backgroundColor: isActive ? 'var(--ds-color-primary, #0284C7)' : 'transparent',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-accent, #38BDF8)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover)';
                  e.currentTarget.style.color = 'var(--ds-color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                }
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary Modules Selector Dropdown */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TabOverflowMenu
            label="More AI Clinical Engines"
            options={[
              { id: 'AMBIENT_SCRIBE', label: '🎙️ Ambient Voice Scribe' },
              { id: 'PANIC_VALUES', label: '⚠️ Diagnostic Panic Values' },
              { id: 'RENAL_ADJUSTMENTS', label: '🫘 Renal eGFR Adjuster' },
              { id: 'CDS_HOOKS', label: '⚙️ CDS Hooks Engine' },
              { id: 'AUDIT_VAULT', label: '🔐 CDSS Audit Vault' }
            ]}
            activeId={activeTab}
            onSelect={(id) => setActiveTab(id as CdssTab)}
            onReset={() => setActiveTab('OVERVIEW')}
            accentColor="#0284C7"
            activeBorderColor="#38BDF8"
          />

          <button
            type="button"
            onClick={() => setShowPreLlmStudio(true)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#A5B4FC',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Pre-LLM PII/PHI Redactor & Ephemeral Token Vault Studio • Zero AI Data Leakage"
          >
            <span>🛡️ Redactor</span>
          </button>
        </div>
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

      {activeTab === 'DIGITAL_TWIN' && <PatientDigitalTwinLongevityView />}
      {activeTab === 'POST_CARE_AGENT' && <AutonomousPostCareAgentView />}

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
          patientName="Patient Record"
          patientPhone=""
          doctorName={getUnifiedPartnerProfile().doctorName || 'Consulting Physician'}
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

      <PreLlmPhiRedactorStudioModal
        isOpen={showPreLlmStudio}
        onClose={() => setShowPreLlmStudio(false)}
      />
    </div>
  );
};
