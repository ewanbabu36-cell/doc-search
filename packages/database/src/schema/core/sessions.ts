import { uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';
import { branches } from './branches.js';
import { users } from './users.js';

export const sessions = coreSchema.table(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    tokenFamilyId: uuid('token_family_id').notNull().defaultRandom(),
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_sessions_token_hash').on(table.refreshTokenHash),
    index('idx_sessions_user_tenant').on(table.userId, table.tenantId),
    index('idx_sessions_family').on(table.tokenFamilyId),
    index('idx_sessions_expires_at').on(table.expiresAt),
    index('idx_sessions_revoked_at').on(table.revokedAt)
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
