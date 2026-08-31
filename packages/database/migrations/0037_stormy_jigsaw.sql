CREATE TABLE "clinical"."ambient_ai_scribe_transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"doctor_name" varchar(128) NOT NULL,
	"specialty_name" varchar(128) NOT NULL,
	"encounter_ts" timestamp with time zone DEFAULT now() NOT NULL,
	"audio_duration_sec" integer DEFAULT 180 NOT NULL,
	"raw_transcript" text NOT NULL,
	"soap_note" jsonb NOT NULL,
	"suggested_icd10" jsonb NOT NULL,
	"suggested_prescriptions" jsonb NOT NULL,
	"review_status" varchar(32) DEFAULT 'AI_DRAFTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."cdss_audit_traces" (
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
CREATE TABLE "clinical"."critical_panic_value_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"test_name" varchar(128) NOT NULL,
	"measured_value" varchar(64) NOT NULL,
	"normal_range" varchar(64) NOT NULL,
	"panic_threshold" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"urgency_level" varchar(64) NOT NULL,
	"clinical_risk_summary" text NOT NULL,
	"communicated_to_doc" boolean DEFAULT true NOT NULL,
	"doctor_name" varchar(128) NOT NULL,
	"alert_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"ack_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ddi_drug_interaction_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"drug_a" varchar(255) NOT NULL,
	"drug_b" varchar(255) NOT NULL,
	"severity_level" varchar(64) NOT NULL,
	"clinical_consequence" text NOT NULL,
	"mechanism" text NOT NULL,
	"recommended_management" text NOT NULL,
	"evidence_ref" varchar(255) NOT NULL,
	"was_overridden" boolean DEFAULT false NOT NULL,
	"override_justification" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."sepsis_news2_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"bed_number" varchar(64) NOT NULL,
	"ward_name" varchar(128) NOT NULL,
	"news2_score" integer NOT NULL,
	"qsofa_score" integer NOT NULL,
	"risk_grade" varchar(64) NOT NULL,
	"respiratory_rate" integer NOT NULL,
	"spo2_pct" integer NOT NULL,
	"req_supp_o2" boolean DEFAULT false NOT NULL,
	"systolic_bp" integer NOT NULL,
	"pulse_rate" integer NOT NULL,
	"temperature_c" numeric(4, 1) NOT NULL,
	"consciousness_level" varchar(32) DEFAULT 'ALERT' NOT NULL,
	"serum_lactate" numeric(4, 2),
	"bundle_checklist" jsonb NOT NULL,
	"alert_status" varchar(32) DEFAULT 'TRIGGERED_ACTIVE' NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_by" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_aast_tenant_patient" ON "clinical"."ambient_ai_scribe_transcripts" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_cdsstr_tenant_branch" ON "clinical"."cdss_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cdsstr_num" ON "clinical"."cdss_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_cpva_tenant_patient" ON "clinical"."critical_panic_value_alerts" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_ddi_tenant_patient" ON "clinical"."ddi_drug_interaction_checks" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_sna_tenant_patient" ON "clinical"."sepsis_news2_alerts" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_sna_triggered" ON "clinical"."sepsis_news2_alerts" USING btree ("triggered_at");