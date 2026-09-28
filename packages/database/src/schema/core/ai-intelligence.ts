import { uuid, varchar, integer, text, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';

/**
 * 1. AI Request Registry (Mandatory Gateway Request Audit & Telemetry)
 */
export const aiRequestRegistry = coreSchema.table(
  'ai_request_registry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    requestId: varchar('request_id', { length: 100 }).notNull(),
    traceId: varchar('trace_id', { length: 128 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    userRole: varchar('user_role', { length: 64 }).notNull(),
    module: varchar('module', { length: 64 }).notNull(),
    purpose: varchar('purpose', { length: 128 }).notNull(),
    inputClassification: varchar('input_classification', { length: 32 }).notNull(), // PUBLIC, INTERNAL, CONFIDENTIAL, PATIENT_DATA, FINANCIAL_DATA, SECURITY_DATA, REGULATORY_DATA
    outputClassification: varchar('output_classification', { length: 32 }).notNull(),
    approvalRequirement: varchar('approval_requirement', { length: 32 }).notNull(), // LEVEL_0_INFORMATION, LEVEL_1_RECOMMENDATION, LEVEL_2_DRAFT, LEVEL_3_APPROVAL_REQUIRED, LEVEL_4_PROHIBITED
    model: varchar('model', { length: 100 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 50 }).notNull().default('1.0.0'),
    permissions: jsonb('permissions').default([]),
    latencyMs: integer('latency_ms').notNull().default(0),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    costInr: varchar('cost_inr', { length: 32 }).notNull().default('0.00'),
    status: varchar('status', { length: 32 }).notNull().default('SUCCESS'), // SUCCESS, REJECTED, BLOCKED, FAILED
    rejectionReason: text('rejection_reason'),
    metadata: jsonb('metadata').default({}),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_req_registry_req_id').on(table.requestId),
    index('idx_ai_req_tenant').on(table.tenantId),
    index('idx_ai_req_user').on(table.userId),
    index('idx_ai_req_module').on(table.module),
    index('idx_ai_req_status').on(table.status),
    index('idx_ai_req_trace').on(table.traceId),
    index('idx_ai_req_time').on(table.requestedAt)
  ]
);

export type AiRequestRegistryRecord = typeof aiRequestRegistry.$inferSelect;
export type NewAiRequestRegistryRecord = typeof aiRequestRegistry.$inferInsert;

/**
 * 2. AI Incidents & CAPA Integration
 */
export const aiIncidents = coreSchema.table(
  'ai_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    incidentCode: varchar('incident_code', { length: 100 }).notNull(),
    incidentType: varchar('incident_type', { length: 64 }).notNull(), // HALLUCINATION, PROMPT_INJECTION, BIAS_DRIFT, PRIVACY_BREACH, SAFETY_VIOLATION, REGULATORY_BREACH
    severity: varchar('severity', { length: 32 }).notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    status: varchar('status', { length: 32 }).notNull().default('OPEN'), // OPEN, INVESTIGATING, RCA_COMPLETED, CAPA_ASSIGNED, RESOLVED, CLOSED
    model: varchar('model', { length: 100 }),
    promptTemplate: varchar('prompt_template', { length: 100 }),
    description: text('description').notNull(),
    rootCause: text('root_cause'),
    capaId: uuid('capa_id'),
    capaAction: text('capa_action'),
    preventiveMeasure: text('preventive_measure'),
    reportedBy: varchar('reported_by', { length: 255 }).notNull(),
    resolvedBy: varchar('resolved_by', { length: 255 }),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_ai_incident_code').on(table.tenantId, table.incidentCode),
    index('idx_ai_incident_tenant').on(table.tenantId),
    index('idx_ai_incident_type').on(table.incidentType),
    index('idx_ai_incident_status').on(table.status),
    index('idx_ai_incident_severity').on(table.severity)
  ]
);

export type AiIncident = typeof aiIncidents.$inferSelect;
export type NewAiIncident = typeof aiIncidents.$inferInsert;

/**
 * 3. AI Cost & Token Budgets
 */
export const aiCostBudgets = coreSchema.table(
  'ai_cost_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scopeType: varchar('scope_type', { length: 32 }).notNull().default('TENANT'), // TENANT, USER, MODULE, FEATURE
    scopeId: varchar('scope_id', { length: 128 }).notNull(),
    monthlyTokenLimit: integer('monthly_token_limit').notNull().default(1000000),
    monthlyBudgetInr: integer('monthly_budget_inr').notNull().default(5000),
    dailyTokenLimit: integer('daily_token_limit').notNull().default(100000),
    currentMonthTokens: integer('current_month_tokens').notNull().default(0),
    currentMonthCostInr: varchar('current_month_cost_inr', { length: 32 }).notNull().default('0.00'),
    currentDayTokens: integer('current_day_tokens').notNull().default(0),
    lastResetDate: timestamp('last_reset_date', { withTimezone: true }).notNull().defaultNow(),
    hardStopThresholdPercent: integer('hard_stop_threshold_percent').notNull().default(100),
    warningThresholdPercent: integer('warning_threshold_percent').notNull().default(80),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // ACTIVE, WARNING, SUSPENDED, EXCEEDED
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_cost_budget_scope').on(table.tenantId, table.scopeType, table.scopeId),
    index('idx_ai_cost_budget_tenant').on(table.tenantId),
    index('idx_ai_cost_budget_status').on(table.status)
  ]
);

