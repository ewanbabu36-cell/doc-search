-- Migration: 0055_p0_scalability_outbox_and_idempotency.sql
-- Description: P0 Scalability Remediation: Transactional Outbox, Financial Idempotency & Concurrency Defense

CREATE TABLE IF NOT EXISTS "core"."outbox_jobs" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
    "job_type" varchar(100) NOT NULL,
    "payload" jsonb NOT NULL,
    "status" varchar(50) DEFAULT 'PENDING' NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "locked_by" varchar(255),
    "locked_until" timestamp with time zone,
    "last_error" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_jobs_fetch" ON "core"."outbox_jobs" ("status", "locked_until", "priority", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_jobs_tenant" ON "core"."outbox_jobs" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_jobs_type" ON "core"."outbox_jobs" ("job_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."idempotency_records" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
    "user_id" varchar(255),
    "idempotency_key" varchar(255) NOT NULL,
    "request_hash" varchar(64) NOT NULL,
    "method" varchar(10) NOT NULL,
    "route_path" varchar(255) NOT NULL,
    "status" varchar(50) DEFAULT 'IN_FLIGHT' NOT NULL,
    "status_code" integer,
    "response_headers" jsonb,
    "response_body" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_idempotency_tenant_key" ON "core"."idempotency_records" ("tenant_id", "idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_idempotency_expires" ON "core"."idempotency_records" ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_active_opd_slot" ON "clinical"."opd_slots" ("tenant_id", "doctor_id", "slot_date", "start_time") WHERE booking_status NOT IN ('CANCELLED', 'BLOCKED');
