import { uuid, varchar, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { coreSchema, tenants } from './tenants.js';
import { branches } from './branches.js';

export const aiChatConversations = coreSchema.table(
  'ai_chat_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    userId: varchar('user_id', { length: 255 }).notNull(),
    role: varchar('role', { length: 64 }).notNull(),
    patientMrn: varchar('patient_mrn', { length: 64 }),
    title: varchar('title', { length: 255 }).notNull().default('New Conversation'),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ai_chat_conv_tenant_user').on(table.tenantId, table.userId),
    index('idx_ai_chat_conv_tenant_status').on(table.tenantId, table.status),
    index('idx_ai_chat_conv_patient').on(table.tenantId, table.patientMrn),
    index('idx_ai_chat_conv_updated').on(table.tenantId, table.updatedAt)
  ]
);

export const aiChatMessages = coreSchema.table(
  'ai_chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => aiChatConversations.id, { onDelete: 'cascade' })
      .notNull(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    senderType: varchar('sender_type', { length: 32 }).notNull(), // USER, ASSISTANT, SYSTEM
    userId: varchar('user_id', { length: 255 }),
    content: text('content').notNull(),
    capabilityId: varchar('capability_id', { length: 128 }),
    toolId: varchar('tool_id', { length: 128 }),
    toolInput: jsonb('tool_input'),
    toolOutput: jsonb('tool_output'),
    modelProvider: varchar('model_provider', { length: 64 }),
    modelVersion: varchar('model_version', { length: 64 }),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    traceId: varchar('trace_id', { length: 128 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_ai_chat_msg_conv_time').on(table.conversationId, table.createdAt),
    index('idx_ai_chat_msg_tenant_trace').on(table.tenantId, table.traceId)
  ]
);

export type AiChatConversation = typeof aiChatConversations.$inferSelect;
export type NewAiChatConversation = typeof aiChatConversations.$inferInsert;

export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type NewAiChatMessage = typeof aiChatMessages.$inferInsert;
