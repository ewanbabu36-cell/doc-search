import { z } from 'zod';

/**
 * Phase 2.6 Enums: Clinical Consultation & Medical Documentation (EMR)
 */

export const ConsultationStatusEnum = z.enum([
  'DRAFT',
  'STARTED',
  'IN_PROGRESS',
  'READY_FOR_COMPLETION',
  'COMPLETED',
  'CANCELLED'
]);
export type ConsultationStatus = z.infer<typeof ConsultationStatusEnum>;

export const ClinicalConsultationTypeEnum = z.enum([
  'OPD_CONSULTATION',
  'TELECONSULTATION',
  'EMERGENCY_EVALUATION',
  'FOLLOW_UP_REVIEW',
  'INPATIENT_ROUNDS'
]);
export type ClinicalConsultationType = z.infer<typeof ClinicalConsultationTypeEnum>;

export const DiagnosisTypeEnum = z.enum([
  'PRIMARY',
  'SECONDARY',
  'DIFFERENTIAL',
  'PROVISIONAL'
]);
export type DiagnosisType = z.infer<typeof DiagnosisTypeEnum>;

export const DiagnosisClinicalStatusEnum = z.enum([
  'ACTIVE',
  'RESOLVED',
  'CHRONIC',
  'INACTIVE'
]);
export type DiagnosisClinicalStatus = z.infer<typeof DiagnosisClinicalStatusEnum>;

export const DiagnosisCertaintyEnum = z.enum([
  'CONFIRMED',
  'SUSPECTED',
  'RULED_OUT'
]);
export type DiagnosisCertainty = z.infer<typeof DiagnosisCertaintyEnum>;

export const MedicationRouteEnum = z.enum([
  'ORAL',
  'INHALATION',
  'TOPICAL',
  'INTRAVENOUS',
  'SUBCUTANEOUS',
  'OPHTHALMIC',
  'OTIC'
]);
export type MedicationRoute = z.infer<typeof MedicationRouteEnum>;

export const MedicationFoodRelationEnum = z.enum([
  'BEFORE_FOOD',
  'AFTER_FOOD',
  'WITH_FOOD',
  'ANYTIME'
]);
export type MedicationFoodRelation = z.infer<typeof MedicationFoodRelationEnum>;

export const MedicationStatusEnum = z.enum([
  'ACTIVE',
  'DISCONTINUED',
  'COMPLETED',
  'CANCELLED'
]);
export type MedicationStatus = z.infer<typeof MedicationStatusEnum>;

export const InstructionPriorityEnum = z.enum([
  'ROUTINE',
  'IMPORTANT',
  'CRITICAL'
]);
export type InstructionPriority = z.infer<typeof InstructionPriorityEnum>;

export const FollowUpStatusEnum = z.enum([
  'PENDING',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED'
]);
export type FollowUpStatus = z.infer<typeof FollowUpStatusEnum>;

export const ConsultationAuditOperationStatusEnum = z.enum(['SUCCESS', 'FAILURE', 'DENIED']);
export type ConsultationAuditOperationStatus = z.infer<typeof ConsultationAuditOperationStatusEnum>;

/**
 * Phase 2.6 DTOs
 */

export const ConsultationVitalsDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientId: z.string().uuid(),
  temperatureCelsius: z.string().optional(),
  pulseBpm: z.number().int().optional(),
  respiratoryRateBpm: z.number().int().optional(),
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  oxygenSaturationPercent: z.number().int().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  bmi: z.string().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  clinicalNotes: z.string().optional(),
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationVitalsDto = z.infer<typeof ConsultationVitalsDtoSchema>;

export const ConsultationExaminationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  generalAppearance: z.string().optional(),
  cardiovascular: z.string().optional(),
  respiratory: z.string().optional(),
  abdomen: z.string().optional(),
  neurological: z.string().optional(),
  musculoskeletal: z.string().optional(),
  skin: z.string().optional(),
  ent: z.string().optional(),
  eyes: z.string().optional(),
  otherFindings: z.string().optional(),
  freeTextFindings: z.string().optional(),
  examinedBy: z.string().min(1),
  examinedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationExaminationDto = z.infer<typeof ConsultationExaminationDtoSchema>;

