import {
  getDatabase,
  billingCashierSessions,
  billingReconciliations,
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

export interface OpenShiftInput {
  cashierName?: string | undefined;
  openingBalance?: number | undefined;
  notes?: string | undefined;
}

export interface CloseShiftInput {
  actualCash: number;
  notes?: string | undefined;
  supervisorUserId?: string | undefined;
}

export class CashierShiftService {
  async openShift(input: OpenShiftInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const cashierId = session.userId || 'CASHIER_01';

    // Verify cashier doesn't already have an open shift
    const [existingOpen] = await tx
      .select()
      .from(billingCashierSessions)
      .where(and(
        eq(billingCashierSessions.tenantId, scope.tenantId),
        eq(billingCashierSessions.cashierId, cashierId),
        eq(billingCashierSessions.status, 'OPEN')
      ))
      .limit(1);

    if (existingOpen) {
      throw AppError.badRequest(`Cashier already has an open shift session: ${existingOpen.sessionNumber}`);
    }

    const sessionNumber = `SFT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const openingBalance = Math.max(0, input.openingBalance || 0);

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

    const [created] = await tx
      .insert(billingCashierSessions)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId,
        organizationId: orgId,
        branchId,
        cashierId,
        cashierName: input.cashierName || session.userId || 'Cashier Staff',
        sessionNumber,
        openingBalance: String(openingBalance),
        cashReceived: '0.00',
        cashRefunded: '0.00',
        expectedClosingBalance: String(openingBalance),
        status: 'OPEN',
        notes: input.notes
      })
      .returning();

    await auditRepository.recordEvent({
      eventType: 'CASHIER_SHIFT_OPENED',
      resourceType: 'billing_cashier_session',
      resourceId: created.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: { sessionNumber, openingBalance, cashierId }
    }, session, tx);

    return created;
  }

  async getCurrentShift(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const cashierId = session.userId || 'CASHIER_01';

    let [openShift] = await tx
      .select()
      .from(billingCashierSessions)
      .where(and(
        eq(billingCashierSessions.tenantId, scope.tenantId),
        eq(billingCashierSessions.cashierId, cashierId),
        eq(billingCashierSessions.status, 'OPEN')
      ))
      .limit(1);

    if (!openShift) {
      [openShift] = await tx
        .select()
        .from(billingCashierSessions)
        .where(and(
          eq(billingCashierSessions.tenantId, scope.tenantId),
          eq(billingCashierSessions.status, 'OPEN')
        ))
        .limit(1);
    }

    return openShift || null;
  }

  async recordShiftMovement(
    data: { cashReceived?: number | undefined; cashRefunded?: number | undefined },
    session: SessionContext,
    tx: any = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const current = await this.getCurrentShift(session, tx);
    if (!current) return null; // No shift active

    const addReceived = Math.max(0, data.cashReceived || 0);
    const addRefunded = Math.max(0, data.cashRefunded || 0);

    const newReceived = Math.round((parseFloat(current.cashReceived || '0') + addReceived) * 100) / 100;
    const newRefunded = Math.round((parseFloat(current.cashRefunded || '0') + addRefunded) * 100) / 100;
    const opening = parseFloat(current.openingBalance || '0');
    const newExpected = Math.round((opening + newReceived - newRefunded) * 100) / 100;

    const [updated] = await tx
      .update(billingCashierSessions)
      .set({
        cashReceived: String(newReceived),
        cashRefunded: String(newRefunded),
        expectedClosingBalance: String(newExpected),
        updatedAt: new Date()
      })
      .where(and(eq(billingCashierSessions.id, current.id), eq(billingCashierSessions.tenantId, scope.tenantId)))
      .returning();

    return updated;
  }

  async closeShift(sessionId: string, input: CloseShiftInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [shift] = await tx
      .select()
      .from(billingCashierSessions)
      .where(and(eq(billingCashierSessions.id, sessionId), eq(billingCashierSessions.tenantId, scope.tenantId)))
      .limit(1);

    if (!shift) {
      throw AppError.notFound('Shift session not found or does not belong to this tenant');
    }

    if (shift.status !== 'OPEN') {
      throw AppError.badRequest(`Shift session is already ${shift.status}. Immutable historical sessions cannot be modified.`);
    }

    const opening = parseFloat(shift.openingBalance || '0');
    const received = parseFloat(shift.cashReceived || '0');
    const refunded = parseFloat(shift.cashRefunded || '0');
    const expectedClosing = Math.round((opening + received - refunded) * 100) / 100;
    const actualClosing = Math.round(input.actualCash * 100) / 100;
    const variance = Math.round((actualClosing - expectedClosing) * 100) / 100;
    const reconcilStatus = variance === 0 ? 'MATCHED' : 'DISCREPANCY';

    const [closedShift] = await tx
      .update(billingCashierSessions)
      .set({
        closingBalance: String(actualClosing),
        expectedClosingBalance: String(expectedClosing),
        status: reconcilStatus === 'MATCHED' ? 'RECONCILED' : 'RECONCILIATION_PENDING',
        closedAt: new Date(),
        notes: input.notes || shift.notes,
        updatedAt: new Date()
      })
      .where(eq(billingCashierSessions.id, shift.id))
      .returning();

    // Create entry in billing_reconciliations
    const [reconcilRecord] = await tx
      .insert(billingReconciliations)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: shift.partnerId,
        organizationId: shift.organizationId,
        branchId: shift.branchId,
        cashierSessionId: shift.id,
        expectedAmount: String(expectedClosing),
        actualAmount: String(actualClosing),
        variance: String(variance),
        status: reconcilStatus,
        reconciledBy: session.userId || 'SUPERVISOR',
        remarks: input.notes || `Shift closed with variance ₹${variance}`
      })
      .returning();

    await auditRepository.recordEvent({
      eventType: 'CASHIER_SHIFT_CLOSED',
      resourceType: 'billing_cashier_session',
      resourceId: closedShift.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        sessionNumber: shift.sessionNumber,
        expectedClosing,
        actualClosing,
        variance,
        reconcilStatus
      }
    }, session, tx);

    return {
      shift: closedShift,
      reconciliation: reconcilRecord,
      variance,
      isBalanced: variance === 0
    };
  }

  async getShifts(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return tx
      .select()
      .from(billingCashierSessions)
      .where(eq(billingCashierSessions.tenantId, scope.tenantId))
      .orderBy(desc(billingCashierSessions.openedAt));
  }
}

export const cashierShiftService = new CashierShiftService();
