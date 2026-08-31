import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const QualityAccreditationChapterEnum = z.enum([
  'AAC_ACCESS_ASSESSMENT_CONTINUITY',
  'COP_CARE_OF_PATIENTS',
  'MOM_MANAGEMENT_OF_MEDICATION',
  'PRE_PATIENT_RIGHTS_EDUCATION',
  'HIC_HOSPITAL_INFECTION_CONTROL',
  'PSQ_PATIENT_SAFETY_QUALITY',
  'ROM_RESPONSIBILITIES_MANAGEMENT',
  'FMS_FACILITY_MANAGEMENT_SAFETY',
  'HRM_HUMAN_RESOURCE_MANAGEMENT',
  'IMS_INFORMATION_MANAGEMENT_SYSTEM'
]);
export type QualityAccreditationChapter = z.infer<typeof QualityAccreditationChapterEnum>;

export const IncidentCategoryEnum = z.enum([
  'MEDICATION_ERROR',
  'PATIENT_FALL',
  'SURGICAL_COMPLICATION_NEVER_EVENT',
  'NEEDLE_STICK_SHARPS',
  'TRANSFUSION_REACTION',
  'DIAGNOSTIC_DELAY',
  'PRESSURE_ULCER',
  'EQUIPMENT_FAILURE',
  'STAFF_VIOLENCE_SECURITY',
  'PATIENT_ELOPEMENT_LAMA',
  'HEALTHCARE_ASSOCIATED_INFECTION',
  'OTHER_SAFETY_EVENT'
]);
export type IncidentCategory = z.infer<typeof IncidentCategoryEnum>;

export const SacScoreEnum = z.enum([
  'SAC_1_EXTREME_SENTINEL',
  'SAC_2_MAJOR',
  'SAC_3_MODERATE',
  'SAC_4_MINOR_NEAR_MISS'
]);
export type SacScore = z.infer<typeof SacScoreEnum>;

export const IncidentStatusEnum = z.enum([
  'REPORTED',
  'UNDER_TRIAGE',
  'RCA_IN_PROGRESS',
  'CAPA_FORMULATED',
  'CAPA_IMPLEMENTATION',
  'MONITORING_EFFECTIVENESS',
  'CLOSED'
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

export const HaiTypeEnum = z.enum([
  'CLABSI',
  'CAUTI',
  'VAP',
  'SSI',
  'MDRO_COLONIZATION_INFECTION'
]);
export type HaiType = z.infer<typeof HaiTypeEnum>;

export const IsolationPrecautionTypeEnum = z.enum([
  'STANDARD',
  'CONTACT',
  'DROPLET',
  'AIRBORNE',
  'PROTECTIVE_REVERSE'
]);
export type IsolationPrecautionType = z.infer<typeof IsolationPrecautionTypeEnum>;

export const HandHygieneMomentEnum = z.enum([
  'BEFORE_PATIENT_CONTACT',
  'BEFORE_CLEAN_ASEPTIC_PROCEDURE',
  'AFTER_BODY_FLUID_EXPOSURE',
  'AFTER_PATIENT_CONTACT',
  'AFTER_TOUCHING_PATIENT_SURROUNDINGS'
]);
export type HandHygieneMoment = z.infer<typeof HandHygieneMomentEnum>;

export const SwabSampleTypeEnum = z.enum([
  'OT_AIR_SETTLE_PLATE',
  'OT_SURFACE_SWAB',
  'ENDOSCOPE_CHANNEL_FLUSH',
  'DIALYSIS_WATER_ENDOTOXIN',
  'AUTOCLAVE_BIOLOGICAL_INDICATOR',
  'CSSD_STERILITY_SWAB'
]);
export type SwabSampleType = z.infer<typeof SwabSampleTypeEnum>;

export const BmwColorCategoryEnum = z.enum([
  'YELLOW_ANATOMICAL_SOILED',
  'RED_CONTAMINATED_PLASTIC',
  'WHITE_TRANSLUCENT_SHARPS',
  'BLUE_GLASSWARE_METALLIC'
]);
export type BmwColorCategory = z.infer<typeof BmwColorCategoryEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const QualityStandardDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  chapter: QualityAccreditationChapterEnum,
  standardCode: z.string(),
  standardTitle: z.string(),
  description: z.string(),
  measurableElementsCount: z.number(),
  complianceScorePct: z.number(),
  status: z.enum(['FULLY_COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'UNDER_AUDIT']),
  assignedLead: z.string(),
  lastAuditDate: z.string()
});
export type QualityStandardDto = z.infer<typeof QualityStandardDtoSchema>;

export const HospitalIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  incidentNumber: z.string(),
  category: IncidentCategoryEnum,
  sacScore: SacScoreEnum,
  status: IncidentStatusEnum,
  patientInvolved: z.boolean(),
  patientMrn: z.string().nullable().optional(),
  patientName: z.string().nullable().optional(),
  departmentName: z.string(),
  locationDetail: z.string(),
  incidentDateTime: z.string(),
  reportedByStaff: z.string(),
  reportedByRole: z.string(),
  briefSummary: z.string(),
  detailedDescription: z.string(),
  immediateActionTaken: z.string(),
  patientHarmLevel: z.enum(['NO_HARM_NEAR_MISS', 'MILD_TRANSIENT_HARM', 'MODERATE_PROLONGED_HOSPITALIZATION', 'SEVERE_PERMANENT_HARM', 'SENTINEL_DEATH']),
  isSentinelEvent: z.boolean(),
  investigatingQualityOfficer: z.string().nullable().optional(),
  rcaRequired: z.boolean(),
  closedAt: z.string().nullable().optional(),
  createdAt: z.string()
});
export type HospitalIncidentDto = z.infer<typeof HospitalIncidentDtoSchema>;

