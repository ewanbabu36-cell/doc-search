CREATE TABLE IF NOT EXISTS "core"."ai_chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(64) NOT NULL,
	"patient_mrn" varchar(64),
	"title" varchar(255) DEFAULT 'New Conversation' NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_conv_tenant_user" ON "core"."ai_chat_conversations" USING btree ("tenant_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_conv_tenant_status" ON "core"."ai_chat_conversations" USING btree ("tenant_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_conv_patient" ON "core"."ai_chat_conversations" USING btree ("tenant_id", "patient_mrn");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_conv_updated" ON "core"."ai_chat_conversations" USING btree ("tenant_id", "updated_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."ai_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"sender_type" varchar(32) NOT NULL,
	"user_id" varchar(255),
	"content" text NOT NULL,
	"capability_id" varchar(128),
	"tool_id" varchar(128),
	"tool_input" jsonb,
	"tool_output" jsonb,
	"model_provider" varchar(64),
	"model_version" varchar(64),
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"trace_id" varchar(128) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_msg_conv_time" ON "core"."ai_chat_messages" USING btree ("conversation_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_msg_tenant_trace" ON "core"."ai_chat_messages" USING btree ("tenant_id", "trace_id");
--> statement-breakpoint
ALTER TABLE "core"."ai_chat_conversations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "core"."ai_chat_conversations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS p_ai_chat_conversations_isolation ON "core"."ai_chat_conversations";
--> statement-breakpoint
CREATE POLICY p_ai_chat_conversations_isolation ON "core"."ai_chat_conversations"
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL OR branch_id IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL OR branch_id IS NULL))
  );
--> statement-breakpoint
ALTER TABLE "core"."ai_chat_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "core"."ai_chat_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS p_ai_chat_messages_isolation ON "core"."ai_chat_messages";
--> statement-breakpoint
CREATE POLICY p_ai_chat_messages_isolation ON "core"."ai_chat_messages"
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL OR branch_id IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL OR branch_id IS NULL))
  );
