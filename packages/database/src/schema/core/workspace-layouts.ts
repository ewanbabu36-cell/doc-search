import { uuid, varchar, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema } from './tenants.js';

export const userWorkspaceLayouts = coreSchema.table(
  'user_workspace_layouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    activePresetId: varchar('active_preset_id', { length: 64 }).notNull().default('CLINICAL_DEFAULT'),
    dockSlots: jsonb('dock_slots').notNull().default([]),
    headerSlots: jsonb('header_slots').notNull().default([]),
    customFolders: jsonb('custom_folders').notNull().default([]),
    drawerPinnedIds: jsonb('drawer_pinned_ids').notNull().default([]),
    themeVariant: varchar('theme_variant', { length: 32 }).notNull().default('LIQUID_GLASS_DARK'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('idx_user_workspace_layouts_tenant_user').on(table.tenantId, table.userId),
    index('idx_user_workspace_layouts_preset').on(table.activePresetId),
    index('idx_user_workspace_layouts_updated').on(table.updatedAt)
  ]
);

export type UserWorkspaceLayout = typeof userWorkspaceLayouts.$inferSelect;
export type NewUserWorkspaceLayout = typeof userWorkspaceLayouts.$inferInsert;
