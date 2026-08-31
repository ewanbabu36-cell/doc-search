import { uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';
import { branches } from './branches.js';
import { users } from './users.js';

export const auditEvents = coreSchema.table(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }),
    correlationId: varchar('correlation_id', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    metadata: jsonb('metadata').default({}),
    previousHash: varchar('previous_hash', { length: 128 }),
    integrityHash: varchar('integrity_hash', { length: 128 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_audit_events_tenant_time').on(table.tenantId, table.timestamp),
    index('idx_audit_events_actor_time').on(table.actorId, table.timestamp),
    index('idx_audit_events_resource').on(table.resourceType, table.resourceId),
    index('idx_audit_events_correlation').on(table.correlationId),
    index('idx_audit_events_event_type').on(table.eventType),
    index('idx_audit_events_integrity').on(table.integrityHash)
  ]
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
