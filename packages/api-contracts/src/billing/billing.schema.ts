import { z } from 'zod';

export const SubscriptionStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED'
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const BillingCycleSchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']);
export type BillingCycle = z.infer<typeof BillingCycleSchema>;

export const BillingAccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
export type BillingAccountStatus = z.infer<typeof BillingAccountStatusSchema>;

export const InvoiceStatusSchema = z.enum([
  'DRAFT',
  'ISSUED',
  'PAID',
  'PARTIALLY_PAID',
  'OVERDUE',
  'VOID',
  'CANCELLED'
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// DTO Schemas
export const SubscriptionDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  partnerTenantSlug: z.string(),
  productId: z.string().uuid(),
  productName: z.string(),
  planId: z.string().uuid(),
  planName: z.string(),
  planVersion: z.string(),
  status: SubscriptionStatusSchema,
  startDate: z.string().datetime(),
  renewalDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cancellationDate: z.string().datetime().optional(),
  cancellationReason: z.string().optional(),
  billingCycle: BillingCycleSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

export const BillingAccountDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  partnerTenantSlug: z.string(),
  billingContactName: z.string(),
  billingEmail: z.string().email(),
  taxIdReference: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  billingCycle: BillingCycleSchema.default('MONTHLY'),
  status: BillingAccountStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BillingAccountDto = z.infer<typeof BillingAccountDtoSchema>;

export const InvoiceDtoSchema = z.object({
  id: z.string().uuid(),
  billingAccountId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  invoiceNumber: z.string(),
  partnerTradeName: z.string(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3),
  subtotal: z.string(),
  taxAmount: z.string(),
  totalAmount: z.string(),
  status: InvoiceStatusSchema,
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InvoiceDto = z.infer<typeof InvoiceDtoSchema>;

export const PaymentRecordDtoSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  amount: z.string(),
  currency: z.string().length(3),
  paymentStatus: PaymentStatusSchema,
  provider: z.string(),
  providerReference: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  failureReasonCode: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type PaymentRecordDto = z.infer<typeof PaymentRecordDtoSchema>;

export const TransitionSubscriptionRequestSchema = z.object({
  toStatus: SubscriptionStatusSchema,
  reason: z.string().min(3)
});
export type TransitionSubscriptionRequest = z.infer<typeof TransitionSubscriptionRequestSchema>;
