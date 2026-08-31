import { z } from 'zod';

export const AIModelLifecycleStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'DEPRECATED',
  'RETIRED'
]);
export type AIModelLifecycleStatus = z.infer<typeof AIModelLifecycleStatusSchema>;

export const AIModelDeploymentStatusSchema = z.enum([
  'NOT_DEPLOYED',
  'SANDBOX',
  'STAGING',
  'PRODUCTION',
  'SUSPENDED'
]);
export type AIModelDeploymentStatus = z.infer<typeof AIModelDeploymentStatusSchema>;

export const AIRiskClassificationSchema = z.enum([
  'LOW_ADMINISTRATIVE',
  'MODERATE_OPERATIONAL',
  'HIGH_CLINICAL_CONTEXT',
  'PROHIBITED'
]);
export type AIRiskClassification = z.infer<typeof AIRiskClassificationSchema>;

export const AICapabilityClassificationSchema = z.enum([
  'TEXT_EMBEDDING',
  'SUMMARIZATION',
  'DOCUMENT_EXTRACTION',
  'CLASSIFICATION',
  'SEARCH_RERANKING'
]);
export type AICapabilityClassification = z.infer<typeof AICapabilityClassificationSchema>;

export const AIGovernancePolicyStatusSchema = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'SUSPENDED',
  'RETIRED'
]);
export type AIGovernancePolicyStatus = z.infer<typeof AIGovernancePolicyStatusSchema>;

export const AIGovernancePolicyTypeSchema = z.enum([
  'CLINICAL_SAFETY_BOUNDARY',
  'DATA_PRIVACY_REDACTION',
  'HUMAN_IN_THE_LOOP_MANDATE',
  'PROHIBITED_USE_ENFORCEMENT'
]);
export type AIGovernancePolicyType = z.infer<typeof AIGovernancePolicyTypeSchema>;

export const AIPromptTypeSchema = z.enum([
  'SYSTEM',
  'DEVELOPER',
  'TASK',
  'SAFETY',
  'EVALUATION'
]);
export type AIPromptType = z.infer<typeof AIPromptTypeSchema>;

export const AIPromptApprovalStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED_FOR_PRODUCTION',
  'REJECTED',
  'RETIRED'
]);
export type AIPromptApprovalStatus = z.infer<typeof AIPromptApprovalStatusSchema>;

export const AIQuotaTypeSchema = z.enum([
  'TOKENS',
  'REQUESTS',
  'COMPUTE_UNITS'
]);
export type AIQuotaType = z.infer<typeof AIQuotaTypeSchema>;

export const AIQuotaPeriodSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'CUSTOM'
]);
export type AIQuotaPeriod = z.infer<typeof AIQuotaPeriodSchema>;

export const AIUsageSourceStatusSchema = z.enum([
  'CONNECTED',
  'DISCONNECTED',
  'PENDING_TELEMETRY_PIPELINE'
]);
export type AIUsageSourceStatus = z.infer<typeof AIUsageSourceStatusSchema>;

export const AISafetySeveritySchema = z.enum([
  'INFO',
  'NOTICE',
  'WARNING',
  'HIGH',
  'CRITICAL'
]);
export type AISafetySeverity = z.infer<typeof AISafetySeveritySchema>;

export const AISafetyEventStatusSchema = z.enum([
  'OPEN',
  'UNDER_REVIEW',
  'ACKNOWLEDGED',
  'RESOLVED',
  'DISMISSED'
]);
export type AISafetyEventStatus = z.infer<typeof AISafetyEventStatusSchema>;

export const AIRequestStatusSchema = z.enum([
  'COMPLETED',
  'BLOCKED_BY_POLICY',
  'RATE_LIMITED',
  'FAILED'
]);
export type AIRequestStatus = z.infer<typeof AIRequestStatusSchema>;

export const AIOutcomeStatusSchema = z.enum([
  'PASSED_SAFETY_GATE',
  'TRIGGERED_HUMAN_REVIEW',
  'FLAGGED_ANOMALY'
]);
export type AIOutcomeStatus = z.infer<typeof AIOutcomeStatusSchema>;

export const HumanReviewStatusSchema = z.enum([
  'NOT_REQUIRED',
  'PENDING_CLINICAL_LEAD',
  'APPROVED_BY_HUMAN',
  'REJECTED_BY_HUMAN'
]);
export type HumanReviewStatus = z.infer<typeof HumanReviewStatusSchema>;

