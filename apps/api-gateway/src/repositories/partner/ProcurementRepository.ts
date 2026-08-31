export interface ProcurementVendorRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  vendorCode?: string;
  vendorName: string;
  vendorCategory: string;
  vendorType: string;
  status?: string;
  taxIdGstin?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  rating?: number;
  riskClassification?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export interface ProcurementItemRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  itemCode?: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  standardPriceMinorUnits: number;
  reorderLevel: number;
  safetyStock: number;
  currentStock: number;
  hsnCode?: string;
  taxRatePercent?: number;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export interface PurchaseRequisitionRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  requisitionNumber?: string;
  departmentName: string;
  requestorName: string;
  urgency: string;
  items: Record<string, unknown>[];
  totalEstimatedCostMinorUnits: number;
  justification: string;
  status?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export interface PurchaseOrderRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  poNumber?: string;
  vendorId: string;
  vendorName: string;
  requisitionId?: string;
  orderDate?: string | Date;
  expectedDeliveryDate?: string | Date;
  items: Record<string, unknown>[];
  subtotalMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  paymentTerms: string;
  shippingAddress: string;
  status?: string;
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export interface GoodsReceiptRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  grnNumber?: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  receivedDate?: string | Date;
  receivedBy: string;
  challanNumber: string;
  items: Record<string, unknown>[];
  status?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface ProcurementInspectionRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  inspectionNumber?: string;
  grnId: string;
  grnNumber: string;
  inspectorName: string;
  inspectionDate?: string | Date;
  overallResult: string;
  items: Record<string, unknown>[];
  remarks?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface PurchaseInvoiceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  vendorId: string;
  vendorName: string;
  invoiceDate?: string | Date;
  totalAmountMinorUnits: number;
  taxAmountMinorUnits: number;
  status?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface InvoiceMatchRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  matchNumber?: string;
  invoiceId: string;
  poId: string;
  grnId: string;
  matchStatus: string;
  varianceAmountMinorUnits: number;
  variancePercentage: number;
  withinTolerance: boolean;
  matchedBy: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface VendorReturnRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  returnNumber?: string;
  grnId: string;
  vendorId: string;
  vendorName: string;
  reason: string;
  items: Record<string, unknown>[];
  status?: string;
  approvedBy?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface ProcurementAuditRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  actorName?: string;
  actorRole?: string;
  performedBy?: string;
  justification?: string;
  integrityHash: string;
  timestamp?: Date;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ProcurementRepository {
  private vendorsStore: ProcurementVendorRecord[] = [];
  private itemsStore: ProcurementItemRecord[] = [];
  private requisitionsStore: PurchaseRequisitionRecord[] = [];
  private poStore: PurchaseOrderRecord[] = [];
  private grnStore: GoodsReceiptRecord[] = [];
  private inspectionStore: ProcurementInspectionRecord[] = [];
  private invoiceStore: PurchaseInvoiceRecord[] = [];
  private matchStore: InvoiceMatchRecord[] = [];
  private returnStore: VendorReturnRecord[] = [];
  private auditStore: ProcurementAuditRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      activeVendorsCount: 42,
      openRequisitionsCount: 7,
      pendingOrdersCount: 5,
      awaitingInspectionGrnCount: 3,
      unmatchedInvoicesCount: 4,
      totalSpendThisMonthMinorUnits: 854000000,
      stockoutRiskItemsCount: 2,
      onTimeDeliveryPercentage: 96.4,
      threeWayMatchSuccessRate: 98.2
    };
  }

  async getAnalytics(_tenantId: string) {
    return {
      spendByCategory: [
        { category: 'PHARMACEUTICALS', spendMinorUnits: 450000000 },
        { category: 'SURGICAL_CONSUMABLES', spendMinorUnits: 250000000 },
        { category: 'LAB_REAGENTS', spendMinorUnits: 154000000 }
      ],
      vendorPerformanceLeaderboard: [
        { vendorName: 'MedTech Supplies Ltd', score: 98.5 },
        { vendorName: 'Apex Pharma Distributors', score: 96.0 }
      ],
      leadTimeDaysAverage: 3.4
    };
  }

  // Vendors
  async getVendors(tenantId: string) {
    return this.vendorsStore.filter(v => v.tenantId === tenantId);
  }

  async getVendorById(tenantId: string, id: string) {
    return this.vendorsStore.find(v => v.id === id && v.tenantId === tenantId) || null;
  }

  async createVendor(data: ProcurementVendorRecord) {
    const record: ProcurementVendorRecord = {
      id: data.id || 'vnd_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.vendorsStore.unshift(record);
    return record;
  }

  async updateVendor(id: string, updates: Partial<ProcurementVendorRecord>) {
    const idx = this.vendorsStore.findIndex(v => v.id === id);
    if (idx !== -1) {
      const current = this.vendorsStore[idx];
      if (current) {
        this.vendorsStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.vendorsStore[idx];
      }
    }
    return null;
  }

  // Items
  async getItems(tenantId: string) {
    return this.itemsStore.filter(i => i.tenantId === tenantId);
  }

  async createItem(data: ProcurementItemRecord) {
    const record: ProcurementItemRecord = {
      id: data.id || 'itm_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.itemsStore.unshift(record);
    return record;
  }

  // Purchase Requisitions
  async getRequisitions(tenantId: string) {
    return this.requisitionsStore.filter(r => r.tenantId === tenantId);
  }

  async createRequisition(data: PurchaseRequisitionRecord) {
    const record: PurchaseRequisitionRecord = {
      id: data.id || 'pr_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'PENDING_APPROVAL',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.requisitionsStore.unshift(record);
    return record;
  }

  async updateRequisition(id: string, updates: Partial<PurchaseRequisitionRecord>) {
    const idx = this.requisitionsStore.findIndex(r => r.id === id);
    if (idx !== -1) {
      const current = this.requisitionsStore[idx];
      if (current) {
        this.requisitionsStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.requisitionsStore[idx];
      }
    }
    return null;
  }

  // Purchase Orders
  async getPurchaseOrders(tenantId: string) {
    return this.poStore.filter(p => p.tenantId === tenantId);
  }

  async getPurchaseOrderById(tenantId: string, id: string) {
    return this.poStore.find(p => p.id === id && p.tenantId === tenantId) || null;
  }

  async createPurchaseOrder(data: PurchaseOrderRecord) {
    const record: PurchaseOrderRecord = {
      id: data.id || 'po_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.poStore.unshift(record);
    return record;
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrderRecord>) {
    const idx = this.poStore.findIndex(p => p.id === id);
    if (idx !== -1) {
      const current = this.poStore[idx];
      if (current) {
        this.poStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.poStore[idx];
      }
    }
    return null;
  }

  // Goods Receipts (GRN)
  async getGoodsReceipts(tenantId: string) {
    return this.grnStore.filter(g => g.tenantId === tenantId);
  }

  async createGoodsReceipt(data: GoodsReceiptRecord) {
    const record: GoodsReceiptRecord = {
      id: data.id || 'grn_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'RECEIVED_PENDING_INSPECTION',
      createdAt: new Date()
    };
    this.grnStore.unshift(record);
    return record;
  }

  // Inspections
  async getInspections(tenantId: string) {
    return this.inspectionStore.filter(i => i.tenantId === tenantId);
  }

  async createInspection(data: ProcurementInspectionRecord) {
    const record: ProcurementInspectionRecord = {
      id: data.id || 'insp_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.inspectionStore.unshift(record);
    return record;
  }

  // Invoices
  async getInvoices(tenantId: string) {
    return this.invoiceStore.filter(i => i.tenantId === tenantId);
  }

  async createInvoice(data: PurchaseInvoiceRecord) {
    const record: PurchaseInvoiceRecord = {
      id: data.id || 'inv_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'ENTERED_PENDING_MATCH',
      createdAt: new Date()
    };
    this.invoiceStore.unshift(record);
    return record;
  }

  // 3-Way Matching
  async getInvoiceMatches(tenantId: string) {
    return this.matchStore.filter(m => m.tenantId === tenantId);
  }

  async createInvoiceMatch(data: InvoiceMatchRecord) {
    const record: InvoiceMatchRecord = {
      id: data.id || 'mat_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.matchStore.unshift(record);
    return record;
  }

  // Vendor Returns
  async getVendorReturns(tenantId: string) {
    return this.returnStore.filter(r => r.tenantId === tenantId);
  }

  async createVendorReturn(data: VendorReturnRecord) {
    const record: VendorReturnRecord = {
      id: data.id || 'ret_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'RETURN_REQUESTED',
      createdAt: new Date()
    };
    this.returnStore.unshift(record);
    return record;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: ProcurementAuditRecord) {
    const record: ProcurementAuditRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    this.auditStore.unshift(record);
    return record;
  }
}
