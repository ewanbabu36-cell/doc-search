CREATE TABLE "clinical"."executive_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_code" varchar(64) NOT NULL,
	"actor_name" varchar(128) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"integrity_hash" varchar(128) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."executive_command_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"hospital_name" varchar(255) NOT NULL,
	"snapshot_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"surge_level" varchar(32) DEFAULT 'NORMAL_GREEN' NOT NULL,
	"active_emergency_codes" jsonb NOT NULL,
	"total_beds" integer NOT NULL,
	"occupied_beds" integer NOT NULL,
	"bed_occupancy_pct" numeric(5, 2) NOT NULL,
	"available_beds_count" integer NOT NULL,
	"icu_beds_total" integer NOT NULL,
	"icu_beds_occupied" integer NOT NULL,
	"icu_occupancy_pct" numeric(5, 2) NOT NULL,
	"ventilators_total" integer NOT NULL,
	"ventilators_in_use" integer NOT NULL,
	"ventilator_util_pct" numeric(5, 2) NOT NULL,
	"ed_triage_waiting" integer NOT NULL,
	"ed_hold_admission" integer NOT NULL,
	"ed_nedocs_score" integer NOT NULL,
	"ed_nedocs_status" varchar(64) NOT NULL,
	"ot_suites_active" integer NOT NULL,
	"ot_suites_total" integer NOT NULL,
	"ot_util_pct" numeric(5, 2) NOT NULL,
	"surgeries_in_progress" integer NOT NULL,
	"surgeries_delayed" integer NOT NULL,
	"daily_rev_velocity" numeric(12, 2) NOT NULL,
	"unbilled_risk" numeric(12, 2) NOT NULL,
	"claims_denial_risk_count" integer NOT NULL,
	"stat_lab_pending" integer NOT NULL,
	"stat_rad_pending" integer NOT NULL,
	"critical_blood_alert_count" integer NOT NULL,
	"critical_consumables_risk_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."hospital_surge_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"surge_event_code" varchar(64) NOT NULL,
	"surge_level" varchar(32) NOT NULL,
	"emergency_code_type" varchar(64),
	"location" varchar(255) NOT NULL,
	"justification" text NOT NULL,
	"declared_by" varchar(128) NOT NULL,
	"declared_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"resolved_by" varchar(128),
	"resolved_at" timestamp with time zone,
	"outcome_notes" text
);
--> statement-breakpoint
CREATE TABLE "clinical"."predictive_bed_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"forecast_window" varchar(32) NOT NULL,
	"specialty_name" varchar(128) NOT NULL,
	"current_occupied" integer NOT NULL,
	"capacity_limit" integer NOT NULL,
	"predicted_admissions" integer NOT NULL,
	"predicted_discharges" integer NOT NULL,
	"net_projected_demand" integer NOT NULL,
	"projected_occ_pct" numeric(5, 2) NOT NULL,
	"bottleneck_level" varchar(32) DEFAULT 'LOW' NOT NULL,
	"ai_confidence_pct" numeric(5, 2) DEFAULT '92.50' NOT NULL,
	"recommended_action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."what_if_simulation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"scenario_name" varchar(255) NOT NULL,
	"surge_type" varchar(64) NOT NULL,
	"duration_hours" integer DEFAULT 48 NOT NULL,
	"divert_elective" boolean DEFAULT false NOT NULL,
	"fast_track_discharge" boolean DEFAULT false NOT NULL,
	"sim_occupancy_peak" numeric(5, 2) NOT NULL,
	"sim_icu_deficit" integer NOT NULL,
	"sim_vent_shortage" integer NOT NULL,
	"sim_ed_wait_peak" integer NOT NULL,
	"sim_financial_impact" numeric(12, 2) NOT NULL,
	"ai_recommendations" jsonb NOT NULL,
	"run_by" varchar(128) DEFAULT 'System AI Modeler' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_exat_tenant_branch" ON "clinical"."executive_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_exat_num" ON "clinical"."executive_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_ecs_tenant_branch" ON "clinical"."executive_command_snapshots" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_ecs_timestamp" ON "clinical"."executive_command_snapshots" USING btree ("snapshot_timestamp");--> statement-breakpoint
CREATE INDEX "idx_hse_tenant_branch" ON "clinical"."hospital_surge_events" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_hse_code" ON "clinical"."hospital_surge_events" USING btree ("tenant_id","surge_event_code");--> statement-breakpoint
CREATE INDEX "idx_pbf_tenant_spec" ON "clinical"."predictive_bed_forecasts" USING btree ("tenant_id","specialty_name","forecast_window");--> statement-breakpoint
CREATE INDEX "idx_wisr_tenant_branch" ON "clinical"."what_if_simulation_runs" USING btree ("tenant_id","branch_id");