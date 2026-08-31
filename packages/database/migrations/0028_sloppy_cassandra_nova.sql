CREATE TABLE "clinical"."emergency_ambulance_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"transfer_code" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"ambulance_number" varchar(64) NOT NULL,
	"transport_type" varchar(64) DEFAULT 'INBOUND_RECEIVAL' NOT NULL,
	"sending_facility" varchar(255) NOT NULL,
	"receiving_facility" varchar(255) NOT NULL,
	"accompanying_paramedic" varchar(255) NOT NULL,
	"transfer_reason" text NOT NULL,
	"departure_time" timestamp with time zone DEFAULT now() NOT NULL,
	"arrival_time" timestamp with time zone,
	"status" varchar(64) DEFAULT 'DISPATCHED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_audit_traces" (
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
CREATE TABLE "clinical"."emergency_crash_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cart_code" varchar(64) NOT NULL,
	"location_zone" varchar(255) NOT NULL,
	"seal_number" varchar(64) NOT NULL,
	"is_seal_intact" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_checked_by" varchar(255) NOT NULL,
	"defibrillator_battery_percent" integer DEFAULT 100 NOT NULL,
	"oxygen_cylinder_pressure_psi" integer DEFAULT 2000 NOT NULL,
	"has_expired_items" boolean DEFAULT false NOT NULL,
	"status" varchar(64) DEFAULT 'READY' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_death_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"death_certificate_number" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"is_brought_dead" boolean DEFAULT false NOT NULL,
	"declared_dead_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"declaring_physician" varchar(255) NOT NULL,
	"primary_cause_of_death" text NOT NULL,
	"secondary_causes" text,
	"mortuary_handover_staff" varchar(255) NOT NULL,
	"police_informed" boolean DEFAULT false NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_code" varchar(64) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"total_beds" integer DEFAULT 20 NOT NULL,
	"resuscitation_beds" integer DEFAULT 4 NOT NULL,
	"trauma_beds" integer DEFAULT 4 NOT NULL,
	"observation_beds" integer DEFAULT 8 NOT NULL,
	"head_of_emergency" varchar(255) NOT NULL,
	"is_disaster_mode_active" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_disaster_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"incident_code" varchar(64) NOT NULL,
	"disaster_type" varchar(255) NOT NULL,
	"incident_commander_name" varchar(255) NOT NULL,
	"total_victims_count" integer DEFAULT 0 NOT NULL,
	"critical_victims_count" integer DEFAULT 0 NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deactivated" boolean DEFAULT false NOT NULL,
	"deactivated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_disposition_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"outcome" varchar(64) NOT NULL,
	"authorizing_physician" varchar(255) NOT NULL,
	"destination_ward_or_facility" varchar(255),
	"clinical_summary" text NOT NULL,
	"follow_up_instructions" text,
	"disposition_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_number" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"is_unknown_patient" boolean DEFAULT false NOT NULL,
	"temporary_identifier" varchar(64),
	"patient_gender" varchar(32) DEFAULT 'UNKNOWN' NOT NULL,
	"patient_age" integer,
	"arrival_mode" varchar(64) DEFAULT 'WALK_IN' NOT NULL,
	"brought_by" varchar(255) NOT NULL,
	"referral_source" text,
	"chief_complaint" text NOT NULL,
	"arrival_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"registration_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"current_status" varchar(64) DEFAULT 'ARRIVED' NOT NULL,
	"current_zone_id" uuid,
	"current_zone_name" varchar(255),
	"current_bed_number" varchar(64),
	"assigned_physician_name" varchar(255),
	"assigned_nurse_name" varchar(255),
	"triage_esi_level" varchar(64),
	"is_trauma_alert" boolean DEFAULT false NOT NULL,
	"is_code_blue" boolean DEFAULT false NOT NULL,
	"is_mlc" boolean DEFAULT false NOT NULL,
	"mlc_case_number" varchar(64),
	"disposition_outcome" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_mlc_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"mlc_number" varchar(64) NOT NULL,
	"case_type" varchar(64) NOT NULL,
	"police_station" varchar(255) NOT NULL,
	"police_officer_name" varchar(255) NOT NULL,
	"police_badge_number" varchar(64),
	"fir_number" varchar(64),
	"injury_description" text NOT NULL,
	"evidence_items_collected" text DEFAULT '' NOT NULL,
	"chain_of_custody_custodian" varchar(255) NOT NULL,
	"government_notification_sent" boolean DEFAULT false NOT NULL,
	"registered_by_doctor" varchar(255) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_observation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"observation_bed_number" varchar(64) NOT NULL,
	"admission_reason" text NOT NULL,
	"attending_doctor" varchar(255) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"clinical_progress_summary" text NOT NULL,
	"hours_in_observation" numeric(5, 1) DEFAULT '0.0' NOT NULL,
	"status" varchar(64) DEFAULT 'ACTIVE_MONITORING' NOT NULL,
	"final_decision_notes" text
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_resuscitation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"event_number" varchar(64) NOT NULL,
	"location_bay" varchar(255) NOT NULL,
	"team_leader_name" varchar(255) NOT NULL,
	"initial_rhythm" varchar(64) NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"cpr_duration_minutes" integer DEFAULT 0 NOT NULL,
	"shocks_delivered_count" integer DEFAULT 0 NOT NULL,
	"airway_secured_type" varchar(255) NOT NULL,
	"medications_administered_summary" text DEFAULT '' NOT NULL,
	"rosc_achieved" boolean DEFAULT false NOT NULL,
	"final_outcome" varchar(255) DEFAULT 'IN_PROGRESS' NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_triage_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"triage_nurse_name" varchar(255) NOT NULL,
	"esi_level" varchar(64) NOT NULL,
	"chief_complaint" text NOT NULL,
	"pain_score" integer DEFAULT 0 NOT NULL,
	"systolic_bp" integer NOT NULL,
	"diastolic_bp" integer NOT NULL,
	"pulse_rate" integer NOT NULL,
	"respiratory_rate" integer NOT NULL,
	"temperature_f" numeric(5, 2) NOT NULL,
	"spo2_percentage" numeric(5, 2) NOT NULL,
	"gcs_score" integer DEFAULT 15 NOT NULL,
	"blood_glucose_mg_dl" numeric(6, 2),
	"is_pregnant" boolean,
	"allergies_noted" text NOT NULL,
	"high_risk_indicators" text,
	"sepsis_screen_positive" boolean DEFAULT false NOT NULL,
	"stroke_screen_positive" boolean DEFAULT false NOT NULL,
	"stemi_screen_positive" boolean DEFAULT false NOT NULL,
	"triage_notes" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_triage_reassessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"reassessed_by_nurse" varchar(255) NOT NULL,
	"previous_esi" varchar(64) NOT NULL,
	"new_esi" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"reassessment_vitals_summary" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."emergency_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"zone_code" varchar(64) NOT NULL,
	"zone_name" varchar(255) NOT NULL,
	"zone_type" varchar(64) NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"occupied_count" integer DEFAULT 0 NOT NULL,
	"charge_per_hour" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."trauma_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"activation_number" varchar(64) NOT NULL,
	"activation_level" varchar(64) NOT NULL,
	"mechanism_of_injury" text NOT NULL,
	"time_of_injury" timestamp with time zone NOT NULL,
	"trauma_team_leader" varchar(255) NOT NULL,
	"airway_status" varchar(255) NOT NULL,
	"breathing_status" varchar(255) NOT NULL,
	"circulation_status" varchar(255) NOT NULL,
	"disability_gcs" integer DEFAULT 15 NOT NULL,
	"exposure_findings" text NOT NULL,
	"fast_scan_positive" boolean DEFAULT false NOT NULL,
	"pelvic_binder_applied" boolean DEFAULT false NOT NULL,
	"massive_transfusion_activated" boolean DEFAULT false NOT NULL,
	"specialist_consults_called" text DEFAULT '' NOT NULL,
	"disposition_plan" text DEFAULT '' NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical"."emergency_ambulance_transfers" ADD CONSTRAINT "emergency_ambulance_transfers_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_death_records" ADD CONSTRAINT "emergency_death_records_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_disposition_records" ADD CONSTRAINT "emergency_disposition_records_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_encounters" ADD CONSTRAINT "emergency_encounters_current_zone_id_emergency_zones_id_fk" FOREIGN KEY ("current_zone_id") REFERENCES "clinical"."emergency_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_mlc_cases" ADD CONSTRAINT "emergency_mlc_cases_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_observation_cases" ADD CONSTRAINT "emergency_observation_cases_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_resuscitation_events" ADD CONSTRAINT "emergency_resuscitation_events_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_triage_assessments" ADD CONSTRAINT "emergency_triage_assessments_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_triage_reassessments" ADD CONSTRAINT "emergency_triage_reassessments_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."emergency_zones" ADD CONSTRAINT "emergency_zones_department_id_emergency_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."emergency_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."trauma_activations" ADD CONSTRAINT "trauma_activations_encounter_id_emergency_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."emergency_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_eat_tenant_encounter" ON "clinical"."emergency_ambulance_transfers" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_eat_transfer_code" ON "clinical"."emergency_ambulance_transfers" USING btree ("tenant_id","transfer_code");--> statement-breakpoint
