CREATE TABLE IF NOT EXISTS "core"."device_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"device_code" varchar(100) NOT NULL,
	"deviceName" varchar(255) NOT NULL,
	"device_type" varchar(50) DEFAULT 'WORKSTATION' NOT NULL,
	"hardware_fingerprint" varchar(255) NOT NULL,
	"device_token_hash" varchar(128) NOT NULL,
	"os_info" varchar(255),
	"app_version" varchar(50),
	"ip_address" varchar(45),
	"status" varchar(50) DEFAULT 'AUTHORIZED' NOT NULL,
	"enrolled_by" varchar(255) NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_device_tenant_code" ON "core"."device_registry" ("tenant_id", "device_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_device_tenant" ON "core"."device_registry" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_device_status" ON "core"."device_registry" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_device_heartbeat" ON "core"."device_registry" ("last_heartbeat_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."saga_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"saga_code" varchar(100) NOT NULL,
	"saga_type" varchar(100) NOT NULL,
	"correlation_id" varchar(100),
	"status" varchar(50) DEFAULT 'STARTED' NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"context_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failure_reason" text,
	"initiated_by" varchar(255) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_saga_tenant_code" ON "core"."saga_workflows" ("tenant_id", "saga_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_tenant" ON "core"."saga_workflows" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_status" ON "core"."saga_workflows" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_correlation" ON "core"."saga_workflows" ("correlation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."saga_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saga_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"step_name" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"forward_action" varchar(100) NOT NULL,
	"forward_payload" jsonb DEFAULT '{}'::jsonb,
	"forward_result" jsonb DEFAULT '{}'::jsonb,
	"compensation_action" varchar(100) NOT NULL,
	"compensation_payload" jsonb DEFAULT '{}'::jsonb,
	"compensation_result" jsonb DEFAULT '{}'::jsonb,
	"error_details" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_steps_saga" ON "core"."saga_steps" ("saga_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_steps_status" ON "core"."saga_steps" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."dead_letter_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_queue" varchar(100) DEFAULT 'outbox_jobs' NOT NULL,
	"original_job_id" varchar(255) NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"failure_reason" text NOT NULL,
	"stack_trace" text,
	"total_attempts" integer DEFAULT 5 NOT NULL,
	"status" varchar(50) DEFAULT 'DEAD_LETTERED' NOT NULL,
	"discarded_by" varchar(255),
	"discard_reason" text,
	"replayed_at" timestamp with time zone,
	"replayed_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_tenant" ON "core"."dead_letter_jobs" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_status" ON "core"."dead_letter_jobs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_job_type" ON "core"."dead_letter_jobs" ("job_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."offline_sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"device_id" uuid,
	"sync_batch_id" varchar(100) NOT NULL,
	"client_operation_id" varchar(255) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"operation" varchar(50) NOT NULL,
	"client_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"client_timestamp" timestamp with time zone NOT NULL,
	"server_received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_queue_tenant" ON "core"."offline_sync_queue" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_queue_device" ON "core"."offline_sync_queue" ("device_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_queue_status" ON "core"."offline_sync_queue" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_queue_batch" ON "core"."offline_sync_queue" ("sync_batch_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."offline_sync_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sync_queue_id" uuid,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"server_version" integer NOT NULL,
	"client_version" integer NOT NULL,
	"server_payload" jsonb NOT NULL,
	"client_payload" jsonb NOT NULL,
	"conflict_reason" text NOT NULL,
	"resolution_strategy" varchar(50) DEFAULT 'UNRESOLVED' NOT NULL,
	"resolved_payload" jsonb,
	"resolved_by" varchar(255),
	"resolution_remarks" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_conflicts_tenant" ON "core"."offline_sync_conflicts" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_conflicts_entity" ON "core"."offline_sync_conflicts" ("entity_type", "entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_conflicts_status" ON "core"."offline_sync_conflicts" ("resolution_strategy");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."reconciliation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"run_code" varchar(100) NOT NULL,
	"domain" varchar(50) NOT NULL,
	"source_a" varchar(100) NOT NULL,
	"source_b" varchar(100) NOT NULL,
	"matched_count" integer DEFAULT 0 NOT NULL,
	"discrepancy_count" integer DEFAULT 0 NOT NULL,
	"missing_count" integer DEFAULT 0 NOT NULL,
	"total_evaluated" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"executed_by" varchar(255) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_recon_runs_code" ON "core"."reconciliation_runs" ("tenant_id", "run_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_runs_tenant" ON "core"."reconciliation_runs" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_runs_domain" ON "core"."reconciliation_runs" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_runs_status" ON "core"."reconciliation_runs" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."reconciliation_discrepancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"discrepancy_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"source_a_value" jsonb,
	"source_b_value" jsonb,
	"variance_description" text NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"resolved_by" varchar(255),
	"resolution_remarks" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_disc_run" ON "core"."reconciliation_discrepancies" ("run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_disc_tenant" ON "core"."reconciliation_discrepancies" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recon_disc_status" ON "core"."reconciliation_discrepancies" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."audit_ledger_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_code" varchar(100) NOT NULL,
	"tenant_id" uuid,
	"start_timestamp" timestamp with time zone,
	"end_timestamp" timestamp with time zone,
	"total_events_scanned" integer DEFAULT 0 NOT NULL,
	"chained_events_verified" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'VALID' NOT NULL,
	"last_verified_hash" varchar(128),
	"first_tampered_event_id" varchar(255),
	"tampered_details" text,
	"verified_by" varchar(255) NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_audit_verif_code" ON "core"."audit_ledger_verifications" ("verification_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_verif_tenant" ON "core"."audit_ledger_verifications" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_verif_status" ON "core"."audit_ledger_verifications" ("status");
