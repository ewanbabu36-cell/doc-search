import { apiRequest } from './api-client.js';
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
  RevenueAnalyticsDto,
  CreateServiceCatalogRequest,
  UpdateServiceCatalogRequest,
  CreatePriceListRequest,
  CaptureChargeRequest,
  CreateInvoiceRequest,
  FinalizeInvoiceRequest,
  ApplyDiscountRequest,
  RecordPaymentRequest,
  AllocatePaymentRequest,
  IssueReceiptRequest,
  RequestRefundRequest,
  ApproveRefundRequest,
  ProcessRefundRequest,
  CreateCreditNoteRequest,
  CreateDebitAdjustmentRequest,
  CreateAdvanceRequest,
  OpenCashierSessionRequest,
  CloseCashierSessionRequest,
  ReconcileCashierSessionRequest,
  CancelInvoiceRequest,
  SearchBillingInvoicesRequest,
  SearchBillingChargesRequest,
  QueryBillingAuditRequest
} from '@docsearch/api-contracts';
import {
  MOCK_BILLING_OVERVIEW,
  MOCK_BILLING_SERVICE_CATALOG,
  MOCK_BILLING_PRICE_LISTS,
  MOCK_BILLING_CHARGES,
  MOCK_BILLING_INVOICES,
  MOCK_BILLING_PAYMENTS,
  MOCK_BILLING_RECEIPTS,
  MOCK_BILLING_REFUNDS,
  MOCK_BILLING_CREDIT_NOTES,
  MOCK_BILLING_DEBIT_ADJUSTMENTS,
  MOCK_BILLING_ADVANCES,
  MOCK_BILLING_CASHIER_SESSIONS,
  MOCK_BILLING_RECONCILIATIONS,
  MOCK_BILLING_FINANCIAL_TRANSACTIONS,
  MOCK_BILLING_AUDIT_TRACES,
  MOCK_PATIENT_BILLING_HISTORIES,
  MOCK_REVENUE_ANALYTICS
} from './mock-billing-data.js';

export interface IBillingManagementService {
  getOverview(tenantId: string, branchId?: string): Promise<BillingOverviewDto>;
  getServiceCatalog(tenantId: string, category?: string, searchTerm?: string): Promise<BillingServiceCatalogDto[]>;
  createService(req: CreateServiceCatalogRequest): Promise<BillingServiceCatalogDto>;
  updateService(req: UpdateServiceCatalogRequest): Promise<BillingServiceCatalogDto>;
  getPriceLists(tenantId: string, branchId?: string): Promise<BillingPriceListDto[]>;
  createPriceList(req: CreatePriceListRequest): Promise<BillingPriceListDto>;
  getCharges(req: SearchBillingChargesRequest): Promise<BillingChargeDto[]>;
  getChargeById(tenantId: string, chargeId: string): Promise<BillingChargeDto | null>;
  captureCharge(req: CaptureChargeRequest): Promise<BillingChargeDto>;
  getInvoices(req: SearchBillingInvoicesRequest): Promise<BillingInvoiceDto[]>;
  getInvoiceById(tenantId: string, invoiceId: string): Promise<BillingInvoiceDto | null>;
  createInvoice(req: CreateInvoiceRequest): Promise<BillingInvoiceDto>;
  finalizeInvoice(req: FinalizeInvoiceRequest): Promise<BillingInvoiceDto>;
  cancelInvoice(req: CancelInvoiceRequest): Promise<BillingInvoiceDto>;
  applyDiscount(req: ApplyDiscountRequest): Promise<BillingInvoiceDto>;
  getPayments(tenantId: string, branchId?: string, invoiceId?: string, patientId?: string): Promise<BillingPaymentDto[]>;
  recordPayment(req: RecordPaymentRequest): Promise<BillingPaymentDto>;
  allocatePayment(req: AllocatePaymentRequest): Promise<BillingPaymentDto>;
  getReceipts(tenantId: string, branchId?: string, patientId?: string): Promise<BillingReceiptDto[]>;
  issueReceipt(req: IssueReceiptRequest): Promise<BillingReceiptDto>;
  getRefunds(tenantId: string, branchId?: string, status?: string): Promise<BillingRefundDto[]>;
  requestRefund(req: RequestRefundRequest): Promise<BillingRefundDto>;
  approveRefund(req: ApproveRefundRequest): Promise<BillingRefundDto>;
  processRefund(req: ProcessRefundRequest): Promise<BillingRefundDto>;
  getCreditNotes(tenantId: string, branchId?: string): Promise<BillingCreditNoteDto[]>;
  createCreditNote(req: CreateCreditNoteRequest): Promise<BillingCreditNoteDto>;
  getDebitAdjustments(tenantId: string, branchId?: string): Promise<BillingDebitAdjustmentDto[]>;
  createDebitAdjustment(req: CreateDebitAdjustmentRequest): Promise<BillingDebitAdjustmentDto>;
  getAdvances(tenantId: string, branchId?: string, patientId?: string): Promise<BillingAdvanceDto[]>;
  createAdvance(req: CreateAdvanceRequest): Promise<BillingAdvanceDto>;
  getCashierSessions(tenantId: string, branchId?: string, status?: string): Promise<BillingCashierSessionDto[]>;
  openCashierSession(req: OpenCashierSessionRequest): Promise<BillingCashierSessionDto>;
  closeCashierSession(req: CloseCashierSessionRequest): Promise<BillingCashierSessionDto>;
  getReconciliations(tenantId: string, branchId?: string): Promise<BillingReconciliationDto[]>;
  reconcileCashierSession(req: ReconcileCashierSessionRequest): Promise<BillingReconciliationDto>;
  getFinancialTransactions(tenantId: string, branchId?: string): Promise<BillingFinancialTransactionDto[]>;
  getPatientBillingHistory(tenantId: string, patientId: string): Promise<PatientBillingHistoryDto | null>;
  getRevenueAnalytics(tenantId: string, branchId?: string): Promise<RevenueAnalyticsDto>;
  getBillingAuditTrail(req: QueryBillingAuditRequest): Promise<BillingAuditTraceDto[]>;
}

