import { z } from 'zod';

/**
 * ============================================================================
 * PHASE 2.7: CLINICAL ORDERS, LABORATORY & DIAGNOSTIC INVESTIGATION CONTRACTS
 * ============================================================================
 */

export const InvestigationCategoryEnum = z.enum([
  'HEMATOLOGY',
  'BIOCHEMISTRY',
  'MICROBIOLOGY',
  'IMMUNOLOGY',
  'PATHOLOGY',
  'RADIOLOGY',
  'CARDIOLOGY',
  'ENDOCRINOLOGY',
  'GENERAL'
]);
export type InvestigationCategory = z.infer<typeof InvestigationCategoryEnum>;

export const InvestigationSpecimenTypeEnum = z.enum([
  'WHOLE_BLOOD',
  'SERUM',
  'PLASMA',
  'URINE',
  'STOOL',
  'SPUTUM',
  'SWAB',
  'CSF',
  'TISSUE',
  'NONE'
]);
export type InvestigationSpecimenType = z.infer<typeof InvestigationSpecimenTypeEnum>;

export const InvestigationStatusEnum = z.enum([
  'ORDERED',
  'ACKNOWLEDGED',
  'SAMPLE_REQUIRED',
  'SAMPLE_COLLECTED',
  'PROCESSING',
  'RESULT_READY',
  'VERIFIED',
  'REVIEWED',
  'CANCELLED'
]);
export type InvestigationStatus = z.infer<typeof InvestigationStatusEnum>;

export const InvestigationPriorityEnum = z.enum([
  'ROUTINE',
  'URGENT',
  'STAT',
  'EMERGENCY'
]);
export type InvestigationPriority = z.infer<typeof InvestigationPriorityEnum>;

export const SpecimenCollectionStatusEnum = z.enum([
  'PENDING',
  'COLLECTED',
  'RECEIVED_IN_LAB',
  'REJECTED'
]);
export type SpecimenCollectionStatus = z.infer<typeof SpecimenCollectionStatusEnum>;

export const InvestigationResultStatusEnum = z.enum([
  'DRAFT',
  'COMPLETED',
  'VERIFIED',
  'AMENDED',
  'RETRACTED'
]);
export type InvestigationResultStatus = z.infer<typeof InvestigationResultStatusEnum>;

export const InvestigationResultFlagEnum = z.enum([
  'NORMAL',
  'LOW',
  'HIGH',
  'ABNORMAL',
  'CRITICAL_LOW',
  'CRITICAL_HIGH'
]);
export type InvestigationResultFlag = z.infer<typeof InvestigationResultFlagEnum>;

export const InvestigationReportStatusEnum = z.enum([
  'DRAFT',
  'PRELIMINARY',
  'FINAL',
  'AMENDED',
  'CANCELLED'
]);
export type InvestigationReportStatus = z.infer<typeof InvestigationReportStatusEnum>;

export const InvestigationCatalogStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'RETIRED'
]);
export type InvestigationCatalogStatus = z.infer<typeof InvestigationCatalogStatusEnum>;

export const InvestigationAuditOperationStatusEnum = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED'
]);
export type InvestigationAuditOperationStatus = z.infer<typeof InvestigationAuditOperationStatusEnum>;

// ==========================================
// DTO SCHEMAS
// ==========================================

export const InvestigationCatalogDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  testCode: z.string().min(1),
  testName: z.string().min(1),
  shortName: z.string().optional(),
  category: InvestigationCategoryEnum,
  specimenType: InvestigationSpecimenTypeEnum,
  department: z.string().min(1),
  clinicalDescription: z.string().optional(),
  preparationRequirements: z.string().optional(),
  fastingRequired: z.boolean().default(false),
  turnaroundTargetHours: z.number().int().min(1).default(24),
  sampleVolume: z.string().optional(),
  status: InvestigationCatalogStatusEnum.default('ACTIVE'),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationCatalogDto = z.infer<typeof InvestigationCatalogDtoSchema>;

export const InvestigationPanelItemDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  panelId: z.string().uuid(),
  investigationId: z.string().uuid(),
  investigationCode: z.string().optional(),
  investigationName: z.string().optional(),
  displayOrder: z.number().int().default(0),
  createdAt: z.string().datetime()
});
export type InvestigationPanelItemDto = z.infer<typeof InvestigationPanelItemDtoSchema>;

