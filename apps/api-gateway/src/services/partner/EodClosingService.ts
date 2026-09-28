import {
  getDatabase,
  billingEodClosings,
  billingInvoices,
  billingPayments,
  billingRefunds,
  billingReconciliations,
  purchaseInvoicePayments,
  eq,
  and,
  desc,
  ne
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError } from '@docsearch/shared-core';

export interface CloseDayInput {
  closingDate?: string | undefined;
  notes?: string | undefined;
}

export interface ReopenDayInput {
  reason: string;
  supervisorOverrideToken?: string | undefined;
}

export class EodClosingService {
  async closeDay(input: CloseDayInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const branchId = scope.branchId || session.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    const closingDate = (input.closingDate || new Date().toISOString().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closingDate)) {
      throw AppError.badRequest('closingDate must be in format YYYY-MM-DD');
    }

    // 1. Prevent accidental duplicate closure
    const [existing] = await tx
      .select()
      .from(billingEodClosings)
      .where(and(
        eq(billingEodClosings.tenantId, scope.tenantId),
        eq(billingEodClosings.branchId, branchId),
        eq(billingEodClosings.closingDate, closingDate)
      ))
      .limit(1);

    if (existing && existing.status === 'CLOSED') {
      throw AppError.badRequest(
        `Business date ${closingDate} is already closed (Session: ${existing.id}). Duplicate closure rejected.`
      );
    }

    // 2. Aggregate real metrics from PostgreSQL for this date
    const dayInvoices = await tx
      .select()
      .from(billingInvoices)
      .where(and(
        eq(billingInvoices.tenantId, scope.tenantId),
        ne(billingInvoices.status, 'CANCELLED'),
        ne(billingInvoices.status, 'VOIDED')
      ));

    // Filter to closingDate by createdAt or issuedAt
    const filteredInvoices = dayInvoices.filter((inv: any) => {
      const d = inv.issuedAt || inv.createdAt;
      const invDate = new Date(d).toISOString().slice(0, 10);
      return invDate === closingDate;
    });

    let grossBilling = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let netBilling = 0;
    let creditIssued = 0;
    const departmentBreakdown: Record<string, number> = {};

    for (const inv of filteredInvoices) {
      const sub = parseFloat(inv.subtotal || '0');
      const disc = parseFloat(inv.discountTotal || '0');
      const tax = parseFloat(inv.taxTotal || '0');
      const tot = parseFloat(inv.totalAmount || '0');

      grossBilling += sub;
      discountTotal += disc;
      taxTotal += tax;
      netBilling += tot;

      if (inv.invoiceType === 'CREDIT' || inv.status === 'CREDIT' || (inv as any).billingType === 'CREDIT') {
        creditIssued += parseFloat(inv.dueAmount || '0');
      }

      const dept = (inv.invoiceType || 'GENERAL').toUpperCase();
      departmentBreakdown[dept] = Math.round(((departmentBreakdown[dept] || 0) + tot) * 100) / 100;
    }

    // Aggregate Payments
    const allPayments = await tx
      .select()
      .from(billingPayments)
      .where(and(
        eq(billingPayments.tenantId, scope.tenantId),
        eq(billingPayments.status, 'SUCCESS')
      ));

    const filteredPayments = allPayments.filter((p: any) => {
      const pDate = new Date(p.receivedAt || p.createdAt).toISOString().slice(0, 10);
      return pDate === closingDate;
    });

    let cashCollected = 0;
    let digitalCollected = 0;
    let totalCollected = 0;

    for (const p of filteredPayments) {
      const amt = parseFloat(p.amount || '0');
      totalCollected += amt;
      if (p.paymentMethod?.toUpperCase() === 'CASH') {
        cashCollected += amt;
      } else {
        digitalCollected += amt;
      }
    }

    // Aggregate Refunds
    const allRefunds = await tx
      .select()
      .from(billingRefunds)
      .where(and(
        eq(billingRefunds.tenantId, scope.tenantId),
        eq(billingRefunds.status, 'COMPLETED')
      ));

    const filteredRefunds = allRefunds.filter((r: any) => {
      const rDate = new Date(r.processedAt || r.createdAt).toISOString().slice(0, 10);
      return rDate === closingDate;
    });

    let totalRefunded = 0;
    for (const r of filteredRefunds) {
      totalRefunded += parseFloat(r.amount || '0');
    }

    // Aggregate AP Payments
    const apPayments = await tx
      .select()
      .from(purchaseInvoicePayments)
      .where(eq(purchaseInvoicePayments.tenantId, scope.tenantId));

    const filteredApPayments = apPayments.filter((p: any) => {
      const apDate = new Date(p.paidAt || p.createdAt).toISOString().slice(0, 10);
      return apDate === closingDate;
    });

    let apPaid = 0;
    for (const p of filteredApPayments) {
      apPaid += parseFloat(p.amount || '0');
    }

    // Aggregate Reconciliations & Variances
    const dayReconciliations = await tx
      .select()
      .from(billingReconciliations)
      .where(eq(billingReconciliations.tenantId, scope.tenantId));

    const filteredReconcil = dayReconciliations.filter((r: any) => {
      const recDate = new Date(r.reconciledAt || r.createdAt).toISOString().slice(0, 10);
      return recDate === closingDate;
    });