export class BillingManagementService implements IBillingManagementService {
  private services: BillingServiceCatalogDto[] = [...MOCK_BILLING_SERVICE_CATALOG];
  private priceLists: BillingPriceListDto[] = [...MOCK_BILLING_PRICE_LISTS];
  private charges: BillingChargeDto[] = [...MOCK_BILLING_CHARGES];
  private invoices: BillingInvoiceDto[] = [...MOCK_BILLING_INVOICES];
  private payments: BillingPaymentDto[] = [...MOCK_BILLING_PAYMENTS];
  private receipts: BillingReceiptDto[] = [...MOCK_BILLING_RECEIPTS];
  private refunds: BillingRefundDto[] = [...MOCK_BILLING_REFUNDS];
  private creditNotes: BillingCreditNoteDto[] = [...MOCK_BILLING_CREDIT_NOTES];
  private debitAdjustments: BillingDebitAdjustmentDto[] = [...MOCK_BILLING_DEBIT_ADJUSTMENTS];
  private advances: BillingAdvanceDto[] = [...MOCK_BILLING_ADVANCES];
  private cashierSessions: BillingCashierSessionDto[] = [...MOCK_BILLING_CASHIER_SESSIONS];
  private reconciliations: BillingReconciliationDto[] = [...MOCK_BILLING_RECONCILIATIONS];
  private transactions: BillingFinancialTransactionDto[] = [...MOCK_BILLING_FINANCIAL_TRANSACTIONS];
  private auditTraces: BillingAuditTraceDto[] = [...MOCK_BILLING_AUDIT_TRACES];

  public async getOverview(tenantId: string, _branchId?: string): Promise<BillingOverviewDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const totalRev = this.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalOut = this.invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const overdueCount = this.invoices.filter((inv) => inv.status === 'OVERDUE').length;
    const activeSessions = this.cashierSessions.filter((s) => s.status === 'OPEN').length;
    const pendingRefunds = this.refunds.filter((r) => r.status === 'REQUESTED').length;

