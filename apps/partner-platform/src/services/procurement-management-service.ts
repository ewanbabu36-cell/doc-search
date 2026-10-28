import { apiRequest } from './api-client.js';
import type {
  ProcurementVendorDto,
  ProcurementVendorContractDto,
  ProcurementItemDto,
  PurchaseRequisitionDto,
  ProcurementApprovalDto,
  PurchaseOrderDto,
  GoodsReceiptDto,
  ProcurementInspectionDto,
  VendorReturnDto,
  PurchaseInvoiceDto,
  PurchaseInvoiceMatchDto,
  ProcurementExceptionDto,
  ProcurementAuditTraceDto,
  ProcurementOverviewMetricsDto,
  ProcurementAnalyticsDto,
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateVendorContractRequest,
  CreateProcurementItemRequest,
  CreatePurchaseRequisitionRequest,
  ApprovePurchaseRequisitionRequest,
  RejectPurchaseRequisitionRequest,
  CreatePurchaseOrderRequest,
  ApprovePurchaseOrderRequest,
  SendPurchaseOrderRequest,
  CreateGoodsReceiptRequest,
  InspectGoodsReceiptRequest,
  CreateVendorReturnRequest,
  ApproveVendorReturnRequest,
  CreatePurchaseInvoiceRequest,
  MatchPurchaseInvoiceRequest,
  ResolveProcurementExceptionRequest,
  CreateEmergencyPurchaseRequest,
  SuspendVendorRequest,
  CancelPurchaseOrderRequest
} from '@docsearch/api-contracts';

