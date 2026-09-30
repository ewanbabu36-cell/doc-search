import { uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { coreSchema } from './tenants.js';

export const revocations = coreSchema.table(
  'revocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    targetType: varchar('target_type', { length: 50 }).notNull(), // 'USER', 'TENANT', 'SESSION', 'GLOBAL'
    targetId: varchar('target_id', { length: 255 }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }).notNull().defaultNow(),
    reason: text('reason'),
    revokedBy: varchar('revoked_by', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_revocations_target').on(table.targetType, table.targetId),
    index('idx_revocations_revoked_at').on(table.revokedAt)
  ]
);

export type Revocation = typeof revocations.$inferSelect;
export type NewRevocation = typeof revocations.$inferInsert;
