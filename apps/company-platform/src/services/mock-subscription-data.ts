import type {
  SubscriptionDto,
  BillingAccountDto,
  InvoiceDto,
  PaymentRecordDto
} from '@docsearch/api-contracts';

/**
 * Day-0 Clean Slate: Zero fake subscriptions, accounts, or invoices.
 */
export const mockSubscriptions: SubscriptionDto[] = [];
export const mockBillingAccounts: BillingAccountDto[] = [];
export const mockInvoices: InvoiceDto[] = [];
export const mockPaymentRecords: PaymentRecordDto[] = [];
