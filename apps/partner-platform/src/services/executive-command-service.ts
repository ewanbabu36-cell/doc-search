import { apiCall, isMockFallbackAllowed } from './api-client.js';
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

import {
  mockExecutiveSnapshot,
  mockPredictiveBedForecasts,
  mockEdNedocsHourly,
  mockOtSuiteEfficiencies,
  mockPatientAcuityHeatmap,
  mockRcmLeakageRisks,
  mockCriticalConsumableRunouts,
  mockWhatIfScenarioResults,
  mockExecutiveAuditTraces
} from './mock-executive-command-data.js';

export interface IExecutiveCommandService {
  getCommandSnapshot(tenantId: string): Promise<ExecutiveCommandSnapshotDto>;
  declareSurgeEvent(tenantId: string, payload: DeclareSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto>;
  resolveSurgeEvent(tenantId: string, payload: ResolveSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto>;

  getBedForecasts(tenantId: string): Promise<PredictiveBedForecastDto[]>;
  getEdNedocsHistory(tenantId: string): Promise<EdNedocsHourlyDto[]>;
  getOtEfficiencies(tenantId: string): Promise<OtSuiteEfficiencyDto[]>;
  getPatientAcuityHeatmap(tenantId: string): Promise<PatientAcuityHeatmapItemDto[]>;
  getRcmLeakageRisks(tenantId: string): Promise<RcmLeakageRiskItemDto[]>;
  getCriticalConsumables(tenantId: string): Promise<CriticalConsumableRunoutDto[]>;

  runWhatIfSimulation(tenantId: string, payload: WhatIfScenarioRequest): Promise<WhatIfScenarioResultDto>;
  getSimulationHistory(tenantId: string): Promise<WhatIfScenarioResultDto[]>;

  overrideBedAllocation(tenantId: string, payload: OverrideBedAllocationRequest): Promise<void>;
  getAuditTraces(tenantId: string): Promise<ExecutiveAuditTraceDto[]>;
}

export class ExecutiveCommandService implements IExecutiveCommandService {
  private snapshot: ExecutiveCommandSnapshotDto = isMockFallbackAllowed() ? { ...mockExecutiveSnapshot } : {
    hospitalName: 'Healthcare Facility',
    surgeLevel: 'NORMAL_GREEN',
    activeEmergencyCodes: [],
    totalBeds: 0,
    occupiedBeds: 0,
    availableBedsCount: 0,
    bedOccupancyPct: 0,
    icuBedsTotal: 0,
    icuBedsOccupied: 0,
    icuOccupancyPct: 0,
    ventilatorsTotal: 0,
    ventilatorsInUse: 0,
    ventilatorUtilizationPct: 0,
    edNedocsScore: 0,
    edNedocsStatus: 'NORMAL',
    otUtilizationPct: 0,
    edWaitingCount: 0,
    admittedWaitingBedCount: 0,
    otSurgeriesCompletedToday: 0,
    criticalLabAlertsPendingCount: 0,
    statRadiologyScansPendingCount: 0,
    bloodBankUnitsCritical: false,
    unbilledDischargesCount: 0,
    totalAtRiskRevenueAmount: 0,
    lastUpdated: new Date().toISOString(),
    snapshotTimestamp: new Date().toISOString()
  } as any;
  private bedForecasts: PredictiveBedForecastDto[] = isMockFallbackAllowed() ? [...mockPredictiveBedForecasts] : [];
  private edHistory: EdNedocsHourlyDto[] = isMockFallbackAllowed() ? [...mockEdNedocsHourly] : [];
  private otEfficiencies: OtSuiteEfficiencyDto[] = isMockFallbackAllowed() ? [...mockOtSuiteEfficiencies] : [];
  private acuityHeatmap: PatientAcuityHeatmapItemDto[] = isMockFallbackAllowed() ? [...mockPatientAcuityHeatmap] : [];
  private rcmRisks: RcmLeakageRiskItemDto[] = isMockFallbackAllowed() ? [...mockRcmLeakageRisks] : [];
  private consumables: CriticalConsumableRunoutDto[] = isMockFallbackAllowed() ? [...mockCriticalConsumableRunouts] : [];
  private simulations: WhatIfScenarioResultDto[] = isMockFallbackAllowed() ? [...mockWhatIfScenarioResults] : [];
  private auditTraces: ExecutiveAuditTraceDto[] = isMockFallbackAllowed() ? [...mockExecutiveAuditTraces] : [];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'Dr. Alok Verma (CMO)',
    actorRole = 'EXECUTIVE_ADMIN',
    tenantId = '11111111-1111-4111-8111-111111111111'
  ) {
    const traceNumber = `TRACE-EXEC-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: ExecutiveAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId,
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getCommandSnapshot(_tenantId: string): Promise<ExecutiveCommandSnapshotDto> {
    try {
      return await apiCall<ExecutiveCommandSnapshotDto>('/api/v1/partner/executive-mis/command/snapshot');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return { ...this.snapshot, snapshotTimestamp: new Date().toISOString() };
    }
  }

  async declareSurgeEvent(_tenantId: string, payload: DeclareSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto> {
    try {
      return await apiCall<ExecutiveCommandSnapshotDto>('/api/v1/partner/executive-mis/command/surge', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      this.snapshot.surgeLevel = payload.surgeLevel;
      if (payload.codeType) {
        this.snapshot.activeEmergencyCodes.unshift({
          codeType: payload.codeType,
          location: payload.location,
          declaredAt: new Date().toISOString(),
          status: 'ACTIVE'
        });
      }
      this.appendAudit('DECLARE_SURGE_EVENT', 'HOSPITAL_SURGE', crypto.randomUUID(), payload.surgeLevel, payload.justification, payload.declaredBy);
      return { ...this.snapshot };
    }
  }

  async resolveSurgeEvent(_tenantId: string, payload: ResolveSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto> {
    try {
      return await apiCall<ExecutiveCommandSnapshotDto>('/api/v1/partner/executive-mis/command/surge/resolve', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      this.snapshot.surgeLevel = 'NORMAL_GREEN';
      this.snapshot.activeEmergencyCodes.forEach((code) => {
        code.status = 'RESOLVED';
      });
      this.appendAudit('RESOLVE_SURGE_EVENT', 'HOSPITAL_SURGE', crypto.randomUUID(), 'NORMAL_GREEN', payload.outcomeNotes, payload.resolvedBy);
      return { ...this.snapshot };
    }
  }

  async getBedForecasts(_tenantId: string): Promise<PredictiveBedForecastDto[]> {
    try {
      return await apiCall<PredictiveBedForecastDto[]>('/api/v1/partner/executive-mis/command/bed-forecasts');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.bedForecasts];
    }
  }

  async getEdNedocsHistory(_tenantId: string): Promise<EdNedocsHourlyDto[]> {
    try {
      return await apiCall<EdNedocsHourlyDto[]>('/api/v1/partner/executive-mis/command/ed-nedocs');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.edHistory];
    }
  }

  async getOtEfficiencies(_tenantId: string): Promise<OtSuiteEfficiencyDto[]> {
    try {
      return await apiCall<OtSuiteEfficiencyDto[]>('/api/v1/partner/executive-mis/command/ot-efficiencies');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.otEfficiencies];
    }
  }

  async getPatientAcuityHeatmap(_tenantId: string): Promise<PatientAcuityHeatmapItemDto[]> {
    try {
      return await apiCall<PatientAcuityHeatmapItemDto[]>('/api/v1/partner/executive-mis/command/patient-acuity');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.acuityHeatmap];
    }
  }

  async getRcmLeakageRisks(_tenantId: string): Promise<RcmLeakageRiskItemDto[]> {
    try {
      return await apiCall<RcmLeakageRiskItemDto[]>('/api/v1/partner/executive-mis/command/rcm-risks');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.rcmRisks];
    }
  }

  async getCriticalConsumables(_tenantId: string): Promise<CriticalConsumableRunoutDto[]> {
    try {
      return await apiCall<CriticalConsumableRunoutDto[]>('/api/v1/partner/executive-mis/command/consumables');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.consumables];
    }
  }

  async runWhatIfSimulation(_tenantId: string, payload: WhatIfScenarioRequest): Promise<WhatIfScenarioResultDto> {
    try {
      return await apiCall<WhatIfScenarioResultDto>('/api/v1/partner/executive-mis/command/what-if', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      let peakOcc = 95.5;
      let icuDeficit = 4;
      let ventShortage = 2;
      let waitPeak = 95;
      let finImpact = 1800000;
      const recs: string[] = [];

      if (payload.surgeType === 'MASS_CASUALTY_SURGE_50_PTS') {
        peakOcc = 99.2;
        icuDeficit = 6;
        ventShortage = 4;
        waitPeak = 120;
        finImpact = 2500000;
        recs.push('Activate Disaster Triage Zone in Outpatient concourse.');
        recs.push('Divert 6 elective surgical cases to Day Care center.');
        recs.push('Mobilize backup O-Negative blood bank universal packs.');
      } else if (payload.surgeType === 'EPIDEMIC_RESPIRATORY_SURGE_30_PCT') {
        peakOcc = 97.0;
        icuDeficit = 8;
        ventShortage = 6;
        waitPeak = 85;
        finImpact = 1500000;
        recs.push('Convert Ward 4 into dedicated negative pressure isolation unit.');
        recs.push('Request 5 rental backup transport ventilators from OEM supplier.');
      } else if (payload.surgeType === 'OT_COMPLEX_MAINTENANCE_DOWNTIME') {
        peakOcc = 86.0;
        icuDeficit = 0;
        ventShortage = 0;
        waitPeak = 45;
        finImpact = -950000;
        recs.push('Re-sequence elective cases into extended evening block times in OT 1 and OT 3.');
      } else {
        recs.push('Optimize discharge velocity ahead of scheduled bed demand.');
      }

      const simResult: WhatIfScenarioResultDto = {
        scenarioId: crypto.randomUUID(),
        scenarioName: `Simulated: ${payload.scenarioName}`,
        simulatedOccupancyPeakPct: peakOcc,
        simulatedIcuDeficitBeds: icuDeficit,
        simulatedVentilatorShortageCount: ventShortage,
        simulatedEdWaitTimePeakMins: waitPeak,
        simulatedDailyFinancialImpactInr: finImpact,
        aiRecommendations: recs,
        generatedAt: new Date().toISOString()
      };

      this.simulations.unshift(simResult);
      this.appendAudit('RUN_WHAT_IF_SIMULATION', 'SIMULATION_SCENARIO', simResult.scenarioId, payload.surgeType, `Simulated scenario: ${payload.scenarioName}`);
      return simResult;
    }
  }

  async getSimulationHistory(_tenantId: string): Promise<WhatIfScenarioResultDto[]> {
    try {
      return await apiCall<WhatIfScenarioResultDto[]>('/api/v1/partner/executive-mis/command/what-if/history');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.simulations];
    }
  }

  async overrideBedAllocation(_tenantId: string, payload: OverrideBedAllocationRequest): Promise<void> {
    try {
      await apiCall<unknown>('/api/v1/partner/executive-mis/command/bed-override', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return;
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      this.appendAudit('OVERRIDE_BED_ALLOCATION', 'BED_ALLOCATION', payload.bedId, payload.targetPatientMrn, payload.overrideReason, payload.authorizedBy);
    }
  }

  async getAuditTraces(_tenantId: string): Promise<ExecutiveAuditTraceDto[]> {
    try {
      return await apiCall<ExecutiveAuditTraceDto[]>('/api/v1/partner/executive-mis/audit-traces');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.auditTraces];
    }
  }
}

export const executiveCommandService = new ExecutiveCommandService();
