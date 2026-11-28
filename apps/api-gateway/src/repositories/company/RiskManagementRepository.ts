import crypto from 'node:crypto';
import {
  getDatabase,
  withSecurityContext,
  eq,
  desc,
  and,
  users,
  partnerProfiles,
  subscriptions,
  plans,
  licenses,
  billingAccounts,
  invoices,
  payments,
  companyAuditTraces,
  aiUsageRecords,
  billingInvoices,
  billingDiscounts,
  billingRefunds,
  billingPayments,
  encounters,
  pharmacyBatches,
  partnerGovernanceOverrides,
  companyCostLedger,
  riskLeakageAlerts,
  riskPreventionPolicies,
  type CompanyCostLedgerEntry,
  type NewCompanyCostLedgerEntry,
  type RiskLeakageAlert,
  type RiskPreventionPolicy
} from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { isValidUuid } from '../../utils/uuid-guard.js';

export interface RiskSnapshotRawData {
  partners: Array<typeof partnerProfiles.$inferSelect>;
  subscriptions: Array<typeof subscriptions.$inferSelect>;
  plans: Array<typeof plans.$inferSelect>;
  licenses: Array<typeof licenses.$inferSelect>;
  billingAccounts: Array<typeof billingAccounts.$inferSelect>;
  companyInvoices: Array<typeof invoices.$inferSelect>;
  companyPayments: Array<typeof payments.$inferSelect>;
  governanceOverrides: Array<typeof partnerGovernanceOverrides.$inferSelect>;
  aiUsage: Array<typeof aiUsageRecords.$inferSelect>;
  costLedger: CompanyCostLedgerEntry[];
  alerts: RiskLeakageAlert[];
  policy: RiskPreventionPolicy;
  clinicalInvoices: Array<typeof billingInvoices.$inferSelect>;
  clinicalDiscounts: Array<typeof billingDiscounts.$inferSelect>;
  clinicalRefunds: Array<typeof billingRefunds.$inferSelect>;
  clinicalPayments: Array<typeof billingPayments.$inferSelect>;
  completedEncounters: Array<typeof encounters.$inferSelect>;
  pharmacyBatches: Array<typeof pharmacyBatches.$inferSelect>;
}

