import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const RECORD_COMPLETION_STATUSES = [
  'OPEN',
  'INCOMPLETE',
  'UNDER_REVIEW',
  'COMPLETED',
  'LOCKED'
] as const;
export type RecordCompletionStatus = (typeof RECORD_COMPLETION_STATUSES)[number];

export const ICD_CODE_TYPES = [
  'PRIMARY_DIAGNOSIS',
  'SECONDARY_DIAGNOSIS',
  'COMORBIDITY',
  'COMPLICATION',
  'EXTERNAL_CAUSE_OF_INJURY'
] as const;
export type ICDCodeType = (typeof ICD_CODE_TYPES)[number];

export const POA_INDICATORS = [
  'YES_PRESENT_ON_ADMISSION',
  'NO_NOT_PRESENT_ON_ADMISSION',
  'EXEMPT_FROM_POA_REPORTING',
  'DOCUMENTATION_INSUFFICIENT'
] as const;
export type POAIndicator = (typeof POA_INDICATORS)[number];

export const CODING_REVIEW_STATUSES = [
  'PENDING_INITIAL_CODE',
  'CODED_AWAITING_REVIEW',
  'UNDER_AUDIT_REVIEW',
  'APPROVED_FINALIZED',
  'REJECTED_NEEDS_CORRECTION'
] as const;
export type CodingReviewStatus = (typeof CODING_REVIEW_STATUSES)[number];

export const CLINICAL_QUERY_STATUSES = [
  'OPEN',
  'SENT_TO_CLINICIAN',
  'RESPONDED_BY_CLINICIAN',
  'RESOLVED',
  'CANCELLED'
] as const;
export type ClinicalQueryStatus = (typeof CLINICAL_QUERY_STATUSES)[number];

export const ROI_REQUEST_TYPES = [
  'PATIENT_SELF_REQUEST',
  'AUTHORIZED_REPRESENTATIVE',
  'LEGAL_SUBPOENA_COURT',
  'INSURANCE_TPA_AUDIT',
  'GOVERNMENT_REGULATORY_BODY',
  'EXTERNAL_HEALTHCARE_PROVIDER'
] as const;
export type ROIRequestType = (typeof ROI_REQUEST_TYPES)[number];

export const ROI_STATUSES = [
  'REQUESTED',
  'IDENTITY_VERIFIED',
  'UNDER_LEGAL_REVIEW',
  'APPROVED',
  'RECORD_PREPARED',
  'DISCLOSED_AND_RELEASED',
  'CLOSED',
  'REJECTED'
] as const;
export type ROIStatus = (typeof ROI_STATUSES)[number];

export const ARCHIVE_STORAGE_TYPES = [
  'DIGITAL_ONLY_EHR',
  'PHYSICAL_CHART_ROOM',
  'HYBRID_SCANNED_AND_PHYSICAL',
  'OFF_SITE_SECURE_VAULT'
] as const;
export type ArchiveStorageType = (typeof ARCHIVE_STORAGE_TYPES)[number];

export const LEGAL_HOLD_STATUSES = [
  'ACTIVE_LEGAL_HOLD',
  'UNDER_COURT_INSPECTION',
  'RELEASED_LEGAL_HOLD'
] as const;
export type LegalHoldStatus = (typeof LEGAL_HOLD_STATUSES)[number];

// ============================================================================
// DTOs & SCHEMAS
// ============================================================================

export const MRDepartmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  departmentCode: z.string(),
  departmentName: z.string(),
  headOfMrdName: z.string(),
  leadHIMOfficerName: z.string(),
  leadCodingAuditorName: z.string(),
  physicalVaultLocation: z.string(),
  totalIndexedRecords: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type MRDepartmentDto = z.infer<typeof MRDepartmentSchema>;

export const MedicalRecordIndexSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordNumber: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string(),
  encounterNumber: z.string(),
  encounterType: z.string(),
  admissionDate: z.string(),
  dischargeDate: z.string().optional(),
  primaryAttendingDoctor: z.string(),
  completionStatus: z.enum(RECORD_COMPLETION_STATUSES),
  codingStatus: z.enum(CODING_REVIEW_STATUSES),
  storageType: z.enum(ARCHIVE_STORAGE_TYPES),
  physicalShelfNumber: z.string().optional(),
  physicalBoxNumber: z.string().optional(),
  isLegalHoldActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type MedicalRecordIndexDto = z.infer<typeof MedicalRecordIndexSchema>;

export const MedicalRecordCompletionTaskSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  taskCode: z.string(),
  deficiencyType: z.string(),
  responsibleStaffName: z.string(),
  responsibleStaffRole: z.string(),
  description: z.string(),
  dueDate: z.string(),
  isResolved: z.boolean(),
  resolvedAt: z.string().optional(),
  resolvedByStaff: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});
export type MedicalRecordCompletionTaskDto = z.infer<typeof MedicalRecordCompletionTaskSchema>;

export const ICDCodeItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  shortDescription: z.string(),
  fullDescription: z.string(),
  chapter: z.string(),
  category: z.string(),
  isBillable: z.boolean()
});
export type ICDCodeItemDto = z.infer<typeof ICDCodeItemSchema>;

export const MedicalDiagnosisCodeSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  icdCode: z.string(),
  icdDescription: z.string(),
  codeType: z.enum(ICD_CODE_TYPES),
  poaIndicator: z.enum(POA_INDICATORS),
  sequencingOrder: z.number().int().positive(),
  assignedByCoder: z.string(),
  coderNotes: z.string().optional(),
  createdAt: z.string()
});
export type MedicalDiagnosisCodeDto = z.infer<typeof MedicalDiagnosisCodeSchema>;

export const CodingReviewSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  reviewNumber: z.string(),
  reviewerName: z.string(),
  reviewerRole: z.string(),
  reviewLevel: z.enum(['FIRST_LEVEL_AUDIT', 'SECOND_LEVEL_SENIOR_AUDIT', 'COMPLIANCE_PEER_REVIEW']),
  status: z.enum(CODING_REVIEW_STATUSES),
  findingsAndErrorsNotes: z.string(),
  codingAccuracyScorePercent: z.number().int().min(0).max(100),
  reviewedAt: z.string()
});
export type CodingReviewDto = z.infer<typeof CodingReviewSchema>;

export const ClinicalDocumentationQuerySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  queryNumber: z.string(),
  queryTitle: z.string(),
  initiatedByCoder: z.string(),
  assignedDoctorName: z.string(),
  clinicalReason: z.string(),
  supportingDocumentationSnippet: z.string(),
  clinicianClarificationResponse: z.string().optional(),
  status: z.enum(CLINICAL_QUERY_STATUSES),
  initiatedAt: z.string(),
  respondedAt: z.string().optional()
});
export type ClinicalDocumentationQueryDto = z.infer<typeof ClinicalDocumentationQuerySchema>;

export const ReleaseOfInformationRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  requestNumber: z.string(),
  recordId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  requestType: z.enum(ROI_REQUEST_TYPES),
  requestorName: z.string(),
  requestorOrganization: z.string().optional(),
  purposeOfRequest: z.string(),
  authorizedByOfficer: z.string().optional(),
  status: z.enum(ROI_STATUSES),
  deliveryMethod: z.enum(['ELECTRONIC_SECURE_PORTAL', 'PHYSICAL_CERTIFIED_COPIES', 'IN_PERSON_COLLECTION']),
  requestedAt: z.string(),
  releasedAt: z.string().optional()
});
export type ReleaseOfInformationRequestDto = z.infer<typeof ReleaseOfInformationRequestSchema>;

export const LegalRecordRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  legalRequestNumber: z.string(),
  recordId: z.string(),
  patientName: z.string(),
  courtOrAgencyName: z.string(),
  legalNoticeReferenceNumber: z.string(),
  officerInChargeName: z.string(),
  subpoenaDetails: z.string(),
  isPreservationOrder: z.boolean(),
  legalHoldApplied: z.boolean(),
  servedAt: z.string()
});
export type LegalRecordRequestDto = z.infer<typeof LegalRecordRequestSchema>;

export const MedicalRecordLegalHoldSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  holdCode: z.string(),
  recordId: z.string(),
  patientName: z.string(),
  legalMatterTitle: z.string(),
  reasonForHold: z.string(),
  authorizedByLegalCounsel: z.string(),
  status: z.enum(LEGAL_HOLD_STATUSES),
  appliedAt: z.string(),
  releasedAt: z.string().optional()
});
export type MedicalRecordLegalHoldDto = z.infer<typeof MedicalRecordLegalHoldSchema>;

export const BirthRegistryRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  birthRegistrationNumber: z.string(),
  motherEncounterId: z.string(),
  motherPatientName: z.string(),
  motherMrn: z.string(),
  babyNameOrIdentifier: z.string(),
  birthTimestamp: z.string(),
  deliveryType: z.string(),
  gender: z.string(),
  birthWeightKg: z.number(),
  attendingObstetrician: z.string(),
  attendingPaediatrician: z.string(),
  birthCertificateReferenceNumber: z.string(),
  governmentPortalNotified: z.boolean(),
  createdAt: z.string()
});
export type BirthRegistryRecordDto = z.infer<typeof BirthRegistryRecordSchema>;

