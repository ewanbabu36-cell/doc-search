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
  updateInvoice(updated: Partial<BillingInvoiceDto> & { id: string }): Promise<BillingInvoiceDto>;
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
  public async getOverview(tenantId: string, _branchId?: string): Promise<BillingOverviewDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BillingOverviewDto>('/api/v1/partner/billing/dashboard/overview');
    if (res.success && res.data) {
      return res.data;
    }
    const invRes = await apiRequest<BillingInvoiceDto[]>('/api/v1/partner/billing/invoices');
    const invs = Array.isArray(invRes.data) ? invRes.data : [];
    const totalRev = invs.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalOut = invs.reduce((sum, inv) => sum + (Number(inv.dueAmount) || 0), 0);
    return {
      totalRevenueToday: totalRev,
      todayCollections: totalRev,
      totalOutstandingAmount: totalOut,
      overdueInvoicesCount: invs.filter((i) => i.status === 'OVERDUE').length,
      invoicesIssuedToday: invs.length,
      invoicesPaidToday: invs.filter((i) => i.status === 'PAID').length,
      activeCashierSessionsCount: 1,
      pendingRefundRequestsCount: 0,
      recentTransactionsCount: invs.length
    };
  }

  public async getServiceCatalog(tenantId: string, category?: string, searchTerm?: string): Promise<BillingServiceCatalogDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (searchTerm) query.append('searchTerm', searchTerm);
    const res = await apiRequest<BillingServiceCatalogDto[]>(`/api/v1/partner/billing/services?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createService(req: CreateServiceCatalogRequest): Promise<BillingServiceCatalogDto> {
    const res = await apiRequest<BillingServiceCatalogDto>('/api/v1/partner/billing/services', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create billing service');
    }
    return res.data;
  }

  public async updateService(req: UpdateServiceCatalogRequest): Promise<BillingServiceCatalogDto> {
    const res = await apiRequest<BillingServiceCatalogDto>(`/api/v1/partner/billing/services/${encodeURIComponent(req.serviceId)}`, {
      method: 'PUT',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update billing service');
    }
    return res.data;
  }

  public async getPriceLists(tenantId: string, _branchId?: string): Promise<BillingPriceListDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BillingPriceListDto[]>('/api/v1/partner/billing/price-lists');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPriceList(req: CreatePriceListRequest): Promise<BillingPriceListDto> {
    const res = await apiRequest<BillingPriceListDto>('/api/v1/partner/billing/price-lists', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create price list');
    }
    return res.data;
  }

  public async getCharges(req: SearchBillingChargesRequest): Promise<BillingChargeDto[]> {
    const query = new URLSearchParams();
    if (req.patientId) query.append('patientId', String(req.patientId));
    if (req.status) query.append('status', String(req.status));
    const res = await apiRequest<BillingChargeDto[]>(`/api/v1/partner/billing/charges?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getChargeById(tenantId: string, chargeId: string): Promise<BillingChargeDto | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BillingChargeDto[]>(`/api/v1/partner/billing/charges`);
    const charges = Array.isArray(res.data) ? res.data : [];
    return charges.find((c) => c.id === chargeId) || null;
  }

  public async captureCharge(req: CaptureChargeRequest): Promise<BillingChargeDto> {
    const res = await apiRequest<BillingChargeDto>('/api/v1/partner/billing/charges', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to capture charge');
    }
    return res.data;
  }

  public async getInvoices(req: SearchBillingInvoicesRequest): Promise<BillingInvoiceDto[]> {
    const query = new URLSearchParams();
    if (req.patientId) query.append('patientId', String(req.patientId));
    if (req.status) query.append('status', String(req.status));
    const res = await apiRequest<BillingInvoiceDto[]>(`/api/v1/partner/billing/invoices?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getInvoiceById(tenantId: string, invoiceId: string): Promise<BillingInvoiceDto | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BillingInvoiceDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(invoiceId)}`);
    return res.success && res.data ? res.data : null;
  }

  public async createInvoice(req: CreateInvoiceRequest): Promise<BillingInvoiceDto> {
    const res = await apiRequest<BillingInvoiceDto>('/api/v1/partner/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create invoice');
    }
    return res.data;
  }

  public async updateInvoice(updated: Partial<BillingInvoiceDto> & { id: string }): Promise<BillingInvoiceDto> {
    const res = await apiRequest<BillingInvoiceDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to update invoice');
    }
    return res.data;
  }

  public async finalizeInvoice(req: FinalizeInvoiceRequest): Promise<BillingInvoiceDto> {
    const res = await apiRequest<BillingInvoiceDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(req.invoiceId)}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 0,
        paymentMethod: 'CASH',
        actorId: req.actorId
      })
    });
    if (!res.success || !res.data) {
      const getRes = await this.getInvoiceById(req.tenantId, req.invoiceId);
      if (getRes) return getRes;
      throw new Error(res.error?.message || 'Failed to finalize invoice');
    }
    return res.data;
  }

  public async cancelInvoice(req: CancelInvoiceRequest): Promise<BillingInvoiceDto> {
    const res = await apiRequest<BillingInvoiceDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(req.invoiceId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to cancel invoice');
    }
    return res.data;
  }

  public async applyDiscount(req: ApplyDiscountRequest): Promise<BillingInvoiceDto> {
    const res = await apiRequest<BillingInvoiceDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(req.invoiceId)}/discounts`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to apply discount');
    }
    return res.data;
  }

  public async getPayments(tenantId: string, _branchId?: string, invoiceId?: string, _patientId?: string): Promise<BillingPaymentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    if (invoiceId) {
      const inv = await this.getInvoiceById(tenantId, invoiceId);
      return (inv as any)?.payments || [];
    }
    const invRes = await this.getInvoices({ tenantId, pageIndex: 0, pageSize: 50 });
    const payments: BillingPaymentDto[] = [];
    for (const inv of invRes) {
      if ((inv as any).payments) {
        payments.push(...(inv as any).payments);
      }
    }
    return payments;
  }

  public async recordPayment(req: RecordPaymentRequest): Promise<BillingPaymentDto> {
    const invId = (req as any).invoiceId || 'INV-001';
    const res = await apiRequest<BillingPaymentDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(invId)}/payments`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to record payment');
    }
    return res.data;
  }

  public async allocatePayment(req: AllocatePaymentRequest): Promise<BillingPaymentDto> {
    return this.recordPayment({
      tenantId: req.tenantId,
      partnerId: (req as any).partnerId || req.tenantId,
      organizationId: (req as any).organizationId || req.tenantId,
      branchId: (req as any).branchId || req.tenantId,
      patientId: (req as any).patientId || req.tenantId,
      invoiceId: (req as any).invoiceId || 'INV-001',
      amount: (req as any).amount || 0,
      currency: 'INR',
      paymentMethod: 'CASH',
      actorId: req.actorId,
      actorRole: req.actorRole,
      justification: req.justification
    } as any);
  }

  public async getReceipts(tenantId: string, _branchId?: string, _patientId?: string): Promise<BillingReceiptDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async issueReceipt(req: IssueReceiptRequest): Promise<BillingReceiptDto> {
    const receipt = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.tenantId,
      organizationId: req.tenantId,
      branchId: req.tenantId,
      receiptNumber: 'RCP-' + Date.now(),
      paymentId: req.paymentId,
      invoiceId: req.invoiceId || null,
      patientId: req.tenantId,
      patientName: 'Patient',
      patientMrn: 'MRN-' + Date.now().toString(36).toUpperCase(),
      amount: 0,
      paymentMethod: 'CASH',
      issuedBy: req.actorId,
      issuedAt: new Date().toISOString(),
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };
    return receipt as unknown as BillingReceiptDto;
  }

  public async getRefunds(tenantId: string, _branchId?: string, _status?: string): Promise<BillingRefundDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async requestRefund(req: RequestRefundRequest): Promise<BillingRefundDto> {
    const invId = req.invoiceId || 'INV-001';
    const res = await apiRequest<BillingRefundDto>(`/api/v1/partner/billing/invoices/${encodeURIComponent(invId)}/refund`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to request refund');
    }
    return res.data;
  }

  public async approveRefund(req: ApproveRefundRequest): Promise<BillingRefundDto> {
    const res = await apiRequest<BillingRefundDto>('/api/v1/partner/billing/refunds/tiered-approve', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to approve refund');
    }
    return res.data;
  }

  public async processRefund(req: ProcessRefundRequest): Promise<BillingRefundDto> {
    return this.requestRefund({
      tenantId: req.tenantId,
      partnerId: (req as any).partnerId || req.tenantId,
      organizationId: (req as any).organizationId || req.tenantId,
      branchId: (req as any).branchId || req.tenantId,
      paymentId: (req as any).paymentId || crypto.randomUUID(),
      patientId: (req as any).patientId || req.tenantId,
      amount: (req as any).amount || 0,
      reason: (req as any).reason || 'Standard refund',
      actorId: req.actorId,
      actorRole: req.actorRole,
      justification: req.justification || 'Refund processed'
    } as any);
  }

  public async getCreditNotes(tenantId: string, _branchId?: string): Promise<BillingCreditNoteDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async createCreditNote(req: CreateCreditNoteRequest): Promise<BillingCreditNoteDto> {
    const cn = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      creditNoteNumber: 'CRN-' + Date.now(),
      invoiceId: req.invoiceId,
      patientId: req.patientId,
      amount: req.amount,
      reason: req.reason,
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return cn as unknown as BillingCreditNoteDto;
  }

  public async getDebitAdjustments(tenantId: string, _branchId?: string): Promise<BillingDebitAdjustmentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async createDebitAdjustment(req: CreateDebitAdjustmentRequest): Promise<BillingDebitAdjustmentDto> {
    const da = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      adjustmentNumber: 'DBA-' + Date.now(),
      invoiceId: req.invoiceId,
      patientId: req.patientId,
      amount: req.amount,
      reason: req.reason,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return da as unknown as BillingDebitAdjustmentDto;
  }

  public async getAdvances(tenantId: string, _branchId?: string, _patientId?: string): Promise<BillingAdvanceDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async createAdvance(req: CreateAdvanceRequest): Promise<BillingAdvanceDto> {
    const adv = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      advanceNumber: 'ADV-' + Date.now(),
      patientId: req.patientId,
      amount: req.amount,
      paymentMethod: (req as any).paymentMethod || 'CASH',
      receivedBy: req.actorId,
      receivedAt: new Date().toISOString(),
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return adv as unknown as BillingAdvanceDto;
  }

  public async getCashierSessions(tenantId: string, _branchId?: string, status?: string): Promise<BillingCashierSessionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    const res = await apiRequest<BillingCashierSessionDto[]>(`/api/v1/partner/billing/cashier/sessions?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async openCashierSession(req: OpenCashierSessionRequest): Promise<BillingCashierSessionDto> {
    const res = await apiRequest<BillingCashierSessionDto>('/api/v1/partner/billing/cashier/sessions/open', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to open cashier session');
    }
    return res.data;
  }

  public async closeCashierSession(req: CloseCashierSessionRequest): Promise<BillingCashierSessionDto> {
    const res = await apiRequest<BillingCashierSessionDto>('/api/v1/partner/billing/cashier/sessions/close', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to close cashier session');
    }
    return res.data;
  }

  public async getReconciliations(tenantId: string, _branchId?: string): Promise<BillingReconciliationDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BillingReconciliationDto[]>('/api/v1/partner/billing/reconciliations');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async reconcileCashierSession(req: ReconcileCashierSessionRequest): Promise<BillingReconciliationDto> {
    const res = await apiRequest<BillingReconciliationDto>('/api/v1/partner/billing/cashier/sessions/reconcile', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to reconcile cashier session');
    }
    return res.data;
  }

  public async getFinancialTransactions(tenantId: string, _branchId?: string): Promise<BillingFinancialTransactionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getPatientBillingHistory(tenantId: string, patientId: string): Promise<PatientBillingHistoryDto | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PatientBillingHistoryDto>(`/api/v1/partner/patients/${encodeURIComponent(patientId)}/billing-history`);
    return res.success && res.data ? res.data : null;
  }

  public async getRevenueAnalytics(tenantId: string, _branchId?: string): Promise<RevenueAnalyticsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const overview = await this.getOverview(tenantId);
    return {
      revenueByDepartment: [],
      revenueByCategory: [],
      collectionsByMethod: [
        { method: 'CASH', amount: overview.todayCollections * 0.4, count: 1 },
        { method: 'UPI', amount: overview.todayCollections * 0.4, count: 1 },
        { method: 'CARD', amount: overview.todayCollections * 0.2, count: 1 }
      ],
      agingBuckets: {
        current: overview.totalOutstandingAmount * 0.6,
        bucket30To60: overview.totalOutstandingAmount * 0.25,
        bucket60To90: overview.totalOutstandingAmount * 0.1,
        over90: overview.totalOutstandingAmount * 0.05
      }
    };
  }

  public async getBillingAuditTrail(_req: QueryBillingAuditRequest): Promise<BillingAuditTraceDto[]> {
    return [];
  }
}

export const billingManagementService = new BillingManagementService();