export const IncidentRcaDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  rcaCode: z.string(),
  incidentId: z.string().uuid(),
  incidentNumber: z.string(),
  leadInvestigator: z.string(),
  investigationTeam: z.array(z.string()),
  fiveWhysAnalysis: z.array(z.object({
    step: z.number(),
    whyQuestion: z.string(),
    becauseAnswer: z.string()
  })),
  fishboneCategories: z.object({
    people: z.array(z.string()),
    process: z.array(z.string()),
    equipment: z.array(z.string()),
    environment: z.array(z.string()),
    management: z.array(z.string())
  }),
  rootCauseStatement: z.string(),
  contributingFactors: z.string(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'APPROVED_BY_COMMITTEE']),
  completedDate: z.string().nullable().optional(),
  createdAt: z.string()
});
export type IncidentRcaDto = z.infer<typeof IncidentRcaDtoSchema>;

export const QualityCapaDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  capaCode: z.string(),
  incidentId: z.string().uuid().nullable().optional(),
  incidentNumber: z.string().nullable().optional(),
  title: z.string(),
  actionDescription: z.string(),
  actionType: z.enum(['CORRECTIVE', 'PREVENTIVE', 'SYSTEMIC_REDESIGN']),
  assignedOwner: z.string(),
  targetCompletionDate: z.string(),
  verificationMetric: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED_EFFECTIVE', 'OVERDUE']),
  completedDate: z.string().nullable().optional(),
  verifiedBy: z.string().nullable().optional(),
  verifiedDate: z.string().nullable().optional(),
  createdAt: z.string()
});
export type QualityCapaDto = z.infer<typeof QualityCapaDtoSchema>;

