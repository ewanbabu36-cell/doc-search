import { FacilityTemplateConfiguratorStudio } from './views/FacilityTemplateConfiguratorStudio.js';
import React, { useState, useEffect, useCallback } from 'react';
import type {
  ExecutiveCommandSnapshotDto,
  PredictiveBedForecastDto,
  EdNedocsHourlyDto,
  OtSuiteEfficiencyDto,
  PatientAcuityHeatmapItemDto,
  RcmLeakageRiskItemDto,
  CriticalConsumableRunoutDto,
  WhatIfScenarioRequest,
  WhatIfScenarioResultDto,
  ExecutiveAuditTraceDto,
  DeclareSurgeEventRequest,
  ResolveSurgeEventRequest,
  OverrideBedAllocationRequest
} from '@docsearch/api-contracts';

import { executiveCommandService } from '../services/executive-command-service.js';

// Views
import { ExecutiveCommandCenterOverviewView } from './views/ExecutiveCommandCenterOverviewView.js';
import { RealtimeHospitalCommandWallView } from './views/RealtimeHospitalCommandWallView.js';
import { BedCapacityForecastView } from './views/BedCapacityForecastView.js';
import { EdNedocsSurgeRadarView } from './views/EdNedocsSurgeRadarView.js';
import { OtEfficiencyHeatmapView } from './views/OtEfficiencyHeatmapView.js';
import { ClinicalAcuityRiskHeatmapView } from './views/ClinicalAcuityRiskHeatmapView.js';
import { RcmLeakageDenialRiskView } from './views/RcmLeakageDenialRiskView.js';
import { CriticalConsumableRunoutView } from './views/CriticalConsumableRunoutView.js';
import { WhatIfSimulationSandboxView } from './views/WhatIfSimulationSandboxView.js';
import { ExecutiveAuditVaultView } from './views/ExecutiveAuditVaultView.js';
import { HospitalPatientJourneyCommandBar } from './common/HospitalPatientJourneyCommandBar.js';
import type { PartnerModuleKey } from './PartnerPlatformShell.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { DeclareSurgeEventDialog } from './dialogs/DeclareSurgeEventDialog.js';
import { ResolveSurgeEventDialog } from './dialogs/ResolveSurgeEventDialog.js';
import { RunWhatIfSimulationDialog } from './dialogs/RunWhatIfSimulationDialog.js';
import { OverrideBedAllocationDialog } from './dialogs/OverrideBedAllocationDialog.js';

type ExecutiveTab =
  | 'OVERVIEW'
  | 'COMMAND_WALL'
  | 'BED_FORECASTS'
  | 'ED_NEDOCS'
  | 'OT_EFFICIENCY'
  | 'CLINICAL_ACUITY'
  | 'RCM_LEAKAGE'
  | 'CONSUMABLES'
  | 'WHAT_IF_SANDBOX'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
  onNavigateModule?: ((moduleKey: PartnerModuleKey) => void) | undefined;
  currentUserRole?: string | undefined;
}

