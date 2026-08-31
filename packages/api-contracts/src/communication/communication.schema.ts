import { z } from 'zod';

export const ContentStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
  'RETRACTED'
]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ContentTypeSchema = z.enum([
  'PLATFORM_ANNOUNCEMENT',
  'RELEASE_BROADCAST',
  'OPERATIONAL_BULLETIN',
  'POLICY_UPDATE'
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const TargetAudienceSchema = z.enum([
  'ALL_PARTNERS',
  'ENTERPRISE_TIER_ONLY',
  'CLINIC_TIER_ONLY',
  'SPECIFIC_PARTNERS',
  'SYSTEM_ADMINS_ONLY'
]);
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;

export const NotificationChannelSchema = z.enum([
  'IN_APP_BANNER',
  'EMAIL_NOTIFICATION',
  'API_WEBHOOK',
  'ALL_CHANNELS'
]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const DeliveryStatusSchema = z.enum([
  'PENDING',
  'DISPATCHED',
  'DELIVERED',
  'FAILED'
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

// DTOs
export const ContentItemDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  slug: z.string().min(3),
  type: ContentTypeSchema,
  status: ContentStatusSchema,
  targetAudience: TargetAudienceSchema,
  targetPartnerIds: z.array(z.string().uuid()).default([]),
  summary: z.string().min(5),
  bodyMarkdown: z.string().min(5),
  versionTag: z.string().optional(),
  pinned: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
  authorEmail: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ContentItemDto = z.infer<typeof ContentItemDtoSchema>;

export const NotificationTemplateDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(3),
  name: z.string().min(3),
  channel: NotificationChannelSchema,
  subjectTemplate: z.string().min(3),
  bodyTemplate: z.string().min(5),
  variables: z.array(z.string()).default([]),
  status: z.enum(['ACTIVE', 'DEPRECATED']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type NotificationTemplateDto = z.infer<typeof NotificationTemplateDtoSchema>;

export const DispatchRecordDtoSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  contentItemTitle: z.string(),
  partnerId: z.string().uuid().optional(),
  partnerTradeName: z.string().optional(),
  recipientEmail: z.string(),
  channel: NotificationChannelSchema,
  deliveryStatus: DeliveryStatusSchema,
  dispatchedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type DispatchRecordDto = z.infer<typeof DispatchRecordDtoSchema>;

// Transition & Creation Requests
export const TransitionContentStatusRequestSchema = z.object({
  toStatus: ContentStatusSchema,
  reason: z.string().min(3)
});
export type TransitionContentStatusRequest = z.infer<typeof TransitionContentStatusRequestSchema>;

export const TriggerDispatchRequestSchema = z.object({
  contentItemId: z.string().uuid(),
  channel: NotificationChannelSchema,
  reason: z.string().min(3)
});
export type TriggerDispatchRequest = z.infer<typeof TriggerDispatchRequestSchema>;
