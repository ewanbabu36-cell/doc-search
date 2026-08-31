import { z } from 'zod';

/**
 * Phase 1: Company Platform Contract Boundaries
 * Only platform governance, subscription, partner lifecycle, and telemetry contracts.
 */
export const CompanyPartnerOnboardSchema = z.object({
  organizationName: z.string().min(2).max(120),
  orgType: z.enum(['HOSPITAL_CHAIN', 'INDEPENDENT_HOSPITAL', 'CLINIC_NETWORK', 'SOLO_PRACTICE']),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8).max(20),
  taxId: z.string().min(3).max(50),
  planId: z.string().uuid()
});

export type CompanyPartnerOnboardInput = z.infer<typeof CompanyPartnerOnboardSchema>;

export const CompanySubscriptionEventSchema = z.object({
  tenantId: z.string().uuid(),
  event: z.enum(['PLAN_UPGRADED', 'PLAN_DOWNGRADED', 'SUSPENDED', 'CANCELLED']),
  effectiveDate: z.string().datetime(),
  entitlements: z.record(z.boolean())
});

export type CompanySubscriptionEvent = z.infer<typeof CompanySubscriptionEventSchema>;
