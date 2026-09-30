import { uuid, varchar, integer, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';

export const idempotencyRecords = coreSchema.table(
  'idempotency_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 }),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    requestHash: varchar('request_hash', { length: 64 }).notNull(), // SHA-256 hex digest
    method: varchar('method', { length: 10 }).notNull(),
    routePath: varchar('route_path', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('IN_FLIGHT'), // IN_FLIGHT, COMPLETED, FAILED
    statusCode: integer('status_code'),
    responseHeaders: jsonb('response_headers'),
    responseBody: text('response_body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
  },
  (table) => [
    uniqueIndex('idx_idempotency_tenant_key').on(table.tenantId, table.idempotencyKey),
    index('idx_idempotency_expires').on(table.expiresAt)
  ]
);

export type IdempotencyRecord = typeof idempotencyRecords.$inferSelect;
export type NewIdempotencyRecord = typeof idempotencyRecords.$inferInsert;
