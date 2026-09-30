import { uuid, varchar, integer, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';

export const outboxJobs = coreSchema.table(
  'outbox_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    jobType: varchar('job_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED, DLQ
    priority: integer('priority').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    lockedBy: varchar('locked_by', { length: 255 }),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true })
  },
  (table) => [
    index('idx_outbox_jobs_fetch').on(table.status, table.lockedUntil, table.priority, table.createdAt),
    index('idx_outbox_jobs_tenant').on(table.tenantId),
    index('idx_outbox_jobs_type').on(table.jobType)
  ]
);

export type OutboxJob = typeof outboxJobs.$inferSelect;
export type NewOutboxJob = typeof outboxJobs.$inferInsert;