export const InvestigationPanelDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  panelCode: z.string().min(1),
  panelName: z.string().min(1),
  category: InvestigationCategoryEnum,
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  items: z.array(InvestigationPanelItemDtoSchema).default([]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationPanelDto = z.infer<typeof InvestigationPanelDtoSchema>;

export const InvestigationSpecimenDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  orderId: z.string().uuid(),
  patientId: z.string().uuid(),
  accessionNumber: z.string().min(1),
  specimenType: InvestigationSpecimenTypeEnum,
  containerType: z.string().optional(),
  collectionSite: z.string().optional(),
  collectionStatus: SpecimenCollectionStatusEnum.default('PENDING'),
  collectedAt: z.string().datetime().optional(),
  collectedBy: z.string().optional(),
  receivedInLabAt: z.string().datetime().optional(),
  receivedBy: z.string().optional(),
  rejectionStatus: z.boolean().default(false),
  rejectionReason: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectedBy: z.string().optional(),
  collectionNotes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationSpecimenDto = z.infer<typeof InvestigationSpecimenDtoSchema>;

export const InvestigationResultDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  orderId: z.string().uuid(),
  specimenId: z.string().uuid().optional(),
  parameterCode: z.string().min(1),
  parameterName: z.string().min(1),
  resultValue: z.string().min(1),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  referenceMin: z.number().optional(),
  referenceMax: z.number().optional(),
  criticalMin: z.number().optional(),
  criticalMax: z.number().optional(),
  abnormalFlag: InvestigationResultFlagEnum.default('NORMAL'),
  isCritical: z.boolean().default(false),
  qualitativeInterpretation: z.string().optional(),
  resultStatus: InvestigationResultStatusEnum.default('DRAFT'),
  enteredBy: z.string().min(1),
  enteredAt: z.string().datetime(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  version: z.number().int().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationResultDto = z.infer<typeof InvestigationResultDtoSchema>;

export const InvestigationResultAmendmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  orderId: z.string().uuid(),
  resultId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  amendmentNumber: z.number().int().default(1),
  previousValue: z.string().min(1),
  newValue: z.string().min(1),
  previousAbnormalFlag: InvestigationResultFlagEnum.optional(),
  newAbnormalFlag: InvestigationResultFlagEnum.optional(),
  reason: z.string().min(1),
  amendedBy: z.string().min(1),
  amendedRole: z.string().min(1),
  amendedAt: z.string().datetime()
});
export type InvestigationResultAmendmentDto = z.infer<typeof InvestigationResultAmendmentDtoSchema>;

export const InvestigationReportDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  orderId: z.string().uuid(),
  patientId: z.string().uuid(),
  reportNumber: z.string().min(1),
  reportTitle: z.string().min(1),
  clinicalFindings: z.string().optional(),
  impression: z.string().optional(),
  recommendations: z.string().optional(),
  reportingClinician: z.string().min(1),
  verifyingPathologist: z.string().optional(),
  reportStatus: InvestigationReportStatusEnum.default('DRAFT'),
  reportVersion: z.number().int().default(1),
  finalizedAt: z.string().datetime().optional(),
  reviewedByDoctorAt: z.string().datetime().optional(),
  reviewingDoctor: z.string().optional(),
  doctorReviewNotes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationReportDto = z.infer<typeof InvestigationReportDtoSchema>;