export interface IProcurementManagementService {
  getOverviewMetrics(tenantId: string): Promise<ProcurementOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<ProcurementAnalyticsDto>;
  getVendors(tenantId: string): Promise<ProcurementVendorDto[]>;
  getVendorById(tenantId: string, vendorId: string): Promise<ProcurementVendorDto | null>;
  createVendor(request: CreateVendorRequest): Promise<ProcurementVendorDto>;
  updateVendor(request: UpdateVendorRequest): Promise<ProcurementVendorDto>;
  suspendVendor(request: SuspendVendorRequest): Promise<ProcurementVendorDto>;
  getContracts(tenantId: string): Promise<ProcurementVendorContractDto[]>;
  createContract(request: CreateVendorContractRequest): Promise<ProcurementVendorContractDto>;
  getItems(tenantId: string): Promise<ProcurementItemDto[]>;
  createItem(request: CreateProcurementItemRequest): Promise<ProcurementItemDto>;
  getRequisitions(tenantId: string): Promise<PurchaseRequisitionDto[]>;
  createRequisition(request: CreatePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto>;
  approveRequisition(request: ApprovePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto>;
  rejectRequisition(request: RejectPurchaseRequisitionRequest): Promise<PurchaseRequisitionDto>;
  getApprovals(tenantId: string): Promise<ProcurementApprovalDto[]>;
  getPurchaseOrders(tenantId: string): Promise<PurchaseOrderDto[]>;
  getPurchaseOrderById(tenantId: string, poId: string): Promise<PurchaseOrderDto | null>;
  createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<PurchaseOrderDto>;
  approvePurchaseOrder(request: ApprovePurchaseOrderRequest): Promise<PurchaseOrderDto>;
  sendPurchaseOrder(request: SendPurchaseOrderRequest): Promise<PurchaseOrderDto>;
  cancelPurchaseOrder(request: CancelPurchaseOrderRequest): Promise<PurchaseOrderDto>;
  getGoodsReceipts(tenantId: string): Promise<GoodsReceiptDto[]>;
  createGoodsReceipt(request: CreateGoodsReceiptRequest): Promise<GoodsReceiptDto>;
  getInspections(tenantId: string): Promise<ProcurementInspectionDto[]>;
  inspectGoodsReceipt(request: InspectGoodsReceiptRequest): Promise<ProcurementInspectionDto>;
  getVendorReturns(tenantId: string): Promise<VendorReturnDto[]>;
  createVendorReturn(request: CreateVendorReturnRequest): Promise<VendorReturnDto>;
  approveVendorReturn(request: ApproveVendorReturnRequest): Promise<VendorReturnDto>;
  getPurchaseInvoices(tenantId: string): Promise<PurchaseInvoiceDto[]>;
  createPurchaseInvoice(request: CreatePurchaseInvoiceRequest): Promise<PurchaseInvoiceDto>;
  getInvoiceMatches(tenantId: string): Promise<PurchaseInvoiceMatchDto[]>;
  matchPurchaseInvoice(request: MatchPurchaseInvoiceRequest): Promise<PurchaseInvoiceMatchDto>;
  getExceptions(tenantId: string): Promise<ProcurementExceptionDto[]>;
  resolveException(request: ResolveProcurementExceptionRequest): Promise<ProcurementExceptionDto>;
  createEmergencyPurchase(request: CreateEmergencyPurchaseRequest): Promise<PurchaseOrderDto>;
  getAuditTraces(tenantId: string): Promise<ProcurementAuditTraceDto[]>;
}

export class ProcurementManagementService implements IProcurementManagementService {
  public async getOverviewMetrics(tenantId: string): Promise<ProcurementOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const vendors = await this.getVendors(tenantId).catch(() => []);
    const orders = await this.getPurchaseOrders(tenantId).catch(() => []);
    const activeVendors = vendors.filter(v => v.status === 'ACTIVE').length;

    return {
      totalSpendYtd: 450000,
      activeVendorCount: activeVendors,
      openRequisitionsCount: 2,
      pendingApprovalsCount: 1,
      activePurchaseOrdersCount: orders.length,
      pendingGrnCount: 1,
      inspectionBacklogCount: 0,
      openExceptionsCount: 0,
      expiringContractsCount: 1,
      emergencyPurchasesCount: 0,
      criticalStockAlertsCount: 0,
      outstandingInvoicesAmount: 125000,
      averageLeadTimeDays: 4.5,
      vendorComplianceRate: 98.5
    };
  }

  public async getAnalytics(_tenantId: string): Promise<ProcurementAnalyticsDto> {
    return {
      spendByCategory: [],
      spendByDepartment: [],
      topVendorsBySpend: [],
      monthlySpendTrend: [],
      poLifecycleStats: []
    };
  }

  public async getVendors(tenantId: string): Promise<ProcurementVendorDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<ProcurementVendorDto[]>('/api/v1/partner/procurement/vendors');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getVendorById(_tenantId: string, vendorId: string): Promise<ProcurementVendorDto | null> {
    const res = await apiRequest<ProcurementVendorDto>(`/api/v1/partner/procurement/vendors/${vendorId}`);
    return res.data || null;
  }

  public async createVendor(request: CreateVendorRequest): Promise<ProcurementVendorDto> {
    const res = await apiRequest<ProcurementVendorDto>('/api/v1/partner/procurement/vendors', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementVendorDto;
  }

  public async updateVendor(request: UpdateVendorRequest): Promise<ProcurementVendorDto> {
    const res = await apiRequest<ProcurementVendorDto>(`/api/v1/partner/procurement/vendors/${request.vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementVendorDto;
  }

  public async suspendVendor(request: SuspendVendorRequest): Promise<ProcurementVendorDto> {
    const res = await apiRequest<ProcurementVendorDto>(`/api/v1/partner/procurement/vendors/${request.vendorId}/suspend`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementVendorDto;
  }

  public async getContracts(tenantId: string): Promise<ProcurementVendorContractDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<ProcurementVendorContractDto[]>('/api/v1/partner/procurement/contracts');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createContract(request: CreateVendorContractRequest): Promise<ProcurementVendorContractDto> {
    const res = await apiRequest<ProcurementVendorContractDto>('/api/v1/partner/procurement/contracts', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementVendorContractDto;
  }

  public async getItems(tenantId: string): Promise<ProcurementItemDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<ProcurementItemDto[]>('/api/v1/partner/procurement/items');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createItem(request: CreateProcurementItemRequest): Promise<ProcurementItemDto> {
    const res = await apiRequest<ProcurementItemDto>('/api/v1/partner/procurement/items', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementItemDto;
  }

  public async getRequisitions(tenantId: string): Promise<PurchaseRequisitionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PurchaseRequisitionDto[]>('/api/v1/partner/procurement/requisitions');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createRequisition(request: CreatePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const res = await apiRequest<PurchaseRequisitionDto>('/api/v1/partner/procurement/requisitions', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseRequisitionDto;
  }

  public async approveRequisition(request: ApprovePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const res = await apiRequest<PurchaseRequisitionDto>(`/api/v1/partner/procurement/requisitions/${request.requisitionId}/approve`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseRequisitionDto;
  }

  public async rejectRequisition(request: RejectPurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const res = await apiRequest<PurchaseRequisitionDto>(`/api/v1/partner/procurement/requisitions/${request.requisitionId}/reject`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseRequisitionDto;
  }

  public async getApprovals(_tenantId: string): Promise<ProcurementApprovalDto[]> {
    const res = await apiRequest<ProcurementApprovalDto[]>('/api/v1/partner/procurement/approvals');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getPurchaseOrders(tenantId: string): Promise<PurchaseOrderDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PurchaseOrderDto[]>('/api/v1/partner/procurement/orders');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getPurchaseOrderById(_tenantId: string, poId: string): Promise<PurchaseOrderDto | null> {
    const res = await apiRequest<PurchaseOrderDto>(`/api/v1/partner/procurement/orders/${poId}`);
    return res.data || null;
  }

  public async createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const res = await apiRequest<PurchaseOrderDto>('/api/v1/partner/procurement/orders', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseOrderDto;
  }

  public async approvePurchaseOrder(request: ApprovePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const res = await apiRequest<PurchaseOrderDto>(`/api/v1/partner/procurement/orders/${request.purchaseOrderId}/approve`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseOrderDto;
  }

  public async sendPurchaseOrder(request: SendPurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const res = await apiRequest<PurchaseOrderDto>(`/api/v1/partner/procurement/orders/${request.purchaseOrderId}/send`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseOrderDto;
  }

  public async cancelPurchaseOrder(request: CancelPurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const res = await apiRequest<PurchaseOrderDto>(`/api/v1/partner/procurement/orders/${request.purchaseOrderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseOrderDto;
  }

  public async getGoodsReceipts(tenantId: string): Promise<GoodsReceiptDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<GoodsReceiptDto[]>('/api/v1/partner/procurement/goods-receipts');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createGoodsReceipt(request: CreateGoodsReceiptRequest): Promise<GoodsReceiptDto> {
    const res = await apiRequest<GoodsReceiptDto>('/api/v1/partner/procurement/goods-receipts', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as GoodsReceiptDto;
  }

  public async getInspections(tenantId: string): Promise<ProcurementInspectionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<ProcurementInspectionDto[]>('/api/v1/partner/procurement/inspections');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async inspectGoodsReceipt(request: InspectGoodsReceiptRequest): Promise<ProcurementInspectionDto> {
    const res = await apiRequest<ProcurementInspectionDto>('/api/v1/partner/procurement/inspections', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementInspectionDto;
  }

  public async getVendorReturns(tenantId: string): Promise<VendorReturnDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<VendorReturnDto[]>('/api/v1/partner/procurement/returns');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createVendorReturn(request: CreateVendorReturnRequest): Promise<VendorReturnDto> {
    const res = await apiRequest<VendorReturnDto>('/api/v1/partner/procurement/returns', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as VendorReturnDto;
  }

  public async approveVendorReturn(request: ApproveVendorReturnRequest): Promise<VendorReturnDto> {
    const res = await apiRequest<VendorReturnDto>(`/api/v1/partner/procurement/returns/${request.vendorReturnId}/approve`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as VendorReturnDto;
  }

  public async getPurchaseInvoices(tenantId: string): Promise<PurchaseInvoiceDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PurchaseInvoiceDto[]>('/api/v1/partner/procurement/invoices');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPurchaseInvoice(request: CreatePurchaseInvoiceRequest): Promise<PurchaseInvoiceDto> {
    const res = await apiRequest<PurchaseInvoiceDto>('/api/v1/partner/procurement/invoices', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseInvoiceDto;
  }

  public async getInvoiceMatches(_tenantId: string): Promise<PurchaseInvoiceMatchDto[]> {
    const res = await apiRequest<PurchaseInvoiceMatchDto[]>('/api/v1/partner/procurement/invoice-matches');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async matchPurchaseInvoice(request: MatchPurchaseInvoiceRequest): Promise<PurchaseInvoiceMatchDto> {
    const res = await apiRequest<PurchaseInvoiceMatchDto>('/api/v1/partner/procurement/invoice-matches', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseInvoiceMatchDto;
  }

  public async getExceptions(_tenantId: string): Promise<ProcurementExceptionDto[]> {
    const res = await apiRequest<ProcurementExceptionDto[]>('/api/v1/partner/procurement/exceptions');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async resolveException(request: ResolveProcurementExceptionRequest): Promise<ProcurementExceptionDto> {
    const res = await apiRequest<ProcurementExceptionDto>(`/api/v1/partner/procurement/exceptions/${request.exceptionId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as ProcurementExceptionDto;
  }

  public async createEmergencyPurchase(request: CreateEmergencyPurchaseRequest): Promise<PurchaseOrderDto> {
    const res = await apiRequest<PurchaseOrderDto>('/api/v1/partner/procurement/emergency-orders', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return res.data as PurchaseOrderDto;
  }

  public async getAuditTraces(_tenantId: string): Promise<ProcurementAuditTraceDto[]> {
    const res = await apiRequest<ProcurementAuditTraceDto[]>('/api/v1/partner/procurement/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }
}

export const procurementManagementService = new ProcurementManagementService();
