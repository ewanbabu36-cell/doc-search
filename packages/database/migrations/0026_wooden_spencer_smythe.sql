CREATE TABLE "clinical"."inpatient_admission_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"approver_id" uuid,
	"approver_name" varchar(255) NOT NULL,
	"approver_role" varchar(100) NOT NULL,
	"decision" varchar(50) NOT NULL,
	"allocated_ward_id" uuid,
	"allocated_bed_id" uuid,
	"justification" text NOT NULL,
	"decision_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_admission_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_number" varchar(100) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"encounter_id" uuid,
	"referring_doctor_name" varchar(255) NOT NULL,
	"admitting_doctor_name" varchar(255) NOT NULL,
	"department" varchar(100) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"requested_ward_type" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"requested_bed_class" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"admission_source" varchar(50) DEFAULT 'OPD' NOT NULL,
	"priority" varchar(30) DEFAULT 'ROUTINE' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"provisional_diagnosis" text NOT NULL,
	"admission_reason" text NOT NULL,
	"expected_length_of_stay_days" integer DEFAULT 3 NOT NULL,
	"insurance_pre_auth_ref" varchar(100),
	"status" varchar(50) DEFAULT 'SUBMITTED' NOT NULL,
	"decision_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_admissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_number" varchar(100) NOT NULL,
	"admission_request_id" uuid,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"patient_gender" varchar(20) NOT NULL,
	"patient_age" integer NOT NULL,
	"encounter_id" uuid,
	"admitting_doctor_name" varchar(255) NOT NULL,
	"attending_consultant_name" varchar(255) NOT NULL,
	"department" varchar(100) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"ward_id" uuid NOT NULL,
	"ward_name" varchar(255) NOT NULL,
	"bed_id" uuid NOT NULL,
	"bed_code" varchar(50) NOT NULL,
	"admission_type" varchar(50) DEFAULT 'ELECTIVE' NOT NULL,
	"admission_source" varchar(50) DEFAULT 'OPD' NOT NULL,
	"admission_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_discharge_date" timestamp with time zone NOT NULL,
	"actual_discharge_date_time" timestamp with time zone,
	"primary_diagnosis" text NOT NULL,
	"secondary_diagnosis" text,
	"isolation_required" boolean DEFAULT false NOT NULL,
	"payer_type" varchar(50) DEFAULT 'SELF_PAY' NOT NULL,
	"payer_name" varchar(255),
	"insurance_claim_number" varchar(100),
	"financial_deposit_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'ADMITTED' NOT NULL,
	"discharge_disposition" varchar(50),
	"discharge_summary_finalized" boolean DEFAULT false NOT NULL,
	"billing_cleared" boolean DEFAULT false NOT NULL,
	"insurance_cleared" boolean DEFAULT false NOT NULL,
	"clinical_clearance" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_code" varchar(100) NOT NULL,
	"patient_id" uuid,
	"patient_mrn" varchar(100),
	"previous_state" jsonb,
	"new_state" jsonb NOT NULL,
	"justification" text NOT NULL,
	"ip_address" varchar(50) DEFAULT '127.0.0.1' NOT NULL,
	"integrity_hash" varchar(255) NOT NULL,
	"previous_hash" varchar(255) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_bed_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"ward_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"allocated_from" timestamp with time zone DEFAULT now() NOT NULL,
	"allocated_to" timestamp with time zone,
	"status" varchar(50) DEFAULT 'OCCUPIED' NOT NULL,
	"allocation_type" varchar(50) DEFAULT 'ADMISSION' NOT NULL,
	"allocated_by" varchar(255) NOT NULL,
	"released_by" varchar(255),
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_bed_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"block_number" varchar(100) NOT NULL,
	"bed_id" uuid NOT NULL,
	"bed_code" varchar(50) NOT NULL,
	"ward_id" uuid NOT NULL,
	"block_reason" varchar(50) NOT NULL,
	"blocked_from" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"authorized_by" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE_BLOCKED' NOT NULL,
	"unblocked_at" timestamp with time zone,
	"unblocked_by" varchar(255),
	"justification_notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_bed_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"reservation_number" varchar(100) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"ward_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"admission_request_id" uuid,
	"reserved_from" timestamp with time zone NOT NULL,
	"reserved_until" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'CONFIRMED' NOT NULL,
	"priority" varchar(30) DEFAULT 'ROUTINE' NOT NULL,
	"reserved_by" varchar(255) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_bed_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"previous_status" varchar(50) NOT NULL,
	"new_status" varchar(50) NOT NULL,
	"patient_id" uuid,
	"admission_id" uuid,
	"changed_by" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_bed_turnaround" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"turnaround_number" varchar(100) NOT NULL,
	"bed_id" uuid NOT NULL,
	"bed_code" varchar(50) NOT NULL,
	"ward_id" uuid NOT NULL,
	"vacated_by_patient_id" uuid,
	"cleaning_type" varchar(50) DEFAULT 'TERMINAL_DISCHARGE_DISINFECTION' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_housekeeper" varchar(255),
	"cleaning_started_at" timestamp with time zone,
	"cleaning_completed_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'PENDING_CLEANING' NOT NULL,
	"environmental_inspection_passed" boolean DEFAULT false NOT NULL,
	"inspected_by" varchar(255),
	"turnaround_duration_minutes" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_beds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"ward_id" uuid NOT NULL,
	"room_id" uuid,
	"bed_code" varchar(50) NOT NULL,
	"bed_number" varchar(50) NOT NULL,
	"bed_type" varchar(50) DEFAULT 'STANDARD_ELECTRIC' NOT NULL,
	"bed_class" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"gender_eligibility" varchar(30) DEFAULT 'ALL' NOT NULL,
	"has_oxygen_port" boolean DEFAULT true NOT NULL,
	"has_suction_port" boolean DEFAULT true NOT NULL,
	"has_ventilator" boolean DEFAULT false NOT NULL,
	"has_cardiac_monitor" boolean DEFAULT false NOT NULL,
	"daily_charge_rate" numeric(12, 2) DEFAULT '150.00' NOT NULL,
	"current_patient_id" uuid,
	"current_admission_id" uuid,
	"last_cleaned_at" timestamp with time zone,
	"last_occupied_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_care_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"nursing_diagnosis" varchar(255) NOT NULL,
	"expected_outcome" text NOT NULL,
	"interventions" text NOT NULL,
	"target_evaluation_date" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_care_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"staff_id" uuid,
	"staff_name" varchar(255) NOT NULL,
	"role" varchar(100) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_from" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_to" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_discharge_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"target_discharge_date" timestamp with time zone NOT NULL,
	"readiness_status" varchar(50) DEFAULT 'PLANNING' NOT NULL,
	"is_medication_reconciled" boolean DEFAULT false NOT NULL,
	"is_nursing_care_handover_done" boolean DEFAULT false NOT NULL,
	"is_billing_cleared" boolean DEFAULT false NOT NULL,
	"is_insurance_pre_approved" boolean DEFAULT false NOT NULL,
	"is_discharge_summary_finalized" boolean DEFAULT false NOT NULL,
	"transport_arrangement" varchar(50) DEFAULT 'SELF_TRANSPORT' NOT NULL,
	"patient_education_summary" text,
	"follow_up_instructions" text,
	"coordinator_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_discharge_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_number" varchar(100) NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"requesting_doctor_name" varchar(255) NOT NULL,
	"discharge_type" varchar(50) DEFAULT 'ROUTINE_HOME' NOT NULL,
	"condition_at_discharge" varchar(50) DEFAULT 'STABLE_IMPROVED' NOT NULL,
	"clinical_clearance" boolean DEFAULT false NOT NULL,
	"clinical_clearance_doctor" varchar(255),
	"financial_clearance" boolean DEFAULT false NOT NULL,
	"financial_clearance_officer" varchar(255),
	"insurance_clearance" boolean DEFAULT false NOT NULL,
	"insurance_clearance_ref" varchar(100),
	"pharmacy_med_discharged" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING_CLEARANCE' NOT NULL,
	"discharge_authorized_by" varchar(255),
	"authorized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_discharge_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"summary_number" varchar(100) NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"admission_date" timestamp with time zone NOT NULL,
	"discharge_date" timestamp with time zone NOT NULL,
	"attending_consultant_name" varchar(255) NOT NULL,
	"final_primary_diagnosis" text NOT NULL,
	"final_secondary_diagnosis" text,
	"surgical_procedures_performed" text,
	"hospital_course_summary" text NOT NULL,
	"key_investigation_findings" text,
	"treatment_given" text NOT NULL,
	"discharge_medication_advice" text NOT NULL,
	"diet_and_activity_advice" text NOT NULL,
	"warning_signs_to_seek_immediate_care" text NOT NULL,
	"follow_up_appointment_date" timestamp with time zone,
	"follow_up_doctor_name" varchar(255),
	"is_finalized" boolean DEFAULT false NOT NULL,
	"finalized_by" varchar(255),
	"finalized_at" timestamp with time zone,
	"version_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_doctor_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_name" varchar(255) NOT NULL,
	"doctor_specialty" varchar(100) NOT NULL,
	"round_type" varchar(50) DEFAULT 'MORNING_PRIMARY_ROUND' NOT NULL,
	"subjective_assessment" text NOT NULL,
	"objective_clinical_findings" text NOT NULL,
	"clinical_impression" text NOT NULL,
	"treatment_plan_updates" text NOT NULL,
	"ordered_investigations_summary" text,
	"medication_adjustments" text,
	"discharge_readiness_score" integer DEFAULT 50 NOT NULL,
	"expected_discharge_review_date" timestamp with time zone,
	"round_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_intake_output" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"recorded_by" varchar(255) NOT NULL,
	"shift" varchar(50) DEFAULT 'DAY' NOT NULL,
	"intake_oral_ml" integer DEFAULT 0 NOT NULL,
	"intake_iv_fluid_ml" integer DEFAULT 0 NOT NULL,
	"intake_tube_feeding_ml" integer DEFAULT 0 NOT NULL,
	"intake_blood_product_ml" integer DEFAULT 0 NOT NULL,
	"total_intake_ml" integer DEFAULT 0 NOT NULL,
	"output_urine_ml" integer DEFAULT 0 NOT NULL,
	"output_drain_ml" integer DEFAULT 0 NOT NULL,
	"output_vomitus_ml" integer DEFAULT 0 NOT NULL,
	"output_stool_ml" integer DEFAULT 0 NOT NULL,
	"total_output_ml" integer DEFAULT 0 NOT NULL,
	"net_fluid_balance_ml" integer DEFAULT 0 NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_nursing_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"assessed_by" varchar(255) NOT NULL,
	"shift_type" varchar(50) DEFAULT 'MORNING_SHIFT' NOT NULL,
	"assessment_type" varchar(50) DEFAULT 'INITIAL_ADMISSION' NOT NULL,
	"fall_risk_score" integer DEFAULT 0 NOT NULL,
	"fall_risk_level" varchar(30) DEFAULT 'LOW' NOT NULL,
	"pressure_injury_risk_score" integer DEFAULT 20 NOT NULL,
	"pressure_injury_risk_level" varchar(30) DEFAULT 'LOW' NOT NULL,
	"pain_score" integer DEFAULT 0 NOT NULL,
	"consciousness_level" varchar(50) DEFAULT 'ALERT' NOT NULL,
	"mobility_status" varchar(50) DEFAULT 'INDEPENDENT' NOT NULL,
	"dietary_intake_level" varchar(50) DEFAULT 'NORMAL_ORAL' NOT NULL,
	"nursing_summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_nursing_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"note_type" varchar(50) DEFAULT 'PROGRESS_NOTE' NOT NULL,
	"shift" varchar(50) DEFAULT 'DAY' NOT NULL,
	"is_critical_flag" boolean DEFAULT false NOT NULL,
	"note_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_patient_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"ward_id" uuid NOT NULL,
	"ward_name" varchar(255) NOT NULL,
	"bed_id" uuid NOT NULL,
	"bed_code" varchar(50) NOT NULL,
	"room_number" varchar(50),
	"location_start" timestamp with time zone DEFAULT now() NOT NULL,
	"location_end" timestamp with time zone,
	"movement_type" varchar(50) DEFAULT 'ADMISSION_ENTRY' NOT NULL,
	"transferred_by" varchar(255) NOT NULL,
	"clinical_justification" text
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"ward_id" uuid NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"room_class" varchar(50) DEFAULT 'STANDARD' NOT NULL,
	"bed_count" integer DEFAULT 1 NOT NULL,
	"is_negative_pressure" boolean DEFAULT false NOT NULL,
	"has_attached_bath" boolean DEFAULT true NOT NULL,
	"has_medical_gas" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_transfer_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transfer_id" uuid NOT NULL,
	"approver_name" varchar(255) NOT NULL,
	"approver_role" varchar(100) NOT NULL,
	"decision" varchar(50) NOT NULL,
	"assigned_bed_id" uuid,
	"justification" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transfer_number" varchar(100) NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"source_ward_id" uuid NOT NULL,
	"source_ward_name" varchar(255) NOT NULL,
	"source_bed_id" uuid NOT NULL,
	"source_bed_code" varchar(50) NOT NULL,
	"destination_ward_id" uuid NOT NULL,
	"destination_ward_name" varchar(255) NOT NULL,
	"destination_bed_id" uuid,
	"destination_bed_code" varchar(50),
	"transfer_type" varchar(50) DEFAULT 'CLINICAL_ESCALATION' NOT NULL,
	"priority" varchar(30) DEFAULT 'ROUTINE' NOT NULL,
	"transfer_reason" text NOT NULL,
	"requesting_doctor_name" varchar(255) NOT NULL,
	"transport_requirement" varchar(50) DEFAULT 'WHEELCHAIR' NOT NULL,
	"nursing_handoff_notes" text,
	"status" varchar(50) DEFAULT 'REQUESTED' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"unit_code" varchar(50) NOT NULL,
	"unit_name" varchar(255) NOT NULL,
	"unit_type" varchar(50) DEFAULT 'INPATIENT_DIVISION' NOT NULL,
	"specialty" varchar(100) DEFAULT 'MULTI_SPECIALTY' NOT NULL,
	"building" varchar(100) DEFAULT 'Main Hospital Tower' NOT NULL,
	"floor" varchar(50) DEFAULT 'Level 3' NOT NULL,
	"head_nurse_id" uuid,
	"clinical_director_id" uuid,
	"total_capacity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_vital_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"admission_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"recorded_by" varchar(255) NOT NULL,
	"temperature_celsius" numeric(4, 2),
	"pulse_bpm" integer,
	"respiratory_rate_bpm" integer,
	"systolic_bp_mm_hg" integer,
	"diastolic_bp_mm_hg" integer,
	"spo2_percentage" integer,
	"blood_glucose_mg_dl" numeric(6, 2),
	"pain_scale_score" integer,
	"gcs_score" integer,
	"is_abnormal" boolean DEFAULT false NOT NULL,
	"abnormal_details" text,
	"notes" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."inpatient_wards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"ward_code" varchar(50) NOT NULL,
	"ward_name" varchar(255) NOT NULL,
	"ward_type" varchar(50) NOT NULL,
	"care_level" varchar(50) DEFAULT 'TERTIARY_CARE' NOT NULL,
	"gender_policy" varchar(30) DEFAULT 'ALL' NOT NULL,
	"building" varchar(100) NOT NULL,
	"floor" varchar(50) NOT NULL,
	"wing" varchar(50) DEFAULT 'North Wing',
	"nursing_station_name" varchar(100) DEFAULT 'Central Station' NOT NULL,
	"isolation_capable" boolean DEFAULT false NOT NULL,
	"ventilator_capable" boolean DEFAULT false NOT NULL,
	"total_beds" integer DEFAULT 0 NOT NULL,
	"active_beds" integer DEFAULT 0 NOT NULL,
	"occupied_beds" integer DEFAULT 0 NOT NULL,
	"blocked_beds" integer DEFAULT 0 NOT NULL,
	"cleaning_beds" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admission_approvals" ADD CONSTRAINT "inpatient_admission_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admission_approvals" ADD CONSTRAINT "inpatient_admission_approvals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admission_approvals" ADD CONSTRAINT "inpatient_admission_approvals_request_id_inpatient_admission_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "clinical"."inpatient_admission_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admission_requests" ADD CONSTRAINT "inpatient_admission_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admission_requests" ADD CONSTRAINT "inpatient_admission_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_admission_request_id_inpatient_admission_requests_id_fk" FOREIGN KEY ("admission_request_id") REFERENCES "clinical"."inpatient_admission_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_audit_traces" ADD CONSTRAINT "inpatient_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_audit_traces" ADD CONSTRAINT "inpatient_audit_traces_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_allocations" ADD CONSTRAINT "inpatient_bed_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_allocations" ADD CONSTRAINT "inpatient_bed_allocations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_allocations" ADD CONSTRAINT "inpatient_bed_allocations_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_allocations" ADD CONSTRAINT "inpatient_bed_allocations_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_allocations" ADD CONSTRAINT "inpatient_bed_allocations_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_blocks" ADD CONSTRAINT "inpatient_bed_blocks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_blocks" ADD CONSTRAINT "inpatient_bed_blocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_blocks" ADD CONSTRAINT "inpatient_bed_blocks_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_blocks" ADD CONSTRAINT "inpatient_bed_blocks_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_reservations" ADD CONSTRAINT "inpatient_bed_reservations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_reservations" ADD CONSTRAINT "inpatient_bed_reservations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_reservations" ADD CONSTRAINT "inpatient_bed_reservations_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_reservations" ADD CONSTRAINT "inpatient_bed_reservations_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_status_history" ADD CONSTRAINT "inpatient_bed_status_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_status_history" ADD CONSTRAINT "inpatient_bed_status_history_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_status_history" ADD CONSTRAINT "inpatient_bed_status_history_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_turnaround" ADD CONSTRAINT "inpatient_bed_turnaround_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_turnaround" ADD CONSTRAINT "inpatient_bed_turnaround_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_turnaround" ADD CONSTRAINT "inpatient_bed_turnaround_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_bed_turnaround" ADD CONSTRAINT "inpatient_bed_turnaround_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_beds" ADD CONSTRAINT "inpatient_beds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_beds" ADD CONSTRAINT "inpatient_beds_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_beds" ADD CONSTRAINT "inpatient_beds_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_beds" ADD CONSTRAINT "inpatient_beds_room_id_inpatient_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "clinical"."inpatient_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_plans" ADD CONSTRAINT "inpatient_care_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_plans" ADD CONSTRAINT "inpatient_care_plans_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_plans" ADD CONSTRAINT "inpatient_care_plans_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_teams" ADD CONSTRAINT "inpatient_care_teams_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_teams" ADD CONSTRAINT "inpatient_care_teams_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_care_teams" ADD CONSTRAINT "inpatient_care_teams_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_plans" ADD CONSTRAINT "inpatient_discharge_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_plans" ADD CONSTRAINT "inpatient_discharge_plans_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_plans" ADD CONSTRAINT "inpatient_discharge_plans_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_requests" ADD CONSTRAINT "inpatient_discharge_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_requests" ADD CONSTRAINT "inpatient_discharge_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_requests" ADD CONSTRAINT "inpatient_discharge_requests_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_summaries" ADD CONSTRAINT "inpatient_discharge_summaries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_summaries" ADD CONSTRAINT "inpatient_discharge_summaries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_discharge_summaries" ADD CONSTRAINT "inpatient_discharge_summaries_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_doctor_rounds" ADD CONSTRAINT "inpatient_doctor_rounds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_doctor_rounds" ADD CONSTRAINT "inpatient_doctor_rounds_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_doctor_rounds" ADD CONSTRAINT "inpatient_doctor_rounds_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_intake_output" ADD CONSTRAINT "inpatient_intake_output_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_intake_output" ADD CONSTRAINT "inpatient_intake_output_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_intake_output" ADD CONSTRAINT "inpatient_intake_output_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_assessments" ADD CONSTRAINT "inpatient_nursing_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_assessments" ADD CONSTRAINT "inpatient_nursing_assessments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_assessments" ADD CONSTRAINT "inpatient_nursing_assessments_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_notes" ADD CONSTRAINT "inpatient_nursing_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_notes" ADD CONSTRAINT "inpatient_nursing_notes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_nursing_notes" ADD CONSTRAINT "inpatient_nursing_notes_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_patient_locations" ADD CONSTRAINT "inpatient_patient_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_patient_locations" ADD CONSTRAINT "inpatient_patient_locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_patient_locations" ADD CONSTRAINT "inpatient_patient_locations_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_patient_locations" ADD CONSTRAINT "inpatient_patient_locations_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_patient_locations" ADD CONSTRAINT "inpatient_patient_locations_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_rooms" ADD CONSTRAINT "inpatient_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_rooms" ADD CONSTRAINT "inpatient_rooms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_rooms" ADD CONSTRAINT "inpatient_rooms_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfer_approvals" ADD CONSTRAINT "inpatient_transfer_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfer_approvals" ADD CONSTRAINT "inpatient_transfer_approvals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfer_approvals" ADD CONSTRAINT "inpatient_transfer_approvals_transfer_id_inpatient_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "clinical"."inpatient_transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_source_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("source_ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_source_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("source_bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_destination_ward_id_inpatient_wards_id_fk" FOREIGN KEY ("destination_ward_id") REFERENCES "clinical"."inpatient_wards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_transfers" ADD CONSTRAINT "inpatient_transfers_destination_bed_id_inpatient_beds_id_fk" FOREIGN KEY ("destination_bed_id") REFERENCES "clinical"."inpatient_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_units" ADD CONSTRAINT "inpatient_units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_units" ADD CONSTRAINT "inpatient_units_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_vital_observations" ADD CONSTRAINT "inpatient_vital_observations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_vital_observations" ADD CONSTRAINT "inpatient_vital_observations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_vital_observations" ADD CONSTRAINT "inpatient_vital_observations_admission_id_inpatient_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "clinical"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_wards" ADD CONSTRAINT "inpatient_wards_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_wards" ADD CONSTRAINT "inpatient_wards_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."inpatient_wards" ADD CONSTRAINT "inpatient_wards_unit_id_inpatient_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "clinical"."inpatient_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inpatient_adm_approvals_req_idx" ON "clinical"."inpatient_admission_approvals" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_adm_req_num_unq" ON "clinical"."inpatient_admission_requests" USING btree ("tenant_id","request_number");--> statement-breakpoint
CREATE INDEX "inpatient_adm_req_status_idx" ON "clinical"."inpatient_admission_requests" USING btree ("tenant_id","branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_admissions_num_unq" ON "clinical"."inpatient_admissions" USING btree ("tenant_id","admission_number");--> statement-breakpoint
CREATE INDEX "inpatient_admissions_patient_idx" ON "clinical"."inpatient_admissions" USING btree ("tenant_id","patient_id","status");--> statement-breakpoint
CREATE INDEX "inpatient_admissions_ward_bed_idx" ON "clinical"."inpatient_admissions" USING btree ("ward_id","bed_id","status");--> statement-breakpoint
CREATE INDEX "inpatient_audit_traces_tenant_entity_idx" ON "clinical"."inpatient_audit_traces" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "inpatient_bed_allocations_adm_bed_idx" ON "clinical"."inpatient_bed_allocations" USING btree ("admission_id","bed_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_bed_blocks_num_unq" ON "clinical"."inpatient_bed_blocks" USING btree ("tenant_id","block_number");--> statement-breakpoint
CREATE INDEX "inpatient_bed_blocks_bed_idx" ON "clinical"."inpatient_bed_blocks" USING btree ("bed_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_bed_reservations_num_unq" ON "clinical"."inpatient_bed_reservations" USING btree ("tenant_id","reservation_number");--> statement-breakpoint
CREATE INDEX "inpatient_bed_reservations_bed_time_idx" ON "clinical"."inpatient_bed_reservations" USING btree ("bed_id","status","reserved_from");--> statement-breakpoint
CREATE INDEX "inpatient_bed_status_history_bed_idx" ON "clinical"."inpatient_bed_status_history" USING btree ("bed_id","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_turnaround_num_unq" ON "clinical"."inpatient_bed_turnaround" USING btree ("tenant_id","turnaround_number");--> statement-breakpoint
CREATE INDEX "inpatient_turnaround_bed_idx" ON "clinical"."inpatient_bed_turnaround" USING btree ("bed_id","status");--> statement-breakpoint
CREATE INDEX "inpatient_beds_tenant_branch_idx" ON "clinical"."inpatient_beds" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "inpatient_beds_ward_idx" ON "clinical"."inpatient_beds" USING btree ("ward_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_beds_code_unq" ON "clinical"."inpatient_beds" USING btree ("tenant_id","branch_id","bed_code");--> statement-breakpoint
CREATE INDEX "inpatient_care_plans_adm_idx" ON "clinical"."inpatient_care_plans" USING btree ("admission_id","status");--> statement-breakpoint
CREATE INDEX "inpatient_care_teams_adm_idx" ON "clinical"."inpatient_care_teams" USING btree ("admission_id","is_primary");--> statement-breakpoint
CREATE INDEX "inpatient_discharge_plans_adm_idx" ON "clinical"."inpatient_discharge_plans" USING btree ("admission_id","readiness_status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_disch_req_num_unq" ON "clinical"."inpatient_discharge_requests" USING btree ("tenant_id","request_number");--> statement-breakpoint
CREATE INDEX "inpatient_disch_req_adm_idx" ON "clinical"."inpatient_discharge_requests" USING btree ("admission_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_disch_sum_num_unq" ON "clinical"."inpatient_discharge_summaries" USING btree ("tenant_id","summary_number");--> statement-breakpoint
CREATE INDEX "inpatient_disch_sum_adm_idx" ON "clinical"."inpatient_discharge_summaries" USING btree ("admission_id");--> statement-breakpoint
CREATE INDEX "inpatient_rounds_adm_idx" ON "clinical"."inpatient_doctor_rounds" USING btree ("admission_id","round_timestamp");--> statement-breakpoint
CREATE INDEX "inpatient_io_adm_idx" ON "clinical"."inpatient_intake_output" USING btree ("admission_id","recorded_at");--> statement-breakpoint
CREATE INDEX "inpatient_nursing_assess_adm_idx" ON "clinical"."inpatient_nursing_assessments" USING btree ("admission_id","created_at");--> statement-breakpoint
CREATE INDEX "inpatient_nursing_notes_adm_idx" ON "clinical"."inpatient_nursing_notes" USING btree ("admission_id","created_at");--> statement-breakpoint
CREATE INDEX "inpatient_patient_loc_adm_idx" ON "clinical"."inpatient_patient_locations" USING btree ("admission_id","location_start");--> statement-breakpoint
CREATE INDEX "inpatient_rooms_tenant_branch_idx" ON "clinical"."inpatient_rooms" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_rooms_num_unq" ON "clinical"."inpatient_rooms" USING btree ("tenant_id","branch_id","ward_id","room_number");--> statement-breakpoint
CREATE INDEX "inpatient_transfer_approvals_idx" ON "clinical"."inpatient_transfer_approvals" USING btree ("transfer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_transfers_num_unq" ON "clinical"."inpatient_transfers" USING btree ("tenant_id","transfer_number");--> statement-breakpoint
CREATE INDEX "inpatient_transfers_status_idx" ON "clinical"."inpatient_transfers" USING btree ("tenant_id","branch_id","status");--> statement-breakpoint
CREATE INDEX "inpatient_units_tenant_branch_idx" ON "clinical"."inpatient_units" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_units_code_unq" ON "clinical"."inpatient_units" USING btree ("tenant_id","branch_id","unit_code");--> statement-breakpoint
CREATE INDEX "inpatient_vitals_adm_idx" ON "clinical"."inpatient_vital_observations" USING btree ("admission_id","recorded_at");--> statement-breakpoint
CREATE INDEX "inpatient_wards_tenant_branch_idx" ON "clinical"."inpatient_wards" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inpatient_wards_code_unq" ON "clinical"."inpatient_wards" USING btree ("tenant_id","branch_id","ward_code");