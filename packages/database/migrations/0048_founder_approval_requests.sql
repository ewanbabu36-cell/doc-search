CREATE TABLE IF NOT EXISTS "company"."founder_approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" varchar(100) NOT NULL UNIQUE,
	"entity_type" varchar(100) NOT NULL,
	"task_title" varchar(255) NOT NULL,
	"submitter_name" varchar(255) NOT NULL,
	"submitter_email" varchar(255) NOT NULL,
	"submitter_role" varchar(100) NOT NULL,
	"payload_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approval_status" varchar(50) DEFAULT 'PENDING_FOUNDER_APPROVAL' NOT NULL,
	"task_status" varchar(50) DEFAULT 'AWAITING_FOUNDER_APPROVAL' NOT NULL,
	"founder_remarks" text,
	"approved_by_email" varchar(255),
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_founder_appr_status" ON "company"."founder_approval_requests" USING btree ("approval_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_founder_appr_submitter" ON "company"."founder_approval_requests" USING btree ("submitter_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_founder_appr_type" ON "company"."founder_approval_requests" USING btree ("entity_type");