    return {
      ...MOCK_BILLING_OVERVIEW,
      totalRevenueToday: totalRev > 0 ? totalRev : MOCK_BILLING_OVERVIEW.totalRevenueToday,
      totalOutstandingAmount: totalOut > 0 ? totalOut : MOCK_BILLING_OVERVIEW.totalOutstandingAmount,
      overdueInvoicesCount: overdueCount,
      activeCashierSessionsCount: activeSessions,
      pendingRefundRequestsCount: pendingRefunds
    };
  }

  public async getServiceCatalog(tenantId: string, category?: string, searchTerm?: string): Promise<BillingServiceCatalogDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.services.filter((s) => s.tenantId === tenantId);
    if (category) {
      list = list.filter((s) => s.category === category);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.serviceCode.toLowerCase().includes(lower) ||
          s.serviceName.toLowerCase().includes(lower) ||
          (s.department && s.department.toLowerCase().includes(lower))
      );
    }
    return list;
  }

  public async createService(req: CreateServiceCatalogRequest): Promise<BillingServiceCatalogDto> {
    const existing = this.services.find(
      (s) => s.tenantId === req.tenantId && s.serviceCode.toLowerCase() === req.serviceCode.toLowerCase()
    );
    if (existing) {
      throw new Error(`Service code "${req.serviceCode}" already exists.`);
    }

    const newService: BillingServiceCatalogDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      serviceCode: req.serviceCode.toUpperCase(),
      serviceName: req.serviceName,
      description: req.description,
      category: req.category,
      department: req.department,
      serviceType: req.serviceType,
      unit: req.unit,
      basePrice: req.basePrice,
      taxable: req.taxable,
      taxCode: req.taxCode,
      active: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.services.unshift(newService);
    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'SERVICE_CREATED',
      entityType: 'SERVICE_CATALOG',
      entityId: newService.id,
      afterSnapshot: newService as unknown as Record<string, unknown>,
      reason: req.justification,
      financialImpact: req.basePrice
    });

    return newService;
  }

  public async updateService(req: UpdateServiceCatalogRequest): Promise<BillingServiceCatalogDto> {
    const s = this.services.find((item) => item.id === req.serviceId && item.tenantId === req.tenantId);
    if (!s) throw new Error('Service item not found.');

    const before = { ...s };
    if (req.serviceName) s.serviceName = req.serviceName;
    if (req.description !== undefined) s.description = req.description;
    if (req.category) s.category = req.category;
    if (req.department !== undefined) s.department = req.department;
    if (req.basePrice !== undefined) s.basePrice = req.basePrice;
    if (req.taxable !== undefined) s.taxable = req.taxable;
    if (req.taxCode !== undefined) s.taxCode = req.taxCode;
    if (req.active !== undefined) s.active = req.active;
    s.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: s.partnerId,
      organizationId: s.organizationId,
      branchId: s.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'SERVICE_UPDATED',
      entityType: 'SERVICE_CATALOG',
      entityId: s.id,
      beforeSnapshot: before as unknown as Record<string, unknown>,
      afterSnapshot: s as unknown as Record<string, unknown>,
      reason: req.justification
    });

    return s;
  }

  public async getPriceLists(tenantId: string, branchId?: string): Promise<BillingPriceListDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.priceLists.filter((p) => p.tenantId === tenantId);
    if (branchId) {
      list = list.filter((p) => !p.branchId || p.branchId === branchId);
    }
    return list;
  }

  public async createPriceList(req: CreatePriceListRequest): Promise<BillingPriceListDto> {
    const newPriceList: BillingPriceListDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      priceListCode: req.priceListCode.toUpperCase(),
      name: req.name,
      currency: req.currency,
      status: 'ACTIVE',
      effectiveFrom: new Date().toISOString(),
      items: req.items.map((it) => {
        const cat = this.services.find((s) => s.id === it.serviceCatalogId);
        return {
          id: crypto.randomUUID(),
          tenantId: req.tenantId,
          priceListId: '',
          serviceCatalogId: it.serviceCatalogId,
          serviceCode: cat?.serviceCode || 'UNKNOWN',
          serviceName: cat?.serviceName || 'Service Item',
          unitPrice: it.unitPrice,
          discountAllowed: it.discountAllowed,
          effectiveFrom: new Date().toISOString()
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    newPriceList.items.forEach((it) => (it.priceListId = newPriceList.id));

    this.priceLists.unshift(newPriceList);
    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'PRICE_LIST_CREATED',
      entityType: 'PRICE_LIST',
      entityId: newPriceList.id,
      afterSnapshot: newPriceList as unknown as Record<string, unknown>,
      reason: req.justification
    });

    return newPriceList;
  }

  public async getCharges(req: SearchBillingChargesRequest): Promise<BillingChargeDto[]> {
    if (!req.tenantId) throw new Error('Tenant ID is required');
    let list = this.charges.filter((c) => c.tenantId === req.tenantId);
    if (req.branchId) list = list.filter((c) => c.branchId === req.branchId);
    if (req.patientId) list = list.filter((c) => c.patientId === req.patientId);
    if (req.status) list = list.filter((c) => c.status === req.status);
    if (req.sourceDomain) list = list.filter((c) => c.sourceDomain === req.sourceDomain);
    if (req.searchTerm) {
      const lower = req.searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.chargeNumber.toLowerCase().includes(lower) ||
          c.patientName.toLowerCase().includes(lower) ||
          c.patientMrn.toLowerCase().includes(lower)
      );
    }
    return list;
  }

  public async getChargeById(tenantId: string, chargeId: string): Promise<BillingChargeDto | null> {
    const c = this.charges.find((item) => item.id === chargeId && item.tenantId === tenantId);
    return c || null;
  }

  public async captureCharge(req: CaptureChargeRequest): Promise<BillingChargeDto> {
    const chargeId = crypto.randomUUID();
    const chargeNumber = `CHG-${new Date().getFullYear()}-${String(this.charges.length + 415).padStart(5, '0')}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const items = req.items.map((it) => {
      const gross = it.quantity * it.unitPrice;
      const net = gross - it.discountAmount + it.taxAmount;
      subtotal += gross;
      discountTotal += it.discountAmount;
      taxTotal += it.taxAmount;

      return {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        chargeId,
        serviceCatalogId: it.serviceCatalogId,
        serviceCode: it.serviceCode || 'SRV-GEN',
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        grossAmount: gross,
        discountAmount: it.discountAmount,
        taxAmount: it.taxAmount,
        netAmount: net,
        sourceReference: it.sourceReference,
        orderingDoctorId: it.orderingDoctorId,
        departmentId: it.departmentId,
        createdAt: new Date().toISOString()
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal;

    const newCharge: BillingChargeDto = {
      id: chargeId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      encounterId: req.encounterId,
      consultationId: req.consultationId,
      sourceDomain: req.sourceDomain,
      sourceEntityId: req.sourceEntityId,
      chargeNumber,
      status: 'CAPTURED',
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      capturedBy: req.actorId,
      capturedAt: new Date().toISOString(),
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.charges.unshift(newCharge);

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transactionType: 'CHARGE',
      referenceType: 'CHARGE',
      referenceId: chargeNumber,
      patientId: req.patientId,
      patientName: req.patientName,
      debit: grandTotal,
      credit: 0,
      balanceImpact: grandTotal,
      actorId: req.actorId,
      notes: `Charge ${chargeNumber} captured for ${req.sourceDomain}`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'CHARGE_CAPTURED',
      entityType: 'CHARGE',
      entityId: newCharge.id,
      patientId: req.patientId,
      afterSnapshot: newCharge as unknown as Record<string, unknown>,
      financialImpact: grandTotal,
      reason: req.justification
    });

    return newCharge;
  }

  public async getInvoices(req: SearchBillingInvoicesRequest): Promise<BillingInvoiceDto[]> {
    try {
      const res = await apiRequest<BillingInvoiceDto[]>('/api/v1/partner/billing/invoices');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    if (!req.tenantId) throw new Error('Tenant ID is required');
    let list = this.invoices.filter((inv) => inv.tenantId === req.tenantId);
    if (req.branchId) list = list.filter((inv) => inv.branchId === req.branchId);
    if (req.patientId) list = list.filter((inv) => inv.patientId === req.patientId);
    if (req.status) list = list.filter((inv) => inv.status === req.status);
    if (req.searchTerm) {
      const lower = req.searchTerm.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(lower) ||
          inv.patientName.toLowerCase().includes(lower) ||
          inv.patientMrn.toLowerCase().includes(lower)
      );
    }
    return list;
  }

  public async getInvoiceById(tenantId: string, invoiceId: string): Promise<BillingInvoiceDto | null> {
    const inv = this.invoices.find((item) => item.id === invoiceId && item.tenantId === tenantId);
    return inv || null;
  }

  public async createInvoice(req: CreateInvoiceRequest): Promise<BillingInvoiceDto> {
    try {
      const res = await apiRequest<BillingInvoiceDto>('/api/v1/partner/billing/invoices', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoices.length + 110).padStart(5, '0')}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const items = req.items.map((it) => {
      const gross = it.quantity * it.unitPrice;
      const net = gross - it.discountAmount + it.taxAmount;
      subtotal += gross;
      discountTotal += it.discountAmount;
      taxTotal += it.taxAmount;

      return {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        invoiceId,
        chargeId: it.chargeId,
        chargeItemId: it.chargeItemId,
        serviceCatalogId: it.serviceCatalogId,
        serviceCode: it.serviceCode,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        grossAmount: gross,
        discountAmount: it.discountAmount,
        taxAmount: it.taxAmount,
        netAmount: net,
        createdAt: new Date().toISOString()
      };
    });

    const totalAmount = subtotal - discountTotal + taxTotal;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + req.dueDays);

    const newInvoice: BillingInvoiceDto = {
      id: invoiceId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      encounterId: req.encounterId,
      invoiceNumber,
      invoiceType: req.invoiceType,
      status: 'DRAFT',
      subtotal,
      discountTotal,
      taxTotal,
      roundingAdjustment: 0.00,
      totalAmount,
      paidAmount: 0.00,
      dueAmount: totalAmount,
      currency: 'USD',
      dueAt: dueAt.toISOString(),
      items,
      discounts: [],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.invoices.unshift(newInvoice);

    // If chargeIds provided, update their status to INVOICED
    if (req.chargeIds) {
      req.chargeIds.forEach((cid) => {
        const c = this.charges.find((ch) => ch.id === cid && ch.tenantId === req.tenantId);
        if (c) c.status = 'INVOICED';
      });
    }

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'INVOICE_CREATED',
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      patientId: req.patientId,
      invoiceId: newInvoice.id,
      afterSnapshot: newInvoice as unknown as Record<string, unknown>,
      financialImpact: totalAmount,
      reason: req.justification
    });

    return newInvoice;
  }

  public async finalizeInvoice(req: FinalizeInvoiceRequest): Promise<BillingInvoiceDto> {
    const inv = this.invoices.find((item) => item.id === req.invoiceId && item.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');
    if (inv.status !== 'DRAFT') {
      throw new Error(`Cannot finalize invoice in status ${inv.status}. Only DRAFT invoices can be finalized.`);
    }

    const before = { ...inv };
    inv.status = 'ISSUED';
    inv.issuedAt = new Date().toISOString();
    inv.finalizedAt = new Date().toISOString();
    inv.finalizedBy = req.actorId;
    inv.updatedAt = new Date().toISOString();

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: inv.partnerId,
      organizationId: inv.organizationId,
      branchId: inv.branchId,
      transactionType: 'INVOICE',
      referenceType: 'INVOICE',
      referenceId: inv.invoiceNumber,
      patientId: inv.patientId,
      patientName: inv.patientName,
      debit: inv.totalAmount,
      credit: 0,
      balanceImpact: inv.totalAmount,
      actorId: req.actorId,
      notes: `Invoice ${inv.invoiceNumber} finalized and issued`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: inv.partnerId,
      organizationId: inv.organizationId,
      branchId: inv.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'INVOICE_FINALIZED',
      entityType: 'INVOICE',
      entityId: inv.id,
      patientId: inv.patientId,
      invoiceId: inv.id,
      beforeSnapshot: before as unknown as Record<string, unknown>,
      afterSnapshot: inv as unknown as Record<string, unknown>,
      financialImpact: inv.totalAmount,
      reason: req.justification
    });

    return inv;
  }

  public async cancelInvoice(req: CancelInvoiceRequest): Promise<BillingInvoiceDto> {
    const inv = this.invoices.find((item) => item.id === req.invoiceId && item.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');
    if (inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID') {
      throw new Error('Paid or partially paid invoices cannot be cancelled. Issue a credit note or refund instead.');
    }

    const before = { ...inv };
    inv.status = inv.status === 'DRAFT' ? 'CANCELLED' : 'VOIDED';
    inv.dueAmount = 0.00;
    inv.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: inv.partnerId,
      organizationId: inv.organizationId,
      branchId: inv.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: inv.status === 'CANCELLED' ? 'INVOICE_CANCELLED' : 'INVOICE_VOIDED',
      entityType: 'INVOICE',
      entityId: inv.id,
      patientId: inv.patientId,
      invoiceId: inv.id,
      beforeSnapshot: before as unknown as Record<string, unknown>,
      afterSnapshot: inv as unknown as Record<string, unknown>,
      financialImpact: -inv.totalAmount,
      reason: req.justification
    });

    return inv;
  }

  public async applyDiscount(req: ApplyDiscountRequest): Promise<BillingInvoiceDto> {
    const inv = this.invoices.find((item) => item.id === req.invoiceId && item.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');
    if (inv.status === 'PAID' || inv.status === 'CANCELLED' || inv.status === 'VOIDED') {
      throw new Error(`Cannot apply discount on invoice with status ${inv.status}.`);
    }

    let discountAmount = 0;
    if (req.discountType === 'PERCENTAGE') {
      discountAmount = (inv.subtotal * req.discountValue) / 100;
    } else {
      discountAmount = req.discountValue;
    }

    if (discountAmount > inv.dueAmount) {
      throw new Error(`Discount amount ($${discountAmount.toFixed(2)}) cannot exceed remaining invoice due ($${inv.dueAmount.toFixed(2)}).`);
    }

    const before = { ...inv };
    inv.discountTotal += discountAmount;
    inv.totalAmount -= discountAmount;
    inv.dueAmount -= discountAmount;
    if (inv.dueAmount <= 0) {
      inv.dueAmount = 0;
      inv.status = 'PAID';
    }
    inv.updatedAt = new Date().toISOString();

    const discountRecord = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      invoiceId: inv.id,
      invoiceItemId: req.invoiceItemId,
      discountType: req.discountType,
      discountValue: req.discountValue,
      discountAmount,
      reason: req.reason,
      approvedBy: req.actorId,
      createdBy: req.actorId,
      createdAt: new Date().toISOString()
    };
    inv.discounts.push(discountRecord);

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: inv.partnerId,
      organizationId: inv.organizationId,
      branchId: inv.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'DISCOUNT_APPLIED',
      entityType: 'DISCOUNT',
      entityId: discountRecord.id,
      patientId: inv.patientId,
      invoiceId: inv.id,
      beforeSnapshot: before as unknown as Record<string, unknown>,
      afterSnapshot: inv as unknown as Record<string, unknown>,
      financialImpact: -discountAmount,
      reason: req.justification
    });

    return inv;
  }

  public async getPayments(tenantId: string, branchId?: string, invoiceId?: string, patientId?: string): Promise<BillingPaymentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.payments.filter((p) => p.tenantId === tenantId);
    if (branchId) list = list.filter((p) => p.branchId === branchId);
    if (invoiceId) list = list.filter((p) => p.invoiceId === invoiceId);
    if (patientId) list = list.filter((p) => p.patientId === patientId);
    return list;
  }

  public async recordPayment(req: RecordPaymentRequest): Promise<BillingPaymentDto> {
    try {
      const res = await apiRequest<BillingPaymentDto>(`/api/v1/partner/billing/invoices/${req.invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    let inv: BillingInvoiceDto | undefined;
    if (req.invoiceId) {
      inv = this.invoices.find((item) => item.id === req.invoiceId && item.tenantId === req.tenantId);
      if (!inv) throw new Error('Invoice not found.');
      if (inv.status === 'CANCELLED' || inv.status === 'VOIDED') {
        throw new Error('Cannot accept payment for cancelled/voided invoice.');
      }
      if (req.amount > inv.dueAmount) {
        throw new Error(`Payment amount ($${req.amount.toFixed(2)}) cannot exceed outstanding due ($${inv.dueAmount.toFixed(2)}).`);
      }
    }

    const paymentId = crypto.randomUUID();
    const paymentNumber = `PMT-${new Date().getFullYear()}-${String(this.payments.length + 90).padStart(5, '0')}`;

    const newPayment: BillingPaymentDto = {
      id: paymentId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      patientId: req.patientId,
      patientName: inv?.patientName || 'Patient',
      patientMrn: inv?.patientMrn || 'MRN-SAMPLE',
      invoiceId: req.invoiceId,
      invoiceNumber: inv?.invoiceNumber,
      paymentNumber,
      paymentMethod: req.paymentMethod,
      amount: req.amount,
      currency: req.currency,
      referenceNumber: req.referenceNumber,
      status: 'SUCCESS',
      receivedBy: req.actorId,
      receivedAt: new Date().toISOString(),
      notes: req.notes,
      allocations: req.invoiceId
        ? [
            {
              id: crypto.randomUUID(),
              tenantId: req.tenantId,
              paymentId,
              invoiceId: req.invoiceId,
              invoiceNumber: inv?.invoiceNumber,
              allocatedAmount: req.amount,
              createdAt: new Date().toISOString()
            }
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.payments.unshift(newPayment);

    // Update invoice status & due balance
    if (inv) {
      inv.paidAmount += req.amount;
      inv.dueAmount -= req.amount;
      if (inv.dueAmount <= 0) {
        inv.dueAmount = 0;
        inv.status = 'PAID';
      } else {
        inv.status = 'PARTIALLY_PAID';
      }
      inv.updatedAt = new Date().toISOString();
      inv.payments.push(newPayment);
    }

    // Update cashier session if active
    if (req.cashierSessionId) {
      const sess = this.cashierSessions.find((s) => s.id === req.cashierSessionId);
      if (sess && sess.status === 'OPEN') {
        sess.cashReceived += req.amount;
        sess.expectedClosingBalance += req.amount;
        sess.updatedAt = new Date().toISOString();
      }
    }

    // Automatically issue numbered receipt
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(this.receipts.length + 90).padStart(5, '0')}`;
    const newReceipt: BillingReceiptDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      paymentId,
      invoiceId: req.invoiceId,
      patientId: req.patientId,
      patientName: inv?.patientName || 'Patient',
      patientMrn: inv?.patientMrn || 'MRN-SAMPLE',
      receiptNumber,
      amount: req.amount,
      paymentMethod: req.paymentMethod,
      issuedBy: req.actorId,
      issuedAt: new Date().toISOString(),
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };
    this.receipts.unshift(newReceipt);

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transactionType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: paymentNumber,
      patientId: req.patientId,
      patientName: inv?.patientName,
      debit: 0,
      credit: req.amount,
      balanceImpact: -req.amount,
      actorId: req.actorId,
      notes: `Payment of $${req.amount.toFixed(2)} received via ${req.paymentMethod}`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: paymentId,
      patientId: req.patientId,
      invoiceId: req.invoiceId,
      afterSnapshot: newPayment as unknown as Record<string, unknown>,
      financialImpact: -req.amount,
      reason: req.justification
    });

    return newPayment;
  }

  public async allocatePayment(req: AllocatePaymentRequest): Promise<BillingPaymentDto> {
    const pmt = this.payments.find((p) => p.id === req.paymentId && p.tenantId === req.tenantId);
    if (!pmt) throw new Error('Payment record not found.');
    const inv = this.invoices.find((i) => i.id === req.invoiceId && i.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');

    const alreadyAllocated = pmt.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const unallocated = pmt.amount - alreadyAllocated;
    if (req.amount > unallocated) {
      throw new Error(`Allocation ($${req.amount.toFixed(2)}) exceeds unallocated payment funds ($${unallocated.toFixed(2)}).`);
    }

    pmt.allocations.push({
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      paymentId: pmt.id,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      allocatedAmount: req.amount,
      createdAt: new Date().toISOString()
    });

    inv.paidAmount += req.amount;
    inv.dueAmount -= req.amount;
    if (inv.dueAmount <= 0) {
      inv.dueAmount = 0;
      inv.status = 'PAID';
    } else {
      inv.status = 'PARTIALLY_PAID';
    }
    inv.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: pmt.partnerId,
      organizationId: pmt.organizationId,
      branchId: pmt.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'PAYMENT_ALLOCATED',
      entityType: 'PAYMENT_ALLOCATION',
      entityId: pmt.id,
      patientId: pmt.patientId,
      invoiceId: inv.id,
      financialImpact: -req.amount,
      reason: req.justification
    });

    return pmt;
  }

  public async getReceipts(tenantId: string, branchId?: string, patientId?: string): Promise<BillingReceiptDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.receipts.filter((r) => r.tenantId === tenantId);
    if (branchId) list = list.filter((r) => r.branchId === branchId);
    if (patientId) list = list.filter((r) => r.patientId === patientId);
    return list;
  }

  public async issueReceipt(req: IssueReceiptRequest): Promise<BillingReceiptDto> {
    const pmt = this.payments.find((p) => p.id === req.paymentId && p.tenantId === req.tenantId);
    if (!pmt) throw new Error('Payment not found.');

    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(this.receipts.length + 91).padStart(5, '0')}`;
    const newReceipt: BillingReceiptDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: pmt.partnerId,
      organizationId: pmt.organizationId,
      branchId: pmt.branchId,
      paymentId: pmt.id,
      invoiceId: req.invoiceId || pmt.invoiceId,
      patientId: pmt.patientId,
      patientName: pmt.patientName,
      patientMrn: pmt.patientMrn,
      receiptNumber,
      amount: pmt.amount,
      paymentMethod: pmt.paymentMethod,
      issuedBy: req.actorId,
      issuedAt: new Date().toISOString(),
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };

    this.receipts.unshift(newReceipt);
    return newReceipt;
  }

  public async getRefunds(tenantId: string, branchId?: string, status?: string): Promise<BillingRefundDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.refunds.filter((r) => r.tenantId === tenantId);
    if (branchId) list = list.filter((r) => r.branchId === branchId);
    if (status) list = list.filter((r) => r.status === status);
    return list;
  }

  public async requestRefund(req: RequestRefundRequest): Promise<BillingRefundDto> {
    const pmt = this.payments.find((p) => p.id === req.paymentId && p.tenantId === req.tenantId);
    if (!pmt) throw new Error('Payment not found.');
    if (req.amount > pmt.amount) {
      throw new Error(`Refund amount ($${req.amount.toFixed(2)}) cannot exceed paid payment amount ($${pmt.amount.toFixed(2)}).`);
    }

    const refundId = crypto.randomUUID();
    const refundNumber = `RFD-${new Date().getFullYear()}-${String(this.refunds.length + 13).padStart(5, '0')}`;

    const newRefund: BillingRefundDto = {
      id: refundId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      paymentId: req.paymentId,
      invoiceId: req.invoiceId,
      patientId: req.patientId,
      patientName: pmt.patientName,
      patientMrn: pmt.patientMrn,
      refundNumber,
      amount: req.amount,
      reason: req.reason,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.refunds.unshift(newRefund);

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'REFUND_REQUESTED',
      entityType: 'REFUND',
      entityId: refundId,
      patientId: req.patientId,
      invoiceId: req.invoiceId,
      afterSnapshot: newRefund as unknown as Record<string, unknown>,
      financialImpact: req.amount,
      reason: req.justification
    });

    return newRefund;
  }

  public async approveRefund(req: ApproveRefundRequest): Promise<BillingRefundDto> {
    const ref = this.refunds.find((r) => r.id === req.refundId && r.tenantId === req.tenantId);
    if (!ref) throw new Error('Refund request not found.');
    if (ref.status !== 'REQUESTED') {
      throw new Error(`Cannot approve refund in status ${ref.status}.`);
    }

    ref.status = 'APPROVED';
    ref.approvedBy = req.actorId;
    ref.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: ref.partnerId,
      organizationId: ref.organizationId,
      branchId: ref.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'REFUND_APPROVED',
      entityType: 'REFUND',
      entityId: ref.id,
      patientId: ref.patientId,
      invoiceId: ref.invoiceId || undefined,
      afterSnapshot: ref as unknown as Record<string, unknown>,
      financialImpact: ref.amount,
      reason: req.justification
    });

    return ref;
  }

  public async processRefund(req: ProcessRefundRequest): Promise<BillingRefundDto> {
    const ref = this.refunds.find((r) => r.id === req.refundId && r.tenantId === req.tenantId);
    if (!ref) throw new Error('Refund not found.');
    if (ref.status !== 'APPROVED' && ref.status !== 'REQUESTED') {
      throw new Error(`Cannot process refund in status ${ref.status}.`);
    }

    ref.status = 'COMPLETED';
    ref.processedBy = req.actorId;
    ref.processedAt = new Date().toISOString();
    ref.notes = req.paymentGatewayRef ? `Gateway Ref: ${req.paymentGatewayRef}` : ref.notes;
    ref.updatedAt = new Date().toISOString();

    // Mutate payment status
    const pmt = this.payments.find((p) => p.id === ref.paymentId);
    if (pmt) {
      pmt.status = ref.amount >= pmt.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    }

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: ref.partnerId,
      organizationId: ref.organizationId,
      branchId: ref.branchId,
      transactionType: 'REFUND',
      referenceType: 'REFUND',
      referenceId: ref.refundNumber,
      patientId: ref.patientId,
      patientName: ref.patientName,
      debit: ref.amount,
      credit: 0,
      balanceImpact: ref.amount,
      actorId: req.actorId,
      notes: `Refund ${ref.refundNumber} of $${ref.amount.toFixed(2)} completed.`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: ref.partnerId,
      organizationId: ref.organizationId,
      branchId: ref.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'REFUND_COMPLETED',
      entityType: 'REFUND',
      entityId: ref.id,
      patientId: ref.patientId,
      invoiceId: ref.invoiceId || undefined,
      afterSnapshot: ref as unknown as Record<string, unknown>,
      financialImpact: ref.amount,
      reason: req.justification
    });

    return ref;
  }

  public async getCreditNotes(tenantId: string, branchId?: string): Promise<BillingCreditNoteDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.creditNotes.filter((c) => c.tenantId === tenantId);
    if (branchId) list = list.filter((c) => c.branchId === branchId);
    return list;
  }

  public async createCreditNote(req: CreateCreditNoteRequest): Promise<BillingCreditNoteDto> {
    const inv = this.invoices.find((i) => i.id === req.invoiceId && i.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');

    const noteId = crypto.randomUUID();
    const creditNoteNumber = `CRN-${new Date().getFullYear()}-${String(this.creditNotes.length + 6).padStart(5, '0')}`;

    const newCreditNote: BillingCreditNoteDto = {
      id: noteId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      invoiceId: req.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      patientId: req.patientId,
      patientName: inv.patientName,
      creditNoteNumber,
      amount: req.amount,
      reason: req.reason,
      status: 'APPLIED',
      approvedBy: req.actorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.creditNotes.unshift(newCreditNote);

    // Reduce invoice balance
    inv.dueAmount = Math.max(0, inv.dueAmount - req.amount);
    inv.totalAmount = Math.max(0, inv.totalAmount - req.amount);
    if (inv.dueAmount === 0 && inv.paidAmount > 0) {
      inv.status = 'PAID';
    }

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transactionType: 'CREDIT_NOTE',
      referenceType: 'CREDIT_NOTE',
      referenceId: creditNoteNumber,
      patientId: req.patientId,
      patientName: inv.patientName,
      debit: 0,
      credit: req.amount,
      balanceImpact: -req.amount,
      actorId: req.actorId,
      notes: `Credit Note ${creditNoteNumber} issued against invoice ${inv.invoiceNumber}`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'CREDIT_NOTE_CREATED',
      entityType: 'CREDIT_NOTE',
      entityId: noteId,
      patientId: req.patientId,
      invoiceId: req.invoiceId,
      afterSnapshot: newCreditNote as unknown as Record<string, unknown>,
      financialImpact: -req.amount,
      reason: req.justification
    });

    return newCreditNote;
  }

  public async getDebitAdjustments(tenantId: string, branchId?: string): Promise<BillingDebitAdjustmentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.debitAdjustments.filter((d) => d.tenantId === tenantId);
    if (branchId) list = list.filter((d) => d.branchId === branchId);
    return list;
  }

  public async createDebitAdjustment(req: CreateDebitAdjustmentRequest): Promise<BillingDebitAdjustmentDto> {
    const inv = this.invoices.find((i) => i.id === req.invoiceId && i.tenantId === req.tenantId);
    if (!inv) throw new Error('Invoice not found.');

    const adjustmentId = crypto.randomUUID();
    const adjustmentNumber = `DBA-${new Date().getFullYear()}-${String(this.debitAdjustments.length + 4).padStart(5, '0')}`;

    const newAdjustment: BillingDebitAdjustmentDto = {
      id: adjustmentId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      invoiceId: req.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      patientId: req.patientId,
      patientName: inv.patientName,
      adjustmentNumber,
      amount: req.amount,
      reason: req.reason,
      status: 'APPLIED',
      approvedBy: req.actorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.debitAdjustments.unshift(newAdjustment);

    // Increase invoice balance
    inv.totalAmount += req.amount;
    inv.dueAmount += req.amount;
    if (inv.status === 'PAID') {
      inv.status = 'PARTIALLY_PAID';
    }

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transactionType: 'DEBIT_ADJUSTMENT',
      referenceType: 'DEBIT_ADJUSTMENT',
      referenceId: adjustmentNumber,
      patientId: req.patientId,
      patientName: inv.patientName,
      debit: req.amount,
      credit: 0,
      balanceImpact: req.amount,
      actorId: req.actorId,
      notes: `Debit Adjustment ${adjustmentNumber} applied to invoice ${inv.invoiceNumber}`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'DEBIT_ADJUSTMENT_CREATED',
      entityType: 'DEBIT_ADJUSTMENT',
      entityId: adjustmentId,
      patientId: req.patientId,
      invoiceId: req.invoiceId,
      afterSnapshot: newAdjustment as unknown as Record<string, unknown>,
      financialImpact: req.amount,
      reason: req.justification
    });

    return newAdjustment;
  }

  public async getAdvances(tenantId: string, branchId?: string, patientId?: string): Promise<BillingAdvanceDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.advances.filter((a) => a.tenantId === tenantId);
    if (branchId) list = list.filter((a) => a.branchId === branchId);
    if (patientId) list = list.filter((a) => a.patientId === patientId);
    return list;
  }

  public async createAdvance(req: CreateAdvanceRequest): Promise<BillingAdvanceDto> {
    const advanceId = crypto.randomUUID();
    const advanceNumber = `ADV-${new Date().getFullYear()}-${String(this.advances.length + 22).padStart(5, '0')}`;

    const newAdvance: BillingAdvanceDto = {
      id: advanceId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      patientId: req.patientId,
      patientName: req.patientName || 'Sample Patient',
      patientMrn: req.patientMrn || 'MRN-SAMPLE',
      encounterId: req.encounterId,
      advanceNumber,
      amount: req.amount,
      availableAmount: req.amount,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.advances.unshift(newAdvance);

    this.recordFinancialTransaction({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transactionType: 'ADVANCE_DEPOSIT',
      referenceType: 'ADVANCE',
      referenceId: advanceNumber,
      patientId: req.patientId,
      patientName: req.patientName || 'Sample Patient',
      debit: 0,
      credit: req.amount,
      balanceImpact: -req.amount,
      actorId: req.actorId,
      notes: `Advance deposit ${advanceNumber} of $${req.amount.toFixed(2)} recorded`
    });

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'ADVANCE_RECORDED',
      entityType: 'ADVANCE',
      entityId: advanceId,
      patientId: req.patientId,
      afterSnapshot: newAdvance as unknown as Record<string, unknown>,
      financialImpact: -req.amount,
      reason: req.justification
    });

    return newAdvance;
  }

  public async getCashierSessions(tenantId: string, branchId?: string, status?: string): Promise<BillingCashierSessionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.cashierSessions.filter((s) => s.tenantId === tenantId);
    if (branchId) list = list.filter((s) => s.branchId === branchId);
    if (status) list = list.filter((s) => s.status === status);
    return list;
  }

  public async openCashierSession(req: OpenCashierSessionRequest): Promise<BillingCashierSessionDto> {
    const existingOpen = this.cashierSessions.find(
      (s) => s.tenantId === req.tenantId && s.cashierId === req.cashierId && s.status === 'OPEN'
    );
    if (existingOpen) {
      throw new Error(`Cashier "${req.cashierName}" already has an open session (${existingOpen.sessionNumber}).`);
    }

    const sessionId = crypto.randomUUID();
    const sessionNumber = `CSH-SESS-${new Date().getFullYear()}-${String(this.cashierSessions.length + 55).padStart(5, '0')}`;

    const newSession: BillingCashierSessionDto = {
      id: sessionId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      cashierId: req.cashierId,
      cashierName: req.cashierName,
      sessionNumber,
      openingBalance: req.openingBalance,
      cashReceived: 0.00,
      cashRefunded: 0.00,
      expectedClosingBalance: req.openingBalance,
      closingBalance: undefined,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.cashierSessions.unshift(newSession);

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'CASHIER_OPENED',
      entityType: 'CASHIER_SESSION',
      entityId: sessionId,
      afterSnapshot: newSession as unknown as Record<string, unknown>,
      financialImpact: req.openingBalance,
      reason: req.justification
    });

    return newSession;
  }

  public async closeCashierSession(req: CloseCashierSessionRequest): Promise<BillingCashierSessionDto> {
    const sess = this.cashierSessions.find((s) => s.id === req.sessionId && s.tenantId === req.tenantId);
    if (!sess) throw new Error('Cashier session not found.');
    if (sess.status !== 'OPEN') {
      throw new Error(`Cannot close cashier session in status ${sess.status}.`);
    }

    sess.status = 'CLOSED';
    sess.closingBalance = req.closingBalance;
    sess.closedAt = new Date().toISOString();
    sess.notes = req.notes;
    sess.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: sess.partnerId,
      organizationId: sess.organizationId,
      branchId: sess.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'CASHIER_CLOSED',
      entityType: 'CASHIER_SESSION',
      entityId: sess.id,
      afterSnapshot: sess as unknown as Record<string, unknown>,
      reason: req.justification
    });

    return sess;
  }

  public async getReconciliations(tenantId: string, branchId?: string): Promise<BillingReconciliationDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.reconciliations.filter((r) => r.tenantId === tenantId);
    if (branchId) list = list.filter((r) => r.branchId === branchId);
    return list;
  }

  public async reconcileCashierSession(req: ReconcileCashierSessionRequest): Promise<BillingReconciliationDto> {
    const sess = this.cashierSessions.find((s) => s.id === req.sessionId && s.tenantId === req.tenantId);
    if (!sess) throw new Error('Cashier session not found.');

    const expected = sess.expectedClosingBalance;
    const variance = req.actualAmount - expected;
    const status = Math.abs(variance) < 0.01 ? 'MATCHED' : 'DISCREPANCY';

    const reconciliationId = crypto.randomUUID();
    const newReconciliation: BillingReconciliationDto = {
      id: reconciliationId,
      tenantId: req.tenantId,
      partnerId: sess.partnerId,
      organizationId: sess.organizationId,
      branchId: sess.branchId,
      cashierSessionId: sess.id,
      sessionNumber: sess.sessionNumber,
      expectedAmount: expected,
      actualAmount: req.actualAmount,
      variance,
      status,
      reconciledBy: req.actorId,
      reconciledAt: new Date().toISOString(),
      remarks: req.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reconciliations.unshift(newReconciliation);
    sess.status = 'RECONCILED';
    sess.updatedAt = new Date().toISOString();

    this.appendAudit({
      tenantId: req.tenantId,
      partnerId: sess.partnerId,
      organizationId: sess.organizationId,
      branchId: sess.branchId,
      actorId: req.actorId,
      actorRole: req.actorRole,
      operation: 'RECONCILIATION_COMPLETED',
      entityType: 'RECONCILIATION',
      entityId: reconciliationId,
      afterSnapshot: newReconciliation as unknown as Record<string, unknown>,
      financialImpact: variance,
      reason: req.justification
    });

    return newReconciliation;
  }

  public async getFinancialTransactions(tenantId: string, branchId?: string): Promise<BillingFinancialTransactionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let list = this.transactions.filter((t) => t.tenantId === tenantId);
    if (branchId) list = list.filter((t) => t.branchId === branchId);
    return list;
  }

  public async getPatientBillingHistory(tenantId: string, patientId: string): Promise<PatientBillingHistoryDto | null> {
    if (!tenantId || !patientId) return null;
    const existing = MOCK_PATIENT_BILLING_HISTORIES[patientId];
    if (existing) return existing;

    const patientInvoices = this.invoices.filter((i) => i.patientId === patientId && i.tenantId === tenantId);
    const patientPayments = this.payments.filter((p) => p.patientId === patientId && p.tenantId === tenantId);
    const patientAdvances = this.advances.filter((a) => a.patientId === patientId && a.tenantId === tenantId);
    const patientReceipts = this.receipts.filter((r) => r.patientId === patientId && r.tenantId === tenantId);

    const totalBilled = patientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalanceDue = patientInvoices.reduce((sum, i) => sum + i.dueAmount, 0);
    const availableAdvance = patientAdvances.reduce((sum, a) => sum + a.availableAmount, 0);

    const name = patientInvoices[0]?.patientName || patientPayments[0]?.patientName || 'Sample Patient';
    const mrn = patientInvoices[0]?.patientMrn || patientPayments[0]?.patientMrn || 'MRN-SAMPLE';

    return {
      patientId,
      patientName: name,
      patientMrn: mrn,
      totalBilled,
      totalPaid,
      currentBalanceDue,
      availableAdvance,
      invoices: patientInvoices,
      payments: patientPayments,
      advances: patientAdvances,
      receipts: patientReceipts
    };
  }

  public async getRevenueAnalytics(tenantId: string, _branchId?: string): Promise<RevenueAnalyticsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return MOCK_REVENUE_ANALYTICS;
  }

  public async getBillingAuditTrail(req: QueryBillingAuditRequest): Promise<BillingAuditTraceDto[]> {
    if (!req.tenantId) throw new Error('Tenant ID is required');
    let list = this.auditTraces.filter((a) => a.tenantId === req.tenantId);
    if (req.branchId) list = list.filter((a) => a.branchId === req.branchId);
    if (req.patientId) list = list.filter((a) => a.patientId === req.patientId);
    if (req.invoiceId) list = list.filter((a) => a.invoiceId === req.invoiceId);
    if (req.operation) list = list.filter((a) => a.operation === req.operation);
    if (req.actorId) list = list.filter((a) => a.actorId === req.actorId);
    return list;
  }

  private recordFinancialTransaction(params: {
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    transactionType: string;
    referenceType: string;
    referenceId: string;
    patientId?: string | undefined;
    patientName?: string | undefined;
    debit: number;
    credit: number;
    balanceImpact: number;
    actorId: string;
    notes?: string | undefined;
  }): void {
    const transactionNumber = `FTX-${new Date().getFullYear()}-${String(this.transactions.length + 916).padStart(6, '0')}`;
    this.transactions.unshift({
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      partnerId: params.partnerId,
      organizationId: params.organizationId,
      branchId: params.branchId,
      transactionNumber,
      transactionType: params.transactionType,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      patientId: params.patientId,
      patientName: params.patientName,
      debit: params.debit,
      credit: params.credit,
      balanceImpact: params.balanceImpact,
      currency: 'USD',
      actorId: params.actorId,
      occurredAt: new Date().toISOString(),
      notes: params.notes,
      createdAt: new Date().toISOString()
    });
  }

  private appendAudit(params: {
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId?: string | null | undefined;
    actorId: string;
    actorRole: string;
    operation: string;
    entityType: string;
    entityId: string;
    patientId?: string | undefined;
    invoiceId?: string | undefined;
    beforeSnapshot?: Record<string, unknown> | undefined;
    afterSnapshot?: Record<string, unknown> | undefined;
    financialImpact?: number | undefined;
    reason: string;
  }): void {
    const traceId = `TRC-BILL-${new Date().getFullYear()}-${String(this.auditTraces.length + 104).padStart(6, '0')}`;
    const correlationId = `CORR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.auditTraces.length + 1).padStart(3, '0')}`;

    this.auditTraces.unshift({
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      partnerId: params.partnerId,
      organizationId: params.organizationId,
      branchId: params.branchId,
      traceId,
      correlationId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      operation: params.operation,
      entityType: params.entityType,
      entityId: params.entityId,
      patientId: params.patientId,
      invoiceId: params.invoiceId,
      beforeSnapshot: params.beforeSnapshot,
      afterSnapshot: params.afterSnapshot,
      financialImpact: params.financialImpact ?? 0.00,
      reason: params.reason,
      operationStatus: 'SUCCESS',
      timestamp: new Date().toISOString()
    });
  }
}

export const billingManagementService = new BillingManagementService();
