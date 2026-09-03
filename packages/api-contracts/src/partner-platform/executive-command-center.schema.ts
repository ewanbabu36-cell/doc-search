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

// ============================================================================
// Executive MIS & Revenue Leakage DTOs (Milestone 3.5)
// ============================================================================

export const DepartmentWiseBillingSummaryDtoSchema = z.object({
  department: z.string(), // 'OPD', 'IPD', 'EMERGENCY', 'ICU', 'OPERATION_THEATRE', 'PHARMACY', 'LABORATORY', 'RADIOLOGY'
  grossBilledInr: z.number(),
  discountsInr: z.number(),
  netBilledInr: z.number(),
  cashCollectedInr: z.number(),
  insurancePendingInr: z.number(),
  encounterCount: z.number(),
  averageTicketSizeInr: z.number()
});
export type DepartmentWiseBillingSummaryDto = z.infer<typeof DepartmentWiseBillingSummaryDtoSchema>;

export const UnbilledEncounterItemDtoSchema = z.object({
  encounterId: z.string(),
  patientMrn: z.string(),
  patientName: z.string(),
  department: z.string(),
  encounterType: z.enum(['OPD', 'IPD', 'EMERGENCY', 'DAYCARE']),
  admissionDischargeDate: z.string(),
  completedServices: z.array(z.string()),
  unbilledAmountEstimateInr: z.number(),
  unbilledReason: z.enum([
    'MISSING_DISCHARGE_ORDER',
    'PENDING_LAB_VERIFICATION',
    'UNFINALIZED_SURGICAL_NOTES',
    'TPA_PRE_AUTH_QUERY',
    'UNPOSTED_WARD_CONSUMABLES'
  ]),
  agingHours: z.number(),
  status: z.enum(['ACTION_REQUIRED', 'IN_REVIEW', 'ESCALATED_TO_BILLING_LEAD', 'RESOLVED'])
});
export type UnbilledEncounterItemDto = z.infer<typeof UnbilledEncounterItemDtoSchema>;

export const InsuranceClaimAgingBucketDtoSchema = z.object({
  bucket: z.enum(['0_30_DAYS', '31_60_DAYS', '61_90_DAYS', 'OVER_90_DAYS']),
  totalClaimCount: z.number(),
  totalClaimAmountInr: z.number(),
  preAuthPendingCount: z.number(),
  queryRaisedCount: z.number(),
  approvedSettledCount: z.number(),
  deniedCount: z.number(),
  tpaBreakdown: z.array(z.object({
    tpaName: z.string(),
    amountInr: z.number(),
    claimCount: z.number()
  }))
});
export type InsuranceClaimAgingBucketDto = z.infer<typeof InsuranceClaimAgingBucketDtoSchema>;

export const InventoryShrinkageItemDtoSchema = z.object({
  itemSku: z.string(),
  itemName: z.string(),
  department: z.string(),
  physicalCount: z.number(),
  systemRecordedCount: z.number(),
  discrepancyUnits: z.number(),
  shrinkageRatePct: z.number(),
  unitCostInr: z.number(),
  totalShrinkageLossInr: z.number(),
  reason: z.enum([
    'EXPIRED_UNRECORDED',
    'BREAKAGE_SPILLAGE',
    'PILFERAGE_UNACCOUNTED',
    'BATCH_DISCREPANCY',
    'DATA_ENTRY_LAG'
  ]),
  investigationStatus: z.enum(['FLAGGED', 'UNDER_AUDIT', 'RESOLVED_WRITTEN_OFF'])
});
export type InventoryShrinkageItemDto = z.infer<typeof InventoryShrinkageItemDtoSchema>;

export const DoctorPayoutCalculationDtoSchema = z.object({
  doctorId: z.string(),
  doctorName: z.string(),
  specialty: z.string(),
  remunerationModel: z.enum([
    'FEE_FOR_SERVICE_OPD',
    'SURGICAL_PROCEDURE_SPLIT',
    'FIXED_RETAINER_PLUS_INCENTIVE',
    'IPD_PER_DIEM_ROUNDS'
  ]),
  totalPatientsAttended: z.number(),
  grossBilledRevenueInr: z.number(),
  hospitalShareInr: z.number(),
  doctorGrossPayoutInr: z.number(),
  tdsDeductionInr: z.number(), // Section 194J (10%)
  netPayableInr: z.number(),
  settlementStatus: z.enum(['CALCULATED_PENDING_APPROVAL', 'APPROVED_BY_CFO', 'DISBURSED']),
  payoutPeriod: z.string()
});
export type DoctorPayoutCalculationDto = z.infer<typeof DoctorPayoutCalculationDtoSchema>;

export const ExecutiveMisDashboardDtoSchema = z.object({
  tenantId: z.string().uuid(),
  generatedAt: z.string(),
  executiveSnapshot: ExecutiveCommandSnapshotDtoSchema,
  departmentWiseBilling: z.array(DepartmentWiseBillingSummaryDtoSchema),
  unbilledEncounters: z.array(UnbilledEncounterItemDtoSchema),
  insuranceClaimAging: z.array(InsuranceClaimAgingBucketDtoSchema),
  inventoryShrinkage: z.array(InventoryShrinkageItemDtoSchema),
  doctorPayouts: z.array(DoctorPayoutCalculationDtoSchema),
  rcmLeakageRisks: z.array(RcmLeakageRiskItemDtoSchema),
  summaryKpis: z.object({
    totalGrossBilledInr: z.number(),
    totalNetBilledInr: z.number(),
    totalCashCollectedInr: z.number(),
    totalInsuranceArInr: z.number(),
    totalUnbilledRiskInr: z.number(),
    totalInventoryShrinkageLossInr: z.number(),
    totalDoctorNetPayoutInr: z.number(),
    unbilledEncountersCount: z.number(),
    criticalConsumablesStockoutRiskCount: z.number()
  })
});
export type ExecutiveMisDashboardDto = z.infer<typeof ExecutiveMisDashboardDtoSchema>;

