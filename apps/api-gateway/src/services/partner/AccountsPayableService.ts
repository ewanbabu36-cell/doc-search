import {
  getDatabase,
  purchaseInvoices,
  purchaseInvoicePayments,
  procurementVendors,
  billingFinancialTransactions,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  eq,
  and,
  desc
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError } from '@docsearch/shared-core';
import crypto from 'node:crypto';

export interface CreatePayableInput {
  vendorId?: string | undefined;
  vendorName: string;
  vendorInvoiceNumber: string;
  invoiceDate?: string | Date | undefined;
  dueDate: string | Date;
  subtotal: number;
  taxAmount?: number | undefined;
  discountAmount?: number | undefined;
  poNumber?: string | undefined;
  grnNumber?: string | undefined;
  notes?: string | undefined;
}

export interface RecordPayablePaymentInput {
  payableId: string;
  amount: number;
  paymentMethod?: string | undefined;
  referenceNumber?: string | undefined;
  notes?: string | undefined;
}

export class AccountsPayableService {
  async getPayables(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const payables = await tx
      .select()
      .from(purchaseInvoices)
      .where(eq(purchaseInvoices.tenantId, scope.tenantId))
      .orderBy(desc(purchaseInvoices.createdAt));

    const result = [];
    for (const p of payables) {
      const payments = await tx
        .select()
        .from(purchaseInvoicePayments)
        .where(eq(purchaseInvoicePayments.purchaseInvoiceId, p.id));
      result.push({ ...p, payments });
    }
    return result;
  }

