import {
  getDatabase,
  billingReconciliations,
  billingCashierSessions,
  eq,
  and,
  desc
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError } from '@docsearch/shared-core';

export interface CreateReconciliationInput {
  cashierSessionId?: string | undefined;
  expectedAmount: number;
  actualAmount: number;
  remarks?: string | undefined;
}

export interface ResolveDiscrepancyInput {
  resolutionRemarks: string;
}

export class ReconciliationService {
  async getReconciliations(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return tx
      .select()
      .from(billingReconciliations)
      .where(eq(billingReconciliations.tenantId, scope.tenantId))
      .orderBy(desc(billingReconciliations.createdAt));
  }

  async getReconciliationById(id: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [record] = await tx
      .select()
      .from(billingReconciliations)
      .where(and(eq(billingReconciliations.id, id), eq(billingReconciliations.tenantId, scope.tenantId)))
      .limit(1);

    if (!record) {
      throw AppError.notFound('Reconciliation record not found');
    }
    return record;
  }

  async createReconciliation(input: CreateReconciliationInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    let cashierSessionId = input.cashierSessionId;
    let branchId = scope.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    if (cashierSessionId) {
      const [sess] = await tx
        .select()
        .from(billingCashierSessions)
        .where(and(eq(billingCashierSessions.id, cashierSessionId), eq(billingCashierSessions.tenantId, scope.tenantId)))
        .limit(1);
      if (!sess) {
        throw AppError.notFound('Referenced cashier session not found in this tenant');
      }
      branchId = sess.branchId;
    } else {
      // Find or link to tenant's default session
      const [lastSess] = await tx
        .select()
        .from(billingCashierSessions)
        .where(eq(billingCashierSessions.tenantId, scope.tenantId))
        .orderBy(desc(billingCashierSessions.openedAt))
        .limit(1);
      cashierSessionId = lastSess ? lastSess.id : undefined;
    }

    if (!cashierSessionId) {
      // If no cashier session exists, create a system anchor session
      const [sysSess] = await tx
        .insert(billingCashierSessions)
        .values({
          tenantId: scope.tenantId,
          partnerId: scope.tenantId,
          organizationId: scope.tenantId,
          branchId,
          cashierId: session.userId || 'SYSTEM',
          cashierName: 'System Reconciliation Cashier',
          sessionNumber: `SFT-SYS-${Date.now().toString(36).toUpperCase()}`,
          openingBalance: '0.00',
          cashReceived: '0.00',
          cashRefunded: '0.00',
          expectedClosingBalance: '0.00',
          status: 'RECONCILED'
        })
        .returning();
      cashierSessionId = sysSess.id;
    }

    const expected = Math.round(input.expectedAmount * 100) / 100;
    const actual = Math.round(input.actualAmount * 100) / 100;
    const variance = Math.round((actual - expected) * 100) / 100;
    const status = variance === 0 ? 'MATCHED' : 'DISCREPANCY';

    const [created] = await tx
      .insert(billingReconciliations)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: scope.tenantId,
        organizationId: scope.tenantId,
        branchId,
        cashierSessionId,
        expectedAmount: String(expected),
        actualAmount: String(actual),
        variance: String(variance),
        status,
        reconciledBy: session.userId || 'RECONCILIATION_OFFICER',
        remarks: input.remarks || (variance === 0 ? 'Exact match' : `Discrepancy of ₹${variance}`)
      })
      .returning();

    await auditRepository.recordEvent({
      eventType: 'RECONCILIATION_RECORDED',
      resourceType: 'billing_reconciliation',
      resourceId: created.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: { expectedAmount: expected, actualAmount: actual, variance, status }
    }, session, tx);

    return created;
  }

  async resolveDiscrepancy(id: string, input: ResolveDiscrepancyInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const record = await this.getReconciliationById(id, session, tx);

    if (record.status === 'RESOLVED') {
      throw AppError.badRequest('Reconciliation record is already resolved');
    }

    if (!input.resolutionRemarks || !input.resolutionRemarks.trim()) {
      throw AppError.badRequest('resolutionRemarks cannot be empty');
    }

    const [updated] = await tx
      .update(billingReconciliations)
      .set({
        status: 'RESOLVED',
        remarks: `${record.remarks ? record.remarks + ' | ' : ''}Resolved by ${session.userId || 'SUPERVISOR'}: ${input.resolutionRemarks.trim()}`,
        updatedAt: new Date()
      })
      .where(eq(billingReconciliations.id, record.id))
      .returning();

    await auditRepository.recordEvent({
      eventType: 'RECONCILIATION_RESOLVED',
      resourceType: 'billing_reconciliation',
      resourceId: updated.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        reconciliationId: updated.id,
        resolvedBy: session.userId,
        resolutionRemarks: input.resolutionRemarks
      }
    }, session, tx);

    return updated;
  }
}

export const reconciliationService = new ReconciliationService();
