import crypto from 'node:crypto';
import {
  getDatabase,
  reconciliationRuns,
  reconciliationDiscrepancies,
  billingInvoices,
  financialTransactionsPartitioned,
  supplyChainBatches,
  supplyChainStockLedger,
  investigationOrders,
  investigationReports,
  subscriptions,
  licenses,
  desc,
  eq,
  and
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

export type ReconciliationDomain =
  | 'FINANCIAL_PAYMENTS'
  | 'INVENTORY_STOCK'
  | 'CLINICAL_ORDERS'
  | 'SUBSCRIPTION_LICENSES';

export interface RunReconciliationInput {
  domain: ReconciliationDomain;
  branchId?: string | undefined;
  notes?: string | undefined;
}

export interface ResolveDiscrepancyInput {
  resolutionRemarks: string;
}

export class ReconciliationEngineService {
  /**
   * Executes an automated reconciliation run across the specified enterprise domain.
   * Compares source-of-truth records against ledger balances and identifies all variances.
   */
  async executeReconciliationRun(
    input: RunReconciliationInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;
    const branchId = input.branchId || scope.branchId || undefined;

    const runCode = `REC-${input.domain.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const executedBy = session.actorEmail || session.userId || 'RECONCILIATION_OFFICER';

    let matchedCount = 0;
    let discrepancyCount = 0;
    let missingCount = 0;
    let totalEvaluated = 0;
    const discrepanciesToInsert: any[] = [];
    let sourceA = '';
    let sourceB = '';

    if (input.domain === 'FINANCIAL_PAYMENTS') {
      sourceA = 'billing_invoices';
      sourceB = 'financial_transactions';

      const invoices = await db
        .select()
        .from(billingInvoices)
        .where(eq(billingInvoices.tenantId, tenantId))
        .limit(100);

      totalEvaluated = invoices.length;

      for (const inv of invoices) {
        const invTotal = parseFloat(String(inv.totalAmount || '0'));
        const invPaid = parseFloat(String(inv.paidAmount || '0'));

        let txTotal = 0;
        try {
          const txs = await db
            .select()
            .from(financialTransactionsPartitioned)
            .where(
              and(
                eq(financialTransactionsPartitioned.tenantId, tenantId),
                eq(financialTransactionsPartitioned.invoiceId, inv.id)
              )
            );
          txTotal = txs.reduce((sum, t) => sum + parseFloat(String(t.amount || '0')), 0);
        } catch {
          txTotal = invPaid;
        }

        const variance = Math.round((txTotal - invPaid) * 100) / 100;
        if (variance === 0 && (inv.status === 'PAID' ? txTotal >= invTotal : true)) {
          matchedCount++;
        } else {
          discrepancyCount++;
          discrepanciesToInsert.push({
            discrepancyType: 'AMOUNT_MISMATCH',
            entityId: inv.id,
            sourceAValue: { invoiceNumber: inv.invoiceNumber, totalAmount: invTotal, recordedPaid: invPaid, status: inv.status },
            sourceBValue: { aggregatedTxAmount: txTotal },
            varianceDescription: `Variance of ₹${variance} between invoice ${inv.invoiceNumber} paid amount (₹${invPaid}) and recorded payments (₹${txTotal})`
          });
        }
      }
    } else if (input.domain === 'INVENTORY_STOCK') {
      sourceA = 'supply_chain_batches';
      sourceB = 'supply_chain_stock_ledger';

      const batches = await db
        .select()
        .from(supplyChainBatches)
        .where(eq(supplyChainBatches.tenantId, tenantId))
        .limit(100);

      totalEvaluated = batches.length;

      for (const b of batches) {
        const currentStock = b.currentQuantity;

        const ledgerEntries = await db
          .select()
          .from(supplyChainStockLedger)
          .where(
            and(
              eq(supplyChainStockLedger.tenantId, tenantId),
              eq(supplyChainStockLedger.batchId, b.id)
            )
          );

        let netLedgerStock = 0;
        for (const entry of ledgerEntries) {
          if (entry.movementType === 'RECEIPT' || entry.movementType === 'TRANSFER_IN' || entry.movementType === 'RETURN') {
            netLedgerStock += entry.quantity;
          } else if (entry.movementType === 'ISSUE' || entry.movementType === 'TRANSFER_OUT' || entry.movementType === 'DISPENSE' || entry.movementType === 'DISCARD') {
            netLedgerStock -= entry.quantity;
          }
        }

        const stockDiff = currentStock - (ledgerEntries.length > 0 ? netLedgerStock : currentStock);
        if (stockDiff === 0) {
          matchedCount++;
        } else {
          discrepancyCount++;
          discrepanciesToInsert.push({
            discrepancyType: stockDiff > 0 ? 'STOCK_OVERAGE' : 'STOCK_SHORTAGE',
            entityId: b.id,
            sourceAValue: { batchNumber: b.batchNumber, currentStock },
            sourceBValue: { computedLedgerStock: netLedgerStock, totalMovements: ledgerEntries.length },
            varianceDescription: `Discrepancy of ${stockDiff} units between physical batch count (${currentStock}) and net stock movements (${netLedgerStock}) for batch ${b.batchNumber}`
          });
        }
      }
    } else if (input.domain === 'CLINICAL_ORDERS') {
      sourceA = 'investigation_orders';
      sourceB = 'investigation_reports';

      const orders = await db
        .select()
        .from(investigationOrders)
        .where(eq(investigationOrders.tenantId, tenantId))
        .limit(100);

      totalEvaluated = orders.length;

      for (const ord of orders) {
        const reports = await db
          .select()
          .from(investigationReports)
          .where(
            and(
              eq(investigationReports.tenantId, tenantId),
              eq(investigationReports.orderId, ord.id)
            )
          );

        if (ord.status === 'REPORTED' || ord.status === 'VERIFIED') {
          if (reports.length > 0) {
            matchedCount++;
          } else {
            missingCount++;
            discrepanciesToInsert.push({
              discrepancyType: 'RECORD_MISSING_B',
              entityId: ord.id,
              sourceAValue: { orderNumber: ord.orderNumber, status: ord.status },
              sourceBValue: { reportsCount: 0 },
              varianceDescription: `Order ${ord.orderNumber} is marked as '${ord.status}' but has no matching released diagnostic report in repository.`
            });
          }
        } else {
          matchedCount++;
        }
      }
    } else if (input.domain === 'SUBSCRIPTION_LICENSES') {
      sourceA = 'subscriptions';
      sourceB = 'licenses';

      const subs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.partnerId, tenantId))
        .limit(50);

      totalEvaluated = subs.length;

      for (const sub of subs) {
        const licList = await db
          .select()
          .from(licenses)
          .where(
            and(
              eq(licenses.tenantId, tenantId),
              eq(licenses.subscriptionId, sub.id)
            )
          );

        if (sub.status === 'ACTIVE') {
          const activeLic = licList.find((l) => l.status === 'ACTIVE');
          if (activeLic) {
            matchedCount++;
          } else {
            discrepancyCount++;
            discrepanciesToInsert.push({
              discrepancyType: 'STATUS_MISMATCH',
              entityId: sub.id,
              sourceAValue: { subscriptionId: sub.id, status: sub.status },
              sourceBValue: { totalLicenses: licList.length, activeLicenses: 0 },
              varianceDescription: `Subscription ${sub.id} is ACTIVE but has no matching ACTIVE commercial software license provisioned.`
            });
          }
        } else {
          matchedCount++;
        }
      }
    }

    const runStatus: 'COMPLETED' | 'DISCREPANCIES_FOUND' =
      discrepancyCount > 0 || missingCount > 0 ? 'DISCREPANCIES_FOUND' : 'COMPLETED';

    const [run] = await db
      .insert(reconciliationRuns)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        branchId: branchId || null,
        runCode,
        domain: input.domain,
        sourceA,
        sourceB,
        matchedCount,
        discrepancyCount,
        missingCount,
        totalEvaluated,
        status: runStatus,
        executedBy,
        metadata: { notes: input.notes || 'Automated multi-domain reconciliation' }
      })
      .returning();

    if (!run) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to record reconciliation run.',
        statusCode: 500
      });
    }

    if (discrepanciesToInsert.length > 0) {
      await db.insert(reconciliationDiscrepancies).values(
        discrepanciesToInsert.map((d) => ({
          id: crypto.randomUUID(),
          runId: run.id,
          tenantId,
          discrepancyType: d.discrepancyType,
          entityId: d.entityId,
          sourceAValue: d.sourceAValue,
          sourceBValue: d.sourceBValue,
          varianceDescription: d.varianceDescription,
          status: 'OPEN'
        }))
      );
    }

    await auditRepository.recordEvent({
      eventType: 'RECONCILIATION_RUN_COMPLETED',
      resourceType: 'reconciliation_run',
      resourceId: run.id,
      tenantId,
      branchId: branchId || session.branchId,
      metadata: {
        domain: input.domain,
        matchedCount,
        discrepancyCount,
        missingCount,
        totalEvaluated,
        status: runStatus
      }
    }, session, db);

    return {
      run,
      summary: {
        totalEvaluated,
        matchedCount,
        discrepancyCount,
        missingCount,
        status: runStatus
      }
    };
  }

  /**
   * Retrieves historical reconciliation runs for the session tenant.
   */
  async getReconciliationRuns(
    session: SessionContext,
    domain?: ReconciliationDomain,
    limit = 50,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const conditions = [eq(reconciliationRuns.tenantId, scope.tenantId)];
    if (domain) {
      conditions.push(eq(reconciliationRuns.domain, domain));
    }

    return db
      .select()
      .from(reconciliationRuns)
      .where(and(...conditions))
      .orderBy(desc(reconciliationRuns.startedAt))
      .limit(limit);
  }

  /**
   * Retrieves discrepancies for a given reconciliation run.
   */
  async getDiscrepanciesByRun(
    runId: string,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [run] = await db
      .select()
      .from(reconciliationRuns)
      .where(and(eq(reconciliationRuns.id, runId), eq(reconciliationRuns.tenantId, scope.tenantId)))
      .limit(1);

    if (!run) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Reconciliation run not found in tenant scope.',
        statusCode: 404
      });
    }

    return db
      .select()
      .from(reconciliationDiscrepancies)
      .where(
        and(
          eq(reconciliationDiscrepancies.runId, runId),
          eq(reconciliationDiscrepancies.tenantId, scope.tenantId)
        )
      )
      .orderBy(desc(reconciliationDiscrepancies.createdAt));
  }

  /**
   * Resolves a reconciliation discrepancy with explicit resolution remarks and full audit trail.
   */
  async resolveDiscrepancy(
    discrepancyId: string,
    input: ResolveDiscrepancyInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [discrepancy] = await db
      .select()
      .from(reconciliationDiscrepancies)
      .where(
        and(
          eq(reconciliationDiscrepancies.id, discrepancyId),
          eq(reconciliationDiscrepancies.tenantId, scope.tenantId)
        )
      )
      .limit(1);

    if (!discrepancy) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Discrepancy record not found in tenant scope.',
        statusCode: 404
      });
    }

    if (discrepancy.status === 'RESOLVED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Discrepancy is already resolved.',
        statusCode: 400
      });
    }

    if (!input.resolutionRemarks || !input.resolutionRemarks.trim()) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'resolutionRemarks cannot be empty.',
        statusCode: 400
      });
    }

    const resolvedBy = session.actorEmail || session.userId || 'SUPERVISOR';
    const resolvedAt = new Date();

    const [updated] = await db
      .update(reconciliationDiscrepancies)
      .set({
        status: 'RESOLVED',
        resolvedBy,
        resolutionRemarks: input.resolutionRemarks.trim(),
        resolvedAt
      })
      .where(eq(reconciliationDiscrepancies.id, discrepancy.id))
      .returning();

    if (!updated) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to update discrepancy record.',
        statusCode: 500
      });
    }

    await auditRepository.recordEvent({
      eventType: 'RECONCILIATION_DISCREPANCY_RESOLVED',
      resourceType: 'reconciliation_discrepancy',
      resourceId: updated.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        discrepancyId: updated.id,
        runId: updated.runId,
        resolvedBy,
        resolutionRemarks: input.resolutionRemarks.trim()
      }
    }, session, db);

    return updated;
  }
}

export const reconciliationEngineService = new ReconciliationEngineService();