export const HaiSurveillanceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  surveillanceCode: z.string(),
  patientId: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  departmentName: z.string(),
  haiType: HaiTypeEnum,
  diagnosisDate: z.string(),
  pathogenIsolated: z.string(),
  antibioticSensitivity: z.string(),
  invasiveDeviceName: z.string(),
  deviceInsertionDate: z.string(),
  deviceDaysAtInfection: z.number(),
  hicInterventionTaken: z.string(),
  outcomeStatus: z.enum(['RESOLVED', 'ONGOING_TREATMENT', 'TRANSFERRED', 'DECEASED']),
  reportedToInfectionControlCommittee: z.boolean(),
  createdAt: z.string()
});
export type HaiSurveillanceDto = z.infer<typeof HaiSurveillanceDtoSchema>;

export const HaiDeviceDaysDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  departmentName: z.string(),
  monthYear: z.string(),
  centralLineDays: z.number(),
  clabsiCount: z.number(),
  clabsiRatePer1000Days: z.number(),
  urinaryCatheterDays: z.number(),
  cautiCount: z.number(),
  cautiRatePer1000Days: z.number(),
  ventilatorDays: z.number(),
  vapCount: z.number(),
  vapRatePer1000Days: z.number(),
  surgicalProceduresCount: z.number(),
  ssiCount: z.number(),
  ssiPercentage: z.number()
});
export type HaiDeviceDaysDto = z.infer<typeof HaiDeviceDaysDtoSchema>;

export const PatientIsolationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  isolationCode: z.string(),
  patientMrn: z.string(),
  patientName: z.string(),
  departmentName: z.string(),
  roomBedNumber: z.string(),
  precautionType: IsolationPrecautionTypeEnum,
  indicatedReasonOrPathogen: z.string(), // e.g. "MRSA in Sputum", "Open TB"
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  assignedNurseLead: z.string(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type PatientIsolationDto = z.infer<typeof PatientIsolationDtoSchema>;

export const HandHygieneAuditDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  auditCode: z.string(),
  auditDate: z.string(),
  departmentName: z.string(),
  staffCategory: z.enum(['DOCTOR', 'NURSE', 'ALLIED_HEALTH', 'HOUSEKEEPING', 'WARD_ASSISTANT']),
  whoMoment: HandHygieneMomentEnum,
  actionTaken: z.enum(['RUB_PERFORMED', 'WASH_PERFORMED', 'MISSED_OPPORTUNITY']),
  isCompliant: z.boolean(),
  auditedByOfficer: z.string(),
  notes: z.string().nullable().optional()
});
export type HandHygieneAuditDto = z.infer<typeof HandHygieneAuditDtoSchema>;

export const EnvironmentalMicroSwabDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  sampleNumber: z.string(),
  sampleType: SwabSampleTypeEnum,
  locationDescription: z.string(), // e.g. "OT-1 Air Settle Plate", "RO Water Dialysis Port"
  collectionDate: z.string(),
  collectedBy: z.string(),
  cfuCountPerPlateOrMl: z.number(),
  pathogensFound: z.string(),
  permissibleThreshold: z.string(),
  resultStatus: z.enum(['SATISFACTORY_PASS', 'ALERT_THRESHOLD_EXCEEDED', 'UNSATISFACTORY_ACTION_REQUIRED']),
  correctiveFoggingDone: z.boolean(),
  microbiologistSignOff: z.string(),
  createdAt: z.string()
});
export type EnvironmentalMicroSwabDto = z.infer<typeof EnvironmentalMicroSwabDtoSchema>;

export const NeedleStickOccupationalLogDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  incidentCode: z.string(),
  exposedStaffName: z.string(),
  staffRole: z.string(),
  departmentName: z.string(),
  exposureDateTime: z.string(),
  sourcePatientKnown: z.boolean(),
  sourcePatientHivStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  sourcePatientHbsAgStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  sourcePatientHcvStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  pepInitiatedWithinGoldenHour: z.boolean(),
  pepRegimenDetails: z.string(),
  followUpSerologyDue: z.string(),
  counselorName: z.string(),
  createdAt: z.string()
});
export type NeedleStickOccupationalLogDto = z.infer<typeof NeedleStickOccupationalLogDtoSchema>;

