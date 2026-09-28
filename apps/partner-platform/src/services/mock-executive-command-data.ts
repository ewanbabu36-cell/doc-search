import type {
  ExecutiveCommandSnapshotDto,
  PredictiveBedForecastDto,
  EdNedocsHourlyDto,
  OtSuiteEfficiencyDto,
  PatientAcuityHeatmapItemDto,
  RcmLeakageRiskItemDto,
  CriticalConsumableRunoutDto,
  WhatIfScenarioResultDto,
  ExecutiveAuditTraceDto
} from '@docsearch/api-contracts';

export const mockExecutiveSnapshot: ExecutiveCommandSnapshotDto = {
  tenantId: '11111111-1111-4111-8111-111111111111',
  hospitalName: 'Doc Search System Center',
  snapshotTimestamp: new Date().toISOString(),
  surgeLevel: 'NORMAL_GREEN',
  activeEmergencyCodes: [],
  totalBeds: 0,
  occupiedBeds: 0,
  bedOccupancyPct: 0,
  availableBedsCount: 0,
  icuBedsTotal: 0,
  icuBedsOccupied: 0,
  icuOccupancyPct: 0,
  ventilatorsTotal: 0,
  ventilatorsInUse: 0,
  ventilatorUtilizationPct: 0,
  edTriageWaitingCount: 0,
  edHoldForAdmissionCount: 0,
  edNedocsScore: 0,
  edNedocsStatus: 'Normal Capacity',
  otSuitesActive: 0,
  otSuitesTotal: 0,
  otUtilizationPct: 0,
  surgeriesInProgressCount: 0,
  surgeriesDelayedCount: 0,
  dailyRevenueVelocityInr: 0,
  unbilledChargesRiskInr: 0,
  claimsDenialRiskCount: 0,
  statLabOrdersPending: 0,
  statRadiologyOrdersPending: 0,
  criticalBloodUnitsAlertCount: 0,
  criticalConsumablesStockoutRiskCount: 0
};

export const mockPredictiveBedForecasts: PredictiveBedForecastDto[] = [];

export const mockEdNedocsHourly: EdNedocsHourlyDto[] = [];

export const mockOtSuiteEfficiencies: OtSuiteEfficiencyDto[] = [];

export const mockPatientAcuityHeatmap: PatientAcuityHeatmapItemDto[] = [];

export const mockRcmLeakageRisks: RcmLeakageRiskItemDto[] = [];

export const mockCriticalConsumableRunouts: CriticalConsumableRunoutDto[] = [];

export const mockWhatIfScenarioResults: WhatIfScenarioResultDto[] = [];

export const mockExecutiveAuditTraces: ExecutiveAuditTraceDto[] = [];
