import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { partnerProfiles } from './index.js';
import { tenants } from '../core/tenants.js';

const companySchema = pgSchema('company');

/**
 * Authoritative Company Operating Costs & COGS Ledger (Phase 2 Risk Management & Economics Engine)
 * Records both shared platform OPEX and tenant/partner-attributed COGS in INR.
 */
export const companyCostLedger = companySchema.table(
  'company_cost_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: varchar('category', { length: 50 }).notNull(), // CLOUD_INFRA | AI_INFERENCE | SMS_WHATSAPP | GATEWAY_MDR | PAYROLL_SUPPORT | MARKETING_CAC | REFUND_WRITEOFF
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    amountInr: numeric('amount_inr', { precision: 14, scale: 2 }).notNull(),
    billingPeriod: varchar('billing_period', { length: 32 }).notNull(), // YYYY-MM
    source: varchar('source', { length: 100 }).notNull().default('MANUAL_FINANCE_ENTRY'),
    description: text('description'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    incurredAt: timestamp('incurred_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_company_cost_ledger_category').on(table.category),
    index('idx_company_cost_ledger_partner_id').on(table.partnerId),
    index('idx_company_cost_ledger_tenant_id').on(table.tenantId),
    index('idx_company_cost_ledger_period').on(table.billingPeriod),
    index('idx_company_cost_ledger_incurred').on(table.incurredAt)
  ]
);

export type CompanyCostLedgerEntry = typeof companyCostLedger.$inferSelect;
export type NewCompanyCostLedgerEntry = typeof companyCostLedger.$inferInsert;

/**
 * Real-Time Risk & Revenue Leakage Alerts
 * Persisted by live SQL scanning across subscriptions, invoices, clinical encounters, discounts, refunds & pharmacy batches.
 */
export const riskLeakageAlerts = companySchema.table(
  'risk_leakage_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    riskType: varchar('risk_type', { length: 64 }).notNull(), // NEGATIVE_MARGIN_TENANT | FREE_TIER_COGS_BURN | OVERDUE_RECEIVABLE | EXCESSIVE_DISCOUNT | UNBILLED_CLINICAL_ENCOUNTER | HIGH_REFUND_VOID_SPIKE | QUOTA_OVERRUN | EXPIRY_WRITEOFF | CHURN_RISK
    severity: varchar('severity', { length: 24 }).notNull().default('MEDIUM'), // LOW | MEDIUM | HIGH | CRITICAL
    partnerId: uuid('partner_id').references(() => partnerProfiles.id, { onDelete: 'set null' }),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary').notNull(),
    estimatedLossInr: numeric('estimated_loss_inr', { precision: 14, scale: 2 }).notNull().default('0.00'),
    monthlyBurnInr: numeric('monthly_burn_inr', { precision: 14, scale: 2 }).notNull().default('0.00'),
    evidenceJson: jsonb('evidence_json').notNull().default({}),
    preventionRuleCode: varchar('prevention_rule_code', { length: 80 }),
    fingerprint: varchar('fingerprint', { length: 180 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('OPEN'), // OPEN | CONTAINED | RESOLVED | DISMISSED
    mitigationAction: varchar('mitigation_action', { length: 80 }),
    mitigatedBy: varchar('mitigated_by', { length: 255 }),
    mitigatedAt: timestamp('mitigated_at', { withTimezone: true }),
    mitigationNotes: text('mitigation_notes'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_risk_leakage_alerts_fingerprint').on(table.fingerprint),
    index('idx_risk_leakage_alerts_type').on(table.riskType),
    index('idx_risk_leakage_alerts_status').on(table.status),
    index('idx_risk_leakage_alerts_severity').on(table.severity),
    index('idx_risk_leakage_alerts_partner_id').on(table.partnerId),
    index('idx_risk_leakage_alerts_tenant_id').on(table.tenantId)
  ]
);

export type RiskLeakageAlert = typeof riskLeakageAlerts.$inferSelect;
export type NewRiskLeakageAlert = typeof riskLeakageAlerts.$inferInsert;

/**
 * Automated Revenue & Unit-Economics Prevention Guardrail Policies
 * Enforced in real time during deal negotiation, quota consumption, grace expiration & clinical billing.
 */
export const riskPreventionPolicies = companySchema.table(
  'risk_prevention_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyCode: varchar('policy_code', { length: 80 }).notNull(),
    policyName: varchar('policy_name', { length: 200 }).notNull(),
    minGrossMarginPercent: numeric('min_gross_margin_percent', { precision: 6, scale: 2 }).notNull().default('25.00'),
    maxDiscountPercentWithoutCfo: numeric('max_discount_percent_without_cfo', { precision: 6, scale: 2 })
      .notNull()
      .default('20.00'),
    maxGraceDaysBeforeThrottle: integer('max_grace_days_before_throttle').notNull().default(7),
    freeTierMonthlyCogsCapInr: numeric('free_tier_monthly_cogs_cap_inr', { precision: 12, scale: 2 })
      .notNull()
      .default('2500.00'),
    partnerRefundSpikeThresholdPercent: numeric('partner_refund_spike_threshold_percent', {
      precision: 6,
      scale: 2
    })
      .notNull()
      .default('15.00'),
    autoThrottleUnpaidOverdue: boolean('auto_throttle_unpaid_overdue').notNull().default(true),
    autoBlockBelowMarginFloor: boolean('auto_block_below_margin_floor').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    updatedBy: varchar('updated_by', { length: 255 }).notNull().default('SYSTEM_RISK_BASELINE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('uq_risk_prevention_policy_code').on(table.policyCode)]
);

export type RiskPreventionPolicy = typeof riskPreventionPolicies.$inferSelect;
export type NewRiskPreventionPolicy = typeof riskPreventionPolicies.$inferInsert;
