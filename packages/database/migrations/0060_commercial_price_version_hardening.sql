ALTER TABLE "company"."price_versions" ADD COLUMN IF NOT EXISTS "product_id" uuid;
--> statement-breakpoint
ALTER TABLE "company"."price_versions" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'INR' NOT NULL;
--> statement-breakpoint
ALTER TABLE "company"."price_versions" ADD COLUMN IF NOT EXISTS "tax_inclusive" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "company"."price_versions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL;
--> statement-breakpoint
ALTER TABLE "company"."price_versions" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);
--> statement-breakpoint
ALTER TABLE "company"."commercial_order_snapshots" ADD COLUMN IF NOT EXISTS "calculation_hash" varchar(128);
