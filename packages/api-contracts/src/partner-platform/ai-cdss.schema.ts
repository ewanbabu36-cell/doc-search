import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const SepsisRiskGradeEnum = z.enum([
  'LOW_RISK_0_4',
  'MEDIUM_RISK_5_6',
  'HIGH_RISK_RED_ALERT_7_PLUS',
  'SEPTIC_SHOCK_CRITICAL'
]);
export type SepsisRiskGrade = z.infer<typeof SepsisRiskGradeEnum>;

export const DdiSeverityLevelEnum = z.enum([
  'CONTRAINDICATED_FATAL',
  'MAJOR_CLINICAL_RISK',
  'MODERATE_MONITOR_REQUIRED',
  'MINOR_CAUTION'
]);
export type DdiSeverityLevel = z.infer<typeof DdiSeverityLevelEnum>;

export const CdsHookTypeEnum = z.enum([
  'PATIENT_VIEW',
  'ORDER_SELECT',
  'ORDER_SIGN',
  'MEDICATION_PRESCRIBE'
]);
export type CdsHookType = z.infer<typeof CdsHookTypeEnum>;

export const PanicValueCategoryEnum = z.enum([
  'CARDIAC_ENZYME_CRITICAL',
  'ELECTROLYTE_LETHAL',
  'COAGULATION_HEMORRHAGE',
  'BLOOD_GAS_ACIDOSIS',
  'RADIOLOGY_EMERGENCY_STAT'
]);
export type PanicValueCategory = z.infer<typeof PanicValueCategoryEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const SepsisNews2AlertDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  bedNumber: z.string(),
  wardName: z.string(),
  news2Score: z.number(), // 0-20
  qsofaScore: z.number(), // 0-3
  riskGrade: SepsisRiskGradeEnum,
  respiratoryRate: z.number(),
  spO2Pct: z.number(),
  requiresSupplementalO2: z.boolean(),
  systolicBp: z.number(),
  pulseRate: z.number(),
  temperatureCelsius: z.number(),
  consciousnessLevel: z.enum(['ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE']),
  serumLactateMmolL: z.number().nullable().optional(),
  bundleChecklist: z.object({
    bloodCulturesOrdered: z.boolean(),
    lactateMeasured: z.boolean(),
    ivAntibioticsGiven: z.boolean(),
    ivFluidsAdministered: z.boolean(),
    vasopressorsStarted: z.boolean()
  }),
  alertStatus: z.enum(['TRIGGERED_ACTIVE', 'ACKNOWLEDGED_RRT_EN_ROUTE', 'RESOLVED_STABILIZED']),
  triggeredAt: z.string(),
  acknowledgedBy: z.string().nullable().optional()
});
export type SepsisNews2AlertDto = z.infer<typeof SepsisNews2AlertDtoSchema>;

export const DdiInteractionAssessmentDtoSchema = z.object({
  id: z.string().uuid(),
  drugA: z.string(), // e.g. "Warfarin 5mg"
  drugB: z.string(), // e.g. "Aspirin 75mg" or "Clarithromycin 500mg"
  severityLevel: DdiSeverityLevelEnum,
  clinicalConsequence: z.string(), // e.g. "Severe risk of major upper GI hemorrhage and INR elevation"
  mechanism: z.string(), // e.g. "Synergistic platelet inhibition + CYP2C9 inhibition"
  recommendedManagement: z.string(), // e.g. "Avoid combination. Switch to alternative antibiotic (Azithromycin) or reduce Warfarin dose by 50% with daily INR."
  evidenceReference: z.string() // e.g. "Lexicomp DDI Cat X / UpToDate"
});
export type DdiInteractionAssessmentDto = z.infer<typeof DdiInteractionAssessmentDtoSchema>;

export const RenalDoseAdjustmentDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  serumCreatinineMgDl: z.number(),
  estimatedGfrMlMin: z.number(),
  drugName: z.string(),
  prescribedDose: z.string(),
  recommendedRenalDose: z.string(),
  adjustmentRationale: z.string(),
  severity: z.enum(['CRITICAL_TOXICITY_RISK', 'MODERATE_ACCUMULATION', 'MINOR_ADJUSTMENT'])
});
export type RenalDoseAdjustmentDto = z.infer<typeof RenalDoseAdjustmentDtoSchema>;

export const AmbientAiSoapTranscriptDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  specialtyName: z.string(),
  encounterTimestamp: z.string(),
  audioDurationSeconds: z.number(),
  rawTranscriptExcerpt: z.string(),
  soapNote: z.object({
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string()
  }),
  suggestedIcd10Codes: z.array(z.object({
    code: z.string(),
    description: z.string(),
    confidencePct: z.number()
  })),
  suggestedPrescriptions: z.array(z.object({
    drugName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string()
  })),
  reviewStatus: z.enum(['AI_DRAFTED', 'PHYSICIAN_APPROVED', 'COMMITTED_TO_EMR'])
});
export type AmbientAiSoapTranscriptDto = z.infer<typeof AmbientAiSoapTranscriptDtoSchema>;

export const DiagnosticPanicValueAlertDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  location: z.string(),
  testName: z.string(),
  measuredValue: z.string(),
  referenceNormalRange: z.string(),
  panicThreshold: z.string(),
  category: PanicValueCategoryEnum,
  urgencyLevel: z.enum(['CRITICAL_LIFE_THREAT', 'HIGH_URGENCY_15M', 'URGENT_STAT_1H']),
  clinicalRiskSummary: z.string(),
  communicatedToDoctor: z.boolean(),
  doctorName: z.string(),
  alertTimestamp: z.string(),
  acknowledgementTimestamp: z.string().nullable().optional()
});
export type DiagnosticPanicValueAlertDto = z.infer<typeof DiagnosticPanicValueAlertDtoSchema>;

export const CdssOverviewMetricsDtoSchema = z.object({
  activeSepsisAlertsCount: z.number(),
  highRiskPatientsCount: z.number(),
  ddiInteractionsBlockedMonth: z.number(),
  ambientSoapNotesDraftedMonth: z.number(),
  criticalPanicValuesToday: z.number(),
  averageSepsisBundleCompliancePct: z.number(),
  physicianOverrideRatePct: z.number(),
  aiModelAccuracyPct: z.number()
});
export type CdssOverviewMetricsDto = z.infer<typeof CdssOverviewMetricsDtoSchema>;

export const CdssAuditTraceDtoSchema = z.object({
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
export type CdssAuditTraceDto = z.infer<typeof CdssAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const AcknowledgeSepsisAlertRequestSchema = z.object({
  alertId: z.string().uuid(),
  acknowledgedBy: z.string(),
  bundleActionsCompleted: z.array(z.string()),
  clinicalActionTaken: z.string()
});
export type AcknowledgeSepsisAlertRequest = z.infer<typeof AcknowledgeSepsisAlertRequestSchema>;

export const EvaluateDdiRequestSchema = z.object({
  patientMrn: z.string(),
  activeMedications: z.array(z.string()),
  newMedicationToPrescribe: z.string()
});
export type EvaluateDdiRequest = z.infer<typeof EvaluateDdiRequestSchema>;

export const OverrideDdiWarningRequestSchema = z.object({
  interactionId: z.string().uuid(),
  prescribingDoctor: z.string(),
  clinicalJustification: z.string(),
  riskBenefitRatioAssessed: z.boolean().default(true)
});
export type OverrideDdiWarningRequest = z.infer<typeof OverrideDdiWarningRequestSchema>;

export const GenerateAmbientSoapRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  specialtyName: z.string(),
  clinicalDialogueTranscript: z.string()
});
export type GenerateAmbientSoapRequest = z.infer<typeof GenerateAmbientSoapRequestSchema>;

export const AcknowledgePanicValueRequestSchema = z.object({
  panicAlertId: z.string().uuid(),
  acknowledgedByDoctor: z.string(),
  immediateIntervention: z.string()
});
export type AcknowledgePanicValueRequest = z.infer<typeof AcknowledgePanicValueRequestSchema>;
