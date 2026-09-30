import {
  getDatabase,
  patientCreditAccounts,
  billingInvoices,
  eq,
  and,
  desc,
  ne
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError } from '@docsearch/shared-core';

export interface UpsertCreditAccountInput {
  patientId: string;
  creditLimit: number;
  notes?: string | undefined;
}

export interface AgeingBucketTotals {
  current0To30Days: number;
  overdue31To60Days: number;
  overdue61To90Days: number;
  overdue90PlusDays: number;
  totalOutstanding: number;
  totalInvoicesCount: number;
}

export interface PatientAgeingSummary {
  patientId: string;
  patientName: string;
  patientMrn: string;
  current0To30Days: number;
  overdue31To60Days: number;
  overdue61To90Days: number;
  overdue90PlusDays: number;
  totalDue: number;
  invoicesCount: number;
}

export class CreditReceivablesService {
  async getCreditAccount(patientId: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [account] = await tx
      .select()
      .from(patientCreditAccounts)
      .where(and(eq(patientCreditAccounts.patientId, patientId), eq(patientCreditAccounts.tenantId, scope.tenantId)))
      .limit(1);

    if (!account) {
      return {
        patientId,
        creditLimit: 0,
        outstandingBalance: 0,
        availableCredit: 0,
        status: 'INACTIVE',
        isEligible: false
      };
    }

    const limit = parseFloat(account.creditLimit || '0');
    const balance = parseFloat(account.outstandingBalance || '0');
    const available = Math.max(0, Math.round((limit - balance) * 100) / 100);

    return {
      ...account,
      creditLimit: limit,
      outstandingBalance: balance,
      availableCredit: available,
      isEligible: account.status === 'ACTIVE' && available > 0
    };
  }