export const ExecutiveCommandDomainManager: React.FC<Props> = ({
  tenantId,
  onNavigateModule,
  currentUserRole
}) => {
  const [activeTab, setActiveTab] = useState<ExecutiveTab>('OVERVIEW');
  const [targetBedIdForOverride, setTargetBedIdForOverride] = useState<string | null>(null);

  // Data states
  const [snapshot, setSnapshot] = useState<ExecutiveCommandSnapshotDto | null>(null);
  const [bedForecasts, setBedForecasts] = useState<PredictiveBedForecastDto[]>([]);
  const [edHistory, setEdHistory] = useState<EdNedocsHourlyDto[]>([]);
  const [otSuites, setOtSuites] = useState<OtSuiteEfficiencyDto[]>([]);
  const [acuityHeatmap, setAcuityHeatmap] = useState<PatientAcuityHeatmapItemDto[]>([]);
  const [rcmRisks, setRcmRisks] = useState<RcmLeakageRiskItemDto[]>([]);
  const [consumables, setConsumables] = useState<CriticalConsumableRunoutDto[]>([]);
  const [simulations, setSimulations] = useState<WhatIfScenarioResultDto[]>([]);
  const [traces, setTraces] = useState<ExecutiveAuditTraceDto[]>([]);

  // Dialog toggles
  const [showDeclareSurge, setShowDeclareSurge] = useState(false);
  const [showResolveSurge, setShowResolveSurge] = useState(false);
  const [showRunSimulation, setShowRunSimulation] = useState(false);

  const loadData = useCallback(async () => {
    const [
      snap,
      bf,
      ed,
      ot,
      acuity,
      rcm,
      cons,
      sims,
      tr
    ] = await Promise.all([
      executiveCommandService.getCommandSnapshot(tenantId),
      executiveCommandService.getBedForecasts(tenantId),
      executiveCommandService.getEdNedocsHistory(tenantId),
      executiveCommandService.getOtEfficiencies(tenantId),
      executiveCommandService.getPatientAcuityHeatmap(tenantId),
      executiveCommandService.getRcmLeakageRisks(tenantId),
      executiveCommandService.getCriticalConsumables(tenantId),
      executiveCommandService.getSimulationHistory(tenantId),
      executiveCommandService.getAuditTraces(tenantId)
    ]);

    setSnapshot(snap);
    setBedForecasts(bf);
    setEdHistory(ed);
    setOtSuites(ot);
    setAcuityHeatmap(acuity);
    setRcmRisks(rcm);
    setConsumables(cons);
    setSimulations(sims);
    setTraces(tr);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!snapshot) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading Executive Command Center Platform...</div>;
  }

  // Handlers
  const handleDeclareSurge = async (data: DeclareSurgeEventRequest) => {
    await executiveCommandService.declareSurgeEvent(tenantId, data);
    await loadData();
  };

  const handleResolveSurge = async (data: ResolveSurgeEventRequest) => {
    await executiveCommandService.resolveSurgeEvent(tenantId, data);
    await loadData();
  };

  const handleRunSimulation = async (data: WhatIfScenarioRequest) => {
    await executiveCommandService.runWhatIfSimulation(tenantId, data);
    await loadData();
  };

  const handleOverrideBed = async (data: OverrideBedAllocationRequest) => {
    await executiveCommandService.overrideBedAllocation(tenantId, data);
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
          { key: 'OVERVIEW', label: '📊 Executive Overview' },
          { key: 'COMMAND_WALL', label: '🖥️ Command Wall' },
          { key: 'BED_FORECASTS', label: '🛏️ Bed Capacity' },
          { key: 'ED_NEDOCS', label: '🚨 ED NEDOCS' },
          { key: 'OT_EFFICIENCY', label: '🔪 OT Heatmap' }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ExecutiveTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-accent, #38BDF8)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--ds-color-primary, #0284C7)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--ds-color-text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
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

        {/* Secondary Modules Dropdown */}
        <TabOverflowMenu
          label="More Executive Engines"
          options={[
            { id: 'CLINICAL_ACUITY', label: '🩺 Clinical Acuity Radar' },
            { id: 'RCM_LEAKAGE', label: '💳 RCM Revenue Leakage AI' },
            { id: 'CONSUMABLES', label: '🩸 Critical Consumables Burn-Rate' },
            { id: 'WHAT_IF_SANDBOX', label: '🤖 What-If Simulation Sandbox' },
            { id: 'AUDIT_VAULT', label: '🔐 Executive Audit Vault' }
          ]}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as ExecutiveTab)}
          onReset={() => setActiveTab('OVERVIEW')}
          accentColor="#0284C7"
          activeBorderColor="#38BDF8"
        />
      </div>

      {/* Facility Template Switcher & Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <>
          <HospitalPatientJourneyCommandBar
            onNavigateModule={onNavigateModule}
            activeModule="executive-command-center"
            currentUserRole={currentUserRole}
          />
          <FacilityTemplateConfiguratorStudio />
          <ExecutiveCommandCenterOverviewView
          snapshot={snapshot}
          bedForecasts={bedForecasts}
          acuityHeatmap={acuityHeatmap}
          rcmRisks={rcmRisks}
          onDeclareSurge={() => setShowDeclareSurge(true)}
          onResolveSurge={() => setShowResolveSurge(true)}
          onRunSimulation={() => setShowRunSimulation(true)}
          />
        </>
      )}

      {activeTab === 'COMMAND_WALL' && <RealtimeHospitalCommandWallView snapshot={snapshot} />}

      {activeTab === 'BED_FORECASTS' && (
        <BedCapacityForecastView
          forecasts={bedForecasts}
          onOverride={(bedId) => setTargetBedIdForOverride(bedId)}
        />
      )}

      {activeTab === 'ED_NEDOCS' && <EdNedocsSurgeRadarView history={edHistory} />}
      {activeTab === 'OT_EFFICIENCY' && <OtEfficiencyHeatmapView suites={otSuites} />}
      {activeTab === 'CLINICAL_ACUITY' && <ClinicalAcuityRiskHeatmapView heatmap={acuityHeatmap} />}
      {activeTab === 'RCM_LEAKAGE' && <RcmLeakageDenialRiskView risks={rcmRisks} />}
      {activeTab === 'CONSUMABLES' && <CriticalConsumableRunoutView consumables={consumables} />}

      {activeTab === 'WHAT_IF_SANDBOX' && (
        <WhatIfSimulationSandboxView
          simulations={simulations}
          onRunSimulation={() => setShowRunSimulation(true)}
        />
      )}

      {activeTab === 'AUDIT_VAULT' && <ExecutiveAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      <DeclareSurgeEventDialog
        isOpen={showDeclareSurge}
        onClose={() => setShowDeclareSurge(false)}
        onSubmit={handleDeclareSurge}
      />

      <ResolveSurgeEventDialog
        isOpen={showResolveSurge}
        onClose={() => setShowResolveSurge(false)}
        onSubmit={handleResolveSurge}
      />

      <RunWhatIfSimulationDialog
        isOpen={showRunSimulation}
        onClose={() => setShowRunSimulation(false)}
        onSubmit={handleRunSimulation}
      />

      {targetBedIdForOverride && (
        <OverrideBedAllocationDialog
          isOpen={!!targetBedIdForOverride}
          bedId={targetBedIdForOverride}
          onClose={() => setTargetBedIdForOverride(null)}
          onSubmit={handleOverrideBed}
        />
      )}
    </div>
  );
};
