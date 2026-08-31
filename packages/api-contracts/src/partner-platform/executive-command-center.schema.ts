import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const HospitalSurgeLevelEnum = z.enum([
  'NORMAL_GREEN',
  'BUSY_YELLOW',
  'OVERCROWDED_AMBER',
  'CRITICAL_SURGE_RED',
  'DISASTER_BLACK'
]);
export type HospitalSurgeLevel = z.infer<typeof HospitalSurgeLevelEnum>;

export const EmergencyCodeTypeEnum = z.enum([
  'CODE_BLUE_CARDIAC_ARREST',
  'CODE_RED_FIRE_HAZARD',
  'CODE_BLACK_MASS_CASUALTY',
  'CODE_YELLOW_INFRASTRUCTURE_FAILURE',
  'CODE_PINK_INFANT_SECURITY',
  'CODE_ORANGE_HAZMAT_DECONTAMINATION'
]);
export type EmergencyCodeType = z.infer<typeof EmergencyCodeTypeEnum>;

export const PredictiveForecastWindowEnum = z.enum([
  'NEXT_6_HOURS',
  'NEXT_12_HOURS',
  'NEXT_24_HOURS',
  'NEXT_48_HOURS',
  'NEXT_7_DAYS'
]);
export type PredictiveForecastWindow = z.infer<typeof PredictiveForecastWindowEnum>;

export const BottleneckSeverityEnum = z.enum([
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL_BLOCKER'
]);
export type BottleneckSeverity = z.infer<typeof BottleneckSeverityEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const ExecutiveCommandSnapshotDtoSchema = z.object({
  tenantId: z.string().uuid(),
  hospitalName: z.string(),
  snapshotTimestamp: z.string(),
  surgeLevel: HospitalSurgeLevelEnum,
  activeEmergencyCodes: z.array(z.object({
    codeType: EmergencyCodeTypeEnum,
    location: z.string(),
    declaredAt: z.string(),
    status: z.enum(['ACTIVE', 'STANDBY', 'RESOLVED'])
  })),
  // Census
  totalBeds: z.number(),
  occupiedBeds: z.number(),
  bedOccupancyPct: z.number(),
  availableBedsCount: z.number(),
  icuBedsTotal: z.number(),
  icuBedsOccupied: z.number(),
  icuOccupancyPct: z.number(),
  ventilatorsTotal: z.number(),
  ventilatorsInUse: z.number(),
  ventilatorUtilizationPct: z.number(),
  // Emergency
  edTriageWaitingCount: z.number(),
  edHoldForAdmissionCount: z.number(),
  edNedocsScore: z.number(), // 0-200
  edNedocsStatus: z.string(), // "Extremely Busy", "Overcrowded", etc.
  // Operation Theatre
  otSuitesActive: z.number(),
  otSuitesTotal: z.number(),
  otUtilizationPct: z.number(),
  surgeriesInProgressCount: z.number(),
  surgeriesDelayedCount: z.number(),
  // Financials & Diagnostics
  dailyRevenueVelocityInr: z.number(),
  unbilledChargesRiskInr: z.number(),
  claimsDenialRiskCount: z.number(),
  statLabOrdersPending: z.number(),
  statRadiologyOrdersPending: z.number(),
  // Blood Bank & Consumables
  criticalBloodUnitsAlertCount: z.number(),
  criticalConsumablesStockoutRiskCount: z.number()
});
export type ExecutiveCommandSnapshotDto = z.infer<typeof ExecutiveCommandSnapshotDtoSchema>;

export const PredictiveBedForecastDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  forecastWindow: PredictiveForecastWindowEnum,
  specialtyName: z.string(), // e.g. "Cardiology", "Neurology", "General Medicine", "Surgical ICU"
  currentOccupied: z.number(),
  capacityLimit: z.number(),
  predictedAdmissions: z.number(),
  predictedDischarges: z.number(),
  netProjectedDemand: z.number(),
  projectedOccupancyPct: z.number(),
  predictedBottleneckLevel: BottleneckSeverityEnum,
  aiConfidencePct: z.number(),
  recommendedAction: z.string()
});
export type PredictiveBedForecastDto = z.infer<typeof PredictiveBedForecastDtoSchema>;

export const EdNedocsHourlyDtoSchema = z.object({
  hourTimestamp: z.string(),
  totalPatientsInEd: z.number(),
  admittedPatientsWaitingBed: z.number(),
  resuscitationBedsOccupied: z.number(),
  longestWaitTimeMins: z.number(),
  nedocsScore: z.number(),
  surgeCategory: HospitalSurgeLevelEnum,
  predictedArrivalsNext4Hours: z.number()
});
export type EdNedocsHourlyDto = z.infer<typeof EdNedocsHourlyDtoSchema>;

export const OtSuiteEfficiencyDtoSchema = z.object({
  otRoomId: z.string(),
  otRoomName: z.string(),
  suiteType: z.enum(['MODULAR_MAJOR', 'CARDIAC_HYBRID', 'NEURO_STEALTH', 'ORTHO_LAMINAR', 'EMERGENCY_DEDICATED', 'DAY_CARE_MINOR']),
  casesScheduledToday: z.number(),
  casesCompletedToday: z.number(),
  casesInProgress: z.number(),
  averageTurnaroundTimeMins: z.number(),
  utilizationRatePct: z.number(),
  onTimeStartRatePct: z.number(),
  scheduleStatus: z.enum(['ON_SCHEDULE', 'DELAYED_30M', 'DELAYED_OVER_1H', 'OVERRUN_RISK', 'IDLE_AVAILABLE']),
  nextScheduledSpecialty: z.string()
});
export type OtSuiteEfficiencyDto = z.infer<typeof OtSuiteEfficiencyDtoSchema>;

