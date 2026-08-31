CREATE TABLE "company"."ai_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"partner_id" uuid,
	"model_id" uuid NOT NULL,
	"model_version" varchar(20) NOT NULL,
	"prompt_template_id" uuid,
	"prompt_version" varchar(20),
	"governance_policy_id" uuid,
	"safety_classification" varchar(50) NOT NULL,
	"request_status" varchar(50) NOT NULL,
	"outcome_status" varchar(50) NOT NULL,
	"human_review_required" boolean DEFAULT false NOT NULL,
	"human_review_status" varchar(50) DEFAULT 'NOT_REQUIRED' NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."ai_governance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"policy_type" varchar(50) DEFAULT 'CLINICAL_SAFETY_BOUNDARY' NOT NULL,
	"risk_level" varchar(50) DEFAULT 'MODERATE_OPERATIONAL' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb,
	"prohibited_use_cases" jsonb DEFAULT '[]'::jsonb,
	"allowed_use_cases" jsonb DEFAULT '[]'::jsonb,
	"human_oversight_required" boolean DEFAULT true NOT NULL,
	"clinical_safety_boundary" text NOT NULL,
	"approval_required" boolean DEFAULT true NOT NULL,
	"approved_by_id" uuid,
	"approved_by_email" varchar(255),
	"approved_at" timestamp with time zone,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(100) NOT NULL,
	"model_code" varchar(100) NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"model_family" varchar(100) NOT NULL,
	"lifecycle_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"deployment_status" varchar(50) DEFAULT 'NOT_DEPLOYED' NOT NULL,
	"capability_classification" varchar(50) DEFAULT 'SUMMARIZATION' NOT NULL,
	"risk_classification" varchar(50) DEFAULT 'LOW_ADMINISTRATIVE' NOT NULL,
	"context_window" integer DEFAULT 8192 NOT NULL,
	"supported_modalities" jsonb DEFAULT '["TEXT"]'::jsonb,
	"approved_for_production" boolean DEFAULT false NOT NULL,
	"approved_for_clinical_context" boolean DEFAULT false NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"release_date" timestamp with time zone,
	"deprecation_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"prompt_type" varchar(50) DEFAULT 'TASK' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"governance_policy_id" uuid,
	"approval_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"version" varchar(20) NOT NULL,
	"prompt_content" text NOT NULL,
	"change_summary" text NOT NULL,
	"created_by_id" uuid,
	"created_by_email" varchar(255) NOT NULL,
	"approval_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"approved_by_id" uuid,
	"approved_by_email" varchar(255),
	"approved_at" timestamp with time zone,
	"effective_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_safety_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_code" varchar(100) NOT NULL,
	"severity" varchar(50) DEFAULT 'INFO' NOT NULL,
	"category" varchar(100) NOT NULL,
	"model_id" uuid,
	"prompt_template_id" uuid,
	"governance_policy_id" uuid,
	"description" text NOT NULL,
	"recommended_action" text NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"requires_human_review" boolean DEFAULT false NOT NULL,
	"acknowledged_by_id" uuid,
	"acknowledged_by_email" varchar(255),
	"acknowledged_at" timestamp with time zone,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_usage_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(50) DEFAULT 'PLATFORM' NOT NULL,
	"scope_reference" varchar(100) NOT NULL,
	"model_id" uuid,
	"quota_type" varchar(50) DEFAULT 'TOKENS' NOT NULL,
	"limit_value" integer NOT NULL,
	"warning_threshold" integer NOT NULL,
	"period" varchar(50) DEFAULT 'MONTHLY' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."ai_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"partner_id" uuid,
	"tenant_scope" varchar(100),
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "company"."ai_audit_traces" ADD CONSTRAINT "ai_audit_traces_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_audit_traces" ADD CONSTRAINT "ai_audit_traces_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_audit_traces" ADD CONSTRAINT "ai_audit_traces_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "company"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_audit_traces" ADD CONSTRAINT "ai_audit_traces_prompt_template_id_ai_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "company"."ai_prompt_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_audit_traces" ADD CONSTRAINT "ai_audit_traces_governance_policy_id_ai_governance_policies_id_fk" FOREIGN KEY ("governance_policy_id") REFERENCES "company"."ai_governance_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_governance_policies" ADD CONSTRAINT "ai_governance_policies_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_governance_policy_id_ai_governance_policies_id_fk" FOREIGN KEY ("governance_policy_id") REFERENCES "company"."ai_governance_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_prompt_versions" ADD CONSTRAINT "ai_prompt_versions_prompt_template_id_ai_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "company"."ai_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_prompt_versions" ADD CONSTRAINT "ai_prompt_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_prompt_versions" ADD CONSTRAINT "ai_prompt_versions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_safety_events" ADD CONSTRAINT "ai_safety_events_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "company"."ai_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_safety_events" ADD CONSTRAINT "ai_safety_events_prompt_template_id_ai_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "company"."ai_prompt_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_safety_events" ADD CONSTRAINT "ai_safety_events_governance_policy_id_ai_governance_policies_id_fk" FOREIGN KEY ("governance_policy_id") REFERENCES "company"."ai_governance_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_safety_events" ADD CONSTRAINT "ai_safety_events_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_usage_quotas" ADD CONSTRAINT "ai_usage_quotas_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "company"."ai_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_usage_records" ADD CONSTRAINT "ai_usage_records_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "company"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."ai_usage_records" ADD CONSTRAINT "ai_usage_records_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_audit_traces_trace_id" ON "company"."ai_audit_traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_ai_audit_traces_model" ON "company"."ai_audit_traces" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_ai_audit_traces_safety" ON "company"."ai_audit_traces" USING btree ("safety_classification");--> statement-breakpoint
CREATE INDEX "idx_ai_audit_traces_status" ON "company"."ai_audit_traces" USING btree ("request_status");--> statement-breakpoint
CREATE INDEX "idx_ai_audit_traces_time" ON "company"."ai_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_gov_policies_code" ON "company"."ai_governance_policies" USING btree ("policy_code");--> statement-breakpoint
CREATE INDEX "idx_ai_gov_policies_status" ON "company"."ai_governance_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_gov_policies_type" ON "company"."ai_governance_policies" USING btree ("policy_type");--> statement-breakpoint
CREATE INDEX "idx_ai_gov_policies_risk" ON "company"."ai_governance_policies" USING btree ("risk_level");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_models_code" ON "company"."ai_models" USING btree ("model_code");--> statement-breakpoint
CREATE INDEX "idx_ai_models_lifecycle" ON "company"."ai_models" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE INDEX "idx_ai_models_deployment" ON "company"."ai_models" USING btree ("deployment_status");--> statement-breakpoint
CREATE INDEX "idx_ai_models_risk" ON "company"."ai_models" USING btree ("risk_classification");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_prompt_templates_code" ON "company"."ai_prompt_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_type" ON "company"."ai_prompt_templates" USING btree ("prompt_type");--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_approval" ON "company"."ai_prompt_templates" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_policy" ON "company"."ai_prompt_templates" USING btree ("governance_policy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_prompt_versions_template_ver" ON "company"."ai_prompt_versions" USING btree ("prompt_template_id","version");--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_versions_template" ON "company"."ai_prompt_versions" USING btree ("prompt_template_id");--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_versions_status" ON "company"."ai_prompt_versions" USING btree ("approval_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_safety_events_code" ON "company"."ai_safety_events" USING btree ("event_code");--> statement-breakpoint
CREATE INDEX "idx_ai_safety_events_severity" ON "company"."ai_safety_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_ai_safety_events_status" ON "company"."ai_safety_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_safety_events_detected" ON "company"."ai_safety_events" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_ai_quotas_scope" ON "company"."ai_usage_quotas" USING btree ("scope_type","scope_reference");--> statement-breakpoint
CREATE INDEX "idx_ai_quotas_model" ON "company"."ai_usage_quotas" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_ai_quotas_status" ON "company"."ai_usage_quotas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_model" ON "company"."ai_usage_records" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_partner" ON "company"."ai_usage_records" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_date" ON "company"."ai_usage_records" USING btree ("recorded_at");