export const InvestigationOrderDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid().optional(),
  branchName: z.string().optional(),
  orderNumber: z.string().min(1),
  patientId: z.string().uuid(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  patientDob: z.string().optional(),
  patientGender: z.string().optional(),
  encounterId: z.string().uuid(),
  encounterNumber: z.string().min(1),
  consultationId: z.string().uuid().optional(),
  consultationNumber: z.string().optional(),
  orderingDoctorId: z.string().uuid(),
  orderingDoctorName: z.string().min(1),
  orderingDoctorSpecialty: z.string().optional(),
  investigationId: z.string().uuid(),
  investigationCode: z.string().min(1),
  investigationName: z.string().min(1),
  investigationCategory: InvestigationCategoryEnum,
  panelId: z.string().uuid().optional(),
  panelName: z.string().optional(),
  priority: InvestigationPriorityEnum.default('ROUTINE'),
  clinicalIndication: z.string().min(1),
  diagnosisContext: z.string().optional(),
  specimenType: InvestigationSpecimenTypeEnum.default('WHOLE_BLOOD'),
  fastingConfirmed: z.boolean().default(false),
  status: InvestigationStatusEnum.default('ORDERED'),
  isAbnormal: z.boolean().default(false),
  isCritical: z.boolean().default(false),
  specimens: z.array(InvestigationSpecimenDtoSchema).default([]),
  results: z.array(InvestigationResultDtoSchema).default([]),
  report: InvestigationReportDtoSchema.optional(),
  amendments: z.array(InvestigationResultAmendmentDtoSchema).default([]),
  orderedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  sampleCollectedAt: z.string().datetime().optional(),
  processingStartedAt: z.string().datetime().optional(),
  resultEnteredAt: z.string().datetime().optional(),
  verifiedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvestigationOrderDto = z.infer<typeof InvestigationOrderDtoSchema>;

export const InvestigationAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  action: z.string().min(1),
  targetEntity: z.string().min(1),
  targetEntityId: z.string().min(1),
  previousSnapshot: z.record(z.unknown()).optional(),
  newSnapshot: z.record(z.unknown()).optional(),
  justification: z.string().min(1),
  operationStatus: InvestigationAuditOperationStatusEnum.default('SUCCESS'),
  correlationId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime()
});
export type InvestigationAuditTraceDto = z.infer<typeof InvestigationAuditTraceDtoSchema>;

export const InvestigationOverviewDtoSchema = z.object({
  todayOrdersCount: z.number().int().min(0),
  pendingCollectionsCount: z.number().int().min(0),
  processingCount: z.number().int().min(0),
  resultsReadyCount: z.number().int().min(0),
  criticalResultsCount: z.number().int().min(0),
  awaitingVerificationCount: z.number().int().min(0),
  awaitingDoctorReviewCount: z.number().int().min(0),
  completedInvestigationsCount: z.number().int().min(0)
});
export type InvestigationOverviewDto = z.infer<typeof InvestigationOverviewDtoSchema>;

// ==========================================
// MUTATION & QUERY REQUEST SCHEMAS
// ==========================================

export const CreateInvestigationCatalogRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  testCode: z.string().min(1),
  testName: z.string().min(1),
  shortName: z.string().optional(),
  category: InvestigationCategoryEnum,
  specimenType: InvestigationSpecimenTypeEnum,
  department: z.string().min(1),
  clinicalDescription: z.string().optional(),
  preparationRequirements: z.string().optional(),
  fastingRequired: z.boolean().default(false),
  turnaroundTargetHours: z.number().int().min(1).default(24),
  sampleVolume: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type CreateInvestigationCatalogRequest = z.infer<typeof CreateInvestigationCatalogRequestSchema>;

