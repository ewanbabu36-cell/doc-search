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

import {
  MOCK_PROCUREMENT_VENDORS,
  MOCK_VENDOR_CONTRACTS,
  MOCK_PROCUREMENT_ITEMS,
  MOCK_PURCHASE_REQUISITIONS,
  MOCK_PURCHASE_ORDERS,
  MOCK_GOODS_RECEIPTS,
  MOCK_PROCUREMENT_INSPECTIONS,
  MOCK_VENDOR_RETURNS,
  MOCK_PURCHASE_INVOICES,
  MOCK_PURCHASE_INVOICE_MATCHES,
  MOCK_PROCUREMENT_EXCEPTIONS,
  MOCK_PROCUREMENT_AUDIT_TRACES,
  MOCK_PROCUREMENT_METRICS,
  MOCK_PROCUREMENT_ANALYTICS
} from './mock-procurement-data.js';

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
  private vendors: ProcurementVendorDto[] = [...MOCK_PROCUREMENT_VENDORS];
  private contracts: ProcurementVendorContractDto[] = [...MOCK_VENDOR_CONTRACTS];
  private items: ProcurementItemDto[] = [...MOCK_PROCUREMENT_ITEMS];
  private requisitions: PurchaseRequisitionDto[] = [...MOCK_PURCHASE_REQUISITIONS];
  private purchaseOrders: PurchaseOrderDto[] = [...MOCK_PURCHASE_ORDERS];
  private goodsReceipts: GoodsReceiptDto[] = [...MOCK_GOODS_RECEIPTS];
  private inspections: ProcurementInspectionDto[] = [...MOCK_PROCUREMENT_INSPECTIONS];
  private vendorReturns: VendorReturnDto[] = [...MOCK_VENDOR_RETURNS];
  private purchaseInvoices: PurchaseInvoiceDto[] = [...MOCK_PURCHASE_INVOICES];
  private invoiceMatches: PurchaseInvoiceMatchDto[] = [...MOCK_PURCHASE_INVOICE_MATCHES];
  private exceptions: ProcurementExceptionDto[] = [...MOCK_PROCUREMENT_EXCEPTIONS];
  private auditTraces: ProcurementAuditTraceDto[] = [...MOCK_PROCUREMENT_AUDIT_TRACES];

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private appendAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string | undefined,
    actorId: string,
    actorRole: string,
    operation: string,
    entityType: string,
    entityId: string,
    financialImpact: number,
    reason: string
  ): void {
    const traceId = 'TRACE-PROC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const trace: ProcurementAuditTraceDto = {
      id: this.generateId(),
      traceId,
      tenantId,
      partnerId,
      organizationId,
      branchId: branchId || undefined,
      actorId,
      actorRole,
      operation,
      entityType,
      entityId,
      financialImpact,
      reason,
      timestamp: new Date().toISOString(),
      operationStatus: 'SUCCESS',
      hashPointer: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      createdAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<ProcurementOverviewMetricsDto> {
    const totalSpend = this.purchaseOrders
      .filter((po) => po.status !== 'CANCELLED')
      .reduce((sum, po) => sum + po.totalNetAmount, 0);

    const activeVendors = this.vendors.filter((v) => v.status === 'ACTIVE').length;
    const openReqs = this.requisitions.filter((r) => r.status === 'DRAFT' || r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const pendingAppr = this.requisitions.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const activePOs = this.purchaseOrders.filter((po) => po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'APPROVED').length;
    const pendingGrn = this.purchaseOrders.filter((po) => po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED').length;
    const pendingInspect = this.goodsReceipts.filter((grn) => grn.status === 'PENDING_INSPECTION').length;
    const openExceptions = this.exceptions.filter((exc) => exc.status === 'OPEN' || exc.status === 'UNDER_INVESTIGATION').length;
    const outstandingInvoices = this.purchaseInvoices
      .filter((inv) => inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PARTIALLY_PAID')
      .reduce((sum, inv) => sum + inv.outstandingAmount, 0);

    return {
      ...MOCK_PROCUREMENT_METRICS,
      totalSpendYtd: totalSpend > 0 ? totalSpend : MOCK_PROCUREMENT_METRICS.totalSpendYtd,
      activeVendorCount: activeVendors,
      openRequisitionsCount: openReqs,
      pendingApprovalsCount: pendingAppr,
      activePurchaseOrdersCount: activePOs,
      pendingGrnCount: pendingGrn,
      inspectionBacklogCount: pendingInspect,
      openExceptionsCount: openExceptions,
      outstandingInvoicesAmount: outstandingInvoices
    };
  }

  async getAnalytics(_tenantId: string): Promise<ProcurementAnalyticsDto> {
    return { ...MOCK_PROCUREMENT_ANALYTICS };
  }

  async getVendors(_tenantId: string): Promise<ProcurementVendorDto[]> {
    return [...this.vendors];
  }

  async getVendorById(_tenantId: string, vendorId: string): Promise<ProcurementVendorDto | null> {
    const v = this.vendors.find((item) => item.id === vendorId);
    return v || null;
  }

  async createVendor(request: CreateVendorRequest): Promise<ProcurementVendorDto> {
    const exists = this.vendors.some((v) => v.vendorCode === request.vendorCode);
    if (exists) {
      throw new Error(`Vendor with code ${request.vendorCode} already exists.`);
    }

    const newVendor: ProcurementVendorDto = {
      id: this.generateId(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      vendorCode: request.vendorCode,
      legalName: request.legalName,
      tradeName: request.tradeName || undefined,
      vendorCategory: request.vendorCategory,
      vendorType: request.vendorType,
      contactPerson: request.contactPerson || undefined,
      contactEmail: request.contactEmail || undefined,
      contactPhone: request.contactPhone || undefined,
      address: request.address || undefined,
      taxId: request.taxId || undefined,
      gstNumber: request.gstNumber || undefined,
      panNumber: request.panNumber || undefined,
      status: 'ACTIVE',
      riskClassification: request.riskClassification || 'LOW_RISK',
      rating: 4.50,
      paymentTermsDays: request.paymentTermsDays ?? 30,
      leadTimeDays: request.leadTimeDays ?? 3,
      minimumOrderValue: request.minimumOrderValue ?? 0,
      deliverySlaHours: request.deliverySlaHours ?? 48,
      notes: request.notes || undefined,
      activeContractCount: 0,
      openPoCount: 0,
      totalSpendYtd: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.vendors.unshift(newVendor);
    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'VENDOR_REGISTERED',
      'VENDOR',
      newVendor.vendorCode,
      0,
      request.justification
    );

    return newVendor;
  }

  async updateVendor(request: UpdateVendorRequest): Promise<ProcurementVendorDto> {
    const index = this.vendors.findIndex((v) => v.id === request.vendorId);
    if (index === -1) {
      throw new Error(`Vendor ID ${request.vendorId} not found.`);
    }

    const v = this.vendors[index];
    if (!v) {
      throw new Error('Vendor not found.');
    }

    const updated: ProcurementVendorDto = {
      ...v,
      legalName: request.legalName ?? v.legalName,
      tradeName: request.tradeName ?? v.tradeName,
      vendorCategory: request.vendorCategory ?? v.vendorCategory,
      vendorType: request.vendorType ?? v.vendorType,
      contactPerson: request.contactPerson ?? v.contactPerson,
      contactEmail: request.contactEmail ?? v.contactEmail,
      contactPhone: request.contactPhone ?? v.contactPhone,
      address: request.address ?? v.address,
      paymentTermsDays: request.paymentTermsDays ?? v.paymentTermsDays,
      leadTimeDays: request.leadTimeDays ?? v.leadTimeDays,
      minimumOrderValue: request.minimumOrderValue ?? v.minimumOrderValue,
      riskClassification: request.riskClassification ?? v.riskClassification,
      status: request.status ?? v.status,
      notes: request.notes ?? v.notes,
      updatedAt: new Date().toISOString()
    };

    this.vendors[index] = updated;
    this.appendAudit(
      updated.tenantId,
      updated.partnerId,
      updated.organizationId,
      updated.branchId || undefined,
      request.actorId,
      request.actorRole,
      'VENDOR_UPDATED',
      'VENDOR',
      updated.vendorCode,
      0,
      request.justification
    );

    return updated;
  }

  async suspendVendor(request: SuspendVendorRequest): Promise<ProcurementVendorDto> {
    const index = this.vendors.findIndex((v) => v.id === request.vendorId);
    if (index === -1) {
      throw new Error(`Vendor ID ${request.vendorId} not found.`);
    }

    const v = this.vendors[index];
    if (!v) {
      throw new Error('Vendor not found.');
    }

    const updated: ProcurementVendorDto = {
      ...v,
      status: 'SUSPENDED',
      notes: (v.notes ? v.notes + ' | ' : '') + 'Suspended: ' + request.reason,
      updatedAt: new Date().toISOString()
    };

    this.vendors[index] = updated;
    this.appendAudit(
      updated.tenantId,
      updated.partnerId,
      updated.organizationId,
      updated.branchId || undefined,
      request.actorId,
      request.actorRole,
      'VENDOR_SUSPENDED',
      'VENDOR',
      updated.vendorCode,
      0,
      request.justification + ' Reason: ' + request.reason
    );

    return updated;
  }

  async getContracts(_tenantId: string): Promise<ProcurementVendorContractDto[]> {
    return [...this.contracts];
  }

  async createContract(request: CreateVendorContractRequest): Promise<ProcurementVendorContractDto> {
    const vendor = this.vendors.find((v) => v.id === request.vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${request.vendorId} not found.`);
    }

    const newContract: ProcurementVendorContractDto = {
      id: this.generateId(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      vendorId: request.vendorId,
      vendorName: vendor.legalName,
      contractNumber: request.contractNumber,
      title: request.title,
      version: 1,
      effectiveDate: request.effectiveDate,
      expiryDate: request.expiryDate,
      renewalDate: request.renewalDate || undefined,
      status: 'ACTIVE',
      terms: request.terms || undefined,
      slaDays: request.slaDays,
      totalAgreedValue: request.totalAgreedValue,
      approvedBy: request.actorId + ' (' + request.actorRole + ')',
      approvedAt: new Date().toISOString(),
      documentUrl: request.documentUrl || undefined,
      itemCount: request.items.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.contracts.unshift(newContract);
    vendor.activeContractCount += 1;

    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'CONTRACT_APPROVED',
      'CONTRACT',
      newContract.contractNumber,
      request.totalAgreedValue,
      request.justification
    );

    return newContract;
  }

  async getItems(_tenantId: string): Promise<ProcurementItemDto[]> {
    return [...this.items];
  }

  async createItem(request: CreateProcurementItemRequest): Promise<ProcurementItemDto> {
    const newItem: ProcurementItemDto = {
      id: this.generateId(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      itemCode: request.itemCode,
      sku: request.sku || undefined,
      barcode: request.barcode || undefined,
      itemName: request.itemName,
      genericName: request.genericName || undefined,
      category: request.category,
      subcategory: request.subcategory || undefined,
      unit: request.unit,
      packSize: request.packSize,
      manufacturer: request.manufacturer || undefined,
      reorderLevel: request.reorderLevel,
      safetyStock: request.safetyStock,
      minStock: request.minStock,
      maxStock: request.maxStock,
      leadTimeDays: request.leadTimeDays,
      standardCost: request.standardCost,
      isControlled: request.isControlled,
      isExpiryApplicable: request.isExpiryApplicable,
      isBatchApplicable: request.isBatchApplicable,
      isSerialApplicable: request.isSerialApplicable,
      medicationCatalogId: request.medicationCatalogId || undefined,
      status: 'ACTIVE',
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.items.unshift(newItem);
    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'ITEM_CREATED',
      'ITEM',
      newItem.itemCode,
      0,
      request.justification
    );

    return newItem;
  }

  async getRequisitions(_tenantId: string): Promise<PurchaseRequisitionDto[]> {
    return [...this.requisitions];
  }

  async createRequisition(request: CreatePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const reqNumber = 'REQ-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const reqId = this.generateId();

    const items = request.items.map((i) => ({
      id: this.generateId(),
      tenantId: request.tenantId,
      requisitionId: reqId,
      procurementItemId: i.procurementItemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      quantity: i.quantity,
      approvedQuantity: 0,
      unit: i.unit,
      estimatedUnitPrice: i.estimatedUnitPrice,
      totalEstimatedCost: i.quantity * i.estimatedUnitPrice,
      remarks: i.remarks || undefined,
      createdAt: new Date().toISOString()
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalEstimatedCost, 0);

    const newReq: PurchaseRequisitionDto = {
      id: reqId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      requisitionNumber: reqNumber,
      departmentId: request.departmentId || undefined,
      departmentName: request.departmentName,
      storeName: request.storeName,
      requestedBy: request.requestedBy,
      requiredByDate: request.requiredByDate,
      priority: request.priority,
      isEmergency: request.isEmergency,
      status: 'SUBMITTED',
      totalEstimatedAmount: totalAmount,
      reason: request.reason,
      justification: request.justification || undefined,
      suggestedVendorId: request.suggestedVendorId || undefined,
      suggestedVendorName: request.suggestedVendorName || undefined,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requisitions.unshift(newReq);
    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'REQUISITION_CREATED',
      'REQUISITION',
      reqNumber,
      totalAmount,
      request.reason
    );

    return newReq;
  }

  async approveRequisition(request: ApprovePurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const req = this.requisitions.find((r) => r.id === request.requisitionId);
    if (!req) {
      throw new Error(`Requisition ${request.requisitionId} not found.`);
    }

    if (req.status === 'CANCELLED' || req.status === 'REJECTED') {
      throw new Error(`Cannot approve a requisition in ${req.status} state.`);
    }

    req.status = 'APPROVED';
    req.approvedBy = request.actorId + ' (' + request.actorRole + ')';
    req.approvedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    if (request.approvedItems && request.approvedItems.length > 0) {
      for (const approvedItem of request.approvedItems) {
        const item = req.items.find((i) => i.id === approvedItem.itemId);
        if (item) {
          item.approvedQuantity = approvedItem.approvedQuantity;
        }
      }
    } else {
      for (const item of req.items) {
        item.approvedQuantity = item.quantity;
      }
    }

    this.appendAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId || undefined,
      request.actorId,
      request.actorRole,
      'REQUISITION_APPROVED',
      'REQUISITION',
      req.requisitionNumber,
      req.totalEstimatedAmount,
      request.justification
    );

    return req;
  }

  async rejectRequisition(request: RejectPurchaseRequisitionRequest): Promise<PurchaseRequisitionDto> {
    const req = this.requisitions.find((r) => r.id === request.requisitionId);
    if (!req) {
      throw new Error(`Requisition ${request.requisitionId} not found.`);
    }

    req.status = 'REJECTED';
    req.updatedAt = new Date().toISOString();

    this.appendAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId || undefined,
      request.actorId,
      request.actorRole,
      'REQUISITION_REJECTED',
      'REQUISITION',
      req.requisitionNumber,
      0,
      request.reason
    );

    return req;
  }

  async getApprovals(_tenantId: string): Promise<ProcurementApprovalDto[]> {
    return [];
  }

  async getPurchaseOrders(_tenantId: string): Promise<PurchaseOrderDto[]> {
    return [...this.purchaseOrders];
  }

  async getPurchaseOrderById(_tenantId: string, poId: string): Promise<PurchaseOrderDto | null> {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    return po || null;
  }

  async createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const poNumber = 'PO-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const poId = this.generateId();

    const items = request.items.map((i) => {
      const gross = i.orderedQuantity * i.unitPrice;
      const discount = i.discountAmount || 0;
      const tax = i.taxAmount || 0;
      const net = gross - discount + tax;

      return {
        id: this.generateId(),
        tenantId: request.tenantId,
        purchaseOrderId: poId,
        procurementItemId: i.procurementItemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: 0,
        unit: i.unit,
        unitPrice: i.unitPrice,
        grossAmount: gross,
        discountAmount: discount,
        taxAmount: tax,
        netAmount: net,
        status: 'PENDING_RECEIPT',
        createdAt: new Date().toISOString()
      };
    });

    const grossTotal = items.reduce((sum, item) => sum + item.grossAmount, 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const netTotal = items.reduce((sum, item) => sum + item.netAmount, 0);

    const newPO: PurchaseOrderDto = {
      id: poId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      poNumber,
      requisitionId: request.requisitionId || undefined,
      requisitionNumber: request.requisitionNumber || undefined,
      vendorId: request.vendorId,
      vendorName: request.vendorName,
      contractId: request.contractId || undefined,
      contractNumber: request.contractNumber || undefined,
      status: 'APPROVED',
      totalGrossAmount: grossTotal,
      totalDiscountAmount: discountTotal,
      totalTaxAmount: taxTotal,
      totalNetAmount: netTotal,
      deliveryLocation: request.deliveryLocation,
      expectedDeliveryDate: request.expectedDeliveryDate,
      paymentTerms: request.paymentTerms,
      shippingTerms: request.shippingTerms || undefined,
      isEmergency: request.isEmergency,
      approvedBy: request.actorId + ' (' + request.actorRole + ')',
      approvedAt: new Date().toISOString(),
      notes: request.notes || undefined,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.purchaseOrders.unshift(newPO);

    if (request.requisitionId) {
      const linkedReq = this.requisitions.find((r) => r.id === request.requisitionId);
      if (linkedReq) {
        linkedReq.status = 'CONVERTED_TO_PO';
        linkedReq.updatedAt = new Date().toISOString();
      }
    }

    const vendor = this.vendors.find((v) => v.id === request.vendorId);
    if (vendor) {
      vendor.openPoCount += 1;
    }

    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'PO_CREATED',
      'PURCHASE_ORDER',
      poNumber,
      netTotal,
      request.justification
    );

    return newPO;
  }

  async approvePurchaseOrder(request: ApprovePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const po = this.purchaseOrders.find((p) => p.id === request.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase Order ${request.purchaseOrderId} not found.`);
    }

    po.status = 'APPROVED';
    po.approvedBy = request.actorId + ' (' + request.actorRole + ')';
    po.approvedAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();

    this.appendAudit(
      po.tenantId,
      po.partnerId,
      po.organizationId,
      po.branchId || undefined,
      request.actorId,
      request.actorRole,
      'PO_APPROVED',
      'PURCHASE_ORDER',
      po.poNumber,
      po.totalNetAmount,
      request.justification
    );

    return po;
  }

  async sendPurchaseOrder(request: SendPurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const po = this.purchaseOrders.find((p) => p.id === request.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase Order ${request.purchaseOrderId} not found.`);
    }

    po.status = 'SENT_TO_VENDOR';
    po.sentAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();

    this.appendAudit(
      po.tenantId,
      po.partnerId,
      po.organizationId,
      po.branchId || undefined,
      request.actorId,
      request.actorRole,
      'PO_DISPATCHED',
      'PURCHASE_ORDER',
      po.poNumber,
      po.totalNetAmount,
      'Transmitted via ' + request.transmissionMethod
    );

    return po;
  }

  async cancelPurchaseOrder(request: CancelPurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const po = this.purchaseOrders.find((p) => p.id === request.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase Order ${request.purchaseOrderId} not found.`);
    }

    if (po.status === 'FULLY_RECEIVED' || po.status === 'CLOSED') {
      throw new Error(`Cannot cancel a purchase order in ${po.status} state.`);
    }

    po.status = 'CANCELLED';
    po.updatedAt = new Date().toISOString();

    this.appendAudit(
      po.tenantId,
      po.partnerId,
      po.organizationId,
      po.branchId || undefined,
      request.actorId,
      request.actorRole,
      'PO_CANCELLED',
      'PURCHASE_ORDER',
      po.poNumber,
      po.totalNetAmount,
      request.reason
    );

    return po;
  }

  async getGoodsReceipts(_tenantId: string): Promise<GoodsReceiptDto[]> {
    return [...this.goodsReceipts];
  }

  async createGoodsReceipt(request: CreateGoodsReceiptRequest): Promise<GoodsReceiptDto> {
    const po = this.purchaseOrders.find((p) => p.id === request.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase Order ${request.purchaseOrderId} not found.`);
    }

    const grnNumber = 'GRN-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const grnId = this.generateId();

    const items = request.items.map((i) => ({
      id: this.generateId(),
      tenantId: request.tenantId,
      goodsReceiptId: grnId,
      purchaseOrderItemId: i.purchaseOrderItemId,
      procurementItemId: i.procurementItemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      receivedQuantity: i.receivedQuantity,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      shortQuantity: 0,
      excessQuantity: 0,
      damagedQuantity: 0,
      unitPrice: i.unitPrice,
      batchNumber: i.batchNumber || undefined,
      expiryDate: i.expiryDate || undefined,
      serialNumber: i.serialNumber || undefined,
      mfgDate: i.mfgDate || undefined,
      status: 'PENDING_QC',
      createdAt: new Date().toISOString()
    }));

    const newGrn: GoodsReceiptDto = {
      id: grnId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      grnNumber,
      purchaseOrderId: request.purchaseOrderId,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      deliveryDocumentNumber: request.deliveryDocumentNumber || undefined,
      invoiceReferenceNumber: request.invoiceReferenceNumber || undefined,
      receivedDate: request.receivedDate,
      receivingDepartment: request.receivingDepartment,
      storeName: request.storeName,
      receivedBy: request.receivedBy,
      status: 'PENDING_INSPECTION',
      totalReceivedItems: items.length,
      totalAcceptedItems: 0,
      totalRejectedItems: 0,
      remarks: request.remarks || undefined,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.goodsReceipts.unshift(newGrn);

    // Update PO received quantity & status
    let allReceived = true;
    for (const grnItem of items) {
      const poItem = po.items.find((p) => p.id === grnItem.purchaseOrderItemId);
      if (poItem) {
        poItem.receivedQuantity += grnItem.receivedQuantity;
        if (poItem.receivedQuantity < poItem.orderedQuantity) {
          allReceived = false;
        }
      }
    }
    po.status = allReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
    po.updatedAt = new Date().toISOString();

    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'GRN_CREATED',
      'GOODS_RECEIPT',
      grnNumber,
      0,
      request.justification
    );

    return newGrn;
  }

  async getInspections(_tenantId: string): Promise<ProcurementInspectionDto[]> {
    return [...this.inspections];
  }

  async inspectGoodsReceipt(request: InspectGoodsReceiptRequest): Promise<ProcurementInspectionDto> {
    const grn = this.goodsReceipts.find((g) => g.id === request.goodsReceiptId);
    if (!grn) {
      throw new Error(`Goods Receipt ${request.goodsReceiptId} not found.`);
    }

    const inspectionNumber = 'QC-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const inspectionId = this.generateId();

    const inspectionItems = request.items.map((i) => ({
      id: this.generateId(),
      tenantId: request.tenantId,
      inspectionId,
      goodsReceiptItemId: i.goodsReceiptItemId,
      procurementItemId: i.procurementItemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      inspectedQuantity: i.inspectedQuantity,
      passedQuantity: i.passedQuantity,
      failedQuantity: i.failedQuantity,
      quarantinedQuantity: i.quarantinedQuantity,
      defectCategory: i.defectCategory || undefined,
      rejectionReason: i.rejectionReason || undefined,
      checklist: i.checklist || undefined,
      status: i.failedQuantity > 0 ? 'FAILED' : i.quarantinedQuantity > 0 ? 'QUARANTINED' : 'PASSED',
      createdAt: new Date().toISOString()
    }));

    const totalInspected = inspectionItems.reduce((sum, item) => sum + item.inspectedQuantity, 0);
    const totalPassed = inspectionItems.reduce((sum, item) => sum + item.passedQuantity, 0);
    const totalFailed = inspectionItems.reduce((sum, item) => sum + item.failedQuantity, 0);
    const totalQuarantined = inspectionItems.reduce((sum, item) => sum + item.quarantinedQuantity, 0);

    const newInspection: ProcurementInspectionDto = {
      id: inspectionId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      inspectionNumber,
      goodsReceiptId: request.goodsReceiptId,
      grnNumber: grn.grnNumber,
      inspectorId: request.inspectorId,
      inspectionDate: request.inspectionDate,
      status: request.status,
      totalInspectedQuantity: totalInspected,
      totalPassedQuantity: totalPassed,
      totalFailedQuantity: totalFailed,
      totalQuarantinedQuantity: totalQuarantined,
      quarantineReason: request.quarantineReason || undefined,
      notes: request.notes || undefined,
      items: inspectionItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inspections.unshift(newInspection);

    // Update GRN quantities and status
    grn.status = request.status === 'PASSED' ? 'INSPECTED_PASSED' : request.status === 'QUARANTINED' ? 'QUARANTINED' : 'INSPECTED_FAILED';
    grn.totalAcceptedItems = totalPassed > 0 ? grn.totalReceivedItems : 0;
    grn.totalRejectedItems = totalFailed > 0 ? totalFailed : 0;
    grn.updatedAt = new Date().toISOString();

    // Update item stock counts for passed quantities (inventory integration)
    for (const item of inspectionItems) {
      if (item.passedQuantity > 0) {
        const catItem = this.items.find((p) => p.id === item.procurementItemId);
        if (catItem) {
          catItem.currentStock += item.passedQuantity;
          catItem.updatedAt = new Date().toISOString();
        }
      }
    }

    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      request.status === 'PASSED' ? 'QC_PASSED' : 'QC_REJECTED',
      'INSPECTION',
      inspectionNumber,
      0,
      request.justification
    );

    return newInspection;
  }

  async getVendorReturns(_tenantId: string): Promise<VendorReturnDto[]> {
    return [...this.vendorReturns];
  }

  async createVendorReturn(request: CreateVendorReturnRequest): Promise<VendorReturnDto> {
    const vendor = this.vendors.find((v) => v.id === request.vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${request.vendorId} not found.`);
    }

    const returnNumber = 'RTV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const returnId = this.generateId();

    const items = request.items.map((i) => ({
      id: this.generateId(),
      tenantId: request.tenantId,
      vendorReturnId: returnId,
      procurementItemId: i.procurementItemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      returnQuantity: i.returnQuantity,
      unitCost: i.unitCost,
      totalAmount: i.returnQuantity * i.unitCost,
      batchNumber: i.batchNumber || undefined,
      serialNumber: i.serialNumber || undefined,
      reason: i.reason,
      createdAt: new Date().toISOString()
    }));

    const totalReturnAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

    const newReturn: VendorReturnDto = {
      id: returnId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      returnNumber,
      vendorId: request.vendorId,
      vendorName: vendor.legalName,
      goodsReceiptId: request.goodsReceiptId || undefined,
      purchaseOrderId: request.purchaseOrderId || undefined,
      status: 'REQUESTED',
      totalReturnAmount,
      reason: request.reason,
      requestedBy: request.requestedBy,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.vendorReturns.unshift(newReturn);
    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'RETURN_REQUESTED',
      'VENDOR_RETURN',
      returnNumber,
      totalReturnAmount,
      request.justification
    );

    return newReturn;
  }

  async approveVendorReturn(request: ApproveVendorReturnRequest): Promise<VendorReturnDto> {
    const ret = this.vendorReturns.find((r) => r.id === request.vendorReturnId);
    if (!ret) {
      throw new Error(`Vendor return ${request.vendorReturnId} not found.`);
    }

    ret.status = 'APPROVED';
    ret.approvedBy = request.actorId + ' (' + request.actorRole + ')';
    ret.vendorAcknowledgementRef = request.vendorAcknowledgementRef || undefined;
    ret.creditNoteRef = request.creditNoteRef || undefined;
    ret.updatedAt = new Date().toISOString();

    this.appendAudit(
      ret.tenantId,
      ret.partnerId,
      ret.organizationId,
      ret.branchId || undefined,
      request.actorId,
      request.actorRole,
      'RETURN_APPROVED',
      'VENDOR_RETURN',
      ret.returnNumber,
      ret.totalReturnAmount,
      request.justification
    );

    return ret;
  }

  async getPurchaseInvoices(_tenantId: string): Promise<PurchaseInvoiceDto[]> {
    return [...this.purchaseInvoices];
  }

  async createPurchaseInvoice(request: CreatePurchaseInvoiceRequest): Promise<PurchaseInvoiceDto> {
    const vendor = this.vendors.find((v) => v.id === request.vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${request.vendorId} not found.`);
    }

    const invoiceNumber = 'PINV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const newInvoice: PurchaseInvoiceDto = {
      id: this.generateId(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      invoiceNumber,
      vendorInvoiceNumber: request.vendorInvoiceNumber,
      vendorId: request.vendorId,
      vendorName: vendor.legalName,
      purchaseOrderId: request.purchaseOrderId || undefined,
      goodsReceiptId: request.goodsReceiptId || undefined,
      invoiceDate: request.invoiceDate,
      dueDate: request.dueDate,
      subtotal: request.subtotal,
      taxAmount: request.taxAmount,
      discountAmount: request.discountAmount,
      totalAmount: request.totalAmount,
      paidAmount: 0.00,
      outstandingAmount: request.totalAmount,
      matchingStatus: 'PENDING_MATCH',
      paymentStatus: 'UNPAID',
      paymentDueDate: request.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.purchaseInvoices.unshift(newInvoice);
    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'INVOICE_RECORDED',
      'INVOICE',
      invoiceNumber,
      request.totalAmount,
      request.justification
    );

    return newInvoice;
  }

  async getInvoiceMatches(_tenantId: string): Promise<PurchaseInvoiceMatchDto[]> {
    return [...this.invoiceMatches];
  }

  async matchPurchaseInvoice(request: MatchPurchaseInvoiceRequest): Promise<PurchaseInvoiceMatchDto> {
    const inv = this.purchaseInvoices.find((i) => i.id === request.purchaseInvoiceId);
    if (!inv) {
      throw new Error(`Invoice ${request.purchaseInvoiceId} not found.`);
    }

    const po = inv.purchaseOrderId ? this.purchaseOrders.find((p) => p.id === inv.purchaseOrderId) : null;
    const grn = inv.goodsReceiptId ? this.goodsReceipts.find((g) => g.id === inv.goodsReceiptId) : null;

    const poAmount = po ? po.totalNetAmount : inv.totalAmount;
    const grnAmount = grn ? poAmount : inv.totalAmount;
    const totalVariance = Math.abs(inv.totalAmount - poAmount);
    const variancePercent = poAmount > 0 ? (totalVariance / poAmount) * 100 : 0;

    const isMatch = variancePercent <= request.tolerancePercentage;

    const newMatch: PurchaseInvoiceMatchDto = {
      id: this.generateId(),
      tenantId: request.tenantId,
      purchaseInvoiceId: request.purchaseInvoiceId,
      purchaseOrderId: inv.purchaseOrderId || undefined,
      goodsReceiptId: inv.goodsReceiptId || undefined,
      matchingType: request.matchingType,
      status: isMatch ? 'EXACT_MATCH' : 'PRICE_MISMATCH',
      poAmount,
      grnAmount,
      invoiceAmount: inv.totalAmount,
      quantityVariance: 0,
      priceVariance: totalVariance,
      taxVariance: 0,
      totalVariance,
      discrepancyDetails: isMatch
        ? 'Automated 3-way match verified within tolerance limits.'
        : `Price variance $${totalVariance.toFixed(2)} exceeds allowable tolerance (${request.tolerancePercentage}%).`,
      matchedBy: request.actorId + ' (' + request.actorRole + ')',
      matchedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.invoiceMatches.unshift(newMatch);
    inv.matchingStatus = isMatch ? 'MATCHED_3WAY' : 'VARIANCE_FLAGGED';
    inv.updatedAt = new Date().toISOString();

    if (!isMatch) {
      const excNumber = 'EXC-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      const newExc: ProcurementExceptionDto = {
        id: this.generateId(),
        tenantId: request.tenantId,
        partnerId: inv.partnerId,
        organizationId: inv.organizationId,
        branchId: inv.branchId || undefined,
        exceptionNumber: excNumber,
        exceptionType: 'PRICE_OVERCHARGE',
        severity: totalVariance > 500 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        purchaseOrderId: inv.purchaseOrderId || undefined,
        purchaseInvoiceId: inv.id,
        vendorId: inv.vendorId,
        vendorName: inv.vendorName,
        description: `Invoice ${inv.invoiceNumber} variance $${totalVariance.toFixed(2)} flagged during automated 3-way reconciliation.`,
        varianceAmount: totalVariance,
        assignedTo: request.actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.exceptions.unshift(newExc);
    }

    this.appendAudit(
      inv.tenantId,
      inv.partnerId,
      inv.organizationId,
      inv.branchId || undefined,
      request.actorId,
      request.actorRole,
      'INVOICE_MATCHED',
      'INVOICE_MATCH',
      inv.invoiceNumber,
      inv.totalAmount,
      request.justification
    );

    return newMatch;
  }

  async getExceptions(_tenantId: string): Promise<ProcurementExceptionDto[]> {
    return [...this.exceptions];
  }

  async resolveException(request: ResolveProcurementExceptionRequest): Promise<ProcurementExceptionDto> {
    const exc = this.exceptions.find((e) => e.id === request.exceptionId);
    if (!exc) {
      throw new Error(`Exception ${request.exceptionId} not found.`);
    }

    exc.status = request.resolutionStatus;
    exc.resolution = request.resolution;
    exc.resolvedBy = request.actorId + ' (' + request.actorRole + ')';
    exc.resolvedAt = new Date().toISOString();
    exc.updatedAt = new Date().toISOString();

    this.appendAudit(
      exc.tenantId,
      exc.partnerId,
      exc.organizationId,
      exc.branchId || undefined,
      request.actorId,
      request.actorRole,
      'EXCEPTION_RESOLVED',
      'EXCEPTION',
      exc.exceptionNumber,
      exc.varianceAmount,
      request.justification
    );

    return exc;
  }

  async createEmergencyPurchase(request: CreateEmergencyPurchaseRequest): Promise<PurchaseOrderDto> {
    const po = await this.createPurchaseOrder({
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId || undefined,
      vendorId: request.vendorId,
      vendorName: this.vendors.find((v) => v.id === request.vendorId)?.legalName || 'Emergency Vendor',
      deliveryLocation: request.deliveryLocation,
      expectedDeliveryDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      paymentTerms: 'NET_15',
      shippingTerms: 'EXPEDITED_COURIER',
      isEmergency: true,
      notes: 'EMERGENCY PURCHASE: ' + request.clinicalReason + ' | Justification: ' + request.justification,
      items: request.items.map((i) => ({
        procurementItemId: i.procurementItemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        orderedQuantity: i.orderedQuantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        discountAmount: 0,
        taxAmount: 0
      })),
      actorId: request.actorId,
      actorRole: request.actorRole,
      justification: 'EMERGENCY PURCHASE: ' + request.justification
    });

    this.appendAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.branchId,
      request.actorId,
      request.actorRole,
      'EMERGENCY_PURCHASE',
      'PURCHASE_ORDER',
      po.poNumber,
      po.totalNetAmount,
      request.clinicalReason + ' - ' + request.justification
    );

    return po;
  }

  async getAuditTraces(_tenantId: string): Promise<ProcurementAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const procurementManagementService = new ProcurementManagementService();