CREATE INDEX "idx_eatr_tenant_branch" ON "clinical"."emergency_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_eatr_trace_num" ON "clinical"."emergency_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_ecc_tenant_branch" ON "clinical"."emergency_crash_carts" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ecc_cart_code" ON "clinical"."emergency_crash_carts" USING btree ("tenant_id","branch_id","cart_code");--> statement-breakpoint
CREATE INDEX "idx_edead_tenant_encounter" ON "clinical"."emergency_death_records" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_edead_cert_number" ON "clinical"."emergency_death_records" USING btree ("tenant_id","death_certificate_number");--> statement-breakpoint
CREATE INDEX "idx_ed_tenant_branch" ON "clinical"."emergency_departments" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ed_code_branch" ON "clinical"."emergency_departments" USING btree ("tenant_id","branch_id","department_code");--> statement-breakpoint
CREATE INDEX "idx_ede_tenant_branch" ON "clinical"."emergency_disaster_events" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ede_code" ON "clinical"."emergency_disaster_events" USING btree ("tenant_id","incident_code");--> statement-breakpoint
CREATE INDEX "idx_edr_tenant_encounter" ON "clinical"."emergency_disposition_records" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE INDEX "idx_ee_tenant_branch" ON "clinical"."emergency_encounters" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_ee_status" ON "clinical"."emergency_encounters" USING btree ("tenant_id","current_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ee_number" ON "clinical"."emergency_encounters" USING btree ("tenant_id","encounter_number");--> statement-breakpoint
CREATE INDEX "idx_emlc_tenant_encounter" ON "clinical"."emergency_mlc_cases" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_emlc_number" ON "clinical"."emergency_mlc_cases" USING btree ("tenant_id","mlc_number");--> statement-breakpoint
CREATE INDEX "idx_eoc_tenant_encounter" ON "clinical"."emergency_observation_cases" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE INDEX "idx_ere_tenant_encounter" ON "clinical"."emergency_resuscitation_events" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ere_event_number" ON "clinical"."emergency_resuscitation_events" USING btree ("tenant_id","event_number");--> statement-breakpoint
CREATE INDEX "idx_eta_tenant_encounter" ON "clinical"."emergency_triage_assessments" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE INDEX "idx_eta_esi" ON "clinical"."emergency_triage_assessments" USING btree ("tenant_id","esi_level");--> statement-breakpoint
CREATE INDEX "idx_etr_tenant_encounter" ON "clinical"."emergency_triage_reassessments" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE INDEX "idx_ez_tenant_dept" ON "clinical"."emergency_zones" USING btree ("tenant_id","department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ez_code" ON "clinical"."emergency_zones" USING btree ("tenant_id","department_id","zone_code");--> statement-breakpoint
CREATE INDEX "idx_ta_tenant_encounter" ON "clinical"."trauma_activations" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ta_activation_number" ON "clinical"."trauma_activations" USING btree ("tenant_id","activation_number");