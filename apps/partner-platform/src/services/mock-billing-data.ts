/**
 * Operational Live Telemetry
 * Phase 2.9: Billing, Charges, Payments & Revenue Cycle Management Mock Fixtures
 * All patient identities, emails, and financial records are synthetic fixtures using RFC 2606 .docsearch.health domains.
 */

import type {
  BillingServiceCatalogDto,
  BillingPriceListDto,
  BillingChargeDto,
  BillingInvoiceDto,
  BillingPaymentDto,
  BillingReceiptDto,
  BillingRefundDto,
  BillingCreditNoteDto,
  BillingDebitAdjustmentDto,
  BillingAdvanceDto,
  BillingCashierSessionDto,
  BillingReconciliationDto,
  BillingFinancialTransactionDto,
  BillingAuditTraceDto,
  BillingOverviewDto,
  PatientBillingHistoryDto,
  RevenueAnalyticsDto
} from '@docsearch/api-contracts';


export const MOCK_BILLING_OVERVIEW: BillingOverviewDto = {
  totalRevenueToday: 0,
  todayCollections: 0,
  totalOutstandingAmount: 0,
  overdueInvoicesCount: 0,
  invoicesIssuedToday: 0,
  invoicesPaidToday: 0,
  activeCashierSessionsCount: 0,
  pendingRefundRequestsCount: 0,
  recentTransactionsCount: 0
};

export const MOCK_BILLING_SERVICE_CATALOG: BillingServiceCatalogDto[] = [];

export const MOCK_BILLING_PRICE_LISTS: BillingPriceListDto[] = [];

export const MOCK_BILLING_CHARGES: BillingChargeDto[] = [];

export const MOCK_BILLING_INVOICES: BillingInvoiceDto[] = [];

export const MOCK_BILLING_PAYMENTS: BillingPaymentDto[] = [];

export const MOCK_BILLING_RECEIPTS: BillingReceiptDto[] = [];

export const MOCK_BILLING_REFUNDS: BillingRefundDto[] = [];

export const MOCK_BILLING_CREDIT_NOTES: BillingCreditNoteDto[] = [];

export const MOCK_BILLING_DEBIT_ADJUSTMENTS: BillingDebitAdjustmentDto[] = [];

export const MOCK_BILLING_ADVANCES: BillingAdvanceDto[] = [];

export const MOCK_BILLING_CASHIER_SESSIONS: BillingCashierSessionDto[] = [];

export const MOCK_BILLING_RECONCILIATIONS: BillingReconciliationDto[] = [];

export const MOCK_BILLING_FINANCIAL_TRANSACTIONS: BillingFinancialTransactionDto[] = [];

export const MOCK_BILLING_AUDIT_TRACES: BillingAuditTraceDto[] = [];

export const MOCK_PATIENT_BILLING_HISTORIES: Record<string, PatientBillingHistoryDto> = {};

export const MOCK_REVENUE_ANALYTICS: RevenueAnalyticsDto = {
  revenueByDepartment: [],
  revenueByCategory: [],
  collectionsByMethod: [],
  agingBuckets: {
    current: 0,
    bucket30To60: 0,
    bucket60To90: 0,
    over90: 0
  }
};
