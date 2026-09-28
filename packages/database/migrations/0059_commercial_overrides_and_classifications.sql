ALTER TABLE "company"."partner_classifications" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."commercial_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"price_version_id" uuid,
	"override_type" varchar(50) DEFAULT 'FIXED_PRICE' NOT NULL,
	"override_value" integer NOT NULL,
	"valid_until" timestamp with time zone,
	"reason" text NOT NULL,
	"approved_by" varchar(255) NOT NULL,
	"approval_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_commercial_overrides_partner" ON "company"."commercial_overrides" USING btree ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_commercial_overrides_plan" ON "company"."commercial_overrides" USING btree ("plan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_commercial_overrides_status" ON "company"."commercial_overrides" USING btree ("status");
