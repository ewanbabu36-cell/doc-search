CREATE TABLE IF NOT EXISTS "core"."ai_request_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"request_id" varchar(100) NOT NULL,
	"trace_id" varchar(128) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_role" varchar(64) NOT NULL,
	"module" varchar(64) NOT NULL,
	"purpose" varchar(128) NOT NULL,
	"input_classification" varchar(32) NOT NULL,
	"output_classification" varchar(32) NOT NULL,
	"approval_requirement" varchar(32) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_inr" varchar(32) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'SUCCESS' NOT NULL,
	"rejection_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_req_registry_req_id" ON "core"."ai_request_registry" ("request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_tenant" ON "core"."ai_request_registry" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_user" ON "core"."ai_request_registry" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_module" ON "core"."ai_request_registry" ("module");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_status" ON "core"."ai_request_registry" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_trace" ON "core"."ai_request_registry" ("trace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_req_time" ON "core"."ai_request_registry" ("requested_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."ai_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"incident_code" varchar(100) NOT NULL,
	"incident_type" varchar(64) NOT NULL,
	"severity" varchar(32) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(32) DEFAULT 'OPEN' NOT NULL,
	"model" varchar(100),
	"prompt_template" varchar(100),
	"description" text NOT NULL,
	"root_cause" text,
	"capa_id" uuid,
	"capa_action" text,
	"preventive_measure" text,
	"reported_by" varchar(255) NOT NULL,
	"resolved_by" varchar(255),
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_incident_code" ON "core"."ai_incidents" ("tenant_id", "incident_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_incident_tenant" ON "core"."ai_incidents" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_incident_type" ON "core"."ai_incidents" ("incident_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_incident_status" ON "core"."ai_incidents" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_incident_severity" ON "core"."ai_incidents" ("severity");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."ai_cost_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scope_type" varchar(32) DEFAULT 'TENANT' NOT NULL,
	"scope_id" varchar(128) NOT NULL,
	"monthly_token_limit" integer DEFAULT 1000000 NOT NULL,
	"monthly_budget_inr" integer DEFAULT 5000 NOT NULL,
	"daily_token_limit" integer DEFAULT 100000 NOT NULL,
	"current_month_tokens" integer DEFAULT 0 NOT NULL,
	"current_month_cost_inr" varchar(32) DEFAULT '0.00' NOT NULL,
	"current_day_tokens" integer DEFAULT 0 NOT NULL,
	"last_reset_date" timestamp with time zone DEFAULT now() NOT NULL,
	"hard_stop_threshold_percent" integer DEFAULT 100 NOT NULL,
	"warning_threshold_percent" integer DEFAULT 80 NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_cost_budget_scope" ON "core"."ai_cost_budgets" ("tenant_id", "scope_type", "scope_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_budget_tenant" ON "core"."ai_cost_budgets" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_budget_status" ON "core"."ai_cost_budgets" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."ai_anomaly_detections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"anomaly_code" varchar(100) NOT NULL,
	"domain" varchar(32) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(32) DEFAULT 'MEDIUM' NOT NULL,
	"detection_type" varchar(64) NOT NULL,
	"explanation" text NOT NULL,
	"confidence_score" varchar(16) DEFAULT '0.95' NOT NULL,
	"prefix_label" varchar(100) DEFAULT 'ANOMALY DETECTED — HUMAN REVIEW REQUIRED' NOT NULL,
	"data_snapshot" jsonb DEFAULT '{}'::jsonb,
	"recommendation" text,
	"human_review_status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" varchar(255),
	"review_remarks" text,
	"reviewed_at" timestamp with time zone,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_anomaly_tenant_code" ON "core"."ai_anomaly_detections" ("tenant_id", "anomaly_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_anomaly_tenant" ON "core"."ai_anomaly_detections" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_anomaly_domain" ON "core"."ai_anomaly_detections" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_anomaly_status" ON "core"."ai_anomaly_detections" ("human_review_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_anomaly_time" ON "core"."ai_anomaly_detections" ("detected_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."ai_demand_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"forecast_code" varchar(100) NOT NULL,
	"domain" varchar(32) NOT NULL,
	"target_date" timestamp with time zone NOT NULL,
	"predicted_value" integer NOT NULL,
	"confidence_interval_lower" integer NOT NULL,
	"confidence_interval_upper" integer NOT NULL,
	"prefix_label" varchar(100) DEFAULT 'AI FORECAST — ADVISORY ONLY' NOT NULL,
	"assumptions" jsonb DEFAULT '[]'::jsonb,
	"limitations" text,
	"is_advisory_only" boolean DEFAULT true NOT NULL,
	"status" varchar(32) DEFAULT 'PUBLISHED' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_forecast_tenant_code" ON "core"."ai_demand_forecasts" ("tenant_id", "forecast_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_forecast_tenant" ON "core"."ai_demand_forecasts" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_forecast_domain" ON "core"."ai_demand_forecasts" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_forecast_target" ON "core"."ai_demand_forecasts" ("target_date");