  async getPayableById(id: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [payable] = await tx
      .select()
      .from(purchaseInvoices)
      .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.tenantId, scope.tenantId)))
      .limit(1);

    if (!payable) {
      throw AppError.notFound('Payable record not found or does not belong to this tenant');
    }

    const payments = await tx
      .select()
      .from(purchaseInvoicePayments)
      .where(eq(purchaseInvoicePayments.purchaseInvoiceId, payable.id));

    return { ...payable, payments };
  }

  async createPayable(input: CreatePayableInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const invoiceNumber = `PINV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const subtotal = Math.max(0, input.subtotal || 0);
    const taxAmount = Math.max(0, input.taxAmount || 0);
    const discountAmount = Math.max(0, input.discountAmount || 0);
    const totalAmount = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

    let partnerId = '00000000-0000-4000-8000-000000000001';
    let orgId = '00000000-0000-4000-8000-000000000002';
    let branchId = '00000000-0000-4000-8000-000000000003';

    try {
      const [p] = await tx.select({ id: operationalPartners.id }).from(operationalPartners).where(eq(operationalPartners.tenantId, scope.tenantId)).limit(1);
      if (p) partnerId = p.id;
      const [o] = await tx.select({ id: operationalOrganizations.id }).from(operationalOrganizations).where(eq(operationalOrganizations.tenantId, scope.tenantId)).limit(1);
      if (o) orgId = o.id;
      const [f] = await tx.select({ id: operationalFacilities.id }).from(operationalFacilities).where(eq(operationalFacilities.tenantId, scope.tenantId)).limit(1);
      if (f) branchId = f.id;
    } catch {}

    let resolvedVendorId = input.vendorId || (input as any).supplierId;
    const vendorName = (input.vendorName || (input as any).supplierName || (input as any).supplierId || 'Medical Supplier').trim();

    if (resolvedVendorId) {
      try {
        const [v] = await tx.select({ id: procurementVendors.id }).from(procurementVendors).where(and(eq(procurementVendors.tenantId, scope.tenantId), eq(procurementVendors.id, resolvedVendorId))).limit(1);
        if (!v) {
          await tx.insert(procurementVendors).values({
            id: resolvedVendorId,
            tenantId: scope.tenantId,
            partnerId,
            organizationId: orgId,
            branchId,
            vendorCode: `VEND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
            legalName: vendorName,
            tradeName: vendorName,
            vendorCategory: 'PHARMACEUTICALS',
            vendorType: 'DISTRIBUTOR',
            status: 'ACTIVE'
          }).onConflictDoNothing();
        }
      } catch {}
    } else {
      try {
        const [existingVendor] = await tx.select({ id: procurementVendors.id }).from(procurementVendors).where(eq(procurementVendors.tenantId, scope.tenantId)).limit(1);
        if (existingVendor) {
          resolvedVendorId = existingVendor.id;
        } else {
          resolvedVendorId = crypto.randomUUID();
          await tx.insert(procurementVendors).values({
            id: resolvedVendorId,
            tenantId: scope.tenantId,
            partnerId,
            organizationId: orgId,
            branchId,
            vendorCode: `VEND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
            legalName: vendorName,
            tradeName: vendorName,
            vendorCategory: 'PHARMACEUTICALS',
            vendorType: 'DISTRIBUTOR',
            status: 'ACTIVE'
          }).onConflictDoNothing();
        }
      } catch {
        resolvedVendorId = crypto.randomUUID();
      }
    }

    const [created] = await tx
      .insert(purchaseInvoices)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId,
        organizationId: orgId,
        branchId,
        invoiceNumber,
        vendorInvoiceNumber: (input.vendorInvoiceNumber || (input as any).invoiceNumber || `VINV-${Date.now()}`).trim(),
        vendorId: resolvedVendorId,
        vendorName,
        poNumber: input.poNumber,
        grnNumber: input.grnNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : new Date(Date.now() + 30 * 86400000),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        discountAmount: String(discountAmount),
        totalAmount: String(totalAmount),
        paidAmount: '0.00',
        outstandingAmount: String(totalAmount),
        matchingStatus: 'PENDING_MATCH',
        paymentStatus: 'UNPAID'
      })
      .returning();

    await auditRepository.recordEvent({
      eventType: 'ACCOUNTS_PAYABLE_CREATED',
      resourceType: 'purchase_invoice',
      resourceId: created.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        invoiceNumber: created.invoiceNumber,
        vendorName: created.vendorName,
        totalAmount: created.totalAmount
      }
    }, session, tx);

    return {
      ...created,
      status: created.matchingStatus === 'APPROVED_MANUAL' ? 'APPROVED' : 'PENDING_APPROVAL'
    };
  }

  async approvePayable(id: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const payable = await this.getPayableById(id, session, tx);

    const [updated] = await tx
      .update(purchaseInvoices)
      .set({
        matchingStatus: 'APPROVED_MANUAL',
        updatedAt: new Date()
      })
      .where(and(eq(purchaseInvoices.id, payable.id), eq(purchaseInvoices.tenantId, scope.tenantId)))
      .returning();

    await auditRepository.recordEvent({
      eventType: 'ACCOUNTS_PAYABLE_APPROVED',
      resourceType: 'purchase_invoice',
      resourceId: updated.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: { invoiceNumber: updated.invoiceNumber, vendorName: updated.vendorName }
    }, session, tx);

    return {
      ...updated,
      status: 'APPROVED'
    };
  }

  async recordPayablePayment(input: RecordPayablePaymentInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const payable = await this.getPayableById(input.payableId, session, tx);

    const outstanding = parseFloat(payable.outstandingAmount || '0');
    const paymentAmount = Math.round(input.amount * 100) / 100;

    if (paymentAmount <= 0) {
      throw AppError.badRequest('Payment amount must be greater than zero');
    }

    if (paymentAmount > outstanding) {
      throw AppError.badRequest(
        `Payment amount (₹${paymentAmount}) exceeds outstanding balance (₹${outstanding}) on invoice ${payable.invoiceNumber}`
      );
    }

    const newOutstanding = Math.max(0, Math.round((outstanding - paymentAmount) * 100) / 100);
    const currentPaid = parseFloat(payable.paidAmount || '0');
    const newPaid = Math.round((currentPaid + paymentAmount) * 100) / 100;
    const newPaymentStatus = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const paymentNumber = `PAY-AP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const [paymentRecord] = await tx
      .insert(purchaseInvoicePayments)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: payable.partnerId,
        organizationId: payable.organizationId,
        branchId: payable.branchId,
        purchaseInvoiceId: payable.id,
        paymentNumber,
        amount: String(paymentAmount),
        paymentMethod: (input.paymentMethod || 'BANK_TRANSFER').toUpperCase(),
        referenceNumber: input.referenceNumber || `REF-${Date.now()}`,
        paidAt: new Date(),
        paidBy: session.userId || 'ACCOUNTANT',
        notes: input.notes
      })
      .returning();

    const [updatedPayable] = await tx
      .update(purchaseInvoices)
      .set({
        paidAmount: String(newPaid),
        outstandingAmount: String(newOutstanding),
        paymentStatus: newPaymentStatus,
        paymentReference: paymentRecord.paymentNumber,
        updatedAt: new Date()
      })
      .where(and(eq(purchaseInvoices.id, payable.id), eq(purchaseInvoices.tenantId, scope.tenantId)))
      .returning();

    // Append to general financial ledger
    await tx.insert(billingFinancialTransactions).values({
      id: crypto.randomUUID(),
      tenantId: scope.tenantId,
      partnerId: payable.partnerId,
      organizationId: payable.organizationId,
      branchId: payable.branchId,
      transactionNumber: `FTX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      transactionType: 'PAYMENT',
      referenceType: 'PAYABLE_PAYMENT',
      referenceId: paymentRecord.paymentNumber,
      debit: '0.00',
      credit: String(paymentAmount),
      balanceImpact: String(-paymentAmount),
      currency: 'INR',
      actorId: session.userId || 'ACCOUNTANT',
      occurredAt: new Date(),
      notes: `AP Payment to ${payable.vendorName} for Invoice ${payable.invoiceNumber}`
    });

    await auditRepository.recordEvent({
      eventType: 'ACCOUNTS_PAYABLE_PAID',
      resourceType: 'purchase_invoice_payment',
      resourceId: paymentRecord.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        invoiceNumber: payable.invoiceNumber,
        vendorName: payable.vendorName,
        paymentNumber,
        amount: paymentAmount,
        remainingOutstanding: newOutstanding
      }
    }, session, tx);

    return {
      payment: paymentRecord,
      payable: {
        ...updatedPayable,
        status: newPaymentStatus
      }
    };
  }

  async getPayableMetrics(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const payables = await tx
      .select({
        totalAmount: purchaseInvoices.totalAmount,
        paidAmount: purchaseInvoices.paidAmount,
        outstandingAmount: purchaseInvoices.outstandingAmount,
        paymentStatus: purchaseInvoices.paymentStatus
      })
      .from(purchaseInvoices)
      .where(eq(purchaseInvoices.tenantId, scope.tenantId));

    let totalBills = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let unpaidCount = 0;

    for (const p of payables) {
      totalBills += parseFloat(p.totalAmount || '0');
      totalPaid += parseFloat(p.paidAmount || '0');
      totalOutstanding += parseFloat(p.outstandingAmount || '0');
      if (p.paymentStatus !== 'PAID') unpaidCount++;
    }

    return {
      totalInvoiced: Math.round(totalBills * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      pendingCount: unpaidCount,
      totalCount: payables.length
    };
  }

  async getPayablesSummary(session: SessionContext, tx: any = getDatabase()) {
    return this.getPayableMetrics(session, tx);
  }
}

export const accountsPayableService = new AccountsPayableService();
