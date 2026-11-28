import { varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { coreSchema } from './tenants.js';

export const platformSettings = coreSchema.table('platform_settings', {
  key: varchar('key', { length: 120 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
