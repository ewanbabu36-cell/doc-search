CREATE TABLE "clinical"."live_queue_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"token_number" varchar(32) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"doctor_name" varchar(128) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"room_number" varchar(32) NOT NULL,
	"curr_token_serving" varchar(32) NOT NULL,
	"est_wait_mins" integer DEFAULT 15 NOT NULL,
	"queue_status" varchar(32) DEFAULT 'WAITING_IN_LOBBY' NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"phone_number" varchar(32) NOT NULL,
	"last_msg_snippet" text NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"assigned_agent" varchar(128),
	"bot_active" boolean DEFAULT true NOT NULL,
	"last_activity_ts" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."whatsapp_document_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"phone_number" varchar(32) NOT NULL,
	"document_type" varchar(64) NOT NULL,
	"document_number" varchar(64) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size_kb" integer DEFAULT 240 NOT NULL,
	"dispatch_channel" varchar(64) DEFAULT 'WHATSAPP_CLOUD_API' NOT NULL,
	"delivery_status" varchar(32) DEFAULT 'DISPATCHED_READ' NOT NULL,
	"dispatched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."whatsapp_portal_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_code" varchar(64) NOT NULL,
	"actor_name" varchar(128) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"integrity_hash" varchar(128) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_lqt_tenant_token" ON "clinical"."live_queue_tokens" USING btree ("tenant_id","token_number");--> statement-breakpoint
CREATE INDEX "idx_lqt_tenant_doctor" ON "clinical"."live_queue_tokens" USING btree ("tenant_id","doctor_name");--> statement-breakpoint
CREATE INDEX "idx_wac_tenant_phone" ON "clinical"."whatsapp_conversations" USING btree ("tenant_id","phone_number");--> statement-breakpoint
CREATE INDEX "idx_wac_tenant_patient" ON "clinical"."whatsapp_conversations" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_wdd_tenant_patient" ON "clinical"."whatsapp_document_dispatches" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_wpatr_tenant_branch" ON "clinical"."whatsapp_portal_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wpatr_num" ON "clinical"."whatsapp_portal_audit_traces" USING btree ("tenant_id","trace_number");