import { z } from 'zod';

export const LeadStatusSchema = z.enum([
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'DISCOVERY',
  'CONVERTED',
  'DISQUALIFIED'
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadSourceSchema = z.enum([
  'INBOUND_WEB',
  'HEALTHCARE_CONFERENCE',
  'PARTNER_REFERRAL',
  'OUTBOUND_CAMPAIGN',
  'DIRECT_EXECUTIVE_CONTACT',
  'ORGANIC_SEARCH'
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const OpportunityStageSchema = z.enum([
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
]);
export type OpportunityStage = z.infer<typeof OpportunityStageSchema>;

export const OpportunityPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type OpportunityPriority = z.infer<typeof OpportunityPrioritySchema>;

export const CampaignStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
]);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CampaignTypeSchema = z.enum([
  'ENTERPRISE_HOSPITAL_OUTREACH',
  'CLINIC_SUMMIT_INVITATION',
  'DIGITAL_HEALTH_SHOWCASE',
  'PRODUCT_RELEASE_ANNOUNCEMENT',
  'PARTNER_EXPANSION'
]);
export type CampaignType = z.infer<typeof CampaignTypeSchema>;

export const MarketingActivityTypeSchema = z.enum([
  'CAMPAIGN_OUTREACH',
  'PARTNER_DISCOVERY_CALL',
  'EXECUTIVE_DEMO',
  'EVENT_SPONSORSHIP',
  'CONTENT_DISTRIBUTION',
  'FOLLOW_UP_MEETING'
]);
export type MarketingActivityType = z.infer<typeof MarketingActivityTypeSchema>;

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// DTOs
export const LeadDtoSchema = z.object({
  id: z.string().uuid(),
  organizationName: z.string().min(2),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  contactRoleTitle: z.string().optional(),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  assignedOwnerEmail: z.string(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  lastActivityDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type LeadDto = z.infer<typeof LeadDtoSchema>;

export const OpportunityDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  partnerId: z.string().uuid().optional(),
  partnerTradeName: z.string().optional(),
  leadId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  productName: z.string().optional(),
  targetPlanId: z.string().uuid().optional(),
  targetPlanName: z.string().optional(),
  stage: OpportunityStageSchema,
  priority: OpportunityPrioritySchema,
  assignedOwnerEmail: z.string(),
  expectedCloseDate: z.string().datetime().optional(),
  nextAction: z.string().optional(),
  lostReason: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OpportunityDto = z.infer<typeof OpportunityDtoSchema>;

export const CampaignDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  type: CampaignTypeSchema,
  status: CampaignStatusSchema,
  targetSegment: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ownerEmail: z.string(),
  description: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type CampaignDto = z.infer<typeof CampaignDtoSchema>;

export const MarketingActivityDtoSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  campaignName: z.string().optional(),
  partnerId: z.string().uuid().optional(),
  partnerTradeName: z.string().optional(),
  leadId: z.string().uuid().optional(),
  activityType: MarketingActivityTypeSchema,
  title: z.string(),
  description: z.string(),
  recordedByEmail: z.string(),
  activityDate: z.string().datetime(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type MarketingActivityDto = z.infer<typeof MarketingActivityDtoSchema>;

export const SalesTaskDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2),
  leadId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  partnerId: z.string().uuid().optional(),
  relatedEntityName: z.string().optional(),
  assignedUserEmail: z.string(),
  priority: TaskPrioritySchema,
  dueDate: z.string().datetime(),
  status: TaskStatusSchema,
  completionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SalesTaskDto = z.infer<typeof SalesTaskDtoSchema>;

// Transition Requests
export const TransitionLeadRequestSchema = z.object({
  toStatus: LeadStatusSchema,
  reason: z.string().min(3)
});
export type TransitionLeadRequest = z.infer<typeof TransitionLeadRequestSchema>;

export const TransitionOpportunityRequestSchema = z.object({
  toStage: OpportunityStageSchema,
  reason: z.string().min(3)
});
export type TransitionOpportunityRequest = z.infer<typeof TransitionOpportunityRequestSchema>;
