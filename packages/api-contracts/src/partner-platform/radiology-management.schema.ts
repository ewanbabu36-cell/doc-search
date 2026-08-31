import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const RADIOLOGY_MODALITIES = [
  'X_RAY_DIGITAL_RADIOGRAPHY',
  'COMPUTED_TOMOGRAPHY_CT',
  'MAGNETIC_RESONANCE_IMAGING_MRI',
  'ULTRASOUND_SONOGRAPHY_USG',
  'MAMMOGRAPHY_DIGITAL',
  'FLUOROSCOPY',
  'POSITRON_EMISSION_TOMOGRAPHY_PET_CT',
  'NUCLEAR_MEDICINE_SPECT',
  'PORTABLE_BEDSIDE_X_RAY',
  'INTERVENTIONAL_RADIOLOGY_C_ARM'
] as const;
export type RadiologyModalityType = (typeof RADIOLOGY_MODALITIES)[number];

export const MODALITY_STATUSES = [
  'AVAILABLE',
  'BUSY',
  'MAINTENANCE',
  'OFFLINE',
  'RESERVED'
] as const;
export type ModalityStatus = (typeof MODALITY_STATUSES)[number];

export const RADIOLOGY_ORDER_STATUSES = [
  'DRAFT',
  'ORDERED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REPORTED',
  'VERIFIED'
] as const;
export type RadiologyOrderStatus = (typeof RADIOLOGY_ORDER_STATUSES)[number];

export const RADIOLOGY_PRIORITIES = [
  'ROUTINE_ELECTIVE',
  'URGENT_WITHIN_4_HOURS',
  'STAT_EMERGENCY_IMMEDIATE'
] as const;
export type RadiologyPriority = (typeof RADIOLOGY_PRIORITIES)[number];

export const RADIOLOGY_REPORT_STATUSES = [
  'DRAFT',
  'DICTATED',
  'REVIEW',
  'FINALIZED',
  'AMENDED'
] as const;
export type RadiologyReportStatus = (typeof RADIOLOGY_REPORT_STATUSES)[number];

export const CRITICAL_FINDING_SEVERITIES = [
  'CRITICAL_IMMEDIATE_LIFE_THREATENING',
  'URGENT_UNEXPECTED_HIGH_RISK',
  'SIGNIFICANT_NON_URGENT'
] as const;
export type CriticalFindingSeverity = (typeof CRITICAL_FINDING_SEVERITIES)[number];

export const CRITICAL_FINDING_STATUSES = [
  'FLAGGED_PENDING_NOTIFICATION',
  'NOTIFIED_AWAITING_ACKNOWLEDGEMENT',
  'ACKNOWLEDGED_BY_CLINICIAN',
  'ESCALATED_TO_DEPARTMENT_HEAD'
] as const;
export type CriticalFindingStatus = (typeof CRITICAL_FINDING_STATUSES)[number];

// ============================================================================
// DTOs & SCHEMAS
// ============================================================================

export const RadiologyDepartmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  departmentCode: z.string(),
  departmentName: z.string(),
  hodRadiologistName: z.string(),
  chiefTechnologistName: z.string(),
  locationDescription: z.string(),
  totalModalitiesCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type RadiologyDepartmentDto = z.infer<typeof RadiologyDepartmentSchema>;

export const RadiologyModalitySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  modalityCode: z.string(),
  modalityName: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  roomNumber: z.string(),
  manufacturerAndModel: z.string(),
  aetitle: z.string(),
  ipAddress: z.string(),
  dicomPort: z.number().int(),
  status: z.enum(MODALITY_STATUSES),
  isAvailable: z.boolean(),
  lastCalibrationDate: z.string().optional(),
  createdAt: z.string()
});
export type RadiologyModalityDto = z.infer<typeof RadiologyModalitySchema>;

export const RadiologyProcedureCatalogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  procedureCode: z.string(),
  procedureName: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  bodyPart: z.string(),
  requiresContrast: z.boolean(),
  estimatedDurationMinutes: z.number().int().positive(),
  preparationInstructions: z.string(),
  cptCodeReference: z.string().optional(),
  priceAmount: z.number().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type RadiologyProcedureCatalogDto = z.infer<typeof RadiologyProcedureCatalogSchema>;

export const RadiologyOrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  orderNumber: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string(),
  orderingDoctorName: z.string(),
  orderingDepartment: z.string(),
  procedureId: z.string(),
  procedureName: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  priority: z.enum(RADIOLOGY_PRIORITIES),
  clinicalIndication: z.string(),
  requiresContrast: z.boolean(),
  pregnancyScreeningResult: z.string().optional(),
  renalEgfrResult: z.string().optional(),
  knownAllergies: z.string().optional(),
  status: z.enum(RADIOLOGY_ORDER_STATUSES),
  scheduledTime: z.string().optional(),
  orderedAt: z.string()
});
export type RadiologyOrderDto = z.infer<typeof RadiologyOrderSchema>;

export const RadiologyAppointmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  appointmentCode: z.string(),
  orderId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  modalityId: z.string(),
  modalityName: z.string(),
  roomNumber: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  assignedTechnologistName: z.string(),
  status: z.enum(['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  notes: z.string().optional(),
  createdAt: z.string()
});
export type RadiologyAppointmentDto = z.infer<typeof RadiologyAppointmentSchema>;

export const RadiologyPreparationRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  preparationCode: z.string(),
  orderId: z.string(),
  patientName: z.string(),
  fastingConfirmed: z.boolean(),
  mriMetalScreeningCleared: z.boolean(),
  pregnancyStatusConfirmedNegative: z.boolean(),
  renalEgfrAdequate: z.boolean(),
  ivCannulaSecured: z.boolean(),
  informedConsentSigned: z.boolean(),
  preparationNurseName: z.string(),
  isReadyForScan: z.boolean(),
  checkedAt: z.string()
});
export type RadiologyPreparationRecordDto = z.infer<typeof RadiologyPreparationRecordSchema>;

export const RadiologyStudySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  studyInstanceUid: z.string(),
  accessionNumber: z.string(),
  orderId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  studyDescription: z.string(),
  studyDateTime: z.string(),
  seriesCount: z.number().int().positive(),
  instancesCount: z.number().int().positive(),
  radiationDoseDlpMgyCm: z.number().nonnegative().optional(),
  contrastAdministeredMl: z.number().nonnegative().optional(),
  technologistName: z.string(),
  pacsViewerUrl: z.string(),
  pacsSyncStatus: z.enum(['SYNCED', 'PENDING', 'FAILED']),
  status: z.enum(['ACQUIRED', 'REPORTING_IN_PROGRESS', 'REPORTED', 'VERIFIED']),
  createdAt: z.string()
});
export type RadiologyStudyDto = z.infer<typeof RadiologyStudySchema>;

export const RadiologyReportSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  reportNumber: z.string(),
  studyId: z.string(),
  orderId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  procedureName: z.string(),
  clinicalHistory: z.string(),
  imagingTechnique: z.string(),
  comparisonStudyReference: z.string().optional(),
  findings: z.string(),
  impression: z.string(),
  recommendations: z.string().optional(),
  hasCriticalFinding: z.boolean(),
  reportingRadiologistName: z.string(),
  verifyingRadiologistName: z.string().optional(),
  status: z.enum(RADIOLOGY_REPORT_STATUSES),
  version: z.number().int().positive(),
  finalizedAt: z.string().optional(),
  amendmentReason: z.string().optional(),
  createdAt: z.string()
});
export type RadiologyReportDto = z.infer<typeof RadiologyReportSchema>;

export const RadiologyCriticalFindingSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  alertCode: z.string(),
  reportId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  orderingDoctorName: z.string(),
  orderingDepartment: z.string(),
  findingDescription: z.string(),
  severity: z.enum(CRITICAL_FINDING_SEVERITIES),
  flaggedByRadiologist: z.string(),
  notifiedRecipient: z.string(),
  acknowledgedBy: z.string().optional(),
  acknowledgedTimestamp: z.string().optional(),
  status: z.enum(CRITICAL_FINDING_STATUSES),
  createdAt: z.string()
});
export type RadiologyCriticalFindingDto = z.infer<typeof RadiologyCriticalFindingSchema>;