export const PatientAcuityHeatmapItemDtoSchema = z.object({
  bedId: z.string(),
  bedNumber: z.string(),
  wardName: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  deteriorationScore: z.number(), // 1-10 (e.g. Modified Early Warning Score - MEWS)
  acuityLevel: z.enum(['STABLE_GREEN', 'MODERATE_YELLOW', 'HIGH_RISK_AMBER', 'CRITICAL_DETERIORATING_RED']),
  primaryRiskTrigger: z.string(), // e.g. "Tachycardia + Drop in SpO2", "Lactate Elevation"
  icuTransferProbabilityPct: z.number(),
  attendingPhysician: z.string(),
  lastVitalsSync: z.string()
});
export type PatientAcuityHeatmapItemDto = z.infer<typeof PatientAcuityHeatmapItemDtoSchema>;

export const RcmLeakageRiskItemDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  departmentName: z.string(),
  potentialLeakageType: z.enum(['UNBILLED_DIAGNOSTIC_ORDER', 'MISSING_SURGICAL_CONSUMABLE', 'UNAPPROVED_HIGH_COST_IMPLANT', 'INCOMPLETE_PRE_AUTH_EXTENSION', 'DELAYED_DISCHARGE_BILL_RECONCILIATION']),
  estimatedRiskAmountInr: z.number(),
  riskProbabilityPct: z.number(),
  suggestedCorrection: z.string(),
  detectedAt: z.string()
});
export type RcmLeakageRiskItemDto = z.infer<typeof RcmLeakageRiskItemDtoSchema>;

export const CriticalConsumableRunoutDtoSchema = z.object({
  skuCode: z.string(),
  itemName: z.string(),
  category: z.enum(['BLOOD_UNIT', 'LIFE_SAVING_DRUG', 'OXYGEN_CYLINDER', 'SURGICAL_IMPLANT', 'CRITICAL_PPE', 'DIALYSIS_DIALYZER']),
  currentStockUnits: z.number(),
  dailyBurnRateUnits: z.number(),
  projectedRunoutDays: z.number(),
  urgencyLevel: z.enum(['ADEQUATE_BUFFER', 'WARNING_RUNOUT_72H', 'CRITICAL_RUNOUT_24H', 'STOCKOUT_IMMINENT']),
  vendorLeadTimeDays: z.number(),
  autoReplenishmentStatus: z.string()
});
export type CriticalConsumableRunoutDto = z.infer<typeof CriticalConsumableRunoutDtoSchema>;

export const WhatIfScenarioRequestSchema = z.object({
  scenarioName: z.string(),
  surgeType: z.enum(['MASS_CASUALTY_SURGE_50_PTS', 'EPIDEMIC_RESPIRATORY_SURGE_30_PCT', 'OT_COMPLEX_MAINTENANCE_DOWNTIME', 'ICU_BED_CONVERSION_ISOLATION_15_BEDS']),
  durationHours: z.number().default(48),
  divertElectiveSurgeries: z.boolean().default(false),
  fastTrackDischargeBonus: z.boolean().default(false)
});
export type WhatIfScenarioRequest = z.infer<typeof WhatIfScenarioRequestSchema>;

export const WhatIfScenarioResultDtoSchema = z.object({
  scenarioId: z.string().uuid(),
  scenarioName: z.string(),
  simulatedOccupancyPeakPct: z.number(),
  simulatedIcuDeficitBeds: z.number(),
  simulatedVentilatorShortageCount: z.number(),
  simulatedEdWaitTimePeakMins: z.number(),
  simulatedDailyFinancialImpactInr: z.number(),
  aiRecommendations: z.array(z.string()),
  generatedAt: z.string()
});
export type WhatIfScenarioResultDto = z.infer<typeof WhatIfScenarioResultDtoSchema>;

export const ExecutiveAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  traceNumber: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  justification: z.string(),
  integrityHash: z.string(),
  timestamp: z.string()
});
export type ExecutiveAuditTraceDto = z.infer<typeof ExecutiveAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const DeclareSurgeEventRequestSchema = z.object({
  surgeLevel: HospitalSurgeLevelEnum,
  codeType: EmergencyCodeTypeEnum.optional(),
  location: z.string(),
  justification: z.string(),
  declaredBy: z.string()
});
export type DeclareSurgeEventRequest = z.infer<typeof DeclareSurgeEventRequestSchema>;

export const ResolveSurgeEventRequestSchema = z.object({
  resolvedBy: z.string(),
  outcomeNotes: z.string()
});
export type ResolveSurgeEventRequest = z.infer<typeof ResolveSurgeEventRequestSchema>;

export const OverrideBedAllocationRequestSchema = z.object({
  bedId: z.string(),
  targetPatientMrn: z.string(),
  overrideReason: z.string(),
  authorizedBy: z.string()
});
export type OverrideBedAllocationRequest = z.infer<typeof OverrideBedAllocationRequestSchema>;