export const BiomedicalWasteLogDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  logDate: z.string(),
  departmentName: z.string(),
  yellowBagWeightKg: z.number(),
  redBagWeightKg: z.number(),
  whiteTranslucentWeightKg: z.number(),
  blueBagWeightKg: z.number(),
  totalDailyWeightKg: z.number(),
  pcbManifestBarcode: z.string(),
  handedOverToVendorName: z.string(),
  hospitalSupervisorName: z.string()
});
export type BiomedicalWasteLogDto = z.infer<typeof BiomedicalWasteLogDtoSchema>;

export const QualityOverviewMetricsDtoSchema = z.object({
  overallNabhCompliancePct: z.number(),
  openIncidentsCount: z.number(),
  sentinelEventsCount: z.number(),
  clabsiRateFleet: z.number(),
  cautiRateFleet: z.number(),
  vapRateFleet: z.number(),
  ssiRateFleetPct: z.number(),
  handHygieneCompliancePct: z.number(),
  activeIsolatedPatientsCount: z.number(),
  openCapaActionsCount: z.number(),
  overdueCapaCount: z.number(),
  satisfactorySwabsRatePct: z.number()
});
export type QualityOverviewMetricsDto = z.infer<typeof QualityOverviewMetricsDtoSchema>;

export const QualityAuditTraceDtoSchema = z.object({
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
export type QualityAuditTraceDto = z.infer<typeof QualityAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const ReportHospitalIncidentRequestSchema = z.object({
  category: IncidentCategoryEnum,
  sacScore: SacScoreEnum,
  patientInvolved: z.boolean(),
  patientMrn: z.string().optional(),
  patientName: z.string().optional(),
  departmentName: z.string(),
  locationDetail: z.string(),
  incidentDateTime: z.string(),
  reportedByStaff: z.string(),
  reportedByRole: z.string(),
  briefSummary: z.string(),
  detailedDescription: z.string(),
  immediateActionTaken: z.string(),
  patientHarmLevel: z.enum(['NO_HARM_NEAR_MISS', 'MILD_TRANSIENT_HARM', 'MODERATE_PROLONGED_HOSPITALIZATION', 'SEVERE_PERMANENT_HARM', 'SENTINEL_DEATH']),
  isSentinelEvent: z.boolean()
});
export type ReportHospitalIncidentRequest = z.infer<typeof ReportHospitalIncidentRequestSchema>;

export const TriageIncidentRequestSchema = z.object({
  sacScore: SacScoreEnum,
  investigatingQualityOfficer: z.string(),
  rcaRequired: z.boolean()
});
export type TriageIncidentRequest = z.infer<typeof TriageIncidentRequestSchema>;

export const CreateIncidentRcaRequestSchema = z.object({
  incidentId: z.string().uuid(),
  leadInvestigator: z.string(),
  investigationTeam: z.array(z.string()),
  fiveWhysAnalysis: z.array(z.object({
    step: z.number(),
    whyQuestion: z.string(),
    becauseAnswer: z.string()
  })),
  fishboneCategories: z.object({
    people: z.array(z.string()),
    process: z.array(z.string()),
    equipment: z.array(z.string()),
    environment: z.array(z.string()),
    management: z.array(z.string())
  }),
  rootCauseStatement: z.string(),
  contributingFactors: z.string()
});
export type CreateIncidentRcaRequest = z.infer<typeof CreateIncidentRcaRequestSchema>;

export const CreateQualityCapaRequestSchema = z.object({
  incidentId: z.string().uuid().optional(),
  title: z.string(),
  actionDescription: z.string(),
  actionType: z.enum(['CORRECTIVE', 'PREVENTIVE', 'SYSTEMIC_REDESIGN']),
  assignedOwner: z.string(),
  targetCompletionDate: z.string(),
  verificationMetric: z.string()
});
export type CreateQualityCapaRequest = z.infer<typeof CreateQualityCapaRequestSchema>;

export const VerifyQualityCapaRequestSchema = z.object({
  verifiedBy: z.string(),
  isEffective: z.boolean()
});
export type VerifyQualityCapaRequest = z.infer<typeof VerifyQualityCapaRequestSchema>;

export const LogHaiCaseRequestSchema = z.object({
  patientId: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  departmentName: z.string(),
  haiType: HaiTypeEnum,
  diagnosisDate: z.string(),
  pathogenIsolated: z.string(),
  antibioticSensitivity: z.string(),
  invasiveDeviceName: z.string(),
  deviceInsertionDate: z.string(),
  deviceDaysAtInfection: z.number(),
  hicInterventionTaken: z.string()
});
export type LogHaiCaseRequest = z.infer<typeof LogHaiCaseRequestSchema>;

export const AssignPatientIsolationRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  departmentName: z.string(),
  roomBedNumber: z.string(),
  precautionType: IsolationPrecautionTypeEnum,
  indicatedReasonOrPathogen: z.string(),
  assignedNurseLead: z.string()
});
export type AssignPatientIsolationRequest = z.infer<typeof AssignPatientIsolationRequestSchema>;

