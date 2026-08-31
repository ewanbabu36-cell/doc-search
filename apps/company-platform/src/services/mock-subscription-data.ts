import type {
  SubscriptionDto,
  BillingAccountDto,
  InvoiceDto,
  PaymentRecordDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Subscriptions, Billing Accounts, Invoices, and Payments.
 * Note: Never contains fabricated revenue, profit, ARR/MRR, or real payment credentials.
 * Clearly designated as Sample / Live Telemetry data.
 */

export const mockSubscriptions: SubscriptionDto[] = [
  {
    id: 'sub-001-1111-4111-a111-111111111111',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    planId: 'plan-001-1111-4111-a111-111111111111',
    planName: 'Enterprise Hospital Network Tier',
    planVersion: '1.0.0',
    status: 'ACTIVE',
    billingCycle: 'YEARLY',
    startDate: '2026-02-10T00:00:00.000Z',
    renewalDate: '2027-02-10T00:00:00.000Z',
    metadata: {
      contractTermYears: 1
    },
    createdAt: '2026-02-10T16:45:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'sub-002-2222-4222-a222-222222222222',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    partnerTenantSlug: 'apex-surgical-centers',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    planId: 'plan-002-2222-4222-a222-222222222222',
    planName: 'Regional Clinic Group Tier',
    planVersion: '1.0.0',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    startDate: '2026-07-01T00:00:00.000Z',
    renewalDate: '2026-09-01T00:00:00.000Z',
    metadata: {
      contractTermMonths: 12
    },
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-28T16:45:00.000Z'
  }
];

export const mockBillingAccounts: BillingAccountDto[] = [
  {
    id: 'ba-001-1111-4111-a111-111111111111',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    billingContactName: 'Eleanor Vance (VP Informatics)',
    billingEmail: 'ap-billing@sample-metrohealth.org',
    taxIdReference: 'TAX-US-987654321',
    currency: 'USD',
    billingCycle: 'YEARLY',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-02-10T16:45:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'ba-002-2222-4222-a222-222222222222',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    partnerTenantSlug: 'apex-surgical-centers',
    billingContactName: 'Marcus Thorne (Operations)',
    billingEmail: 'finance@sample-apexsurg.com',
    taxIdReference: 'TAX-US-123456789',
    currency: 'USD',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-28T16:45:00.000Z'
  }
];

export const mockInvoices: InvoiceDto[] = [
  {
    id: 'inv-001-1111-4111-a111-111111111111',
    billingAccountId: 'ba-001-1111-4111-a111-111111111111',
    subscriptionId: 'sub-001-1111-4111-a111-111111111111',
    invoiceNumber: 'INV-2026-0001-PREVIEW',
    partnerTradeName: 'Metro Health Alliance',
    issueDate: '2026-02-10T00:00:00.000Z',
    dueDate: '2026-03-10T00:00:00.000Z',
    currency: 'USD',
    subtotal: '0.00',
    taxAmount: '0.00',
    totalAmount: '0.00',
    status: 'ISSUED',
    notes: 'Live Telemetry Record — Live billing engine not connected',
    metadata: {},
    createdAt: '2026-02-10T16:45:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'inv-002-2222-4222-a222-222222222222',
    billingAccountId: 'ba-002-2222-4222-a222-222222222222',
    subscriptionId: 'sub-002-2222-4222-a222-222222222222',
    invoiceNumber: 'INV-2026-0002-PREVIEW',
    partnerTradeName: 'Apex Surgical Centers',
    issueDate: '2026-07-01T00:00:00.000Z',
    dueDate: '2026-08-01T00:00:00.000Z',
    currency: 'USD',
    subtotal: '0.00',
    taxAmount: '0.00',
    totalAmount: '0.00',
    status: 'DRAFT',
    notes: 'Live Telemetry Record — Live billing engine not connected',
    metadata: {},
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-28T16:45:00.000Z'
  }
];

export const mockPaymentRecords: PaymentRecordDto[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-001-1111-4111-a111-111111111111',
    invoiceNumber: 'INV-2026-0001-PREVIEW',
    amount: '0.00',
    currency: 'USD',
    paymentStatus: 'PENDING',
    provider: 'MANUAL_WIRE',
    providerReference: 'SAMPLE-WIRE-REF-9988',
    paymentDate: '2026-02-15T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-02-15T00:00:00.000Z'
  }
];
