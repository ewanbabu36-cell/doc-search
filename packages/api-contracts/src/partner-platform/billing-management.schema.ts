import { z } from 'zod';

/**
 * ============================================================================
 * PHASE 2.9: BILLING, CHARGES, PAYMENTS & REVENUE CYCLE MANAGEMENT (RCM)
 * API CONTRACTS & VALIDATION SCHEMAS
 * ============================================================================
 */

export const BillingInvoiceStatusEnum = z.enum([
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOIDED'
]);
export type BillingInvoiceStatus = z.infer<typeof BillingInvoiceStatusEnum>;

export const ChargeStatusEnum = z.enum([
  'PENDING',
  'CAPTURED',
  'INVOICED',
  'CANCELLED',
  'REVERSED'
]);
export type ChargeStatus = z.infer<typeof ChargeStatusEnum>;

export const BillingPaymentStatusEnum = z.enum([
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REVERSED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
]);
export type BillingPaymentStatus = z.infer<typeof BillingPaymentStatusEnum>;

export const RefundStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
]);
export type RefundStatus = z.infer<typeof RefundStatusEnum>;

export const CashierSessionStatusEnum = z.enum([
  'OPEN',
  'CLOSED',
  'RECONCILIATION_PENDING',
  'RECONCILED'
]);
export type CashierSessionStatus = z.infer<typeof CashierSessionStatusEnum>;

export const BillingPaymentMethodEnum = z.enum([
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'WALLET',
  'CHEQUE',
  'ONLINE',
  'OTHER'
]);
export type BillingPaymentMethod = z.infer<typeof BillingPaymentMethodEnum>;

export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);
export type DiscountType = z.infer<typeof DiscountTypeEnum>;

export const ChargeSourceDomainEnum = z.enum([
  'CLINICAL_CONSULTATION',
  'CLINICAL_INVESTIGATION',
  'PHARMACY',
  'PROCEDURE',
  'REGISTRATION',
  'EMERGENCY',
  'IPD',
  'GENERAL'
]);
export type ChargeSourceDomain = z.infer<typeof ChargeSourceDomainEnum>;

export const ServiceCategoryEnum = z.enum([
  'CONSULTATION',
  'INVESTIGATION',
  'PHARMACY',
  'PROCEDURE',
  'ROOM_BED',
  'EMERGENCY',
  'NURSING',
  'PACKAGE',
  'GENERAL'
]);
export type ServiceCategory = z.infer<typeof ServiceCategoryEnum>;

// ==========================================
// DTOs
// ==========================================

export interface BillingServiceCatalogDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  serviceCode: string;
  serviceName: string;
  description?: string | null | undefined;
  category: ServiceCategory;
  department?: string | null | undefined;
  serviceType: string;
  unit: string;
  basePrice: number;
  taxable: boolean;
  taxCode?: string | null | undefined;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPriceListItemDto {
  id: string;
  tenantId: string;
  priceListId: string;
  serviceCatalogId: string;
  serviceCode: string;
  serviceName: string;
  unitPrice: number;
  discountAllowed: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
}

export interface BillingPriceListDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  priceListCode: string;
  name: string;
  currency: string;
  status: string;
  items: BillingPriceListItemDto[];
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface BillingChargeItemDto {
  id: string;
  tenantId: string;
  chargeId: string;
  serviceCatalogId?: string | null | undefined;
  serviceCode?: string | null | undefined;
  description: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  sourceReference?: string | null | undefined;
  orderingDoctorId?: string | null | undefined;
  departmentId?: string | null | undefined;
  createdAt: string;
}

export interface BillingChargeDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterId?: string | null | undefined;
  consultationId?: string | null | undefined;
  sourceDomain: ChargeSourceDomain;
  sourceEntityId?: string | null | undefined;
  chargeNumber: string;
  status: ChargeStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  capturedBy: string;
  capturedAt: string;
  items: BillingChargeItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceItemDto {
  id: string;
  tenantId: string;
  invoiceId: string;
  chargeId?: string | null | undefined;
  chargeItemId?: string | null | undefined;
  serviceCatalogId?: string | null | undefined;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
}

export interface BillingDiscountDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  invoiceId: string;
  invoiceItemId?: string | null | undefined;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  reason: string;
  approvedBy: string;
  createdBy: string;
  createdAt: string;
}

export interface BillingInvoiceDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterId?: string | null | undefined;
  invoiceNumber: string;
  invoiceType: string;
  status: BillingInvoiceStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundingAdjustment: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  currency: string;
  issuedAt?: string | null | undefined;
  dueAt?: string | null | undefined;
  finalizedAt?: string | null | undefined;
  finalizedBy?: string | null | undefined;
  items: BillingInvoiceItemDto[];
  discounts: BillingDiscountDto[];
  payments: BillingPaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingPaymentAllocationDto {
  id: string;
  tenantId: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber?: string | undefined;
  allocatedAmount: number;
  createdAt: string;
}