export const RecordHandHygieneAuditRequestSchema = z.object({
  departmentName: z.string(),
  staffCategory: z.enum(['DOCTOR', 'NURSE', 'ALLIED_HEALTH', 'HOUSEKEEPING', 'WARD_ASSISTANT']),
  whoMoment: HandHygieneMomentEnum,
  actionTaken: z.enum(['RUB_PERFORMED', 'WASH_PERFORMED', 'MISSED_OPPORTUNITY']),
  auditedByOfficer: z.string(),
  notes: z.string().optional()
});
export type RecordHandHygieneAuditRequest = z.infer<typeof RecordHandHygieneAuditRequestSchema>;

export const RecordEnvironmentalSwabRequestSchema = z.object({
  sampleType: SwabSampleTypeEnum,
  locationDescription: z.string(),
  collectionDate: z.string(),
  collectedBy: z.string(),
  cfuCountPerPlateOrMl: z.number(),
  pathogensFound: z.string(),
  permissibleThreshold: z.string(),
  resultStatus: z.enum(['SATISFACTORY_PASS', 'ALERT_THRESHOLD_EXCEEDED', 'UNSATISFACTORY_ACTION_REQUIRED']),
  correctiveFoggingDone: z.boolean(),
  microbiologistSignOff: z.string()
});
export type RecordEnvironmentalSwabRequest = z.infer<typeof RecordEnvironmentalSwabRequestSchema>;

export const RecordNeedleStickLogRequestSchema = z.object({
  exposedStaffName: z.string(),
  staffRole: z.string(),
  departmentName: z.string(),
  exposureDateTime: z.string(),
  sourcePatientKnown: z.boolean(),
  sourcePatientHivStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  sourcePatientHbsAgStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  sourcePatientHcvStatus: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']),
  pepInitiatedWithinGoldenHour: z.boolean(),
  pepRegimenDetails: z.string(),
  followUpSerologyDue: z.string(),
  counselorName: z.string()
});
export type RecordNeedleStickLogRequest = z.infer<typeof RecordNeedleStickLogRequestSchema>;

export const RecordBmwLogRequestSchema = z.object({
  logDate: z.string(),
  departmentName: z.string(),
  yellowBagWeightKg: z.number(),
  redBagWeightKg: z.number(),
  whiteTranslucentWeightKg: z.number(),
  blueBagWeightKg: z.number(),
  pcbManifestBarcode: z.string(),
  handedOverToVendorName: z.string(),
  hospitalSupervisorName: z.string()
});
export type RecordBmwLogRequest = z.infer<typeof RecordBmwLogRequestSchema>;
