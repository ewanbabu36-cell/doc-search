CREATE TABLE "clinical"."blood_bank_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(64) NOT NULL,
	"actor_id" varchar(64) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"entity_code" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"ip_address" varchar(64) DEFAULT '127.0.0.1' NOT NULL,
	"integrity_hash" varchar(255) NOT NULL,
	"previous_hash" varchar(255) NOT NULL,
	"new_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"facility_code" varchar(64) NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"license_number" varchar(128) NOT NULL,
	"medical_director_name" varchar(255) NOT NULL,
	"head_technologist_name" varchar(255) NOT NULL,
	"storage_location_name" varchar(255) NOT NULL,
	"total_available_units" integer DEFAULT 0 NOT NULL,
	"quarantine_units" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"donation_id" uuid NOT NULL,
	"component_type" varchar(64) NOT NULL,
	"blood_group" varchar(32) NOT NULL,
	"volume_ml" integer NOT NULL,
	"storage_location" varchar(255) NOT NULL,
	"storage_temperature_target_c" varchar(32) NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"status" varchar(64) DEFAULT 'QUARANTINED' NOT NULL,
	"prepared_by_technician" varchar(255) NOT NULL,
	"released_by_pathologist" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_crossmatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"crossmatch_code" varchar(64) NOT NULL,
	"request_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_blood_group" varchar(32) NOT NULL,
	"donor_blood_group" varchar(32) NOT NULL,
	"major_crossmatch_result" varchar(32) NOT NULL,
	"minor_crossmatch_result" varchar(32) NOT NULL,
	"coombs_test_result" varchar(32) DEFAULT 'NEGATIVE' NOT NULL,
	"overall_result" varchar(64) DEFAULT 'COMPATIBLE' NOT NULL,
	"testing_technician_name" varchar(255) NOT NULL,
	"verified_by_pathologist" varchar(255) NOT NULL,
	"crossmatched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_discard_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"discard_code" varchar(64) NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"component_type" varchar(64) NOT NULL,
	"blood_group" varchar(32) NOT NULL,
	"reason" varchar(64) NOT NULL,
	"authorized_by_pathologist" varchar(255) NOT NULL,
	"disposal_method" varchar(255) NOT NULL,
	"discarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"donation_number" varchar(64) NOT NULL,
	"donor_id" uuid NOT NULL,
	"donor_name" varchar(255) NOT NULL,
	"blood_group" varchar(32) NOT NULL,
	"donation_type" varchar(64) NOT NULL,
	"collected_volume_ml" integer DEFAULT 450 NOT NULL,
	"anticoagulant_type" varchar(64) DEFAULT 'CPDA-1' NOT NULL,
	"phlebotomist_name" varchar(255) NOT NULL,
	"collection_location" varchar(255) NOT NULL,
	"unit_status" varchar(64) DEFAULT 'QUARANTINED' NOT NULL,
	"bag_barcode" varchar(128) NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_donor_screenings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"screening_code" varchar(64) NOT NULL,
	"donor_id" uuid NOT NULL,
	"donor_name" varchar(255) NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"hemoglobin_gdl" numeric(4, 1) NOT NULL,
	"systolic_bp" integer NOT NULL,
	"diastolic_bp" integer NOT NULL,
	"pulse_bpm" integer NOT NULL,
	"temperature_f" numeric(4, 1) NOT NULL,
	"medical_history_cleared" boolean DEFAULT true NOT NULL,
	"screening_nurse_name" varchar(255) NOT NULL,
	"eligibility_decision" varchar(64) NOT NULL,
	"remarks" text,
	"screened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_donors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"donor_code" varchar(64) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"gender" varchar(32) NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"blood_group" varchar(32) NOT NULL,
	"contact_number" varchar(64) NOT NULL,
	"email" varchar(255),
	"donor_type" varchar(64) DEFAULT 'VOLUNTARY_NON_REMUNERATED' NOT NULL,
	"eligibility_status" varchar(64) DEFAULT 'ELIGIBLE_FOR_DONATION' NOT NULL,
	"deferral_reason" text,
	"deferral_end_date" timestamp with time zone,
	"total_donations_count" integer DEFAULT 0 NOT NULL,
	"last_donation_date" timestamp with time zone,
	"next_eligible_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"issue_code" varchar(64) NOT NULL,
	"request_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"destination_department" varchar(255) NOT NULL,
	"issuing_technician_name" varchar(255) NOT NULL,
	"receiving_nurse_name" varchar(255) NOT NULL,
	"transport_box_temperature_c" varchar(32) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_quality_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"qc_code" varchar(64) NOT NULL,
	"equipment_name" varchar(255) NOT NULL,
	"check_type" varchar(64) NOT NULL,
	"parameter_measured" varchar(255) NOT NULL,
	"expected_standard" varchar(255) NOT NULL,
	"actual_reading" varchar(255) NOT NULL,
	"is_passed" boolean DEFAULT true NOT NULL,
	"technician_name" varchar(255) NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_code" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"encounter_id" uuid NOT NULL,
	"requesting_department" varchar(255) NOT NULL,
	"ordering_physician_name" varchar(255) NOT NULL,
	"requested_component_type" varchar(64) NOT NULL,
	"patient_blood_group" varchar(32) NOT NULL,
	"quantity_units" integer DEFAULT 1 NOT NULL,
	"urgency" varchar(64) DEFAULT 'ROUTINE_SCHEDULED_OT' NOT NULL,
	"clinical_indication" text NOT NULL,
	"required_by_timestamp" timestamp with time zone NOT NULL,
	"status" varchar(64) DEFAULT 'PENDING_CROSSMATCH' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_temperature_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"unit_location" varchar(255) NOT NULL,
	"storage_unit_type" varchar(64) NOT NULL,
	"recorded_temperature_c" numeric(4, 1) NOT NULL,
	"target_min_c" numeric(4, 1) NOT NULL,
	"target_max_c" numeric(4, 1) NOT NULL,
	"is_excursion" boolean DEFAULT false NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."blood_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"test_code" varchar(64) NOT NULL,
	"donation_id" uuid NOT NULL,
	"unit_barcode" varchar(128) NOT NULL,
	"abo_grouping_result" varchar(32) NOT NULL,
	"rh_factor_result" varchar(32) NOT NULL,
	"antibody_screen" varchar(64) DEFAULT 'NEGATIVE' NOT NULL,
	"hiv_result" varchar(32) DEFAULT 'NON_REACTIVE' NOT NULL,
	"hbsag_result" varchar(32) DEFAULT 'NON_REACTIVE' NOT NULL,
	"hcv_result" varchar(32) DEFAULT 'NON_REACTIVE' NOT NULL,
	"syphilis_vdrl_result" varchar(32) DEFAULT 'NON_REACTIVE' NOT NULL,
	"malaria_result" varchar(32) DEFAULT 'NEGATIVE' NOT NULL,
	"testing_technician_name" varchar(255) NOT NULL,
	"pathologist_sign_off_name" varchar(255) NOT NULL,
	"is_passed_for_release" boolean DEFAULT false NOT NULL,
	"tested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."transfusion_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"reaction_report_code" varchar(64) NOT NULL,
	"transfusion_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"severity" varchar(64) NOT NULL,
	"symptoms_observed" text NOT NULL,
	"immediate_interventions" text NOT NULL,
	"notified_physician_name" varchar(255) NOT NULL,
	"clerical_check_confirmed_matching" boolean DEFAULT true NOT NULL,
	"post_reaction_urine_hemoglobin" varchar(64),
	"direct_antiglobulin_test_dat" varchar(64),
	"investigation_outcome" text,
	"status" varchar(64) DEFAULT 'REPORTED' NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."transfusion_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transfusion_code" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"encounter_id" uuid NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"component_type" varchar(64) NOT NULL,
	"blood_group" varchar(32) NOT NULL,
	"administered_by_nurse" varchar(255) NOT NULL,
	"supervising_doctor_name" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"pre_transfusion_pulse" integer NOT NULL,
	"pre_transfusion_bp" varchar(32) NOT NULL,
	"pre_transfusion_temp_f" numeric(4, 1) NOT NULL,
	"post_transfusion_pulse" integer,
	"post_transfusion_bp" varchar(32),
	"post_transfusion_temp_f" numeric(4, 1),
	"adverse_reaction_noted" boolean DEFAULT false NOT NULL,
	"status" varchar(64) DEFAULT 'IN_PROGRESS' NOT NULL,
	"outcome_notes" text
);
--> statement-breakpoint
ALTER TABLE "clinical"."blood_components" ADD CONSTRAINT "blood_components_donation_id_blood_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "clinical"."blood_donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_crossmatches" ADD CONSTRAINT "blood_crossmatches_request_id_blood_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "clinical"."blood_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_crossmatches" ADD CONSTRAINT "blood_crossmatches_component_id_blood_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "clinical"."blood_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_donations" ADD CONSTRAINT "blood_donations_donor_id_blood_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "clinical"."blood_donors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_donor_screenings" ADD CONSTRAINT "blood_donor_screenings_donor_id_blood_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "clinical"."blood_donors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_issues" ADD CONSTRAINT "blood_issues_request_id_blood_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "clinical"."blood_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_issues" ADD CONSTRAINT "blood_issues_component_id_blood_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "clinical"."blood_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."blood_tests" ADD CONSTRAINT "blood_tests_donation_id_blood_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "clinical"."blood_donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."transfusion_reactions" ADD CONSTRAINT "transfusion_reactions_transfusion_id_transfusion_records_id_fk" FOREIGN KEY ("transfusion_id") REFERENCES "clinical"."transfusion_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bbae_tenant_branch" ON "clinical"."blood_bank_audit_events" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bbae_trace_num" ON "clinical"."blood_bank_audit_events" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_bb_tenant_branch" ON "clinical"."blood_banks" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bb_code_branch" ON "clinical"."blood_banks" USING btree ("tenant_id","branch_id","facility_code");--> statement-breakpoint
CREATE INDEX "idx_bc_tenant_donation" ON "clinical"."blood_components" USING btree ("tenant_id","donation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bc_code" ON "clinical"."blood_components" USING btree ("tenant_id","component_code");--> statement-breakpoint
CREATE INDEX "idx_bxm_tenant_request" ON "clinical"."blood_crossmatches" USING btree ("tenant_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bxm_code" ON "clinical"."blood_crossmatches" USING btree ("tenant_id","crossmatch_code");--> statement-breakpoint
CREATE INDEX "idx_bdr_tenant_branch" ON "clinical"."blood_discard_records" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bdr_code" ON "clinical"."blood_discard_records" USING btree ("tenant_id","discard_code");--> statement-breakpoint
CREATE INDEX "idx_bdn_tenant_donor" ON "clinical"."blood_donations" USING btree ("tenant_id","donor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bdn_number" ON "clinical"."blood_donations" USING btree ("tenant_id","donation_number");--> statement-breakpoint
CREATE INDEX "idx_bds_tenant_donor" ON "clinical"."blood_donor_screenings" USING btree ("tenant_id","donor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bds_code" ON "clinical"."blood_donor_screenings" USING btree ("tenant_id","screening_code");--> statement-breakpoint
CREATE INDEX "idx_bd_tenant_branch" ON "clinical"."blood_donors" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bd_code" ON "clinical"."blood_donors" USING btree ("tenant_id","donor_code");--> statement-breakpoint
CREATE INDEX "idx_bi_tenant_request" ON "clinical"."blood_issues" USING btree ("tenant_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bi_code" ON "clinical"."blood_issues" USING btree ("tenant_id","issue_code");--> statement-breakpoint
CREATE INDEX "idx_bqc_tenant_branch" ON "clinical"."blood_quality_checks" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bqc_code" ON "clinical"."blood_quality_checks" USING btree ("tenant_id","qc_code");--> statement-breakpoint
CREATE INDEX "idx_br_tenant_patient" ON "clinical"."blood_requests" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_br_code" ON "clinical"."blood_requests" USING btree ("tenant_id","request_code");--> statement-breakpoint
CREATE INDEX "idx_btl_tenant_location" ON "clinical"."blood_temperature_logs" USING btree ("tenant_id","unit_location");--> statement-breakpoint
CREATE INDEX "idx_bt_tenant_donation" ON "clinical"."blood_tests" USING btree ("tenant_id","donation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bt_code" ON "clinical"."blood_tests" USING btree ("tenant_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_trx_tenant_transfusion" ON "clinical"."transfusion_reactions" USING btree ("tenant_id","transfusion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_trx_code" ON "clinical"."transfusion_reactions" USING btree ("tenant_id","reaction_report_code");--> statement-breakpoint
CREATE INDEX "idx_tr_tenant_encounter" ON "clinical"."transfusion_records" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tr_code" ON "clinical"."transfusion_records" USING btree ("tenant_id","transfusion_code");