export const ConsultationDiagnosisDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientId: z.string().uuid(),
  diagnosisCode: z.string().min(1),
  diagnosisName: z.string().min(1),
  diagnosisType: DiagnosisTypeEnum,
  clinicalStatus: DiagnosisClinicalStatusEnum,
  certainty: DiagnosisCertaintyEnum,
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationDiagnosisDto = z.infer<typeof ConsultationDiagnosisDtoSchema>;

export const ConsultationMedicationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientId: z.string().uuid(),
  medicationName: z.string().min(1),
  genericName: z.string().optional(),
  strength: z.string().min(1),
  dosage: z.string().min(1),
  route: MedicationRouteEnum,
  frequency: z.string().min(1),
  duration: z.number().int().positive(),
  durationUnit: z.string().min(1).default('DAYS'),
  quantity: z.number().int().positive().default(1),
  instructions: z.string().optional(),
  beforeAfterFood: MedicationFoodRelationEnum.default('AFTER_FOOD'),
  asNeeded: z.boolean().default(false),
  indication: z.string().optional(),
  status: MedicationStatusEnum.default('ACTIVE'),
  prescribedBy: z.string().min(1),
  prescribedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationMedicationDto = z.infer<typeof ConsultationMedicationDtoSchema>;

export const ConsultationInstructionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientInstruction: z.string().optional(),
  dietInstruction: z.string().optional(),
  activityInstruction: z.string().optional(),
  warningSignInstruction: z.string().optional(),
  homeCareInstruction: z.string().optional(),
  followUpInstruction: z.string().optional(),
  instructionPriority: InstructionPriorityEnum.default('ROUTINE'),
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationInstructionDto = z.infer<typeof ConsultationInstructionDtoSchema>;

export const ConsultationFollowUpDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientId: z.string().uuid(),
  followUpRequired: z.boolean().default(true),
  recommendedDate: z.string().optional(),
  recommendedWindow: z.string().optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  status: FollowUpStatusEnum.default('PENDING'),
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationFollowUpDto = z.infer<typeof ConsultationFollowUpDtoSchema>;

export const ConsultationAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  action: z.string().min(1),
  targetEntity: z.string().min(1),
  targetEntityId: z.string().min(1),
  previousSnapshot: z.record(z.unknown()).optional(),
  newSnapshot: z.record(z.unknown()).optional(),
  justification: z.string().min(1),
  operationStatus: ConsultationAuditOperationStatusEnum.default('SUCCESS'),
  correlationId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime()
});
export type ConsultationAuditTraceDto = z.infer<typeof ConsultationAuditTraceDtoSchema>;