export interface BillingPaymentDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  invoiceId?: string | null | undefined;
  invoiceNumber?: string | null | undefined;
  paymentNumber: string;
  paymentMethod: BillingPaymentMethod;
  amount: number;
  currency: string;
  referenceNumber?: string | null | undefined;
  status: BillingPaymentStatus;
  receivedBy: string;
  receivedAt: string;
  notes?: string | null | undefined;
  allocations: BillingPaymentAllocationDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingReceiptDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  paymentId: string;
  invoiceId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: BillingPaymentMethod;
  issuedBy: string;
  issuedAt: string;
  status: string;
  createdAt: string;
}

export interface BillingRefundDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  paymentId: string;
  invoiceId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  refundNumber: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  approvedBy?: string | null | undefined;
  processedBy?: string | null | undefined;
  processedAt?: string | null | undefined;
  notes?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCreditNoteDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  invoiceId: string;
  invoiceNumber?: string | undefined;
  patientId: string;
  patientName: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
  status: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingDebitAdjustmentDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  invoiceId: string;
  invoiceNumber?: string | undefined;
  patientId: string;
  patientName: string;
  adjustmentNumber: string;
  amount: number;
  reason: string;
  status: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAdvanceDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterId?: string | null | undefined;
  advanceNumber: string;
  amount: number;
  availableAmount: number;
  paymentId?: string | null | undefined;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCashierSessionDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  sessionNumber: string;
  openingBalance: number;
  cashReceived: number;
  cashRefunded: number;
  expectedClosingBalance: number;
  closingBalance?: number | null | undefined;
  status: CashierSessionStatus;
  openedAt: string;
  closedAt?: string | null | undefined;
  notes?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface BillingReconciliationDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  cashierSessionId: string;
  sessionNumber?: string | undefined;
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  status: string;
  reconciledBy: string;
  reconciledAt: string;
  remarks?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface BillingFinancialTransactionDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  transactionNumber: string;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  patientId?: string | null | undefined;
  patientName?: string | undefined;
  debit: number;
  credit: number;
  balanceImpact: number;
  currency: string;
  actorId: string;
  occurredAt: string;
  notes?: string | null | undefined;
  createdAt: string;
}

export interface BillingAuditTraceDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  traceId: string;
  correlationId: string;
  actorId: string;
  actorRole: string;
  operation: string;
  entityType: string;
  entityId: string;
  patientId?: string | null | undefined;
  invoiceId?: string | null | undefined;
  beforeSnapshot?: Record<string, unknown> | null | undefined;
  afterSnapshot?: Record<string, unknown> | null | undefined;
  financialImpact?: number | null | undefined;
  reason: string;
  operationStatus: string;
  timestamp: string;
}

export interface BillingOverviewDto {
  totalRevenueToday: number;
  todayCollections: number;
  totalOutstandingAmount: number;
  overdueInvoicesCount: number;
  invoicesIssuedToday: number;
  invoicesPaidToday: number;
  activeCashierSessionsCount: number;
  pendingRefundRequestsCount: number;
  recentTransactionsCount: number;
}

export interface PatientBillingHistoryDto {
  patientId: string;
  patientName: string;
  patientMrn: string;
  totalBilled: number;
  totalPaid: number;
  currentBalanceDue: number;
  availableAdvance: number;
  invoices: BillingInvoiceDto[];
  payments: BillingPaymentDto[];
  advances: BillingAdvanceDto[];
  receipts: BillingReceiptDto[];
}

export interface RevenueAnalyticsDto {
  revenueByDepartment: Array<{ department: string; amount: number; percentage: number }>;
  revenueByCategory: Array<{ category: string; amount: number; percentage: number }>;
  collectionsByMethod: Array<{ method: string; amount: number; count: number }>;
  agingBuckets: {
    current: number; // 0-30 days
    bucket30To60: number; // 31-60 days
    bucket60To90: number; // 61-90 days
    over90: number; // 90+ days
  };
}

// ==========================================
// MUTATION SCHEMAS & REQUEST TYPES
// ==========================================

export const CreateServiceCatalogSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  serviceCode: z.string().min(2).max(100),
  serviceName: z.string().min(2).max(255),
  description: z.string().optional(),
  category: ServiceCategoryEnum,
  department: z.string().optional(),
  serviceType: z.string().default('STANDARD'),
  unit: z.string().default('SERVICE'),
  basePrice: z.number().nonnegative(),
  taxable: z.boolean().default(false),
  taxCode: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateServiceCatalogRequest = z.infer<typeof CreateServiceCatalogSchema>;

export const UpdateServiceCatalogSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  serviceName: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  category: ServiceCategoryEnum.optional(),
  department: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  taxable: z.boolean().optional(),
  taxCode: z.string().optional(),
  active: z.boolean().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type UpdateServiceCatalogRequest = z.infer<typeof UpdateServiceCatalogSchema>;

