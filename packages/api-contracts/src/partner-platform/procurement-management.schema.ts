import { z } from 'zod';

/**
 * ============================================================================
 * PHASE 2.11: PROCUREMENT, SUPPLY CHAIN & VENDOR MANAGEMENT ENUMS & TYPES
 * ============================================================================
 */

export const VendorCategorySchema = z.enum([
  'PHARMACEUTICALS',
  'SURGICAL_DISPOSABLES',
  'LABORATORY_REAGENTS',
  'MEDICAL_EQUIPMENT',
  'PPE_SAFETY',
  'GENERAL_SUPPLIES',
  'IT_BIOMEDICAL'
]);
export type VendorCategory = z.infer<typeof VendorCategorySchema>;

export const VendorTypeSchema = z.enum([
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'DIRECT_IMPORTER',
  'LOCAL_SUPPLIER',
  'SERVICE_PROVIDER'
]);
export type VendorType = z.infer<typeof VendorTypeSchema>;

export const VendorStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'BLACKLISTED',
  'INACTIVE'
]);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VendorRiskClassificationSchema = z.enum([
  'LOW_RISK',
  'MEDIUM_RISK',
  'HIGH_RISK',
  'CRITICAL'
]);
export type VendorRiskClassification = z.infer<typeof VendorRiskClassificationSchema>;

export const ContractStatusSchema = z.enum([
  'DRAFT',
  'REVIEW',
  'APPROVAL',
  'ACTIVE',
  'EXPIRING',
  'EXPIRED',
  'TERMINATED'
]);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const ProcurementItemCategorySchema = z.enum([
  'MEDICINE',
  'SURGICAL_CONSUMABLE',
  'LAB_REAGENT',
  'DIAGNOSTIC_KIT',
  'MEDICAL_DEVICE',
  'PPE_SUPPLY',
  'GENERAL_HOSPITAL',
  'IT_BIOMEDICAL'
]);
export type ProcurementItemCategory = z.infer<typeof ProcurementItemCategorySchema>;

export const RequisitionPrioritySchema = z.enum([
  'ROUTINE',
  'URGENT',
  'EMERGENCY'
]);
export type RequisitionPriority = z.infer<typeof RequisitionPrioritySchema>;

export const RequisitionStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'CONVERTED_TO_PO',
  'CANCELLED'
]);
export type RequisitionStatus = z.infer<typeof RequisitionStatusSchema>;

export const ApprovalStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELEGATED',
  'RETURNED_FOR_CORRECTION'
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const PurchaseOrderStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT_TO_VENDOR',
  'ACKNOWLEDGED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CLOSED',
  'CANCELLED'
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const GoodsReceiptStatusSchema = z.enum([
  'PENDING_INSPECTION',
  'INSPECTED_PASSED',
  'INSPECTED_FAILED',
  'PARTIALLY_ACCEPTED',
  'COMPLETED',
  'QUARANTINED'
]);
export type GoodsReceiptStatus = z.infer<typeof GoodsReceiptStatusSchema>;

export const QualityInspectionStatusSchema = z.enum([
  'PENDING_INSPECTION',
  'PASSED',
  'FAILED',
  'PARTIAL_PASS',
  'QUARANTINED'
]);
export type QualityInspectionStatus = z.infer<typeof QualityInspectionStatusSchema>;

export const VendorReturnStatusSchema = z.enum([
  'DRAFT',
  'REQUESTED',
  'APPROVED',
  'SENT',
  'ACKNOWLEDGED',
  'CREDIT_PENDING',
  'CLOSED'
]);
export type VendorReturnStatus = z.infer<typeof VendorReturnStatusSchema>;

export const InvoiceMatchingStatusSchema = z.enum([
  'PENDING_MATCH',
  'MATCHED_2WAY',
  'MATCHED_3WAY',
  'VARIANCE_FLAGGED',
  'APPROVED_MANUAL',
  'REJECTED'
]);
export type InvoiceMatchingStatus = z.infer<typeof InvoiceMatchingStatusSchema>;