export const RadiologyQualityEventSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  eventCode: z.string(),
  studyId: z.string(),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  eventType: z.enum(['REPEAT_EXPOSURE', 'MOTION_ARTIFACT', 'CONTRAST_EXTRAVASATION', 'EQUIPMENT_FAULT', 'PROTOCOL_DEVIATION']),
  reasonDescription: z.string(),
  technologistName: z.string(),
  correctiveActionTaken: z.string(),
  recordedAt: z.string()
});
export type RadiologyQualityEventDto = z.infer<typeof RadiologyQualityEventSchema>;

export const RadiologyAuditTraceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  traceNumber: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  justification: z.string(),
  ipAddress: z.string(),
  integrityHash: z.string(),
  previousHash: z.string(),
  newState: z.record(z.unknown()),
  timestamp: z.string()
});
export type RadiologyAuditTraceDto = z.infer<typeof RadiologyAuditTraceSchema>;

export const RadiologyOverviewMetricsSchema = z.object({
  todaysOrdersCount: z.number().int().nonnegative(),
  pendingStudiesCount: z.number().int().nonnegative(),
  completedScansCount: z.number().int().nonnegative(),
  pendingReportsCount: z.number().int().nonnegative(),
  criticalFindingsCount: z.number().int().nonnegative(),
  modalityOnlinePercent: z.number().nonnegative(),
  averageTurnaroundMinutes: z.number().nonnegative(),
  emergencyQueueCount: z.number().int().nonnegative()
});
export type RadiologyOverviewMetricsDto = z.infer<typeof RadiologyOverviewMetricsSchema>;

export const RadiologyAnalyticsSchema = z.object({
  studiesByModality: z.array(z.object({ modality: z.string(), count: z.number() })),
  reportsByRadiologist: z.array(z.object({ radiologist: z.string(), count: z.number() })),
  turnaroundTimeTrendHours: z.array(z.object({ date: z.string(), avgHours: z.number() })),
  qualityEventsByType: z.array(z.object({ type: z.string(), count: z.number() }))
});
export type RadiologyAnalyticsDto = z.infer<typeof RadiologyAnalyticsSchema>;

// ============================================================================
// MUTATION REQUEST SCHEMAS
// ============================================================================

export const CreateRadiologyOrderSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  patientId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  encounterId: z.string(),
  orderingDoctorName: z.string().min(1),
  orderingDepartment: z.string().min(1),
  procedureId: z.string(),
  procedureName: z.string().min(1),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  priority: z.enum(RADIOLOGY_PRIORITIES),
  clinicalIndication: z.string().min(1),
  requiresContrast: z.boolean(),
  pregnancyScreeningResult: z.string().optional(),
  renalEgfrResult: z.string().optional(),
  knownAllergies: z.string().optional()
});
export type CreateRadiologyOrderRequest = z.infer<typeof CreateRadiologyOrderSchema>;

export const ScheduleRadiologyStudySchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  orderId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  modalityId: z.string(),
  modalityName: z.string().min(1),
  roomNumber: z.string().min(1),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  assignedTechnologistName: z.string().min(1),
  notes: z.string().optional()
});
export type ScheduleRadiologyStudyRequest = z.infer<typeof ScheduleRadiologyStudySchema>;

export const RescheduleRadiologyStudySchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string(),
  newScheduledStart: z.string(),
  newScheduledEnd: z.string(),
  rescheduleReason: z.string().min(1),
  rescheduledByStaff: z.string().min(1)
});
export type RescheduleRadiologyStudyRequest = z.infer<typeof RescheduleRadiologyStudySchema>;

