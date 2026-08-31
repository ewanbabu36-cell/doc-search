import crypto from 'crypto';
import { ProcurementRepository } from '../../repositories/partner/ProcurementRepository.js';
import { AppError } from '@docsearch/shared-core';

export class ProcurementService {
  constructor(private readonly repo = new ProcurementRepository()) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS'}::${serialized}`).digest('hex');
  }

  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  async getAnalytics(tenantId: string) {
    return await this.repo.getAnalytics(tenantId);
  }

  // Vendors
  async getVendors(tenantId: string) {
    return await this.repo.getVendors(tenantId);
  }

  async createVendor(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const vendorName = String(payload['vendorName'] || '');
    const vendorCategory = String(payload['vendorCategory'] || 'PHARMACEUTICALS');
    const vendorType = String(payload['vendorType'] || 'DISTRIBUTOR');

    if (!vendorName) {
      throw new AppError({ message: 'Vendor name is required', statusCode: 400 });
    }

    const vendorCode = 'VND-' + Date.now().toString().slice(-6);
    const vendor = await this.repo.createVendor({
      ...payload,
      tenantId,
      branchId,
      vendorCode,
      vendorName,
      vendorCategory,
      vendorType,
      status: 'ACTIVE'
    });

    const hash = this.computeHash({ event: 'VENDOR_CREATED', vendorCode, vendorName });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PROCUREMENT_VENDOR',
      entityId: vendor.id as string,
      action: 'CREATE_VENDOR',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Vendor onboarded and verified',
      details: { vendorCode, vendorName }
    });

    return vendor;
  }

  // Items
  async getItems(tenantId: string) {
    return await this.repo.getItems(tenantId);
  }

  async createItem(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const itemName = String(payload['itemName'] || '');
    const category = String(payload['category'] || 'MEDICINE');
    const unitOfMeasure = String(payload['unitOfMeasure'] || 'BOX');
    const standardPriceMinorUnits = Number(payload['standardPriceMinorUnits']) || 0;

    if (!itemName) {
      throw new AppError({ message: 'Item name is required', statusCode: 400 });
    }

    const itemCode = 'ITM-' + Date.now().toString().slice(-6);
    const item = await this.repo.createItem({
      ...payload,
      tenantId,
      branchId,
      itemCode,
      itemName,
      category,
      unitOfMeasure,
      standardPriceMinorUnits,
      reorderLevel: Number(payload['reorderLevel']) || 10,
      safetyStock: Number(payload['safetyStock']) || 5,
      currentStock: Number(payload['currentStock']) || 50
    });

    const hash = this.computeHash({ event: 'ITEM_CREATED', itemCode, itemName });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PROCUREMENT_ITEM',
      entityId: item.id as string,
      action: 'CREATE_ITEM',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Catalog item registered',
      details: { itemCode, itemName }
    });

    return item;
  }

  // Purchase Requisitions
  async getRequisitions(tenantId: string) {
    return await this.repo.getRequisitions(tenantId);
  }

  async createRequisition(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const departmentName = String(payload['departmentName'] || 'Pharmacy');
    const requestorName = String(payload['requestorName'] || actorId);
    const items = (payload['items'] as Record<string, unknown>[]) || [];

    if (items.length === 0) {
      throw new AppError({ message: 'Requisition must include at least one item', statusCode: 400 });
    }

    const requisitionNumber = 'PR-' + Date.now().toString().slice(-6);
    const totalCost = Number(payload['totalEstimatedCostMinorUnits']) || 100000;

    const requisition = await this.repo.createRequisition({
      ...payload,
      tenantId,
      branchId,
      requisitionNumber,
      departmentName,
      requestorName,
      urgency: String(payload['urgency'] || 'ROUTINE'),
      items,
      totalEstimatedCostMinorUnits: totalCost,
      justification: String(payload['justification'] || 'Stock replenishment'),
      status: 'PENDING_APPROVAL'
    });

    const hash = this.computeHash({ event: 'REQUISITION_CREATED', requisitionNumber, totalCost });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisition.id as string,
      action: 'CREATE_REQUISITION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Purchase requisition raised',
      details: { requisitionNumber, totalCost }
    });

    return requisition;
  }

  async approveRequisition(tenantId: string, requisitionId: string, actorId: string) {
    const updated = await this.repo.updateRequisition(requisitionId, {
      status: 'APPROVED',
      approvedBy: actorId,
      approvedAt: new Date()
    });

    if (!updated) throw new AppError({ message: 'Requisition not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'REQUISITION_APPROVED', requisitionId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisitionId,
      action: 'APPROVE_REQUISITION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Purchase requisition approved by department head',
      details: { approvedAt: new Date() }
    });

    return updated;
  }

  // Purchase Orders
  async getPurchaseOrders(tenantId: string) {
    return await this.repo.getPurchaseOrders(tenantId);
  }

  async createPurchaseOrder(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const vendorId = String(payload['vendorId'] || '');
    const vendorName = String(payload['vendorName'] || 'Vendor');
    const items = (payload['items'] as Record<string, unknown>[]) || [];

    if (!vendorId || items.length === 0) {
      throw new AppError({ message: 'Vendor and items are required', statusCode: 400 });
    }

    const poNumber = 'PO-' + Date.now().toString().slice(-6);
    const subtotal = Number(payload['subtotalMinorUnits']) || 5000000;
    const tax = Number(payload['taxMinorUnits']) || 600000;
    const total = subtotal + tax;

    const po = await this.repo.createPurchaseOrder({
      ...payload,
      tenantId,
      branchId,
      poNumber,
      vendorId,
      vendorName,
      items,
      subtotalMinorUnits: subtotal,
      taxMinorUnits: tax,
      totalMinorUnits: total,
      paymentTerms: String(payload['paymentTerms'] || 'NET_30'),
      shippingAddress: String(payload['shippingAddress'] || 'Central Hospital Pharmacy Warehouse, Dock 2'),
      status: 'DRAFT'
    });

    const hash = this.computeHash({ event: 'PO_CREATED', poNumber, total });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PURCHASE_ORDER',
      entityId: po.id as string,
      action: 'CREATE_PO',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Purchase order drafted',
      details: { poNumber, total }
    });

    return po;
  }

  async approvePurchaseOrder(tenantId: string, poId: string, actorId: string) {
    const updated = await this.repo.updatePurchaseOrder(poId, {
      status: 'APPROVED',
      approvedBy: actorId,
      approvedAt: new Date()
    });

    if (!updated) throw new AppError({ message: 'Purchase order not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'PO_APPROVED', poId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'PURCHASE_ORDER',
      entityId: poId,
      action: 'APPROVE_PO',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Purchase order approved for vendor transmission',
      details: { approvedAt: new Date() }
    });

    return updated;
  }

  async createEmergencyPurchase(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const poNumber = 'PO-EMG-' + Date.now().toString().slice(-6);
    const subtotal = Number(payload['subtotalMinorUnits']) || 1500000;
    const tax = Number(payload['taxMinorUnits']) || 180000;
    const total = subtotal + tax;

    const po = await this.repo.createPurchaseOrder({
      ...payload,
      tenantId,
      branchId,
      poNumber,
      vendorId: String(payload['vendorId'] || 'vnd-stat'),
      vendorName: String(payload['vendorName'] || 'Emergency Medical Suppliers'),
      items: (payload['items'] as Record<string, unknown>[]) || [{ itemName: 'STAT Antivenom / ICU Consumables', quantity: 10 }],
      subtotalMinorUnits: subtotal,
      taxMinorUnits: tax,
      totalMinorUnits: total,
      paymentTerms: 'IMMEDIATE_ON_DELIVERY',
      shippingAddress: 'Emergency & Trauma Care Dock 1',
      status: 'DISPATCHED_TO_VENDOR',
      approvedBy: actorId,
      approvedAt: new Date()
    });

    const hash = this.computeHash({ event: 'EMERGENCY_PO_CREATED', poNumber, total });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PURCHASE_ORDER',
      entityId: po.id as string,
      action: 'EMERGENCY_PO',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Emergency purchase order authorized under clinical urgency policy',
      details: { poNumber, total }
    });

    return po;
  }

  // Goods Receipts (GRN)
  async getGoodsReceipts(tenantId: string) {
    return await this.repo.getGoodsReceipts(tenantId);
  }

  async createGoodsReceipt(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const poId = String(payload['poId'] || '');
    const poNumber = String(payload['poNumber'] || 'PO-001');

    if (!poId) {
      throw new AppError({ message: 'Purchase Order ID is required for GRN', statusCode: 400 });
    }

    const grnNumber = 'GRN-' + Date.now().toString().slice(-6);
    const grn = await this.repo.createGoodsReceipt({
      ...payload,
      tenantId,
      branchId,
      grnNumber,
      poId,
      poNumber,
      vendorId: String(payload['vendorId'] || 'vnd-001'),
      vendorName: String(payload['vendorName'] || 'Vendor'),
      receivedBy: String(payload['receivedBy'] || actorId),
      challanNumber: String(payload['challanNumber'] || 'DC-8819'),
      items: (payload['items'] as Record<string, unknown>[]) || [],
      status: 'RECEIVED_PENDING_INSPECTION'
    });

    const hash = this.computeHash({ event: 'GRN_CREATED', grnNumber, poNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'GOODS_RECEIPT',
      entityId: grn.id as string,
      action: 'CREATE_GRN',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Goods received at warehouse dock',
      details: { grnNumber, poNumber }
    });

    return grn;
  }

  // Inspections
  async getInspections(tenantId: string) {
    return await this.repo.getInspections(tenantId);
  }

  async createInspection(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const grnId = String(payload['grnId'] || '');
    const overallResult = String(payload['overallResult'] || 'PASSED');

    if (!grnId) {
      throw new AppError({ message: 'GRN ID is required for inspection', statusCode: 400 });
    }

    const inspectionNumber = 'INSP-' + Date.now().toString().slice(-6);
    const inspection = await this.repo.createInspection({
      ...payload,
      tenantId,
      branchId,
      inspectionNumber,
      grnId,
      grnNumber: String(payload['grnNumber'] || 'GRN-001'),
      inspectorName: String(payload['inspectorName'] || actorId),
      overallResult,
      items: (payload['items'] as Record<string, unknown>[]) || []
    });

    const hash = this.computeHash({ event: 'INSPECTION_COMPLETED', inspectionNumber, overallResult });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PROCUREMENT_INSPECTION',
      entityId: inspection.id as string,
      action: 'COMPLETE_INSPECTION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Quality inspection completed',
      details: { inspectionNumber, overallResult }
    });

    return inspection;
  }

  // Invoices
  async getInvoices(tenantId: string) {
    return await this.repo.getInvoices(tenantId);
  }

  async createInvoice(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const invoiceNumber = String(payload['invoiceNumber'] || '');
    const poId = String(payload['poId'] || '');
    const grnId = String(payload['grnId'] || '');

    if (!invoiceNumber || !poId || !grnId) {
      throw new AppError({ message: 'Invoice Number, PO ID, and GRN ID are required', statusCode: 400 });
    }

    const invoice = await this.repo.createInvoice({
      ...payload,
      tenantId,
      branchId,
      invoiceNumber,
      poId,
      poNumber: String(payload['poNumber'] || 'PO-001'),
      grnId,
      grnNumber: String(payload['grnNumber'] || 'GRN-001'),
      vendorId: String(payload['vendorId'] || 'vnd-001'),
      vendorName: String(payload['vendorName'] || 'Vendor'),
      totalAmountMinorUnits: Number(payload['totalAmountMinorUnits']) || 5600000,
      taxAmountMinorUnits: Number(payload['taxAmountMinorUnits']) || 600000,
      status: 'ENTERED_PENDING_MATCH'
    });

    const hash = this.computeHash({ event: 'INVOICE_CREATED', invoiceNumber, total: payload['totalAmountMinorUnits'] });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PURCHASE_INVOICE',
      entityId: invoice.id as string,
      action: 'CREATE_INVOICE',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Vendor invoice registered for matching',
      details: { invoiceNumber, poId, grnId }
    });

    return invoice;
  }

  // 3-Way Matching
  async getInvoiceMatches(tenantId: string) {
    return await this.repo.getInvoiceMatches(tenantId);
  }

  async matchPurchaseInvoice(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const invoiceId = String(payload['invoiceId'] || '');
    const poId = String(payload['poId'] || '');
    const grnId = String(payload['grnId'] || '');

    if (!invoiceId || !poId || !grnId) {
      throw new AppError({ message: 'Invoice ID, PO ID, and GRN ID are required for 3-way matching', statusCode: 400 });
    }

    const matchNumber = 'MATCH-' + Date.now().toString().slice(-6);
    const varianceAmount = Number(payload['varianceAmountMinorUnits']) || 0;
    const variancePct = Number(payload['variancePercentage']) || 0;
    const withinTolerance = Math.abs(variancePct) <= 2.0;

    const match = await this.repo.createInvoiceMatch({
      ...payload,
      tenantId,
      branchId,
      matchNumber,
      invoiceId,
      poId,
      grnId,
      matchStatus: withinTolerance ? 'MATCHED_APPROVED_FOR_PAYMENT' : 'VARIANCE_EXCEPTION_FLAGGED',
      varianceAmountMinorUnits: varianceAmount,
      variancePercentage: variancePct,
      withinTolerance,
      matchedBy: actorId
    });

    const hash = this.computeHash({ event: '3WAY_MATCH_COMPLETED', matchNumber, withinTolerance });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'INVOICE_MATCH',
      entityId: match.id as string,
      action: 'MATCH_INVOICE',
      performedBy: actorId,
      integrityHash: hash,
      justification: '3-Way invoice match verified',
      details: { matchNumber, withinTolerance, variancePct }
    });

    return match;
  }

  // Vendor Returns
  async getVendorReturns(tenantId: string) {
    return await this.repo.getVendorReturns(tenantId);
  }

  async createVendorReturn(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const grnId = String(payload['grnId'] || '');
    const reason = String(payload['reason'] || 'Damaged goods in transit');

    if (!grnId) {
      throw new AppError({ message: 'GRN ID is required for vendor return', statusCode: 400 });
    }

    const returnNumber = 'RET-' + Date.now().toString().slice(-6);
    const ret = await this.repo.createVendorReturn({
      ...payload,
      tenantId,
      branchId,
      returnNumber,
      grnId,
      vendorId: String(payload['vendorId'] || 'vnd-001'),
      vendorName: String(payload['vendorName'] || 'Vendor'),
      reason,
      items: (payload['items'] as Record<string, unknown>[]) || [],
      status: 'RETURN_DISPATCHED'
    });

    const hash = this.computeHash({ event: 'VENDOR_RETURN_CREATED', returnNumber, reason });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'VENDOR_RETURN',
      entityId: ret.id as string,
      action: 'CREATE_RETURN',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Vendor return note generated',
      details: { returnNumber, reason }
    });

    return ret;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }
}
