import { uuid, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { coreSchema } from './tenants.js';

export const users = coreSchema.table(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING_VERIFICATION'), // ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('uq_users_email').on(table.email),
    index('idx_users_status').on(table.status),
    index('idx_users_created_at').on(table.createdAt)
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
