CREATE TABLE "clinical"."biomedical_waste_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"log_date" varchar(32) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"yellow_kg" numeric(6, 2) NOT NULL,
	"red_kg" numeric(6, 2) NOT NULL,
	"white_kg" numeric(6, 2) NOT NULL,
	"blue_kg" numeric(6, 2) NOT NULL,
	"total_kg" numeric(6, 2) NOT NULL,
	"pcb_manifest_barcode" varchar(64) NOT NULL,
	"handed_over_vendor" varchar(255) NOT NULL,
	"hospital_supervisor" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."environmental_micro_swabs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"sample_number" varchar(64) NOT NULL,
	"sample_type" varchar(64) NOT NULL,
	"location_description" varchar(255) NOT NULL,
	"collection_date" varchar(32) NOT NULL,
	"collected_by" varchar(128) NOT NULL,
	"cfu_count" integer NOT NULL,
	"pathogens_found" varchar(255) NOT NULL,
	"permissible_threshold" varchar(128) NOT NULL,
	"result_status" varchar(32) DEFAULT 'SATISFACTORY_PASS' NOT NULL,
	"corrective_fogging_done" boolean DEFAULT false NOT NULL,
	"microbiologist_sign_off" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."hai_device_day_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"month_year" varchar(16) NOT NULL,
	"central_line_days" integer DEFAULT 0 NOT NULL,
	"clabsi_count" integer DEFAULT 0 NOT NULL,
	"clabsi_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"urinary_catheter_days" integer DEFAULT 0 NOT NULL,
	"cauti_count" integer DEFAULT 0 NOT NULL,
	"cauti_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"ventilator_days" integer DEFAULT 0 NOT NULL,
	"vap_count" integer DEFAULT 0 NOT NULL,
	"vap_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"surgical_procedures_count" integer DEFAULT 0 NOT NULL,
	"ssi_count" integer DEFAULT 0 NOT NULL,
	"ssi_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."hai_surveillance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"surveillance_code" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"hai_type" varchar(32) NOT NULL,
	"diagnosis_date" varchar(32) NOT NULL,
	"pathogen_isolated" varchar(255) NOT NULL,
	"antibiotic_sensitivity" text NOT NULL,
	"invasive_device_name" varchar(255) NOT NULL,
	"device_insertion_date" varchar(32) NOT NULL,
	"device_days_at_infection" integer NOT NULL,
	"hic_intervention_taken" text NOT NULL,
	"outcome_status" varchar(32) DEFAULT 'ONGOING_TREATMENT' NOT NULL,
	"reported_to_icc" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."hand_hygiene_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"audit_code" varchar(64) NOT NULL,
	"audit_date" varchar(32) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"staff_category" varchar(32) NOT NULL,
	"who_moment" varchar(64) NOT NULL,
	"action_taken" varchar(32) NOT NULL,
	"is_compliant" boolean DEFAULT true NOT NULL,
	"audited_by_officer" varchar(128) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."hospital_incident_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"incident_number" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"sac_score" varchar(32) DEFAULT 'SAC_3_MODERATE' NOT NULL,
	"status" varchar(32) DEFAULT 'REPORTED' NOT NULL,
	"patient_involved" boolean DEFAULT false NOT NULL,
	"patient_mrn" varchar(64),
	"patient_name" varchar(255),
	"department_name" varchar(128) NOT NULL,
	"location_detail" varchar(255) NOT NULL,
	"incident_date_time" timestamp with time zone NOT NULL,
	"reported_by_staff" varchar(128) NOT NULL,
	"reported_by_role" varchar(64) NOT NULL,
	"brief_summary" varchar(512) NOT NULL,
	"detailed_description" text NOT NULL,
	"immediate_action_taken" text NOT NULL,
	"patient_harm_level" varchar(64) DEFAULT 'NO_HARM_NEAR_MISS' NOT NULL,
	"is_sentinel_event" boolean DEFAULT false NOT NULL,
	"investigating_quality_officer" varchar(128),
	"rca_required" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."incident_rca_investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"rca_code" varchar(64) NOT NULL,
	"incident_id" uuid NOT NULL,
	"incident_number" varchar(64) NOT NULL,
	"lead_investigator" varchar(128) NOT NULL,
	"investigation_team" jsonb NOT NULL,
	"five_whys_analysis" jsonb NOT NULL,
	"fishbone_categories" jsonb NOT NULL,
	"root_cause_statement" text NOT NULL,
	"contributing_factors" text NOT NULL,
	"status" varchar(32) DEFAULT 'IN_PROGRESS' NOT NULL,
	"completed_date" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."needle_stick_occupational_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"incident_code" varchar(64) NOT NULL,
	"exposed_staff_name" varchar(128) NOT NULL,
	"staff_role" varchar(64) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"exposure_date_time" timestamp with time zone NOT NULL,
	"source_patient_known" boolean DEFAULT true NOT NULL,
	"source_hiv_status" varchar(32) DEFAULT 'UNKNOWN' NOT NULL,
	"source_hbsag_status" varchar(32) DEFAULT 'UNKNOWN' NOT NULL,
	"source_hcv_status" varchar(32) DEFAULT 'UNKNOWN' NOT NULL,
	"pep_initiated_golden_hour" boolean DEFAULT true NOT NULL,
	"pep_regimen_details" text NOT NULL,
	"follow_up_serology_due" varchar(32) NOT NULL,
	"counselor_name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_isolation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"isolation_code" varchar(64) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"precaution_type" varchar(32) NOT NULL,
	"indicated_reason" varchar(255) NOT NULL,
	"start_date" varchar(32) NOT NULL,
	"end_date" varchar(32),
	"assigned_nurse_lead" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."quality_accreditation_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"chapter" varchar(64) NOT NULL,
	"standard_code" varchar(32) NOT NULL,
	"standard_title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"measurable_elements_count" integer DEFAULT 5 NOT NULL,
	"compliance_score_pct" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"status" varchar(32) DEFAULT 'FULLY_COMPLIANT' NOT NULL,
	"assigned_lead" varchar(128) NOT NULL,
	"last_audit_date" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."quality_audit_traces" (
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
CREATE TABLE "clinical"."quality_capa_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"capa_code" varchar(64) NOT NULL,
	"incident_id" uuid,
	"incident_number" varchar(64),
	"title" varchar(255) NOT NULL,
	"action_description" text NOT NULL,
	"action_type" varchar(32) DEFAULT 'CORRECTIVE' NOT NULL,
	"assigned_owner" varchar(128) NOT NULL,
	"target_completion_date" varchar(32) NOT NULL,
	"verification_metric" text NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"completed_date" varchar(32),
	"verified_by" varchar(128),
	"verified_date" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."quality_procurement_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"requisition_ref_number" varchar(64) NOT NULL,
	"item_description" varchar(255) NOT NULL,
	"quantity_requested" integer NOT NULL,
	"urgency" varchar(32) DEFAULT 'ROUTINE' NOT NULL,
	"requested_by" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."incident_rca_investigations" ADD CONSTRAINT "incident_rca_investigations_incident_id_hospital_incident_reports_id_fk" FOREIGN KEY ("incident_id") REFERENCES "clinical"."hospital_incident_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bmwl_tenant_date" ON "clinical"."biomedical_waste_logs" USING btree ("tenant_id","log_date");--> statement-breakpoint
CREATE INDEX "idx_ems_tenant_sample" ON "clinical"."environmental_micro_swabs" USING btree ("tenant_id","sample_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ems_num" ON "clinical"."environmental_micro_swabs" USING btree ("tenant_id","sample_number");--> statement-breakpoint
CREATE INDEX "idx_hddl_tenant_dept" ON "clinical"."hai_device_day_logs" USING btree ("tenant_id","department_name","month_year");--> statement-breakpoint
CREATE INDEX "idx_hsr_tenant_patient" ON "clinical"."hai_surveillance_records" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_hsr_code" ON "clinical"."hai_surveillance_records" USING btree ("tenant_id","surveillance_code");--> statement-breakpoint
CREATE INDEX "idx_hha_tenant_dept" ON "clinical"."hand_hygiene_audits" USING btree ("tenant_id","department_name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_hha_code" ON "clinical"."hand_hygiene_audits" USING btree ("tenant_id","audit_code");--> statement-breakpoint
CREATE INDEX "idx_hir_tenant_branch" ON "clinical"."hospital_incident_reports" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_hir_num" ON "clinical"."hospital_incident_reports" USING btree ("tenant_id","incident_number");--> statement-breakpoint
CREATE INDEX "idx_iri_tenant_inc" ON "clinical"."incident_rca_investigations" USING btree ("tenant_id","incident_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_iri_code" ON "clinical"."incident_rca_investigations" USING btree ("tenant_id","rca_code");--> statement-breakpoint
CREATE INDEX "idx_nsol_tenant_branch" ON "clinical"."needle_stick_occupational_logs" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_nsol_code" ON "clinical"."needle_stick_occupational_logs" USING btree ("tenant_id","incident_code");--> statement-breakpoint
CREATE INDEX "idx_pir_tenant_mrn" ON "clinical"."patient_isolation_records" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pir_code" ON "clinical"."patient_isolation_records" USING btree ("tenant_id","isolation_code");--> statement-breakpoint
CREATE INDEX "idx_qas_tenant_branch" ON "clinical"."quality_accreditation_standards" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_qas_code" ON "clinical"."quality_accreditation_standards" USING btree ("tenant_id","standard_code");--> statement-breakpoint
CREATE INDEX "idx_quat_tenant_branch" ON "clinical"."quality_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quat_num" ON "clinical"."quality_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_qca_tenant_branch" ON "clinical"."quality_capa_actions" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_qca_code" ON "clinical"."quality_capa_actions" USING btree ("tenant_id","capa_code");--> statement-breakpoint
CREATE INDEX "idx_qpr_tenant_branch" ON "clinical"."quality_procurement_references" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_qpr_num" ON "clinical"."quality_procurement_references" USING btree ("tenant_id","requisition_ref_number");