export const CreatePriceListSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  priceListCode: z.string().min(2).max(100),
  name: z.string().min(2).max(255),
  currency: z.string().default('USD'),
  items: z.array(
    z.object({
      serviceCatalogId: z.string().uuid(),
      unitPrice: z.number().nonnegative(),
      discountAllowed: z.boolean().default(true)
    })
  ),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreatePriceListRequest = z.infer<typeof CreatePriceListSchema>;

export const CaptureChargeSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  sourceDomain: ChargeSourceDomainEnum,
  sourceEntityId: z.string().optional(),
  items: z.array(
    z.object({
      serviceCatalogId: z.string().uuid().optional(),
      serviceCode: z.string().optional(),
      description: z.string().min(2),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      discountAmount: z.number().nonnegative().default(0),
      taxAmount: z.number().nonnegative().default(0),
      sourceReference: z.string().optional(),
      orderingDoctorId: z.string().optional(),
      departmentId: z.string().optional()
    })
  ).min(1),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CaptureChargeRequest = z.infer<typeof CaptureChargeSchema>;

export const CreateInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string().uuid().optional(),
  invoiceType: z.string().default('OPD'),
  chargeIds: z.array(z.string().uuid()).optional(),
  items: z.array(
    z.object({
      chargeId: z.string().uuid().optional(),
      chargeItemId: z.string().uuid().optional(),
      serviceCatalogId: z.string().uuid().optional(),
      serviceCode: z.string(),
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      discountAmount: z.number().nonnegative().default(0),
      taxAmount: z.number().nonnegative().default(0)
    })
  ).min(1),
  dueDays: z.number().int().nonnegative().default(30),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceSchema>;

export const FinalizeInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type FinalizeInvoiceRequest = z.infer<typeof FinalizeInvoiceSchema>;

export const ApplyDiscountSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  invoiceId: z.string().uuid(),
  invoiceItemId: z.string().uuid().optional(),
  discountType: DiscountTypeEnum,
  discountValue: z.number().positive(),
  reason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ApplyDiscountRequest = z.infer<typeof ApplyDiscountSchema>;

export const RecordPaymentSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  paymentMethod: BillingPaymentMethodEnum,
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  referenceNumber: z.string().optional(),
  cashierSessionId: z.string().uuid().optional(),
  notes: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentSchema>;

export const AllocatePaymentSchema = z.object({
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type AllocatePaymentRequest = z.infer<typeof AllocatePaymentSchema>;

export const IssueReceiptSchema = z.object({
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type IssueReceiptRequest = z.infer<typeof IssueReceiptSchema>;

export const RequestRefundSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type RequestRefundRequest = z.infer<typeof RequestRefundSchema>;

export const ApproveRefundSchema = z.object({
  tenantId: z.string().uuid(),
  refundId: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ApproveRefundRequest = z.infer<typeof ApproveRefundSchema>;

export const ProcessRefundSchema = z.object({
  tenantId: z.string().uuid(),
  refundId: z.string().uuid(),
  paymentGatewayRef: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ProcessRefundRequest = z.infer<typeof ProcessRefundSchema>;

export const CreateCreditNoteSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  patientId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateCreditNoteRequest = z.infer<typeof CreateCreditNoteSchema>;

export const CreateDebitAdjustmentSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  patientId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateDebitAdjustmentRequest = z.infer<typeof CreateDebitAdjustmentSchema>;

export const CreateAdvanceSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string().optional(),
  patientMrn: z.string().optional(),
  encounterId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethod: BillingPaymentMethodEnum,
  referenceNumber: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateAdvanceRequest = z.infer<typeof CreateAdvanceSchema>;

export const OpenCashierSessionSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  cashierId: z.string(),
  cashierName: z.string(),
  openingBalance: z.number().nonnegative(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type OpenCashierSessionRequest = z.infer<typeof OpenCashierSessionSchema>;

export const CloseCashierSessionSchema = z.object({
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  closingBalance: z.number().nonnegative(),
  notes: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CloseCashierSessionRequest = z.infer<typeof CloseCashierSessionSchema>;

export const ReconcileCashierSessionSchema = z.object({
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  actualAmount: z.number().nonnegative(),
  remarks: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ReconcileCashierSessionRequest = z.infer<typeof ReconcileCashierSessionSchema>;

export const CancelInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  reason: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CancelInvoiceRequest = z.infer<typeof CancelInvoiceSchema>;

export const SearchBillingInvoicesSchema = z.object({
  tenantId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: BillingInvoiceStatusEnum.optional(),
  searchTerm: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type SearchBillingInvoicesRequest = z.infer<typeof SearchBillingInvoicesSchema>;

export const SearchBillingChargesSchema = z.object({
  tenantId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: ChargeStatusEnum.optional(),
  sourceDomain: ChargeSourceDomainEnum.optional(),
  searchTerm: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type SearchBillingChargesRequest = z.infer<typeof SearchBillingChargesSchema>;

export const QueryBillingAuditSchema = z.object({
  tenantId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  operation: z.string().optional(),
  actorId: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type QueryBillingAuditRequest = z.infer<typeof QueryBillingAuditSchema>;
