CREATE TABLE IF NOT EXISTS "company"."licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_key" varchar(100) NOT NULL,
	"partner_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"license_type" varchar(50) DEFAULT 'COMMERCIAL' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"activation_status" varchar(50) DEFAULT 'ACTIVATED' NOT NULL,
	"max_concurrent_users" integer DEFAULT 50 NOT NULL,
	"max_doctors" integer DEFAULT 20 NOT NULL,
	"max_branches" integer DEFAULT 5 NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"grace_period_end" timestamp with time zone,
	"signature" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_licenses_key" ON "company"."licenses" USING btree ("license_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_licenses_partner_id" ON "company"."licenses" USING btree ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_licenses_tenant_id" ON "company"."licenses" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_licenses_subscription_id" ON "company"."licenses" USING btree ("subscription_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_licenses_status" ON "company"."licenses" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_licenses_expiry" ON "company"."licenses" USING btree ("expiry_date");
