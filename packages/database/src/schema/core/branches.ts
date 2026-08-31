import { uuid, varchar, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';

export const branches = coreSchema.table(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_branches_tenant_code').on(table.tenantId, table.code),
    index('idx_branches_tenant_id').on(table.tenantId),
    index('idx_branches_status').on(table.status)
  ]
);

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
