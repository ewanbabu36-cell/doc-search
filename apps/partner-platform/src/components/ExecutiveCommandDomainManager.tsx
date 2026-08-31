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
}

export const ExecutiveCommandDomainManager: React.FC<Props> = ({ tenantId }) => {
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
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📊 Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('COMMAND_WALL')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'COMMAND_WALL' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🖥️ Situational Command Wall
        </button>
        <button
          onClick={() => setActiveTab('BED_FORECASTS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'BED_FORECASTS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🛏️ Predictive Bed Capacity
        </button>
        <button
          onClick={() => setActiveTab('ED_NEDOCS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'ED_NEDOCS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🚨 ED NEDOCS Overcrowding
        </button>
        <button
          onClick={() => setActiveTab('OT_EFFICIENCY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OT_EFFICIENCY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔪 OT Suites Heatmap
        </button>
        <button
          onClick={() => setActiveTab('CLINICAL_ACUITY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CLINICAL_ACUITY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🩺 Clinical Acuity Radar
        </button>
        <button
          onClick={() => setActiveTab('RCM_LEAKAGE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'RCM_LEAKAGE' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          💳 RCM Revenue Leakage AI
        </button>
        <button
          onClick={() => setActiveTab('CONSUMABLES')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CONSUMABLES' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🩸 Critical Consumables Burn-Rate
        </button>
        <button
          onClick={() => setActiveTab('WHAT_IF_SANDBOX')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'WHAT_IF_SANDBOX' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🤖 What-If Simulation Sandbox
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 Executive Audit Vault
        </button>
      </div>

      {/* Facility Template Switcher & Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <>
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