export const UpdateInvestigationCatalogRequestSchema = z.object({
  tenantId: z.string().uuid(),
  investigationId: z.string().uuid(),
  testName: z.string().min(1).optional(),
  shortName: z.string().optional(),
  category: InvestigationCategoryEnum.optional(),
  specimenType: InvestigationSpecimenTypeEnum.optional(),
  department: z.string().min(1).optional(),
  clinicalDescription: z.string().optional(),
  preparationRequirements: z.string().optional(),
  fastingRequired: z.boolean().optional(),
  turnaroundTargetHours: z.number().int().min(1).optional(),
  sampleVolume: z.string().optional(),
  status: InvestigationCatalogStatusEnum.optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type UpdateInvestigationCatalogRequest = z.infer<typeof UpdateInvestigationCatalogRequestSchema>;

export const CreateInvestigationPanelRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  panelCode: z.string().min(1),
  panelName: z.string().min(1),
  category: InvestigationCategoryEnum,
  description: z.string().optional(),
  investigationIds: z.array(z.string().uuid()).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type CreateInvestigationPanelRequest = z.infer<typeof CreateInvestigationPanelRequestSchema>;

export const CreateInvestigationOrderRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  patientName: z.string().optional(),
  patientAge: z.string().optional(),
  patientGender: z.string().optional(),
  patientPhone: z.string().optional(),
  orderingDoctorName: z.string().optional(),
  referringDoctor: z.string().optional(),
  encounterId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  orderingDoctorId: z.string().uuid(),
  investigationId: z.string().uuid(),
  panelId: z.string().uuid().optional(),
  priority: InvestigationPriorityEnum.default('ROUTINE'),
  clinicalIndication: z.string().min(1),
  diagnosisContext: z.string().optional(),
  specimenType: InvestigationSpecimenTypeEnum.default('WHOLE_BLOOD'),
  fastingConfirmed: z.boolean().default(false),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type CreateInvestigationOrderRequest = z.infer<typeof CreateInvestigationOrderRequestSchema>;

export const CancelInvestigationOrderRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  cancellationReason: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type CancelInvestigationOrderRequest = z.infer<typeof CancelInvestigationOrderRequestSchema>;

export const AcknowledgeInvestigationOrderRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type AcknowledgeInvestigationOrderRequest = z.infer<typeof AcknowledgeInvestigationOrderRequestSchema>;

export const CollectSpecimenRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  specimenType: InvestigationSpecimenTypeEnum,
  containerType: z.string().min(1),
  collectionSite: z.string().optional(),
  collectionNotes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type CollectSpecimenRequest = z.infer<typeof CollectSpecimenRequestSchema>;

export const RejectSpecimenRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  specimenId: z.string().uuid(),
  rejectionReason: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type RejectSpecimenRequest = z.infer<typeof RejectSpecimenRequestSchema>;

export const ResultEntryItemSchema = z.object({
  parameterCode: z.string().min(1),
  parameterName: z.string().min(1),
  resultValue: z.string().min(1),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  referenceMin: z.number().optional(),
  referenceMax: z.number().optional(),
  criticalMin: z.number().optional(),
  criticalMax: z.number().optional(),
  abnormalFlag: InvestigationResultFlagEnum.default('NORMAL'),
  isCritical: z.boolean().default(false),
  qualitativeInterpretation: z.string().optional()
});
export type ResultEntryItem = z.infer<typeof ResultEntryItemSchema>;

export const EnterInvestigationResultRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  specimenId: z.string().uuid().optional(),
  results: z.array(ResultEntryItemSchema).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type EnterInvestigationResultRequest = z.infer<typeof EnterInvestigationResultRequestSchema>;

export const VerifyInvestigationResultRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  verifyingPathologist: z.string().min(1),
  clinicalImpression: z.string().optional(),
  recommendations: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type VerifyInvestigationResultRequest = z.infer<typeof VerifyInvestigationResultRequestSchema>;

export const FinalizeInvestigationReportRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  reportTitle: z.string().min(1),
  clinicalFindings: z.string().optional(),
  impression: z.string().min(1),
  recommendations: z.string().optional(),
  reportingClinician: z.string().min(1),
  verifyingPathologist: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type FinalizeInvestigationReportRequest = z.infer<typeof FinalizeInvestigationReportRequestSchema>;

export const ReviewInvestigationResultRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  reviewingDoctor: z.string().min(1),
  doctorReviewNotes: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type ReviewInvestigationResultRequest = z.infer<typeof ReviewInvestigationResultRequestSchema>;

export const AmendInvestigationResultRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  resultId: z.string().uuid(),
  newValue: z.string().min(1),
  newAbnormalFlag: InvestigationResultFlagEnum.optional(),
  amendmentReason: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(1)
});
export type AmendInvestigationResultRequest = z.infer<typeof AmendInvestigationResultRequestSchema>;

export const SearchInvestigationOrdersRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  orderingDoctorId: z.string().uuid().optional(),
  category: InvestigationCategoryEnum.optional(),
  status: InvestigationStatusEnum.optional(),
  priority: InvestigationPriorityEnum.optional(),
  isCritical: z.boolean().optional(),
  isAbnormal: z.boolean().optional(),
  searchTerm: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type SearchInvestigationOrdersRequest = z.infer<typeof SearchInvestigationOrdersRequestSchema>;

export const QueryInvestigationAuditRequestSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type QueryInvestigationAuditRequest = z.infer<typeof QueryInvestigationAuditRequestSchema>;
