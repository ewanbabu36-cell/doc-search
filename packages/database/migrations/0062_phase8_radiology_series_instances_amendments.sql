CREATE TABLE IF NOT EXISTS "clinical"."imaging_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"study_id" uuid NOT NULL,
	"series_instance_uid" varchar(128) NOT NULL,
	"series_number" integer DEFAULT 1 NOT NULL,
	"modality" varchar(64) NOT NULL,
	"series_description" text NOT NULL,
	"number_of_instances" integer DEFAULT 1 NOT NULL,
	"body_part_examined" varchar(128),
	"protocol_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."imaging_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"series_id" uuid NOT NULL,
	"study_id" uuid NOT NULL,
	"sop_instance_uid" varchar(128) NOT NULL,
	"sop_class_uid" varchar(128) DEFAULT '1.2.840.10008.5.1.4.1.1.7' NOT NULL,
	"instance_number" integer DEFAULT 1 NOT NULL,
	"rows" integer,
	"columns" integer,
	"bits_allocated" integer DEFAULT 16,
	"bits_stored" integer DEFAULT 12,
	"window_center" numeric(8, 2),
	"window_width" numeric(8, 2),
	"slice_thickness" numeric(6, 2),
	"slice_location" numeric(8, 2),
	"image_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."radiology_report_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"amendment_number" varchar(64) NOT NULL,
	"version_from" integer NOT NULL,
	"version_to" integer NOT NULL,
	"previous_findings" text NOT NULL,
	"previous_impression" text NOT NULL,
	"amended_findings" text NOT NULL,
	"amended_impression" text NOT NULL,
	"reason_for_amendment" text NOT NULL,
	"amended_by_radiologist_name" varchar(255) NOT NULL,
	"digital_signature" text NOT NULL,
	"amended_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_is_tenant_study" ON "clinical"."imaging_series" USING btree ("tenant_id","study_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_is_uid" ON "clinical"."imaging_series" USING btree ("tenant_id","series_instance_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ii_tenant_series" ON "clinical"."imaging_instances" USING btree ("tenant_id","series_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ii_uid" ON "clinical"."imaging_instances" USING btree ("tenant_id","sop_instance_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rra_tenant_report" ON "clinical"."radiology_report_amendments" USING btree ("tenant_id","report_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_rra_number" ON "clinical"."radiology_report_amendments" USING btree ("tenant_id","amendment_number");
