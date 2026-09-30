import type {
  ProcurementVendorDto,
  ProcurementVendorContractDto,
  ProcurementItemDto,
  PurchaseRequisitionDto,
  PurchaseOrderDto,
  GoodsReceiptDto,
  ProcurementInspectionDto,
  VendorReturnDto,
  PurchaseInvoiceDto,
  PurchaseInvoiceMatchDto,
  ProcurementExceptionDto,
  ProcurementAuditTraceDto,
  ProcurementOverviewMetricsDto,
  ProcurementAnalyticsDto
} from '@docsearch/api-contracts';

export const MOCK_PROCUREMENT_VENDORS: ProcurementVendorDto[] = [];
export const MOCK_VENDOR_CONTRACTS: ProcurementVendorContractDto[] = [];
export const MOCK_PROCUREMENT_ITEMS: ProcurementItemDto[] = [];
export const MOCK_PURCHASE_REQUISITIONS: PurchaseRequisitionDto[] = [];
export const MOCK_PURCHASE_ORDERS: PurchaseOrderDto[] = [];
export const MOCK_GOODS_RECEIPTS: GoodsReceiptDto[] = [];
export const MOCK_PROCUREMENT_INSPECTIONS: ProcurementInspectionDto[] = [];
export const MOCK_PURCHASE_INVOICES: PurchaseInvoiceDto[] = [];
export const MOCK_PURCHASE_INVOICE_MATCHES: PurchaseInvoiceMatchDto[] = [];
export const MOCK_PROCUREMENT_EXCEPTIONS: ProcurementExceptionDto[] = [];
export const MOCK_VENDOR_RETURNS: VendorReturnDto[] = [];
export const MOCK_PROCUREMENT_AUDIT_TRACES: ProcurementAuditTraceDto[] = [];

export const MOCK_PROCUREMENT_METRICS: ProcurementOverviewMetricsDto = {
  totalSpendYtd: 0,
  activeVendorCount: 0,
  openRequisitionsCount: 0,
  pendingApprovalsCount: 0,
  activePurchaseOrdersCount: 0,
  pendingGrnCount: 0,
  inspectionBacklogCount: 0,
  openExceptionsCount: 0,
  expiringContractsCount: 0,
  emergencyPurchasesCount: 0,
  criticalStockAlertsCount: 0,
  outstandingInvoicesAmount: 0,
  averageLeadTimeDays: 0,
  vendorComplianceRate: 100
};

export const MOCK_PROCUREMENT_ANALYTICS: ProcurementAnalyticsDto = {
  spendByCategory: [],
  spendByDepartment: [],
  topVendorsBySpend: [],
  monthlySpendTrend: [],
  poLifecycleStats: []
};