// DTOs
export const AIModelDtoSchema = z.object({
  id: z.string().uuid(),
  provider: z.string().min(2),
  modelCode: z.string().min(2),
  modelName: z.string().min(2),
  description: z.string(),
  modelFamily: z.string(),
  lifecycleStatus: AIModelLifecycleStatusSchema,
  deploymentStatus: AIModelDeploymentStatusSchema,
  capabilityClassification: AICapabilityClassificationSchema,
  riskClassification: AIRiskClassificationSchema,
  contextWindow: z.number().int().min(0),
  supportedModalities: z.array(z.string()).default([]),
  approvedForProduction: z.boolean().default(false),
  approvedForClinicalContext: z.boolean().default(false),
  version: z.string().default('1.0.0'),
  releaseDate: z.string().datetime().optional(),
  deprecationDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AIModelDto = z.infer<typeof AIModelDtoSchema>;

export const AIGovernancePolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  policyType: AIGovernancePolicyTypeSchema,
  riskLevel: AIRiskClassificationSchema,
  status: AIGovernancePolicyStatusSchema,
  rules: z.array(z.string()).default([]),
  prohibitedUseCases: z.array(z.string()).default([]),
  allowedUseCases: z.array(z.string()).default([]),
  humanOversightRequired: z.boolean().default(true),
  clinicalSafetyBoundary: z.string(),
  approvalRequired: z.boolean().default(true),
  approvedById: z.string().uuid().optional(),
  approvedByEmail: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  version: z.string().default('1.0.0'),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AIGovernancePolicyDto = z.infer<typeof AIGovernancePolicyDtoSchema>;

export const AIPromptTemplateDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  promptType: AIPromptTypeSchema,
  status: AIPromptApprovalStatusSchema,
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string(),
  currentVersion: z.string().default('1.0.0'),
  variables: z.array(z.string()).default([]),
  governancePolicyId: z.string().uuid().optional(),
  governancePolicyCode: z.string().optional(),
  approvalStatus: AIPromptApprovalStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AIPromptTemplateDto = z.infer<typeof AIPromptTemplateDtoSchema>;

export const AIPromptVersionDtoSchema = z.object({
  id: z.string().uuid(),
  promptTemplateId: z.string().uuid(),
  version: z.string(),
  promptContent: z.string(),
  changeSummary: z.string(),
  createdById: z.string().uuid().optional(),
  createdByEmail: z.string(),
  approvalStatus: AIPromptApprovalStatusSchema,
  approvedById: z.string().uuid().optional(),
  approvedByEmail: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  effectiveAt: z.string().datetime().optional(),
  retiredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type AIPromptVersionDto = z.infer<typeof AIPromptVersionDtoSchema>;

export const AIUsageQuotaDtoSchema = z.object({
  id: z.string().uuid(),
  scopeType: z.string(),
  scopeReference: z.string(),
  modelId: z.string().uuid().optional(),
  modelCode: z.string().optional(),
  quotaType: AIQuotaTypeSchema,
  limitValue: z.number().int().min(0),
  warningThreshold: z.number().int().min(0),
  period: AIQuotaPeriodSchema,
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).default('ACTIVE'),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AIUsageQuotaDto = z.infer<typeof AIUsageQuotaDtoSchema>;

export const AIUsageRecordDtoSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().uuid(),
  modelCode: z.string(),
  partnerId: z.string().uuid().optional(),
  tenantScope: z.string().optional(),
  environment: z.string(),
  requestCount: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  recordedAt: z.string().datetime(),
  sourceStatus: AIUsageSourceStatusSchema,
  metadata: z.record(z.unknown()).default({})
});
export type AIUsageRecordDto = z.infer<typeof AIUsageRecordDtoSchema>;

export const AIAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  actorId: z.string().uuid().optional(),
  actorEmail: z.string().optional(),
  partnerId: z.string().uuid().optional(),
  partnerTradeName: z.string().optional(),
  modelId: z.string().uuid(),
  modelCode: z.string(),
  modelVersion: z.string(),
  promptTemplateId: z.string().uuid().optional(),
  promptTemplateCode: z.string().optional(),
  promptVersion: z.string().optional(),
  governancePolicyId: z.string().uuid().optional(),
  governancePolicyCode: z.string().optional(),
  safetyClassification: AIRiskClassificationSchema,
  requestStatus: AIRequestStatusSchema,
  outcomeStatus: AIOutcomeStatusSchema,
  humanReviewRequired: z.boolean().default(false),
  humanReviewStatus: HumanReviewStatusSchema,
  environment: z.string(),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});
export type AIAuditTraceDto = z.infer<typeof AIAuditTraceDtoSchema>;

export const AISafetyEventDtoSchema = z.object({
  id: z.string().uuid(),
  eventCode: z.string(),
  severity: AISafetySeveritySchema,
  category: z.string(),
  modelId: z.string().uuid().optional(),
  modelCode: z.string().optional(),
  promptTemplateId: z.string().uuid().optional(),
  promptTemplateCode: z.string().optional(),
  governancePolicyId: z.string().uuid().optional(),
  governancePolicyCode: z.string().optional(),
  description: z.string(),
  recommendedAction: z.string(),
  status: AISafetyEventStatusSchema,
  requiresHumanReview: z.boolean().default(false),
  acknowledgedById: z.string().uuid().optional(),
  acknowledgedByEmail: z.string().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  detectedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AISafetyEventDto = z.infer<typeof AISafetyEventDtoSchema>;

// Requests
export const CreateAIModelRequestSchema = z.object({
  provider: z.string().min(2),
  modelCode: z.string().min(2),
  modelName: z.string().min(2),
  description: z.string(),
  modelFamily: z.string(),
  capabilityClassification: AICapabilityClassificationSchema,
  riskClassification: AIRiskClassificationSchema,
  contextWindow: z.number().int().min(0),
  supportedModalities: z.array(z.string()).default(['TEXT']),
  approvedForProduction: z.boolean().default(false),
  approvedForClinicalContext: z.boolean().default(false),
  version: z.string().default('1.0.0')
});
export type CreateAIModelRequest = z.infer<typeof CreateAIModelRequestSchema>;

export const UpdateAIModelRequestSchema = z.object({
  modelName: z.string().min(2).optional(),
  description: z.string().optional(),
  lifecycleStatus: AIModelLifecycleStatusSchema.optional(),
  deploymentStatus: AIModelDeploymentStatusSchema.optional(),
  approvedForProduction: z.boolean().optional(),
  approvedForClinicalContext: z.boolean().optional(),
  reason: z.string().min(3)
});
export type UpdateAIModelRequest = z.infer<typeof UpdateAIModelRequestSchema>;

export const CreateGovernancePolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  policyType: AIGovernancePolicyTypeSchema,
  riskLevel: AIRiskClassificationSchema,
  rules: z.array(z.string()).min(1),
  prohibitedUseCases: z.array(z.string()).min(1),
  allowedUseCases: z.array(z.string()).min(1),
  humanOversightRequired: z.boolean().default(true),
  clinicalSafetyBoundary: z.string().min(5),
  version: z.string().default('1.0.0')
});
export type CreateGovernancePolicyRequest = z.infer<typeof CreateGovernancePolicyRequestSchema>;

export const TransitionGovernancePolicyRequestSchema = z.object({
  toStatus: AIGovernancePolicyStatusSchema,
  reason: z.string().min(3)
});
export type TransitionGovernancePolicyRequest = z.infer<typeof TransitionGovernancePolicyRequestSchema>;

export const CreatePromptTemplateRequestSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  promptType: AIPromptTypeSchema,
  variables: z.array(z.string()).default([]),
  governancePolicyId: z.string().uuid().optional(),
  initialPromptContent: z.string().min(5)
});
export type CreatePromptTemplateRequest = z.infer<typeof CreatePromptTemplateRequestSchema>;