export const ConsultationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  patientId: z.string().uuid(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  patientDob: z.string().optional(),
  patientGender: z.string().optional(),
  patientMobile: z.string().optional(),
  patientAllergies: z.array(z.string()).default([]),
  encounterId: z.string().uuid(),
  encounterNumber: z.string().min(1),
  encounterType: z.string().min(1),
  queueToken: z.string().optional(),
  doctorId: z.string().uuid(),
  doctorName: z.string().min(1),
  doctorSpecialty: z.string().min(1),
  consultationNumber: z.string().min(1),
  consultationStatus: ConsultationStatusEnum,
  consultationType: ClinicalConsultationTypeEnum,
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  chiefComplaint: z.string().min(1),
  historyOfPresentIllness: z.string().optional(),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  allergySummary: z.string().optional(),
  medicationHistory: z.string().optional(),
  examinationSummary: z.string().optional(),
  clinicalAssessment: z.string().optional(),
  treatmentPlan: z.string().optional(),
  patientInstructions: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().optional(),
  version: z.number().int().default(1),
  isAmended: z.boolean().default(false),
  amendmentReason: z.string().optional(),
  vitals: ConsultationVitalsDtoSchema.optional(),
  examination: ConsultationExaminationDtoSchema.optional(),
  diagnoses: z.array(ConsultationDiagnosisDtoSchema).default([]),
  medications: z.array(ConsultationMedicationDtoSchema).default([]),
  instructions: ConsultationInstructionDtoSchema.optional(),
  followUp: ConsultationFollowUpDtoSchema.optional(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationDto = z.infer<typeof ConsultationDtoSchema>;

export const ConsultationOverviewDtoSchema = z.object({
  totalConsultationsCount: z.number().int().nonnegative(),
  activeConsultationsCount: z.number().int().nonnegative(),
  draftConsultationsCount: z.number().int().nonnegative(),
  inProgressConsultationsCount: z.number().int().nonnegative(),
  completedTodayCount: z.number().int().nonnegative(),
  followUpsRequiredCount: z.number().int().nonnegative(),
  uncompletedNotesCount: z.number().int().nonnegative(),
  amendedCount: z.number().int().nonnegative()
});
export type ConsultationOverviewDto = z.infer<typeof ConsultationOverviewDtoSchema>;

/**
 * Phase 2.6 Mutation Requests
 */

export const CreateConsultationSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  encounterId: z.string().uuid(),
  doctorId: z.string().uuid(),
  consultationType: ClinicalConsultationTypeEnum.default('OPD_CONSULTATION'),
  chiefComplaint: z.string().min(1),
  historyOfPresentIllness: z.string().optional(),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  allergySummary: z.string().optional(),
  medicationHistory: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Initialized new clinical consultation')
});
export type CreateConsultationRequest = z.infer<typeof CreateConsultationSchema>;

export const StartConsultationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Started clinician consultation session')
});
export type StartConsultationRequest = z.infer<typeof StartConsultationSchema>;

export const SaveConsultationDraftSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  chiefComplaint: z.string().min(1).optional(),
  historyOfPresentIllness: z.string().optional(),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  allergySummary: z.string().optional(),
  medicationHistory: z.string().optional(),
  examinationSummary: z.string().optional(),
  clinicalAssessment: z.string().optional(),
  treatmentPlan: z.string().optional(),
  patientInstructions: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Saved in-progress consultation draft')
});
export type SaveConsultationDraftRequest = z.infer<typeof SaveConsultationDraftSchema>;

export const AddConsultationVitalsSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  temperatureCelsius: z.string().optional(),
  pulseBpm: z.number().int().optional(),
  respiratoryRateBpm: z.number().int().optional(),
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  oxygenSaturationPercent: z.number().int().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  bmi: z.string().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  clinicalNotes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Recorded consultation clinical observations & vitals')
});
export type AddConsultationVitalsRequest = z.infer<typeof AddConsultationVitalsSchema>;

export const AddExaminationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  generalAppearance: z.string().optional(),
  cardiovascular: z.string().optional(),
  respiratory: z.string().optional(),
  abdomen: z.string().optional(),
  neurological: z.string().optional(),
  musculoskeletal: z.string().optional(),
  skin: z.string().optional(),
  ent: z.string().optional(),
  eyes: z.string().optional(),
  otherFindings: z.string().optional(),
  freeTextFindings: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Recorded system-by-system clinical examination findings')
});
export type AddExaminationRequest = z.infer<typeof AddExaminationSchema>;

export const AddDiagnosisSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  diagnosisCode: z.string().min(1),
  diagnosisName: z.string().min(1),
  diagnosisType: DiagnosisTypeEnum.default('PRIMARY'),
  clinicalStatus: DiagnosisClinicalStatusEnum.default('ACTIVE'),
  certainty: DiagnosisCertaintyEnum.default('CONFIRMED'),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Added clinical diagnosis to consultation')
});
export type AddDiagnosisRequest = z.infer<typeof AddDiagnosisSchema>;