  async upsertCreditAccount(input: UpsertCreditAccountInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [existing] = await tx
      .select()
      .from(patientCreditAccounts)
      .where(and(eq(patientCreditAccounts.patientId, input.patientId), eq(patientCreditAccounts.tenantId, scope.tenantId)))
      .limit(1);

    let account;
    if (existing) {
      const [updated] = await tx
        .update(patientCreditAccounts)
        .set({
          creditLimit: String(input.creditLimit),
          authorizedBy: session.userId || 'SUPERVISOR',
          notes: input.notes || existing.notes,
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(patientCreditAccounts.id, existing.id))
        .returning();
      account = updated;
    } else {
      const [created] = await tx
        .insert(patientCreditAccounts)
        .values({
          id: crypto.randomUUID(),
          tenantId: scope.tenantId,
          partnerId: scope.tenantId,
          organizationId: scope.tenantId,
          branchId: scope.branchId,
          patientId: input.patientId,
          creditLimit: String(input.creditLimit),
          outstandingBalance: '0.00',
          status: 'ACTIVE',
          authorizedBy: session.userId || 'SUPERVISOR',
          notes: input.notes
        })
        .returning();
      account = created;
    }

    await auditRepository.recordEvent({
      eventType: 'CREDIT_LIMIT_UPDATED',
      resourceType: 'patient_credit_account',
      resourceId: account.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: { patientId: input.patientId, creditLimit: input.creditLimit, authorizedBy: account.authorizedBy }
    }, session, tx);

    return account;
  }

  async assertAndApplyCreditCharge(patientId: string, amount: number, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const account = await this.getCreditAccount(patientId, session, tx);

    if (!account.isEligible && account.creditLimit <= 0) {
      throw AppError.badRequest('Patient does not have an approved credit limit account');
    }

    if (account.status !== 'ACTIVE') {
      throw AppError.badRequest(`Patient credit account is ${account.status}. Credit billing denied.`);
    }

    if (account.availableCredit < amount) {
      throw AppError.badRequest(
        `Credit limit exceeded. Available credit: ₹${account.availableCredit}, Required: ₹${amount}`
      );
    }

    const newBalance = Math.round((account.outstandingBalance + amount) * 100) / 100;
    await tx
      .update(patientCreditAccounts)
      .set({
        outstandingBalance: String(newBalance),
        updatedAt: new Date()
      })
      .where(and(eq(patientCreditAccounts.patientId, patientId), eq(patientCreditAccounts.tenantId, scope.tenantId)));

    return {
      previousBalance: account.outstandingBalance,
      newBalance,
      chargedAmount: amount,
      remainingAvailableCredit: Math.round((account.creditLimit - newBalance) * 100) / 100
    };
  }

  async settleCreditPayment(patientId: string, paymentAmount: number, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const account = await this.getCreditAccount(patientId, session, tx);

    const newBalance = Math.max(0, Math.round((account.outstandingBalance - paymentAmount) * 100) / 100);
    await tx
      .update(patientCreditAccounts)
      .set({
        outstandingBalance: String(newBalance),
        updatedAt: new Date()
      })
      .where(and(eq(patientCreditAccounts.patientId, patientId), eq(patientCreditAccounts.tenantId, scope.tenantId)));

    return {
      previousBalance: account.outstandingBalance,
      newBalance,
      settledAmount: paymentAmount,
      availableCredit: Math.round((account.creditLimit - newBalance) * 100) / 100
    };
  }

  async getReceivablesAgeing(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    // Fetch all invoices that have dueAmount > 0 and are not CANCELLED or VOIDED
    const unpaidInvoices = await tx
      .select({
        id: billingInvoices.id,
        invoiceNumber: billingInvoices.invoiceNumber,
        patientId: billingInvoices.patientId,
        invoiceType: billingInvoices.invoiceType,
        status: billingInvoices.status,
        totalAmount: billingInvoices.totalAmount,
        paidAmount: billingInvoices.paidAmount,
        dueAmount: billingInvoices.dueAmount,
        issuedAt: billingInvoices.issuedAt,
        dueAt: billingInvoices.dueAt,
        createdAt: billingInvoices.createdAt
      })
      .from(billingInvoices)
      .where(and(
        eq(billingInvoices.tenantId, scope.tenantId),
        ne(billingInvoices.status, 'CANCELLED'),
        ne(billingInvoices.status, 'VOIDED'),
        ne(billingInvoices.status, 'PAID')
      ))
      .orderBy(desc(billingInvoices.createdAt));

    const now = new Date().getTime();
    let current0To30Days = 0;
    let overdue31To60Days = 0;
    let overdue61To90Days = 0;
    let overdue90PlusDays = 0;
    let totalOutstanding = 0;

    const patientMap = new Map<string, PatientAgeingSummary>();

    for (const inv of unpaidInvoices) {
      const due = parseFloat(inv.dueAmount || '0');
      if (due <= 0) continue;

      const createdDate = inv.issuedAt || inv.createdAt;
      const ageDays = Math.max(0, Math.floor((now - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24)));

      let bucket: '0_30' | '31_60' | '61_90' | '90_plus' = '0_30';
      if (ageDays <= 30) {
        current0To30Days += due;
        bucket = '0_30';
      } else if (ageDays <= 60) {
        overdue31To60Days += due;
        bucket = '31_60';
      } else if (ageDays <= 90) {
        overdue61To90Days += due;
        bucket = '61_90';
      } else {
        overdue90PlusDays += due;
        bucket = '90_plus';
      }

      totalOutstanding += due;

      const pSummary = patientMap.get(inv.patientId) || {
        patientId: inv.patientId,
        patientName: 'Patient',
        patientMrn: 'MRN',
        current0To30Days: 0,
        overdue31To60Days: 0,
        overdue61To90Days: 0,
        overdue90PlusDays: 0,
        totalDue: 0,
        invoicesCount: 0
      };

      pSummary.totalDue = Math.round((pSummary.totalDue + due) * 100) / 100;
      pSummary.invoicesCount += 1;
      if (bucket === '0_30') pSummary.current0To30Days = Math.round((pSummary.current0To30Days + due) * 100) / 100;
      else if (bucket === '31_60') pSummary.overdue31To60Days = Math.round((pSummary.overdue31To60Days + due) * 100) / 100;
      else if (bucket === '61_90') pSummary.overdue61To90Days = Math.round((pSummary.overdue61To90Days + due) * 100) / 100;
      else pSummary.overdue90PlusDays = Math.round((pSummary.overdue90PlusDays + due) * 100) / 100;

      patientMap.set(inv.patientId, pSummary);
    }

    return {
      totals: {
        current0To30Days: Math.round(current0To30Days * 100) / 100,
        overdue31To60Days: Math.round(overdue31To60Days * 100) / 100,
        overdue61To90Days: Math.round(overdue61To90Days * 100) / 100,
        overdue90PlusDays: Math.round(overdue90PlusDays * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalInvoicesCount: unpaidInvoices.length
      },
      patientBreakdown: Array.from(patientMap.values())
    };
  }
}

export const creditReceivablesService = new CreditReceivablesService();