const DEFAULT_POLICY_FALLBACK: RiskPreventionPolicy = {
  id: '78000000-0000-4000-8000-000000000001',
  policyCode: 'DEFAULT_GLOBAL_GUARDRAIL',
  policyName: 'Baseline Platform Margin & Leakage Prevention Guardrails',
  minGrossMarginPercent: '25.00',
  maxDiscountPercentWithoutCfo: '20.00',
  maxGraceDaysBeforeThrottle: 7,
  freeTierMonthlyCogsCapInr: '2500.00',
  partnerRefundSpikeThresholdPercent: '15.00',
  autoThrottleUnpaidOverdue: true,
  autoBlockBelowMarginFloor: true,
  isActive: true,
  updatedBy: 'SYSTEM_RISK_BASELINE',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

function buildHqSecurityContext(session?: SessionContext): SessionContext {
  return {
    userId: session?.userId || '00000000-0000-4000-8000-000000000001',
    tenantId:
      session?.tenantId && isValidUuid(session.tenantId)
        ? session.tenantId
        : '00000000-0000-4000-8000-000000000001',
    branchId: session?.branchId,
    roles: session?.roles || ['SUPER_ADMIN'],
    permissions: session?.permissions || ['*'],
    dataScope: 'global',
    sessionId: session?.sessionId || 'risk-hq-engine',
    actorEmail: session?.actorEmail || 'risk-engine@docsearch.health',
    isSuperAdmin: true
  };
}

export class RiskManagementRepository {
  private requireDb() {
    const db = getDatabase();
    if (!db) {
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'PostgreSQL database is unavailable for Risk Management operations.',
        statusCode: 503
      });
    }
    return db;
  }

  async ensureActivePolicy(session?: SessionContext): Promise<RiskPreventionPolicy> {
    const db = getDatabase();
    if (!db) {
      return DEFAULT_POLICY_FALLBACK;
    }

    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const existing = await tx
        .select()
        .from(riskPreventionPolicies)
        .where(eq(riskPreventionPolicies.policyCode, 'DEFAULT_GLOBAL_GUARDRAIL'))
        .limit(1);

      if (existing[0]) {
        return existing[0];
      }

      const [inserted] = await tx
        .insert(riskPreventionPolicies)
        .values({
          id: '78000000-0000-4000-8000-000000000001',
          policyCode: 'DEFAULT_GLOBAL_GUARDRAIL',
          policyName: 'Baseline Platform Margin & Leakage Prevention Guardrails',
          minGrossMarginPercent: '25.00',
          maxDiscountPercentWithoutCfo: '20.00',
          maxGraceDaysBeforeThrottle: 7,
          freeTierMonthlyCogsCapInr: '2500.00',
          partnerRefundSpikeThresholdPercent: '15.00',
          autoThrottleUnpaidOverdue: true,
          autoBlockBelowMarginFloor: true,
          isActive: true,
          updatedBy: session?.actorEmail || 'SYSTEM_RISK_BASELINE'
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) return inserted;

      const retry = await tx
        .select()
        .from(riskPreventionPolicies)
        .where(eq(riskPreventionPolicies.policyCode, 'DEFAULT_GLOBAL_GUARDRAIL'))
        .limit(1);

      return retry[0] || DEFAULT_POLICY_FALLBACK;
    });
  }

  async updatePolicy(
    updates: {
      policyName?: string | undefined;
      minGrossMarginPercent?: number | undefined;
      maxDiscountPercentWithoutCfo?: number | undefined;
      maxGraceDaysBeforeThrottle?: number | undefined;
      freeTierMonthlyCogsCapInr?: number | undefined;
      partnerRefundSpikeThresholdPercent?: number | undefined;
      autoThrottleUnpaidOverdue?: boolean | undefined;
      autoBlockBelowMarginFloor?: boolean | undefined;
      isActive?: boolean | undefined;
    },
    session: SessionContext
  ): Promise<RiskPreventionPolicy> {
    const db = this.requireDb();
    await this.ensureActivePolicy(session);

    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const setPayload: Record<string, any> = {
        updatedBy: session.actorEmail || session.userId || 'COMPANY_FINANCE_ADMIN',
        updatedAt: new Date()
      };
      if (updates.policyName !== undefined) setPayload['policyName'] = updates.policyName;
      if (updates.minGrossMarginPercent !== undefined) {
        setPayload['minGrossMarginPercent'] = updates.minGrossMarginPercent.toFixed(2);
      }
      if (updates.maxDiscountPercentWithoutCfo !== undefined) {
        setPayload['maxDiscountPercentWithoutCfo'] = updates.maxDiscountPercentWithoutCfo.toFixed(2);
      }
      if (updates.maxGraceDaysBeforeThrottle !== undefined) {
        setPayload['maxGraceDaysBeforeThrottle'] = Math.trunc(updates.maxGraceDaysBeforeThrottle);
      }
      if (updates.freeTierMonthlyCogsCapInr !== undefined) {
        setPayload['freeTierMonthlyCogsCapInr'] = updates.freeTierMonthlyCogsCapInr.toFixed(2);
      }
      if (updates.partnerRefundSpikeThresholdPercent !== undefined) {
        setPayload['partnerRefundSpikeThresholdPercent'] = updates.partnerRefundSpikeThresholdPercent.toFixed(2);
      }
      if (updates.autoThrottleUnpaidOverdue !== undefined) {
        setPayload['autoThrottleUnpaidOverdue'] = updates.autoThrottleUnpaidOverdue;
      }
      if (updates.autoBlockBelowMarginFloor !== undefined) {
        setPayload['autoBlockBelowMarginFloor'] = updates.autoBlockBelowMarginFloor;
      }
      if (updates.isActive !== undefined) {
        setPayload['isActive'] = updates.isActive;
      }

      const [updated] = await tx
        .update(riskPreventionPolicies)
        .set(setPayload)
        .where(eq(riskPreventionPolicies.policyCode, 'DEFAULT_GLOBAL_GUARDRAIL'))
        .returning();

      if (!updated) {
        throw AppError.notFound('Risk prevention guardrail policy not found');
      }
      return updated;
    });
  }

  async loadFullRiskSnapshot(session: SessionContext): Promise<RiskSnapshotRawData> {
    const db = this.requireDb();
    const policy = await this.ensureActivePolicy(session);

    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const [
        partnerRows,
        subRows,
        planRows,
        licenseRows,
        billingAccountRows,
        companyInvoiceRows,
        companyPaymentRows,
        govRows,
        aiUsageRows,
        costRows,
        alertRows,
        clinicalInvoiceRows,
        clinicalDiscountRows,
        clinicalRefundRows,
        clinicalPaymentRows,
        completedEncounterRows,
        batchRows
      ] = await Promise.all([
        tx.select().from(partnerProfiles),
        tx.select().from(subscriptions),
        tx.select().from(plans),
        tx.select().from(licenses),
        tx.select().from(billingAccounts),
        tx.select().from(invoices),
        tx.select().from(payments),
        tx.select().from(partnerGovernanceOverrides),
        tx.select().from(aiUsageRecords),
        tx.select().from(companyCostLedger).orderBy(desc(companyCostLedger.incurredAt)),
        tx.select().from(riskLeakageAlerts).orderBy(desc(riskLeakageAlerts.detectedAt)),
        tx.select().from(billingInvoices),
        tx.select().from(billingDiscounts),
        tx.select().from(billingRefunds),
        tx.select().from(billingPayments),
        tx.select().from(encounters).where(eq(encounters.status, 'COMPLETED')),
        tx.select().from(pharmacyBatches)
      ]);

      return {
        partners: partnerRows,
        subscriptions: subRows,
        plans: planRows,
        licenses: licenseRows,
        billingAccounts: billingAccountRows,
        companyInvoices: companyInvoiceRows,
        companyPayments: companyPaymentRows,
        governanceOverrides: govRows,
        aiUsage: aiUsageRows,
        costLedger: costRows,
        alerts: alertRows,
        policy,
        clinicalInvoices: clinicalInvoiceRows,
        clinicalDiscounts: clinicalDiscountRows,
        clinicalRefunds: clinicalRefundRows,
        clinicalPayments: clinicalPaymentRows,
        completedEncounters: completedEncounterRows,
        pharmacyBatches: batchRows
      };
    });
  }

  async insertCostEntry(
    entry: {
      category: string;
      partnerId?: string | null | undefined;
      tenantId?: string | null | undefined;
      amountInr: number;
      billingPeriod: string;
      source?: string | undefined;
      description?: string | undefined;
      incurredAt?: Date | undefined;
      metadata?: Record<string, any> | undefined;
    },
    session: SessionContext
  ): Promise<CompanyCostLedgerEntry> {
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const insertRow: NewCompanyCostLedgerEntry = {
        id: crypto.randomUUID(),
        category: entry.category,
        partnerId: entry.partnerId && isValidUuid(entry.partnerId) ? entry.partnerId : null,
        tenantId: entry.tenantId && isValidUuid(entry.tenantId) ? entry.tenantId : null,
        amountInr: entry.amountInr.toFixed(2),
        billingPeriod: entry.billingPeriod,
        source: entry.source || 'MANUAL_FINANCE_ENTRY',
        description: entry.description || null,
        createdBy: session.actorEmail || session.userId || 'COMPANY_FINANCE',
        incurredAt: entry.incurredAt || new Date(),
        metadata: entry.metadata || {}
      };

      const [created] = await tx.insert(companyCostLedger).values(insertRow).returning();
      if (!created) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to persist cost ledger entry.',
          statusCode: 500
        });
      }
      return created;
    });
  }

  async listCostEntries(
    filters: { category?: string | undefined; billingPeriod?: string | undefined; partnerId?: string | undefined },
    session: SessionContext
  ): Promise<CompanyCostLedgerEntry[]> {
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const conditions = [];
      if (filters.category) conditions.push(eq(companyCostLedger.category, filters.category));
      if (filters.billingPeriod) conditions.push(eq(companyCostLedger.billingPeriod, filters.billingPeriod));
      if (filters.partnerId && isValidUuid(filters.partnerId)) {
        conditions.push(eq(companyCostLedger.partnerId, filters.partnerId));
      }

      if (conditions.length > 0) {
        return tx
          .select()
          .from(companyCostLedger)
          .where(and(...conditions))
          .orderBy(desc(companyCostLedger.incurredAt))
          .limit(200);
      }

      return tx
        .select()
        .from(companyCostLedger)
        .orderBy(desc(companyCostLedger.incurredAt))
        .limit(200);
    });
  }

  async upsertAlerts(
    candidates: Array<{
      riskType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      partnerId?: string | null | undefined;
      tenantId?: string | null | undefined;
      title: string;
      summary: string;
      estimatedLossInr: number;
      monthlyBurnInr: number;
      evidenceJson: Record<string, any>;
      preventionRuleCode?: string | undefined;
      fingerprint: string;
    }>,
    session: SessionContext
  ): Promise<{ insertedCount: number; updatedCount: number; alerts: RiskLeakageAlert[] }> {
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const [existingRows, knownPartners] = await Promise.all([
        tx.select().from(riskLeakageAlerts),
        tx.select({ id: partnerProfiles.id, tenantId: partnerProfiles.tenantId }).from(partnerProfiles)
      ]);
      const validPartnerIds = new Set(knownPartners.map((p) => p.id));
      const partnerIdByTenant = new Map(knownPartners.map((p) => [p.tenantId, p.id]));
      const byFingerprint = new Map(existingRows.map((r) => [r.fingerprint, r]));

      let insertedCount = 0;
      let updatedCount = 0;

      for (const candidate of candidates) {
        const safePartnerId =
          candidate.partnerId && validPartnerIds.has(candidate.partnerId)
            ? candidate.partnerId
            : candidate.tenantId
              ? partnerIdByTenant.get(candidate.tenantId) || null
              : null;
        const existing = byFingerprint.get(candidate.fingerprint);
        if (!existing) {
          await tx.insert(riskLeakageAlerts).values({
            id: crypto.randomUUID(),
            riskType: candidate.riskType,
            severity: candidate.severity,
            partnerId: safePartnerId,
            tenantId: candidate.tenantId && isValidUuid(candidate.tenantId) ? candidate.tenantId : null,
            title: candidate.title,
            summary: candidate.summary,
            estimatedLossInr: candidate.estimatedLossInr.toFixed(2),
            monthlyBurnInr: candidate.monthlyBurnInr.toFixed(2),
            evidenceJson: candidate.evidenceJson,
            preventionRuleCode: candidate.preventionRuleCode || null,
            fingerprint: candidate.fingerprint,
            status: 'OPEN',
            detectedAt: new Date()
          });
          insertedCount++;
        } else if (existing.status === 'OPEN') {
          await tx
            .update(riskLeakageAlerts)
            .set({
              severity: candidate.severity,
              title: candidate.title,
              summary: candidate.summary,
              estimatedLossInr: candidate.estimatedLossInr.toFixed(2),
              monthlyBurnInr: candidate.monthlyBurnInr.toFixed(2),
              evidenceJson: candidate.evidenceJson,
              preventionRuleCode: candidate.preventionRuleCode || existing.preventionRuleCode,
              updatedAt: new Date()
            })
            .where(eq(riskLeakageAlerts.id, existing.id));
          updatedCount++;
        }
      }

      const alerts = await tx
        .select()
        .from(riskLeakageAlerts)
        .orderBy(desc(riskLeakageAlerts.detectedAt));

      return { insertedCount, updatedCount, alerts };
    });
  }

  async listAlerts(
    filters: { status?: string | undefined; severity?: string | undefined; riskType?: string | undefined; partnerId?: string | undefined },
    session: SessionContext
  ): Promise<RiskLeakageAlert[]> {
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const conditions = [];
      if (filters.status) conditions.push(eq(riskLeakageAlerts.status, filters.status));
      if (filters.severity) conditions.push(eq(riskLeakageAlerts.severity, filters.severity));
      if (filters.riskType) conditions.push(eq(riskLeakageAlerts.riskType, filters.riskType));
      if (filters.partnerId && isValidUuid(filters.partnerId)) {
        conditions.push(eq(riskLeakageAlerts.partnerId, filters.partnerId));
      }

      if (conditions.length > 0) {
        return tx
          .select()
          .from(riskLeakageAlerts)
          .where(and(...conditions))
          .orderBy(desc(riskLeakageAlerts.detectedAt))
          .limit(300);
      }

      return tx
        .select()
        .from(riskLeakageAlerts)
        .orderBy(desc(riskLeakageAlerts.detectedAt))
        .limit(300);
    });
  }

  async findAlertById(alertId: string, session: SessionContext): Promise<RiskLeakageAlert | null> {
    if (!isValidUuid(alertId)) return null;
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const [row] = await tx
        .select()
        .from(riskLeakageAlerts)
        .where(eq(riskLeakageAlerts.id, alertId))
        .limit(1);
      return row || null;
    });
  }

  async markAlertMitigated(
    alertId: string,
    payload: {
      status: 'CONTAINED' | 'RESOLVED' | 'DISMISSED';
      mitigationAction: string;
      mitigationNotes?: string | undefined;
    },
    session: SessionContext
  ): Promise<RiskLeakageAlert> {
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const [updated] = await tx
        .update(riskLeakageAlerts)
        .set({
          status: payload.status,
          mitigationAction: payload.mitigationAction,
          mitigatedBy: session.actorEmail || session.userId || 'COMPANY_RISK_ADMIN',
          mitigatedAt: new Date(),
          mitigationNotes: payload.mitigationNotes || null,
          updatedAt: new Date()
        })
        .where(eq(riskLeakageAlerts.id, alertId))
        .returning();

      if (!updated) {
        throw AppError.notFound(`Risk alert ${alertId} not found`);
      }
      return updated;
    });
  }

  async suspendOverdueLicensesForPartner(partnerId: string, reason: string, session: SessionContext): Promise<number> {
    if (!isValidUuid(partnerId)) return 0;
    const db = this.requireDb();
    return withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      const now = new Date();
      const updated = await tx
        .update(licenses)
        .set({
          status: 'SUSPENDED',
          gracePeriodEnd: now,
          updatedAt: now
        })
        .where(eq(licenses.partnerId, partnerId))
        .returning({ id: licenses.id });

      await tx
        .update(subscriptions)
        .set({
          status: 'SUSPENDED',
          cancellationReason: reason,
          updatedAt: now
        })
        .where(eq(subscriptions.partnerId, partnerId));

      return updated.length;
    });
  }

  async recordCompanyAuditTrace(
    payload: {
      action: string;
      entityReference: string;
      reason: string;
      metadata?: Record<string, any> | undefined;
    },
    session: SessionContext
  ): Promise<void> {
    const db = getDatabase();
    if (!db) return;

    await withSecurityContext(db, buildHqSecurityContext(session), async (tx) => {
      let resolvedActorId: string | null = null;
      if (isValidUuid(session.userId)) {
        const [u] = await tx.select({ id: users.id }).from(users).where(eq(users.id, session.userId)).limit(1);
        resolvedActorId = u?.id || null;
      }

      await tx.insert(companyAuditTraces).values({
        id: crypto.randomUUID(),
        traceId: `trace_risk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        actorId: resolvedActorId,
        actorEmail: session.actorEmail || 'risk-admin@docsearch.health',
        action: payload.action,
        entityReference: payload.entityReference,
        operationStatus: 'SUCCESS',
        occurredAt: new Date(),
        reason: payload.reason,
        metadata: {
          ...(payload.metadata || {}),
          sessionUserId: session.userId
        }
      });
    });
  }
}

export const riskManagementRepository = new RiskManagementRepository();
