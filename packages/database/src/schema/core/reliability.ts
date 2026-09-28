import { uuid, varchar, integer, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';

/**
 * 1. Device Registry: Authorized clinical workstations, tablets, kiosks, scanners
 */
export const deviceRegistry = coreSchema.table(
  'device_registry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    deviceCode: varchar('device_code', { length: 100 }).notNull(),
    deviceName: varchar('deviceName', { length: 255 }).notNull(),
    deviceType: varchar('device_type', { length: 50 }).notNull().default('WORKSTATION'),
    hardwareFingerprint: varchar('hardware_fingerprint', { length: 255 }).notNull(),
    deviceTokenHash: varchar('device_token_hash', { length: 128 }).notNull(),
    osInfo: varchar('os_info', { length: 255 }),
    appVersion: varchar('app_version', { length: 50 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    status: varchar('status', { length: 50 }).notNull().default('AUTHORIZED'), // ENROLLED, AUTHORIZED, SUSPENDED, REVOKED
    enrolledBy: varchar('enrolled_by', { length: 255 }).notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revocationReason: text('revocation_reason'),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_device_tenant_code').on(table.tenantId, table.deviceCode),
    index('idx_device_tenant').on(table.tenantId),
    index('idx_device_status').on(table.status),
    index('idx_device_heartbeat').on(table.lastHeartbeatAt)
  ]
);

export type DeviceRegistryRecord = typeof deviceRegistry.$inferSelect;
export type NewDeviceRegistryRecord = typeof deviceRegistry.$inferInsert;

/**
 * 2. Distributed Saga Workflows
 */
export const sagaWorkflows = coreSchema.table(
  'saga_workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    sagaCode: varchar('saga_code', { length: 100 }).notNull(),
    sagaType: varchar('saga_type', { length: 100 }).notNull(), // PATIENT_DISCHARGE, GRN_STOCK_INGESTION, BILLING_SETTLEMENT, ORDER_FULFILLMENT
    correlationId: varchar('correlation_id', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('STARTED'), // STARTED, IN_PROGRESS, COMPLETED, COMPENSATING, COMPENSATED, FAILED
    currentStepIndex: integer('current_step_index').notNull().default(0),
    totalSteps: integer('total_steps').notNull().default(0),
    contextPayload: jsonb('context_payload').notNull().default({}),
    failureReason: text('failure_reason'),
    initiatedBy: varchar('initiated_by', { length: 255 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_saga_tenant_code').on(table.tenantId, table.sagaCode),
    index('idx_saga_tenant').on(table.tenantId),
    index('idx_saga_status').on(table.status),
    index('idx_saga_correlation').on(table.correlationId)
  ]
);

export type SagaWorkflow = typeof sagaWorkflows.$inferSelect;
export type NewSagaWorkflow = typeof sagaWorkflows.$inferInsert;

/**
 * 3. Distributed Saga Steps (Forward & Compensatory actions)
 */
export const sagaSteps = coreSchema.table(
  'saga_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sagaId: uuid('saga_id')
      .notNull()
      .references(() => sagaWorkflows.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    stepIndex: integer('step_index').notNull(),
    stepName: varchar('step_name', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, RUNNING, COMPLETED, COMPENSATING, COMPENSATED, FAILED
    forwardAction: varchar('forward_action', { length: 100 }).notNull(),
    forwardPayload: jsonb('forward_payload').default({}),
    forwardResult: jsonb('forward_result').default({}),
    compensationAction: varchar('compensation_action', { length: 100 }).notNull(),
    compensationPayload: jsonb('compensation_payload').default({}),
    compensationResult: jsonb('compensation_result').default({}),
    errorDetails: text('error_details'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => [
    index('idx_saga_steps_saga').on(table.sagaId),
    index('idx_saga_steps_status').on(table.status)
  ]
);

export type SagaStep = typeof sagaSteps.$inferSelect;
export type NewSagaStep = typeof sagaSteps.$inferInsert;

/**
 * 4. Dead Letter Queue Jobs
 */
export const deadLetterJobs = coreSchema.table(
  'dead_letter_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sourceQueue: varchar('source_queue', { length: 100 }).notNull().default('outbox_jobs'),
    originalJobId: varchar('original_job_id', { length: 255 }).notNull(),
    jobType: varchar('job_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    failureReason: text('failure_reason').notNull(),
    stackTrace: text('stack_trace'),
    totalAttempts: integer('total_attempts').notNull().default(5),
    status: varchar('status', { length: 50 }).notNull().default('DEAD_LETTERED'), // DEAD_LETTERED, REPLAYED, DISCARDED
    discardedBy: varchar('discarded_by', { length: 255 }),
    discardReason: text('discard_reason'),
    replayedAt: timestamp('replayed_at', { withTimezone: true }),
    replayedBy: varchar('replayed_by', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_dlq_tenant').on(table.tenantId),
    index('idx_dlq_status').on(table.status),
    index('idx_dlq_job_type').on(table.jobType)
  ]
);

export type DeadLetterJob = typeof deadLetterJobs.$inferSelect;
export type NewDeadLetterJob = typeof deadLetterJobs.$inferInsert;

/**
 * 5. Offline Sync Queue
 */
export const offlineSyncQueue = coreSchema.table(
  'offline_sync_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    deviceId: uuid('device_id').references(() => deviceRegistry.id, { onDelete: 'set null' }),
    syncBatchId: varchar('sync_batch_id', { length: 100 }).notNull(),
    clientOperationId: varchar('client_operation_id', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    operation: varchar('operation', { length: 50 }).notNull(), // INSERT, UPDATE, DELETE
    clientVersion: integer('client_version').notNull().default(1),
    payload: jsonb('payload').notNull(),
    clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
    serverReceivedAt: timestamp('server_received_at', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'), // QUEUED, APPLIED, CONFLICT_DETECTED, FAILED
    errorMessage: text('error_message')
  },
  (table) => [
    index('idx_offline_queue_tenant').on(table.tenantId),
    index('idx_offline_queue_device').on(table.deviceId),
    index('idx_offline_queue_status').on(table.status),
    index('idx_offline_queue_batch').on(table.syncBatchId)
  ]
);

export type OfflineSyncQueueItem = typeof offlineSyncQueue.$inferSelect;
export type NewOfflineSyncQueueItem = typeof offlineSyncQueue.$inferInsert;

/**
 * 6. Offline Sync Conflicts (Explicit Non-LWW resolution)
 */
export const offlineSyncConflicts = coreSchema.table(
  'offline_sync_conflicts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    syncQueueId: uuid('sync_queue_id').references(() => offlineSyncQueue.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    serverVersion: integer('server_version').notNull(),
    clientVersion: integer('client_version').notNull(),
    serverPayload: jsonb('server_payload').notNull(),
    clientPayload: jsonb('client_payload').notNull(),
    conflictReason: text('conflict_reason').notNull(),
    resolutionStrategy: varchar('resolution_strategy', { length: 50 }).notNull().default('UNRESOLVED'), // UNRESOLVED, SERVER_WINS, CLIENT_OVERWRITE, FIELD_LEVEL_MERGE, MANUAL_ARBITRATION
    resolvedPayload: jsonb('resolved_payload'),
    resolvedBy: varchar('resolved_by', { length: 255 }),
    resolutionRemarks: text('resolution_remarks'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_sync_conflicts_tenant').on(table.tenantId),
    index('idx_sync_conflicts_entity').on(table.entityType, table.entityId),
    index('idx_sync_conflicts_status').on(table.resolutionStrategy)
  ]
);

export type OfflineSyncConflict = typeof offlineSyncConflicts.$inferSelect;
export type NewOfflineSyncConflict = typeof offlineSyncConflicts.$inferInsert;

/**
 * 7. Multi-Domain Automated Reconciliation Runs
 */
export const reconciliationRuns = coreSchema.table(
  'reconciliation_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id'),
    runCode: varchar('run_code', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 50 }).notNull(), // FINANCIAL_PAYMENTS, INVENTORY_STOCK, CLINICAL_ORDERS, SUBSCRIPTION_LICENSES
    sourceA: varchar('source_a', { length: 100 }).notNull(),
    sourceB: varchar('source_b', { length: 100 }).notNull(),
    matchedCount: integer('matched_count').notNull().default(0),
    discrepancyCount: integer('discrepancy_count').notNull().default(0),
    missingCount: integer('missing_count').notNull().default(0),
    totalEvaluated: integer('total_evaluated').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('COMPLETED'), // COMPLETED, DISCREPANCIES_FOUND, FAILED
    executedBy: varchar('executed_by', { length: 255 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_recon_runs_code').on(table.tenantId, table.runCode),
    index('idx_recon_runs_tenant').on(table.tenantId),
    index('idx_recon_runs_domain').on(table.domain),
    index('idx_recon_runs_status').on(table.status)
  ]
);

export type ReconciliationRun = typeof reconciliationRuns.$inferSelect;
export type NewReconciliationRun = typeof reconciliationRuns.$inferInsert;

/**
 * 8. Reconciliation Discrepancies
 */
export const reconciliationDiscrepancies = coreSchema.table(
  'reconciliation_discrepancies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => reconciliationRuns.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    discrepancyType: varchar('discrepancy_type', { length: 50 }).notNull(), // AMOUNT_MISMATCH, STATUS_MISMATCH, RECORD_MISSING_A, RECORD_MISSING_B, DUPLICATE_ENTRY
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    sourceAValue: jsonb('source_a_value'),
    sourceBValue: jsonb('source_b_value'),
    varianceDescription: text('variance_description').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('OPEN'), // OPEN, INVESTIGATING, RESOLVED, WAIVED
    resolvedBy: varchar('resolved_by', { length: 255 }),
    resolutionRemarks: text('resolution_remarks'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_recon_disc_run').on(table.runId),
    index('idx_recon_disc_tenant').on(table.tenantId),
    index('idx_recon_disc_status').on(table.status)
  ]
);

export type ReconciliationDiscrepancy = typeof reconciliationDiscrepancies.$inferSelect;
export type NewReconciliationDiscrepancy = typeof reconciliationDiscrepancies.$inferInsert;

/**
 * 9. Audit Ledger Cryptographic Verification Log
 */
export const auditLedgerVerifications = coreSchema.table(
  'audit_ledger_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    verificationCode: varchar('verification_code', { length: 100 }).notNull(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    startTimestamp: timestamp('start_timestamp', { withTimezone: true }),
    endTimestamp: timestamp('end_timestamp', { withTimezone: true }),
    totalEventsScanned: integer('total_events_scanned').notNull().default(0),
    chainedEventsVerified: integer('chained_events_verified').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('VALID'), // VALID, TAMPER_DETECTED, BROKEN_CHAIN, NO_RECORDS
    lastVerifiedHash: varchar('last_verified_hash', { length: 128 }),
    firstTamperedEventId: varchar('first_tampered_event_id', { length: 255 }),
    tamperedDetails: text('tampered_details'),
    verifiedBy: varchar('verified_by', { length: 255 }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').default({})
  },
  (table) => [
    uniqueIndex('uq_audit_verif_code').on(table.verificationCode),
    index('idx_audit_verif_tenant').on(table.tenantId),
    index('idx_audit_verif_status').on(table.status)
  ]
);

export type AuditLedgerVerification = typeof auditLedgerVerifications.$inferSelect;
export type NewAuditLedgerVerification = typeof auditLedgerVerifications.$inferInsert;