export const PurchaseInvoicePaymentStatusSchema = z.enum([
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'ON_HOLD',
  'DISPUTED',
  'CANCELLED'
]);
export type PurchaseInvoicePaymentStatus = z.infer<typeof PurchaseInvoicePaymentStatusSchema>;

export const ProcurementExceptionTypeSchema = z.enum([
  'PRICE_OVERCHARGE',
  'QUANTITY_DISCREPANCY',
  'QUALITY_FAILURE',
  'DAMAGED_GOODS',
  'UNAUTHORIZED_PO',
  'DUPLICATE_BILLING',
  'UNAPPROVED_EXPENSE'
]);
export type ProcurementExceptionType = z.infer<typeof ProcurementExceptionTypeSchema>;

export const ProcurementExceptionSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type ProcurementExceptionSeverity = z.infer<typeof ProcurementExceptionSeveritySchema>;

export const ProcurementExceptionStatusSchema = z.enum([
  'OPEN',
  'UNDER_INVESTIGATION',
  'WAIVED_APPROVED',
  'VENDOR_CREDITED',
  'ESCALATED',
  'CLOSED'
]);
export type ProcurementExceptionStatus = z.infer<typeof ProcurementExceptionStatusSchema>;

/**
 * ============================================================================
 * PHASE 2.11 DTO INTERFACES (exactOptionalPropertyTypes compatible)
 * ============================================================================
 */

