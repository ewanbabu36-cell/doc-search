import { pgSchema, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const coreSchema = pgSchema('core');

export const tenants = coreSchema.table(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    type: varchar('type', { length: 50 }).notNull().default('CLINIC'), // HOSPITAL, CLINIC, LAB, PHARMACY, ENTERPRISE
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, PENDING, INACTIVE
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_tenants_slug').on(table.slug),
    index('idx_tenants_status').on(table.status),
    index('idx_tenants_created_at').on(table.createdAt)
  ]
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