export const DeathRegistryRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  deathRegistrationNumber: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  declaredDeadTimestamp: z.string(),
  declaringPhysician: z.string(),
  primaryCauseOfDeath: z.string(),
  secondaryCauses: z.string().optional(),
  deathCertificateNumber: z.string(),
  coronerPoliceInformed: z.boolean(),
  statutoryDeathPortalNotified: z.boolean(),
  createdAt: z.string()
});
export type DeathRegistryRecordDto = z.infer<typeof DeathRegistryRecordSchema>;

export const MedicalRecordAuditTraceSchema = z.object({
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
export type MedicalRecordAuditTraceDto = z.infer<typeof MedicalRecordAuditTraceSchema>;

export const MRDOverviewMetricsSchema = z.object({
  totalActiveRecords: z.number().int().nonnegative(),
  incompleteChartsCount: z.number().int().nonnegative(),
  pendingCodingQueueCount: z.number().int().nonnegative(),
  activeQueriesCount: z.number().int().nonnegative(),
  pendingROIRequestsCount: z.number().int().nonnegative(),
  activeLegalHoldsCount: z.number().int().nonnegative(),
  averageCodingTurnaroundHours: z.number().nonnegative(),
  codingAccuracyRatePercent: z.number().int().min(0).max(100)
});
export type MRDOverviewMetricsDto = z.infer<typeof MRDOverviewMetricsSchema>;

export const MRDAnalyticsSchema = z.object({
  topDiagnosesICD: z.array(z.object({ code: z.string(), title: z.string(), count: z.number() })),
  chartCompletionRates: z.array(z.object({ department: z.string(), rate: z.number() })),
  queryResolutionTimeDays: z.array(z.object({ specialty: z.string(), avgDays: z.number() })),
  roiVolumeByType: z.array(z.object({ type: z.string(), count: z.number() }))
});
export type MRDAnalyticsDto = z.infer<typeof MRDAnalyticsSchema>;

// ============================================================================
// MUTATION REQUEST SCHEMAS
// ============================================================================

export const CreateRecordCompletionTaskSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  deficiencyType: z.string().min(1),
  responsibleStaffName: z.string().min(1),
  responsibleStaffRole: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string()
});
export type CreateRecordCompletionTaskRequest = z.infer<typeof CreateRecordCompletionTaskSchema>;

export const CompleteRecordTaskSchema = z.object({
  tenantId: z.string(),
  taskId: z.string(),
  resolvedByStaff: z.string().min(1),
  notes: z.string().optional()
});
export type CompleteRecordTaskRequest = z.infer<typeof CompleteRecordTaskSchema>;

export const AssignDiagnosisCodeSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  icdCode: z.string().min(1),
  icdDescription: z.string().min(1),
  codeType: z.enum(ICD_CODE_TYPES),
  poaIndicator: z.enum(POA_INDICATORS),
  sequencingOrder: z.number().int().positive(),
  assignedByCoder: z.string().min(1),
  coderNotes: z.string().optional()
});
export type AssignDiagnosisCodeRequest = z.infer<typeof AssignDiagnosisCodeSchema>;

export const UpdateDiagnosisCodeSchema = z.object({
  tenantId: z.string(),
  diagnosisId: z.string(),
  icdCode: z.string().min(1),
  icdDescription: z.string().min(1),
  codeType: z.enum(ICD_CODE_TYPES),
  poaIndicator: z.enum(POA_INDICATORS),
  updatedByCoder: z.string().min(1),
  reasonForRevision: z.string().min(1)
});
export type UpdateDiagnosisCodeRequest = z.infer<typeof UpdateDiagnosisCodeSchema>;

export const SubmitCodingReviewSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  reviewerName: z.string().min(1),
  reviewerRole: z.string().min(1),
  reviewLevel: z.enum(['FIRST_LEVEL_AUDIT', 'SECOND_LEVEL_SENIOR_AUDIT', 'COMPLIANCE_PEER_REVIEW']),
  status: z.enum(CODING_REVIEW_STATUSES),
  findingsAndErrorsNotes: z.string().min(1),
  codingAccuracyScorePercent: z.number().int().min(0).max(100)
});
export type SubmitCodingReviewRequest = z.infer<typeof SubmitCodingReviewSchema>;

export const CreateClinicalDocumentationQuerySchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  queryTitle: z.string().min(1),
  initiatedByCoder: z.string().min(1),
  assignedDoctorName: z.string().min(1),
  clinicalReason: z.string().min(1),
  supportingDocumentationSnippet: z.string().min(1)
});
export type CreateClinicalDocumentationQueryRequest = z.infer<typeof CreateClinicalDocumentationQuerySchema>;

export const ResolveClinicalDocumentationQuerySchema = z.object({
  tenantId: z.string(),
  queryId: z.string(),
  clinicianClarificationResponse: z.string().min(1),
  status: z.enum(['RESPONDED_BY_CLINICIAN', 'RESOLVED', 'CANCELLED']),
  resolvedByDoctor: z.string().min(1)
});
export type ResolveClinicalDocumentationQueryRequest = z.infer<typeof ResolveClinicalDocumentationQuerySchema>;

export const CreateRecordRetrievalRequestSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  requestedByStaff: z.string().min(1),
  departmentPurpose: z.string().min(1),
  expectedReturnDate: z.string()
});
export type CreateRecordRetrievalRequestRequest = z.infer<typeof CreateRecordRetrievalRequestSchema>;

export const CreateROIRequestSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  requestType: z.enum(ROI_REQUEST_TYPES),
  requestorName: z.string().min(1),
  requestorOrganization: z.string().optional(),
  purposeOfRequest: z.string().min(1),
  deliveryMethod: z.enum(['ELECTRONIC_SECURE_PORTAL', 'PHYSICAL_CERTIFIED_COPIES', 'IN_PERSON_COLLECTION'])
});
export type CreateROIRequestRequest = z.infer<typeof CreateROIRequestSchema>;

export const ApproveROIRequestSchema = z.object({
  tenantId: z.string(),
  requestId: z.string(),
  authorizedByOfficer: z.string().min(1),
  notes: z.string().optional()
});
export type ApproveROIRequestRequest = z.infer<typeof ApproveROIRequestSchema>;

export const RejectROIRequestSchema = z.object({
  tenantId: z.string(),
  requestId: z.string(),
  rejectedByOfficer: z.string().min(1),
  rejectionReason: z.string().min(1)
});
export type RejectROIRequestRequest = z.infer<typeof RejectROIRequestSchema>;

export const ReleaseMedicalRecordSchema = z.object({
  tenantId: z.string(),
  requestId: z.string(),
  releasedByOfficer: z.string().min(1),
  releaseNotes: z.string().min(1)
});
export type ReleaseMedicalRecordRequest = z.infer<typeof ReleaseMedicalRecordSchema>;

export const CreateLegalRecordRequestSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  patientName: z.string().min(1),
  courtOrAgencyName: z.string().min(1),
  legalNoticeReferenceNumber: z.string().min(1),
  officerInChargeName: z.string().min(1),
  subpoenaDetails: z.string().min(1),
  isPreservationOrder: z.boolean().default(false)
});
export type CreateLegalRecordRequestRequest = z.infer<typeof CreateLegalRecordRequestSchema>;

export const CreateLegalHoldSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  recordId: z.string(),
  patientName: z.string().min(1),
  legalMatterTitle: z.string().min(1),
  reasonForHold: z.string().min(1),
  authorizedByLegalCounsel: z.string().min(1)
});
export type CreateLegalHoldRequest = z.infer<typeof CreateLegalHoldSchema>;

export const RegisterBirthRecordSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  motherEncounterId: z.string(),
  motherPatientName: z.string().min(1),
  motherMrn: z.string().min(1),
  babyNameOrIdentifier: z.string().min(1),
  birthTimestamp: z.string(),
  deliveryType: z.string().min(1),
  gender: z.string(),
  birthWeightKg: z.number().positive(),
  attendingObstetrician: z.string().min(1),
  attendingPaediatrician: z.string().min(1)
});
export type RegisterBirthRecordRequest = z.infer<typeof RegisterBirthRecordSchema>;

export const RegisterDeathRecordSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  declaredDeadTimestamp: z.string(),
  declaringPhysician: z.string().min(1),
  primaryCauseOfDeath: z.string().min(1),
  secondaryCauses: z.string().optional(),
  deathCertificateNumber: z.string().min(1),
  coronerPoliceInformed: z.boolean().default(false)
});
export type RegisterDeathRecordRequest = z.infer<typeof RegisterDeathRecordSchema>;