export interface ProcurementVendorDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  vendorCode: string;
  legalName: string;
  tradeName?: string | null | undefined;
  vendorCategory: VendorCategory;
  vendorType: VendorType;
  contactPerson?: string | null | undefined;
  contactEmail?: string | null | undefined;
  contactPhone?: string | null | undefined;
  address?: string | null | undefined;
  taxId?: string | null | undefined;
  gstNumber?: string | null | undefined;
  panNumber?: string | null | undefined;
  bankDetails?: Record<string, unknown> | null | undefined;
  status: VendorStatus;
  riskClassification: VendorRiskClassification;
  rating: number;
  paymentTermsDays: number;
  leadTimeDays: number;
  minimumOrderValue: number;
  deliverySlaHours: number;
  notes?: string | null | undefined;
  activeContractCount: number;
  openPoCount: number;
  totalSpendYtd: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementVendorContactDto {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  designation?: string | null | undefined;
  department?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProcurementVendorDocumentDto {
  id: string;
  tenantId: string;
  vendorId: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  expiryDate?: string | null | undefined;
  verificationStatus: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProcurementVendorContractDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  vendorId: string;
  vendorName: string;
  contractNumber: string;
  title: string;
  version: number;
  effectiveDate: string;
  expiryDate: string;
  renewalDate?: string | null | undefined;
  status: ContractStatus;
  terms?: string | null | undefined;
  slaDays: number;
  totalAgreedValue: number;
  approvedBy?: string | null | undefined;
  approvedAt?: string | null | undefined;
  documentUrl?: string | null | undefined;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementVendorContractItemDto {
  id: string;
  tenantId: string;
  contractId: string;
  itemCode: string;
  itemName: string;
  contractedUnitPrice: number;
  discountPercentage: number;
  taxRate: number;
  minimumOrderQuantity: number;
  deliveryLeadDays: number;
  createdAt: string;
}

export interface ProcurementItemDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  itemCode: string;
  sku?: string | null | undefined;
  barcode?: string | null | undefined;
  itemName: string;
  genericName?: string | null | undefined;
  category: ProcurementItemCategory;
  subcategory?: string | null | undefined;
  unit: string;
  packSize: number;
  manufacturer?: string | null | undefined;
  reorderLevel: number;
  safetyStock: number;
  minStock: number;
  maxStock: number;
  leadTimeDays: number;
  standardCost: number;
  isControlled: boolean;
  isExpiryApplicable: boolean;
  isBatchApplicable: boolean;
  isSerialApplicable: boolean;
  medicationCatalogId?: string | null | undefined;
  status: string;
  currentStock: number;
  preferredVendorName?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementItemVendorMappingDto {
  id: string;
  tenantId: string;
  procurementItemId: string;
  vendorId: string;
  vendorName: string;
  vendorCatalogNumber?: string | null | undefined;
  standardPrice: number;
  discountRate: number;
  leadTimeDays: number;
  isPreferred: boolean;
  createdAt: string;
}

export interface PurchaseRequisitionItemDto {
  id: string;
  tenantId: string;
  requisitionId: string;
  procurementItemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  approvedQuantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedCost: number;
  remarks?: string | null | undefined;
  createdAt: string;
}

export interface PurchaseRequisitionDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  requisitionNumber: string;
  departmentId?: string | null | undefined;
  departmentName: string;
  storeName: string;
  requestedBy: string;
  requiredByDate: string;
  priority: RequisitionPriority;
  isEmergency: boolean;
  status: RequisitionStatus;
  totalEstimatedAmount: number;
  reason: string;
  justification?: string | null | undefined;
  suggestedVendorId?: string | null | undefined;
  suggestedVendorName?: string | null | undefined;
  approvedBy?: string | null | undefined;
  approvedAt?: string | null | undefined;
  items: PurchaseRequisitionItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementApprovalDto {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  tier: number;
  approverRole: string;
  approverId: string;
  status: ApprovalStatus;
  comments?: string | null | undefined;
  decidedAt?: string | null | undefined;
  createdAt: string;
}

export interface PurchaseOrderItemDto {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  procurementItemId: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

export interface PurchaseOrderDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  poNumber: string;
  requisitionId?: string | null | undefined;
  requisitionNumber?: string | null | undefined;
  vendorId: string;
  vendorName: string;
  contractId?: string | null | undefined;
  contractNumber?: string | null | undefined;
  status: PurchaseOrderStatus;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalNetAmount: number;
  deliveryLocation: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  shippingTerms?: string | null | undefined;
  isEmergency: boolean;
  approvedBy?: string | null | undefined;
  approvedAt?: string | null | undefined;
  sentAt?: string | null | undefined;
  notes?: string | null | undefined;
  items: PurchaseOrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptItemDto {
  id: string;
  tenantId: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  procurementItemId: string;
  itemCode: string;
  itemName: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  shortQuantity: number;
  excessQuantity: number;
  damagedQuantity: number;
  unitPrice: number;
  batchNumber?: string | null | undefined;
  expiryDate?: string | null | undefined;
  serialNumber?: string | null | undefined;
  barcode?: string | null | undefined;
  mfgDate?: string | null | undefined;
  status: string;
  createdAt: string;
}

export interface GoodsReceiptDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  deliveryDocumentNumber?: string | null | undefined;
  invoiceReferenceNumber?: string | null | undefined;
  receivedDate: string;
  receivingDepartment: string;
  storeName: string;
  receivedBy: string;
  status: GoodsReceiptStatus;
  totalReceivedItems: number;
  totalAcceptedItems: number;
  totalRejectedItems: number;
  remarks?: string | null | undefined;
  items: GoodsReceiptItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementInspectionItemDto {
  id: string;
  tenantId: string;
  inspectionId: string;
  goodsReceiptItemId: string;
  procurementItemId: string;
  itemCode: string;
  itemName: string;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  quarantinedQuantity: number;
  defectCategory?: string | null | undefined;
  rejectionReason?: string | null | undefined;
  checklist?: Record<string, boolean> | null | undefined;
  status: string;
  createdAt: string;
}

export interface ProcurementInspectionDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  inspectionNumber: string;
  goodsReceiptId: string;
  grnNumber: string;
  inspectorId: string;
  inspectionDate: string;
  status: QualityInspectionStatus;
  totalInspectedQuantity: number;
  totalPassedQuantity: number;
  totalFailedQuantity: number;
  totalQuarantinedQuantity: number;
  quarantineReason?: string | null | undefined;
  notes?: string | null | undefined;
  items: ProcurementInspectionItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorReturnItemDto {
  id: string;
  tenantId: string;
  vendorReturnId: string;
  procurementItemId: string;
  itemCode: string;
  itemName: string;
  returnQuantity: number;
  unitCost: number;
  totalAmount: number;
  batchNumber?: string | null | undefined;
  serialNumber?: string | null | undefined;
  reason: string;
  createdAt: string;
}

export interface VendorReturnDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  returnNumber: string;
  vendorId: string;
  vendorName: string;
  goodsReceiptId?: string | null | undefined;
  grnNumber?: string | null | undefined;
  purchaseOrderId?: string | null | undefined;
  poNumber?: string | null | undefined;
  status: VendorReturnStatus;
  totalReturnAmount: number;
  reason: string;
  vendorAcknowledgementRef?: string | null | undefined;
  creditNoteRef?: string | null | undefined;
  requestedBy: string;
  approvedBy?: string | null | undefined;
  items: VendorReturnItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId?: string | null | undefined;
  poNumber?: string | null | undefined;
  goodsReceiptId?: string | null | undefined;
  grnNumber?: string | null | undefined;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  matchingStatus: InvoiceMatchingStatus;
  paymentStatus: PurchaseInvoicePaymentStatus;
  paymentReference?: string | null | undefined;
  paymentDueDate?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceMatchDto {
  id: string;
  tenantId: string;
  purchaseInvoiceId: string;
  purchaseOrderId?: string | null | undefined;
  goodsReceiptId?: string | null | undefined;
  matchingType: string;
  status: string;
  poAmount: number;
  grnAmount: number;
  invoiceAmount: number;
  quantityVariance: number;
  priceVariance: number;
  taxVariance: number;
  totalVariance: number;
  discrepancyDetails?: string | null | undefined;
  matchedBy: string;
  matchedAt: string;
  createdAt: string;
}

export interface ProcurementExceptionDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  exceptionNumber: string;
  exceptionType: ProcurementExceptionType;
  severity: ProcurementExceptionSeverity;
  status: ProcurementExceptionStatus;
  purchaseOrderId?: string | null | undefined;
  goodsReceiptId?: string | null | undefined;
  purchaseInvoiceId?: string | null | undefined;
  vendorId?: string | null | undefined;
  vendorName?: string | null | undefined;
  description: string;
  varianceAmount: number;
  assignedTo?: string | null | undefined;
  resolution?: string | null | undefined;
  resolvedBy?: string | null | undefined;
  resolvedAt?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementAuditTraceDto {
  id: string;
  traceId: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  actorId: string;
  actorRole: string;
  operation: string;
  entityType: string;
  entityId: string;
  purchaseOrderId?: string | null | undefined;
  goodsReceiptId?: string | null | undefined;
  purchaseInvoiceId?: string | null | undefined;
  vendorId?: string | null | undefined;
  financialImpact: number;
  reason: string;
  timestamp: string;
  operationStatus: string;
  hashPointer?: string | null | undefined;
  createdAt: string;
}

export interface ProcurementOverviewMetricsDto {
  totalSpendYtd: number;
  activeVendorCount: number;
  openRequisitionsCount: number;
  pendingApprovalsCount: number;
  activePurchaseOrdersCount: number;
  pendingGrnCount: number;
  inspectionBacklogCount: number;
  openExceptionsCount: number;
  expiringContractsCount: number;
  emergencyPurchasesCount: number;
  criticalStockAlertsCount: number;
  outstandingInvoicesAmount: number;
  averageLeadTimeDays: number;
  vendorComplianceRate: number;
}

export interface ProcurementAnalyticsDto {
  spendByCategory: { category: string; amount: number; percentage: number }[];
  spendByDepartment: { department: string; amount: number; percentage: number }[];
  topVendorsBySpend: { vendorName: string; spend: number; poCount: number; rating: number }[];
  monthlySpendTrend: { month: string; spend: number; budget: number }[];
  poLifecycleStats: { status: string; count: number; value: number }[];
}

/**
 * ============================================================================
 * PHASE 2.11 ZOD REQUEST SCHEMAS
 * ============================================================================
 */

export const CreateVendorSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  vendorCode: z.string().min(2).max(50),
  legalName: z.string().min(2).max(255),
  tradeName: z.string().max(255).optional(),
  vendorCategory: VendorCategorySchema,
  vendorType: VendorTypeSchema,
  contactPerson: z.string().max(150).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  address: z.string().optional(),
  taxId: z.string().max(100).optional(),
  gstNumber: z.string().max(100).optional(),
  panNumber: z.string().max(100).optional(),
  paymentTermsDays: z.number().int().min(0).default(30),
  leadTimeDays: z.number().int().min(1).default(3),
  minimumOrderValue: z.number().min(0).default(0),
  deliverySlaHours: z.number().int().min(1).default(48),
  riskClassification: VendorRiskClassificationSchema.default('LOW_RISK'),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreateVendorRequest = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = z.object({
  tenantId: z.string().uuid(),
  vendorId: z.string().uuid(),
  legalName: z.string().min(2).max(255).optional(),
  tradeName: z.string().max(255).optional(),
  vendorCategory: VendorCategorySchema.optional(),
  vendorType: VendorTypeSchema.optional(),
  contactPerson: z.string().max(150).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  address: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(1).optional(),
  minimumOrderValue: z.number().min(0).optional(),
  riskClassification: VendorRiskClassificationSchema.optional(),
  status: VendorStatusSchema.optional(),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type UpdateVendorRequest = z.infer<typeof UpdateVendorSchema>;

export const CreateVendorContractSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  vendorId: z.string().uuid(),
  contractNumber: z.string().min(2).max(100),
  title: z.string().min(2).max(255),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  renewalDate: z.string().datetime().optional(),
  slaDays: z.number().int().min(1).default(2),
  totalAgreedValue: z.number().min(0).default(0),
  terms: z.string().optional(),
  documentUrl: z.string().optional(),
  items: z.array(
    z.object({
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      contractedUnitPrice: z.number().positive(),
      discountPercentage: z.number().min(0).max(100).default(0),
      taxRate: z.number().min(0).max(100).default(0),
      minimumOrderQuantity: z.number().int().min(1).default(1),
      deliveryLeadDays: z.number().int().min(1).default(3)
    })
  ).default([]),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreateVendorContractRequest = z.infer<typeof CreateVendorContractSchema>;

export const CreateProcurementItemSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  itemCode: z.string().min(2).max(50),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(100).optional(),
  itemName: z.string().min(2).max(255),
  genericName: z.string().max(255).optional(),
  category: ProcurementItemCategorySchema,
  subcategory: z.string().max(100).optional(),
  unit: z.string().min(1).max(50).default('UNIT'),
  packSize: z.number().int().min(1).default(1),
  manufacturer: z.string().max(255).optional(),
  reorderLevel: z.number().int().min(0).default(50),
  safetyStock: z.number().int().min(0).default(20),
  minStock: z.number().int().min(0).default(10),
  maxStock: z.number().int().min(1).default(500),
  leadTimeDays: z.number().int().min(1).default(3),
  standardCost: z.number().min(0).default(0),
  isControlled: z.boolean().default(false),
  isExpiryApplicable: z.boolean().default(true),
  isBatchApplicable: z.boolean().default(true),
  isSerialApplicable: z.boolean().default(false),
  medicationCatalogId: z.string().uuid().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreateProcurementItemRequest = z.infer<typeof CreateProcurementItemSchema>;

export const CreatePurchaseRequisitionSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  departmentName: z.string().min(1),
  storeName: z.string().min(1),
  requestedBy: z.string().min(1),
  requiredByDate: z.string().datetime(),
  priority: RequisitionPrioritySchema.default('ROUTINE'),
  isEmergency: z.boolean().default(false),
  reason: z.string().min(3),
  justification: z.string().optional(),
  suggestedVendorId: z.string().uuid().optional(),
  suggestedVendorName: z.string().optional(),
  items: z.array(
    z.object({
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      quantity: z.number().int().positive(),
      unit: z.string().min(1),
      estimatedUnitPrice: z.number().positive(),
      remarks: z.string().optional()
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1)
});
export type CreatePurchaseRequisitionRequest = z.infer<typeof CreatePurchaseRequisitionSchema>;

export const ApprovePurchaseRequisitionSchema = z.object({
  tenantId: z.string().uuid(),
  requisitionId: z.string().uuid(),
  tier: z.number().int().min(1).default(1),
  approvedItems: z.array(
    z.object({
      itemId: z.string().uuid(),
      approvedQuantity: z.number().int().min(0)
    })
  ).optional(),
  comments: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type ApprovePurchaseRequisitionRequest = z.infer<typeof ApprovePurchaseRequisitionSchema>;

export const RejectPurchaseRequisitionSchema = z.object({
  tenantId: z.string().uuid(),
  requisitionId: z.string().uuid(),
  reason: z.string().min(3),
  actorId: z.string().min(1),
  actorRole: z.string().min(1)
});
export type RejectPurchaseRequisitionRequest = z.infer<typeof RejectPurchaseRequisitionSchema>;

export const CreatePurchaseOrderSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
  requisitionNumber: z.string().optional(),
  vendorId: z.string().uuid(),
  vendorName: z.string().min(1),
  contractId: z.string().uuid().optional(),
  contractNumber: z.string().optional(),
  deliveryLocation: z.string().min(1),
  expectedDeliveryDate: z.string().datetime(),
  paymentTerms: z.string().default('NET_30'),
  shippingTerms: z.string().default('FOB_DESTINATION'),
  isEmergency: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      orderedQuantity: z.number().int().positive(),
      unit: z.string().min(1),
      unitPrice: z.number().positive(),
      discountAmount: z.number().min(0).default(0),
      taxAmount: z.number().min(0).default(0)
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreatePurchaseOrderRequest = z.infer<typeof CreatePurchaseOrderSchema>;

export const ApprovePurchaseOrderSchema = z.object({
  tenantId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  comments: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type ApprovePurchaseOrderRequest = z.infer<typeof ApprovePurchaseOrderSchema>;

export const SendPurchaseOrderSchema = z.object({
  tenantId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  transmissionMethod: z.enum(['EMAIL', 'EDI_GATEWAY', 'VENDOR_PORTAL', 'MANUAL_DISPATCH']).default('EMAIL'),
  recipientEmail: z.string().email().optional(),
  notes: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1)
});
export type SendPurchaseOrderRequest = z.infer<typeof SendPurchaseOrderSchema>;

export const CreateGoodsReceiptSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid(),
  deliveryDocumentNumber: z.string().optional(),
  invoiceReferenceNumber: z.string().optional(),
  receivedDate: z.string().datetime(),
  receivingDepartment: z.string().min(1),
  storeName: z.string().min(1),
  receivedBy: z.string().min(1),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      purchaseOrderItemId: z.string().uuid(),
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      receivedQuantity: z.number().int().min(0),
      unitPrice: z.number().positive(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().datetime().optional(),
      serialNumber: z.string().optional(),
      mfgDate: z.string().datetime().optional()
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreateGoodsReceiptRequest = z.infer<typeof CreateGoodsReceiptSchema>;

export const InspectGoodsReceiptSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  goodsReceiptId: z.string().uuid(),
  inspectorId: z.string().min(1),
  inspectionDate: z.string().datetime(),
  status: QualityInspectionStatusSchema,
  quarantineReason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      goodsReceiptItemId: z.string().uuid(),
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      inspectedQuantity: z.number().int().positive(),
      passedQuantity: z.number().int().min(0),
      failedQuantity: z.number().int().min(0),
      quarantinedQuantity: z.number().int().min(0),
      defectCategory: z.string().optional(),
      rejectionReason: z.string().optional(),
      checklist: z.record(z.boolean()).optional()
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type InspectGoodsReceiptRequest = z.infer<typeof InspectGoodsReceiptSchema>;

export const CreateVendorReturnSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  vendorId: z.string().uuid(),
  goodsReceiptId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  reason: z.string().min(3),
  requestedBy: z.string().min(1),
  items: z.array(
    z.object({
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      returnQuantity: z.number().int().positive(),
      unitCost: z.number().positive(),
      batchNumber: z.string().optional(),
      serialNumber: z.string().optional(),
      reason: z.string().min(3)
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreateVendorReturnRequest = z.infer<typeof CreateVendorReturnSchema>;

export const ApproveVendorReturnSchema = z.object({
  tenantId: z.string().uuid(),
  vendorReturnId: z.string().uuid(),
  vendorAcknowledgementRef: z.string().optional(),
  creditNoteRef: z.string().optional(),
  comments: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type ApproveVendorReturnRequest = z.infer<typeof ApproveVendorReturnSchema>;

export const CreatePurchaseInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  vendorInvoiceNumber: z.string().min(1).max(100),
  vendorId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  goodsReceiptId: z.string().uuid().optional(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CreatePurchaseInvoiceRequest = z.infer<typeof CreatePurchaseInvoiceSchema>;

export const MatchPurchaseInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  purchaseInvoiceId: z.string().uuid(),
  matchingType: z.enum(['TWO_WAY', 'THREE_WAY']).default('THREE_WAY'),
  tolerancePercentage: z.number().min(0).max(10).default(1.0),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type MatchPurchaseInvoiceRequest = z.infer<typeof MatchPurchaseInvoiceSchema>;

export const ResolveProcurementExceptionSchema = z.object({
  tenantId: z.string().uuid(),
  exceptionId: z.string().uuid(),
  resolutionStatus: ProcurementExceptionStatusSchema,
  resolution: z.string().min(5),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type ResolveProcurementExceptionRequest = z.infer<typeof ResolveProcurementExceptionSchema>;

export const CreateEmergencyPurchaseSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentName: z.string().min(1),
  storeName: z.string().min(1),
  vendorId: z.string().uuid(),
  clinicalReason: z.string().min(5),
  justification: z.string().min(10),
  deliveryLocation: z.string().min(1),
  items: z.array(
    z.object({
      procurementItemId: z.string().uuid(),
      itemCode: z.string().min(1),
      itemName: z.string().min(1),
      orderedQuantity: z.number().int().positive(),
      unit: z.string().min(1),
      unitPrice: z.number().positive()
    })
  ).min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1)
});
export type CreateEmergencyPurchaseRequest = z.infer<typeof CreateEmergencyPurchaseSchema>;

export const SuspendVendorSchema = z.object({
  tenantId: z.string().uuid(),
  vendorId: z.string().uuid(),
  reason: z.string().min(5),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type SuspendVendorRequest = z.infer<typeof SuspendVendorSchema>;

export const CancelPurchaseOrderSchema = z.object({
  tenantId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  reason: z.string().min(5),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  justification: z.string().min(3)
});
export type CancelPurchaseOrderRequest = z.infer<typeof CancelPurchaseOrderSchema>;
