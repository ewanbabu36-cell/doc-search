CREATE TABLE "company"."analytics_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"category" varchar(50) DEFAULT 'PLATFORM_USAGE' NOT NULL,
	"description" text NOT NULL,
	"schedule_frequency" varchar(50) DEFAULT 'WEEKLY' NOT NULL,
	"last_generated_at" timestamp with time zone,
	"output_format" varchar(50) DEFAULT 'JSON' NOT NULL,
	"created_by_id" uuid,
	"created_by_email" varchar(255) NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_category" varchar(50) NOT NULL,
	"dimension" varchar(100) NOT NULL,
	"anonymized_cohort" varchar(100) NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"aggregated_value" varchar(100) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"telemetry_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"recorded_date" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."system_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"severity" varchar(50) DEFAULT 'INFO' NOT NULL,
	"description" text NOT NULL,
	"recommended_action" text NOT NULL,
	"source_domain" varchar(100) NOT NULL,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "company"."analytics_reports" ADD CONSTRAINT "analytics_reports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_reports_code" ON "company"."analytics_reports" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_analytics_reports_category" ON "company"."analytics_reports" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshots_cat" ON "company"."analytics_snapshots" USING btree ("metric_category");--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshots_date" ON "company"."analytics_snapshots" USING btree ("recorded_date");--> statement-breakpoint
CREATE INDEX "idx_system_insights_severity" ON "company"."system_insights" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_system_insights_ack" ON "company"."system_insights" USING btree ("is_acknowledged");--> statement-breakpoint
CREATE INDEX "idx_system_insights_date" ON "company"."system_insights" USING btree ("detected_at");