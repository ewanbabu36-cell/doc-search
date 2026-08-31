import { uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';
import { branches } from './branches.js';
import { users } from './users.js';

export const roles = coreSchema.table(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_roles_tenant_code').on(table.tenantId, table.code),
    index('idx_roles_tenant_id').on(table.tenantId),
    index('idx_roles_code').on(table.code)
  ]
);

export const permissions = coreSchema.table(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    scope: varchar('scope', { length: 50 }).notNull().default('tenant'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_permissions_resource_action_scope').on(table.resource, table.action, table.scope),
    index('idx_permissions_resource').on(table.resource),
    index('idx_permissions_action').on(table.action)
  ]
);

export const rolePermissions = coreSchema.table(
  'role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_role_permissions_role_perm').on(table.roleId, table.permissionId),
    index('idx_role_permissions_role_id').on(table.roleId),
    index('idx_role_permissions_perm_id').on(table.permissionId)
  ]
);

export const userRoles = coreSchema.table(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_user_roles_user_role_tenant_branch').on(
      table.userId,
      table.roleId,
      table.tenantId,
      table.branchId
    ),
    index('idx_user_roles_user_tenant').on(table.userId, table.tenantId),
    index('idx_user_roles_role_id').on(table.roleId),
    index('idx_user_roles_branch_id').on(table.branchId)
  ]
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
