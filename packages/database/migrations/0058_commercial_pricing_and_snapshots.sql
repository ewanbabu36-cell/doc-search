CREATE TABLE IF NOT EXISTS "company"."price_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"version_number" varchar(50) NOT NULL,
	"annual_base_price_inr" integer NOT NULL,
	"gst_rate_percent" integer DEFAULT 18 NOT NULL,
	"sac_code" varchar(20) DEFAULT '998313' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."commercial_order_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"price_version_id" uuid,
	"billing_duration_years" integer NOT NULL,
	"annual_base_price_inr" integer NOT NULL,
	"gross_amount_inr" integer NOT NULL,
	"discount_rate_percent" integer DEFAULT 0 NOT NULL,
	"discount_amount_inr" integer DEFAULT 0 NOT NULL,
	"taxable_amount_inr" integer NOT NULL,
	"tax_rate_percent" integer DEFAULT 18 NOT NULL,
	"cgst_amount_inr" integer DEFAULT 0 NOT NULL,
	"sgst_amount_inr" integer DEFAULT 0 NOT NULL,
	"igst_amount_inr" integer DEFAULT 0 NOT NULL,
	"final_amount_inr" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"is_interstate" boolean DEFAULT false NOT NULL,
	"customer_gstin" varchar(50),
	"customer_billing_address" text,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_price_versions_plan_version" ON "company"."price_versions" USING btree ("plan_id","version_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_versions_plan_id" ON "company"."price_versions" USING btree ("plan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_versions_active" ON "company"."price_versions" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_commercial_snapshots_partner_id" ON "company"."commercial_order_snapshots" USING btree ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_commercial_snapshots_status" ON "company"."commercial_order_snapshots" USING btree ("status");