export type AiCostBudget = typeof aiCostBudgets.$inferSelect;
export type NewAiCostBudget = typeof aiCostBudgets.$inferInsert;

/**
 * 4. AI Anomaly Detections & Explainability
 */
export const aiAnomalyDetections = coreSchema.table(
  'ai_anomaly_detections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    anomalyCode: varchar('anomaly_code', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 32 }).notNull(), // CLINICAL, LAB, PHARMACY, BILLING, INVENTORY, SECURITY, OPERATIONS
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    severity: varchar('severity', { length: 32 }).notNull().default('MEDIUM'), // INFO, LOW, MEDIUM, HIGH, CRITICAL
    detectionType: varchar('detection_type', { length: 64 }).notNull(), // LAB_DELTA_CHECK, ABNORMAL_SPIKE, STOCK_LEAKAGE, PRICING_MISMATCH, ANOMALOUS_ACCESS, CLINICAL_CONTRAINDICATION
    explanation: text('explanation').notNull(),
    confidenceScore: varchar('confidence_score', { length: 16 }).notNull().default('0.95'),
    prefixLabel: varchar('prefix_label', { length: 100 }).notNull().default('ANOMALY DETECTED — HUMAN REVIEW REQUIRED'),
    dataSnapshot: jsonb('data_snapshot').default({}),
    recommendation: text('recommendation'),
    humanReviewStatus: varchar('human_review_status', { length: 32 }).notNull().default('PENDING'), // PENDING, ACKNOWLEDGED, OVERRIDDEN, CONFIRMED, DISMISSED
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    reviewRemarks: text('review_remarks'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_ai_anomaly_tenant_code').on(table.tenantId, table.anomalyCode),
    index('idx_ai_anomaly_tenant').on(table.tenantId),
    index('idx_ai_anomaly_domain').on(table.domain),
    index('idx_ai_anomaly_status').on(table.humanReviewStatus),
    index('idx_ai_anomaly_time').on(table.detectedAt)
  ]
);

export type AiAnomalyDetection = typeof aiAnomalyDetections.$inferSelect;
export type NewAiAnomalyDetection = typeof aiAnomalyDetections.$inferInsert;

/**
 * 5. AI Demand Forecasts (Advisory Only)
 */
export const aiDemandForecasts = coreSchema.table(
  'ai_demand_forecasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    forecastCode: varchar('forecast_code', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 32 }).notNull(), // OPD, IPD, PHARMACY, LAB, STAFFING
    targetDate: timestamp('target_date', { withTimezone: true }).notNull(),
    predictedValue: integer('predicted_value').notNull(),
    confidenceIntervalLower: integer('confidence_interval_lower').notNull(),
    confidenceIntervalUpper: integer('confidence_interval_upper').notNull(),
    prefixLabel: varchar('prefix_label', { length: 100 }).notNull().default('AI FORECAST — ADVISORY ONLY'),
    assumptions: jsonb('assumptions').default([]),
    limitations: text('limitations'),
    isAdvisoryOnly: boolean('is_advisory_only').notNull().default(true),
    status: varchar('status', { length: 32 }).notNull().default('PUBLISHED'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_ai_forecast_tenant_code').on(table.tenantId, table.forecastCode),
    index('idx_ai_forecast_tenant').on(table.tenantId),
    index('idx_ai_forecast_domain').on(table.domain),
    index('idx_ai_forecast_target').on(table.targetDate)
  ]
);

export type AiDemandForecast = typeof aiDemandForecasts.$inferSelect;
export type NewAiDemandForecast = typeof aiDemandForecasts.$inferInsert;
