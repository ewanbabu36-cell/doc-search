import { uuid, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';
import { branches } from './branches.js';
import { users } from './users.js';

export const userTenants = coreSchema.table(
  'user_tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED
    isDefault: boolean('is_default').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_user_tenants_user_tenant').on(table.userId, table.tenantId),
    index('idx_user_tenants_user_id').on(table.userId),
    index('idx_user_tenants_tenant_id').on(table.tenantId),
    index('idx_user_tenants_status').on(table.status)
  ]
);

export const userBranches = coreSchema.table(
  'user_branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    isHomeBranch: boolean('is_home_branch').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_user_branches_user_branch').on(table.userId, table.branchId),
    index('idx_user_branches_user_id').on(table.userId),
    index('idx_user_branches_branch_id').on(table.branchId),
    index('idx_user_branches_tenant_branch').on(table.tenantId, table.branchId)
  ]
);

export type UserTenant = typeof userTenants.$inferSelect;
export type NewUserTenant = typeof userTenants.$inferInsert;

export type UserBranch = typeof userBranches.$inferSelect;
export type NewUserBranch = typeof userBranches.$inferInsert;