    let varianceTotal = 0;
    let exceptionsCount = 0;
    for (const r of filteredReconcil) {
      varianceTotal += parseFloat(r.variance || '0');
      if (r.status !== 'MATCHED') exceptionsCount++;
    }

    grossBilling = Math.round(grossBilling * 100) / 100;
    discountTotal = Math.round(discountTotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    netBilling = Math.round(netBilling * 100) / 100;
    totalCollected = Math.round(totalCollected * 100) / 100;
    cashCollected = Math.round(cashCollected * 100) / 100;
    digitalCollected = Math.round(digitalCollected * 100) / 100;
    totalRefunded = Math.round(totalRefunded * 100) / 100;
    creditIssued = Math.round(creditIssued * 100) / 100;
    apPaid = Math.round(apPaid * 100) / 100;
    varianceTotal = Math.round(varianceTotal * 100) / 100;

    let closingRecord;
    if (existing) {
      const [updated] = await tx
        .update(billingEodClosings)
        .set({
          grossBilling: String(grossBilling),
          discountTotal: String(discountTotal),
          taxTotal: String(taxTotal),
          netBilling: String(netBilling),
          totalCollected: String(totalCollected),
          cashCollected: String(cashCollected),
          digitalCollected: String(digitalCollected),
          totalRefunded: String(totalRefunded),
          creditIssued: String(creditIssued),
          apPaid: String(apPaid),
          departmentBreakdown,
          varianceTotal: String(varianceTotal),
          exceptionsCount,
          status: 'CLOSED',
          closedBy: session.userId || 'FINANCE_OFFICER',
          closedAt: new Date(),
          notes: input.notes
        })
        .where(eq(billingEodClosings.id, existing.id))
        .returning();
      closingRecord = updated;
    } else {
      const [created] = await tx
        .insert(billingEodClosings)
        .values({
          id: crypto.randomUUID(),
          tenantId: scope.tenantId,
          partnerId: scope.tenantId,
          organizationId: scope.tenantId,
          branchId,
          closingDate,
          grossBilling: String(grossBilling),
          discountTotal: String(discountTotal),
          taxTotal: String(taxTotal),
          netBilling: String(netBilling),
          totalCollected: String(totalCollected),
          cashCollected: String(cashCollected),
          digitalCollected: String(digitalCollected),
          totalRefunded: String(totalRefunded),
          creditIssued: String(creditIssued),
          apPaid: String(apPaid),
          departmentBreakdown,
          varianceTotal: String(varianceTotal),
          exceptionsCount,
          status: 'CLOSED',
          closedBy: session.userId || 'FINANCE_OFFICER',
          closedAt: new Date(),
          notes: input.notes
        })
        .returning();
      closingRecord = created;
    }

    await auditRepository.recordEvent({
      eventType: 'EOD_DAY_CLOSED',
      resourceType: 'billing_eod_closing',
      resourceId: closingRecord.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        closingDate,
        grossBilling,
        netBilling,
        totalCollected,
        totalRefunded,
        varianceTotal,
        exceptionsCount
      }
    }, session, tx);

    return closingRecord;
  }

  async reopenDay(id: string, input: ReopenDayInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const reason = (input.reason || (input as any).reopenReason || '').trim();
    if (!reason) {
      throw AppError.badRequest('Reopen justification reason is strictly mandatory');
    }

    const [closing] = await tx
      .select()
      .from(billingEodClosings)
      .where(and(eq(billingEodClosings.id, id), eq(billingEodClosings.tenantId, scope.tenantId)))
      .limit(1);

    if (!closing) {
      throw AppError.notFound('EOD closing record not found or does not belong to this tenant');
    }

    if (closing.status === 'REOPENED') {
      throw AppError.badRequest('Financial day is already in REOPENED status');
    }

    const [updated] = await tx
      .update(billingEodClosings)
      .set({
        status: 'REOPENED',
        reopenedBy: session.userId || 'SUPERVISOR',
        reopenedAt: new Date(),
        reopenReason: reason
      })
      .where(eq(billingEodClosings.id, closing.id))
      .returning();

    await auditRepository.recordEvent({
      eventType: 'EOD_DAY_REOPENED',
      resourceType: 'billing_eod_closing',
      resourceId: updated.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        closingDate: updated.closingDate,
        reopenedBy: updated.reopenedBy,
        reason
      }
    }, session, tx);

    return updated;
  }

  async getEodClosings(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return tx
      .select()
      .from(billingEodClosings)
      .where(eq(billingEodClosings.tenantId, scope.tenantId))
      .orderBy(desc(billingEodClosings.closingDate));
  }

  async getEodClosingByDate(closingDate: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [closing] = await tx
      .select()
      .from(billingEodClosings)
      .where(and(eq(billingEodClosings.tenantId, scope.tenantId), eq(billingEodClosings.closingDate, closingDate)))
      .limit(1);
    return closing || null;
  }

  async getEodClosingById(id: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [closing] = await tx
      .select()
      .from(billingEodClosings)
      .where(and(eq(billingEodClosings.tenantId, scope.tenantId), eq(billingEodClosings.id, id)))
      .limit(1);
    if (!closing) {
      throw AppError.notFound(`EOD closing session ${id} not found`);
    }
    return closing;
  }
}

export const eodClosingService = new EodClosingService();