export const CreatePromptVersionRequestSchema = z.object({
  promptTemplateId: z.string().uuid(),
  version: z.string().min(2),
  promptContent: z.string().min(5),
  changeSummary: z.string().min(3)
});
export type CreatePromptVersionRequest = z.infer<typeof CreatePromptVersionRequestSchema>;

export const ApprovePromptVersionRequestSchema = z.object({
  promptVersionId: z.string().uuid(),
  approvalStatus: AIPromptApprovalStatusSchema,
  reason: z.string().min(3)
});
export type ApprovePromptVersionRequest = z.infer<typeof ApprovePromptVersionRequestSchema>;

export const CreateUsageQuotaRequestSchema = z.object({
  scopeType: z.string().min(2),
  scopeReference: z.string().min(2),
  modelId: z.string().uuid().optional(),
  quotaType: AIQuotaTypeSchema,
  limitValue: z.number().int().min(1),
  warningThreshold: z.number().int().min(1),
  period: AIQuotaPeriodSchema
});
export type CreateUsageQuotaRequest = z.infer<typeof CreateUsageQuotaRequestSchema>;

export const AcknowledgeSafetyEventRequestSchema = z.object({
  eventId: z.string().uuid(),
  reason: z.string().min(3)
});
export type AcknowledgeSafetyEventRequest = z.infer<typeof AcknowledgeSafetyEventRequestSchema>;

export const ResolveSafetyEventRequestSchema = z.object({
  eventId: z.string().uuid(),
  resolutionStatus: AISafetyEventStatusSchema,
  resolutionNotes: z.string().min(3)
});
export type ResolveSafetyEventRequest = z.infer<typeof ResolveSafetyEventRequestSchema>;