export const UpdateDiagnosisSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  diagnosisId: z.string().uuid(),
  diagnosisCode: z.string().min(1).optional(),
  diagnosisName: z.string().min(1).optional(),
  diagnosisType: DiagnosisTypeEnum.optional(),
  clinicalStatus: DiagnosisClinicalStatusEnum.optional(),
  certainty: DiagnosisCertaintyEnum.optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Updated clinical diagnosis')
});
export type UpdateDiagnosisRequest = z.infer<typeof UpdateDiagnosisSchema>;

export const RemoveDiagnosisSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  diagnosisId: z.string().uuid(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type RemoveDiagnosisRequest = z.infer<typeof RemoveDiagnosisSchema>;

export const AddMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  medicationName: z.string().min(1),
  genericName: z.string().optional(),
  strength: z.string().min(1),
  dosage: z.string().min(1),
  route: MedicationRouteEnum.default('ORAL'),
  frequency: z.string().min(1),
  duration: z.number().int().positive(),
  durationUnit: z.string().min(1).default('DAYS'),
  quantity: z.number().int().positive().default(1),
  instructions: z.string().optional(),
  beforeAfterFood: MedicationFoodRelationEnum.default('AFTER_FOOD'),
  asNeeded: z.boolean().default(false),
  indication: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Prescribed clinical medication')
});
export type AddMedicationRequest = z.infer<typeof AddMedicationSchema>;

export const UpdateMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationName: z.string().min(1).optional(),
  genericName: z.string().optional(),
  strength: z.string().min(1).optional(),
  dosage: z.string().min(1).optional(),
  route: MedicationRouteEnum.optional(),
  frequency: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  durationUnit: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  instructions: z.string().optional(),
  beforeAfterFood: MedicationFoodRelationEnum.optional(),
  asNeeded: z.boolean().optional(),
  indication: z.string().optional(),
  status: MedicationStatusEnum.optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Updated medication order details')
});
export type UpdateMedicationRequest = z.infer<typeof UpdateMedicationSchema>;

export const DiscontinueMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  medicationId: z.string().uuid(),
  discontinueReason: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type DiscontinueMedicationRequest = z.infer<typeof DiscontinueMedicationSchema>;

export const AddInstructionSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  patientInstruction: z.string().optional(),
  dietInstruction: z.string().optional(),
  activityInstruction: z.string().optional(),
  warningSignInstruction: z.string().optional(),
  homeCareInstruction: z.string().optional(),
  followUpInstruction: z.string().optional(),
  instructionPriority: InstructionPriorityEnum.default('ROUTINE'),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Documented clinical instructions & home care advice')
});
export type AddInstructionRequest = z.infer<typeof AddInstructionSchema>;

export const CreateFollowUpPlanSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  followUpRequired: z.boolean().default(true),
  recommendedDate: z.string().optional(),
  recommendedWindow: z.string().optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Created follow-up clinical recommendation')
});
export type CreateFollowUpPlanRequest = z.infer<typeof CreateFollowUpPlanSchema>;

export const CompleteConsultationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  clinicalAssessment: z.string().min(1),
  treatmentPlan: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1).default('Completed clinical consultation and finalized EMR record')
});
export type CompleteConsultationRequest = z.infer<typeof CompleteConsultationSchema>;

export const AmendConsultationSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid(),
  amendmentReason: z.string().min(1),
  amendedAssessment: z.string().optional(),
  amendedPlan: z.string().optional(),
  additionalNotes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type AmendConsultationRequest = z.infer<typeof AmendConsultationSchema>;

export const QueryConsultationSchema = z.object({
  tenantId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  consultationStatus: ConsultationStatusEnum.optional(),
  consultationType: ClinicalConsultationTypeEnum.optional(),
  searchTerm: z.string().optional()
});
export type QueryConsultationRequest = z.infer<typeof QueryConsultationSchema>;

export const QueryConsultationAuditSchema = z.object({
  tenantId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  actorId: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().max(100).default(50)
});
export type QueryConsultationAuditRequest = z.infer<typeof QueryConsultationAuditSchema>;
