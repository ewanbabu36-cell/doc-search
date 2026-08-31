import { z } from 'zod';

export const TicketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'PENDING_PARTNER',
  'RESOLVED',
  'CLOSED'
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_SLA']);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketCategorySchema = z.enum([
  'TECHNICAL_INCIDENT',
  'INTEGRATION_FHIR_HL7',
  'USER_ACCESS_RBAC',
  'COMMERCIAL_BILLING',
  'CONFIGURATION_BRANCH',
  'TRAINING_ONBOARDING'
]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const SlaStatusSchema = z.enum(['WITHIN_SLA', 'SLA_WARNING', 'SLA_BREACHED']);
export type SlaStatus = z.infer<typeof SlaStatusSchema>;

export const PartnerHealthStatusSchema = z.enum(['HEALTHY', 'NEUTRAL', 'AT_RISK', 'CRITICAL']);
export type PartnerHealthStatus = z.infer<typeof PartnerHealthStatusSchema>;

export const CheckinTypeSchema = z.enum([
  'QUARTERLY_BUSINESS_REVIEW',
  'ONBOARDING_CHECKPOINT',
  'MONTHLY_HEALTH_SYNC',
  'EXECUTIVE_ESCALATION',
  'TECHNICAL_INTEGRATION_REVIEW'
]);
export type CheckinType = z.infer<typeof CheckinTypeSchema>;

export const CheckinStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
export type CheckinStatus = z.infer<typeof CheckinStatusSchema>;

// DTOs
export const SupportTicketDtoSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  partnerTenantSlug: z.string(),
  title: z.string().min(3),
  description: z.string().min(5),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  slaStatus: SlaStatusSchema,
  assignedAgentEmail: z.string(),
  submittedByEmail: z.string(),
  submittedByName: z.string(),
  slaResponseDue: z.string().datetime().optional(),
  slaResolutionDue: z.string().datetime().optional(),
  resolvedDate: z.string().datetime().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SupportTicketDto = z.infer<typeof SupportTicketDtoSchema>;

export const TicketCommentDtoSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorEmail: z.string(),
  authorName: z.string(),
  isInternalOnly: z.boolean().default(false),
  content: z.string().min(1),
  createdAt: z.string().datetime()
});
export type TicketCommentDto = z.infer<typeof TicketCommentDtoSchema>;

export const PartnerHealthDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  partnerTenantSlug: z.string(),
  healthStatus: PartnerHealthStatusSchema,
  healthScore: z.number().min(0).max(100),
  activeTicketsCount: z.number().int().min(0),
  slaBreachCount: z.number().int().min(0),
  lastQbrDate: z.string().datetime().optional(),
  nextScheduledReview: z.string().datetime().optional(),
  riskFactors: z.array(z.string()).default([]),
  assignedSuccessLeadEmail: z.string(),
  metadata: z.record(z.unknown()).default({}),
  updatedAt: z.string().datetime()
});
export type PartnerHealthDto = z.infer<typeof PartnerHealthDtoSchema>;

export const SuccessCheckinDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  checkinType: CheckinTypeSchema,
  status: CheckinStatusSchema,
  scheduledDate: z.string().datetime(),
  conductedDate: z.string().datetime().optional(),
  hostLeadEmail: z.string(),
  attendeeNames: z.array(z.string()).default([]),
  summaryNotes: z.string().optional(),
  actionItems: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SuccessCheckinDto = z.infer<typeof SuccessCheckinDtoSchema>;

// Transition & Modification Requests
export const TransitionTicketRequestSchema = z.object({
  toStatus: TicketStatusSchema,
  resolutionNotes: z.string().optional(),
  reason: z.string().min(3)
});
export type TransitionTicketRequest = z.infer<typeof TransitionTicketRequestSchema>;

export const CreateTicketCommentRequestSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1),
  isInternalOnly: z.boolean().default(false)
});
export type CreateTicketCommentRequest = z.infer<typeof CreateTicketCommentRequestSchema>;
