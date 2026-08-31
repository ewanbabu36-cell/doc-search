import { z } from 'zod';

export const PartnerLifecycleStatusSchema = z.enum([
  'LEAD',
  'PROSPECT',
  'ONBOARDING',
  'VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'OFFBOARDED'
]);

export type PartnerLifecycleStatus = z.infer<typeof PartnerLifecycleStatusSchema>;

export const PartnerTypeSchema = z.enum([
  'HOSPITAL_NETWORK',
  'CLINIC_GROUP',
  'SURGICAL_CENTER',
  'DIAGNOSTIC_LAB',
  'INDIVIDUAL_PRACTICE'
]);

export type PartnerType = z.infer<typeof PartnerTypeSchema>;

export const PartnerVerificationStatusSchema = z.enum([
  'PENDING',
  'IN_REVIEW',
  'VERIFIED',
  'REJECTED'
]);

export type PartnerVerificationStatus = z.infer<typeof PartnerVerificationStatusSchema>;

export const PartnerOnboardingStepSchema = z.enum([
  'ORGANIZATION_PROFILE',
  'BRANCH_CONFIGURATION',
  'SECURITY_VERIFICATION',
  'BAA_EXECUTION',
  'COMPLETED'
]);

export type PartnerOnboardingStep = z.infer<typeof PartnerOnboardingStepSchema>;

export const PartnerContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  roleTitle: z.string().optional()
});

export type PartnerContact = z.infer<typeof PartnerContactSchema>;

export const PartnerProfileDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  tenantSlug: z.string(),
  legalName: z.string(),
  tradeName: z.string(),
  partnerType: PartnerTypeSchema,
  lifecycleStatus: PartnerLifecycleStatusSchema,
  verificationStatus: PartnerVerificationStatusSchema,
  onboardingStep: PartnerOnboardingStepSchema,
  onboardingProgressPercent: z.number().min(0).max(100),
  primaryContact: PartnerContactSchema,
  branchCount: z.number().int().nonnegative(),
  userCount: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type PartnerProfileDto = z.infer<typeof PartnerProfileDtoSchema>;

export const PartnerTransitionRequestSchema = z.object({
  toStatus: PartnerLifecycleStatusSchema,
  reason: z.string().min(3, 'Reason must be at least 3 characters long')
});

export type PartnerTransitionRequest = z.infer<typeof PartnerTransitionRequestSchema>;

export const PartnerTransitionHistoryDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  fromStatus: PartnerLifecycleStatusSchema,
  toStatus: PartnerLifecycleStatusSchema,
  actorEmail: z.string(),
  reason: z.string(),
  timestamp: z.string().datetime()
});

export type PartnerTransitionHistoryDto = z.infer<typeof PartnerTransitionHistoryDtoSchema>;