export const CancelRadiologyStudySchema = z.object({
  tenantId: z.string(),
  orderId: z.string(),
  cancellationReason: z.string().min(1),
  cancelledByStaff: z.string().min(1)
});
export type CancelRadiologyStudyRequest = z.infer<typeof CancelRadiologyStudySchema>;

export const RecordPreparationSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  orderId: z.string(),
  patientName: z.string().min(1),
  fastingConfirmed: z.boolean(),
  mriMetalScreeningCleared: z.boolean(),
  pregnancyStatusConfirmedNegative: z.boolean(),
  renalEgfrAdequate: z.boolean(),
  ivCannulaSecured: z.boolean(),
  informedConsentSigned: z.boolean(),
  preparationNurseName: z.string().min(1),
  isReadyForScan: z.boolean()
});
export type RecordPreparationRequest = z.infer<typeof RecordPreparationSchema>;

export const StartRadiologyProcedureSchema = z.object({
  tenantId: z.string(),
  orderId: z.string(),
  technologistName: z.string().min(1),
  modalityCode: z.string().min(1)
});
export type StartRadiologyProcedureRequest = z.infer<typeof StartRadiologyProcedureSchema>;

export const CompleteRadiologyProcedureSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  orderId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  studyDescription: z.string().min(1),
  seriesCount: z.number().int().positive(),
  instancesCount: z.number().int().positive(),
  radiationDoseDlpMgyCm: z.number().nonnegative().optional(),
  contrastAdministeredMl: z.number().nonnegative().optional(),
  technologistName: z.string().min(1)
});
export type CompleteRadiologyProcedureRequest = z.infer<typeof CompleteRadiologyProcedureSchema>;

export const CreateRadiologyReportSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  studyId: z.string(),
  orderId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  modalityType: z.enum(RADIOLOGY_MODALITIES),
  procedureName: z.string().min(1),
  clinicalHistory: z.string().min(1),
  imagingTechnique: z.string().min(1),
  comparisonStudyReference: z.string().optional(),
  findings: z.string().min(1),
  impression: z.string().min(1),
  recommendations: z.string().optional(),
  hasCriticalFinding: z.boolean(),
  reportingRadiologistName: z.string().min(1)
});
export type CreateRadiologyReportRequest = z.infer<typeof CreateRadiologyReportSchema>;

export const FinalizeRadiologyReportSchema = z.object({
  tenantId: z.string(),
  reportId: z.string(),
  verifyingRadiologistName: z.string().min(1)
});
export type FinalizeRadiologyReportRequest = z.infer<typeof FinalizeRadiologyReportSchema>;

export const AmendRadiologyReportSchema = z.object({
  tenantId: z.string(),
  reportId: z.string(),
  amendedFindings: z.string().min(1),
  amendedImpression: z.string().min(1),
  amendmentReason: z.string().min(1),
  reportingRadiologistName: z.string().min(1)
});
export type AmendRadiologyReportRequest = z.infer<typeof AmendRadiologyReportSchema>;

export const RecordCriticalFindingSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  reportId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  orderingDoctorName: z.string().min(1),
  orderingDepartment: z.string().min(1),
  findingDescription: z.string().min(1),
  severity: z.enum(CRITICAL_FINDING_SEVERITIES),
  flaggedByRadiologist: z.string().min(1),
  notifiedRecipient: z.string().min(1)
});
export type RecordCriticalFindingRequest = z.infer<typeof RecordCriticalFindingSchema>;

export const AcknowledgeCriticalFindingSchema = z.object({
  tenantId: z.string(),
  alertId: z.string(),
  acknowledgedByDoctor: z.string().min(1),
  clinicalActionNotes: z.string().min(1)
});
export type AcknowledgeCriticalFindingRequest = z.infer<typeof AcknowledgeCriticalFindingSchema>;

export const CreatePacsReferenceSchema = z.object({
  tenantId: z.string(),
  studyId: z.string(),
  pacsViewerUrl: z.string().min(1),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'FAILED'])
});
export type CreatePacsReferenceRequest = z.infer<typeof CreatePacsReferenceSchema>;
