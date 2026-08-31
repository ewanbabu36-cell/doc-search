CREATE TABLE "clinical"."anaesthesia_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"lead_anaesthetist" varchar(255) NOT NULL,
	"anaesthesia_type" varchar(50) DEFAULT 'GENERAL_ANAESTHESIA' NOT NULL,
	"induction_time" timestamp with time zone DEFAULT now() NOT NULL,
	"intubation_details" varchar(255),
	"airway_device_used" varchar(100) DEFAULT 'ENDOTRACHEAL_TUBE' NOT NULL,
	"administered_agents_summary" text NOT NULL,
	"iv_fluids_administered_ml" integer DEFAULT 500 NOT NULL,
	"blood_transfused_units" integer DEFAULT 0 NOT NULL,
	"estimated_intraop_blood_loss_ml" integer DEFAULT 50 NOT NULL,
	"intraop_vitals_stability" varchar(100) DEFAULT 'HEMODYNAMICALLY_STABLE' NOT NULL,
	"anaesthesia_end_time" timestamp with time zone,
	"extubation_time" timestamp with time zone,
	"intraoperative_complications" text,
	"post_anaesthesia_aldrete_score" integer DEFAULT 9 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."intraoperative_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"primary_surgeon" varchar(255) NOT NULL,
	"assistant_surgeon" varchar(255),
	"scrub_nurse" varchar(255) NOT NULL,
	"circulating_nurse" varchar(255) NOT NULL,
	"incision_time" timestamp with time zone DEFAULT now() NOT NULL,
	"closure_time" timestamp with time zone,
	"surgical_approach" varchar(255) NOT NULL,
	"intraoperative_findings" text NOT NULL,
	"procedure_details" text NOT NULL,
	"specimens_collected_count" integer DEFAULT 0 NOT NULL,
	"implants_placed_count" integer DEFAULT 0 NOT NULL,
	"sponge_count_verified" boolean DEFAULT true NOT NULL,
	"needle_count_verified" boolean DEFAULT true NOT NULL,
	"instrument_count_verified" boolean DEFAULT true NOT NULL,
	"drains_placed" varchar(255),
	"closure_technique" text NOT NULL,
	"patient_condition_post_surgery" varchar(100) DEFAULT 'STABLE' NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."operation_theatre_complexes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"complex_code" varchar(50) NOT NULL,
	"complex_name" varchar(255) NOT NULL,
	"building" varchar(100) NOT NULL,
	"floor" varchar(50) NOT NULL,
	"head_of_ot" varchar(255),
	"total_rooms" integer DEFAULT 0 NOT NULL,
	"active_rooms" integer DEFAULT 0 NOT NULL,
	"operating_hours" varchar(100) DEFAULT '24/7' NOT NULL,
	"has_laminar_airflow" boolean DEFAULT true NOT NULL,
	"has_central_sterile_supply" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."operation_theatre_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"complex_id" uuid NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"room_name" varchar(255) NOT NULL,
	"ot_type" varchar(50) DEFAULT 'MAJOR_OT' NOT NULL,
	"status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"primary_specialty" varchar(100) NOT NULL,
	"supported_specialties" jsonb DEFAULT '[]'::jsonb,
	"has_pendant_system" boolean DEFAULT true NOT NULL,
	"has_cardiac_monitor" boolean DEFAULT true NOT NULL,
	"has_anaesthesia_workstation" boolean DEFAULT true NOT NULL,
	"has_c_arm_fluoroscopy" boolean DEFAULT false NOT NULL,
	"has_laminar_flow" boolean DEFAULT true NOT NULL,
	"has_hepa_filter" boolean DEFAULT true NOT NULL,
	"last_cleaned_at" timestamp with time zone,
	"hourly_rate" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"current_surgery_id" uuid,
	"current_patient_name" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."operative_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"note_number" varchar(50) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"primary_surgeon_name" varchar(255) NOT NULL,
	"pre_operative_diagnosis" text NOT NULL,
	"post_operative_diagnosis" text NOT NULL,
	"procedure_performed_title" varchar(255) NOT NULL,
	"detailed_operative_findings" text NOT NULL,
	"operative_technique_step_by_step" text NOT NULL,
	"estimated_blood_loss_ml" integer DEFAULT 50 NOT NULL,
	"tissue_specimens_sent_for_biopsy" text,
	"prosthesis_and_implants_used" text,
	"post_operative_instructions" text NOT NULL,
	"is_finalized" boolean DEFAULT true NOT NULL,
	"finalized_by" varchar(255),
	"finalized_at" timestamp with time zone,
	"version_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(50) NOT NULL,
	"actor_id" varchar(100) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"entity_code" varchar(100) NOT NULL,
	"justification" text NOT NULL,
	"ip_address" varchar(50) DEFAULT '127.0.0.1' NOT NULL,
	"integrity_hash" varchar(255) NOT NULL,
	"new_state" jsonb DEFAULT '{}'::jsonb,
	"previous_hash" varchar(255),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_nursing_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"nurse_name" varchar(255) NOT NULL,
	"nurse_role" varchar(50) NOT NULL,
	"note_content" text NOT NULL,
	"counts_final_verified" boolean DEFAULT true NOT NULL,
	"skin_condition_post_op" varchar(100) DEFAULT 'INTACT' NOT NULL,
	"cautery_plate_site_inspection" varchar(100) DEFAULT 'NO_BURNS_NORMAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_resource_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_code" varchar(100) NOT NULL,
	"resource_name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_sterilized" boolean DEFAULT true NOT NULL,
	"sterilization_batch" varchar(100),
	"status" varchar(50) DEFAULT 'ALLOCATED' NOT NULL,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_schedule_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"staff_id" uuid,
	"staff_name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_number" varchar(50) NOT NULL,
	"surgery_request_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"room_id" uuid NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 60 NOT NULL,
	"primary_surgeon_name" varchar(255) NOT NULL,
	"assistant_surgeon_name" varchar(255),
	"lead_anaesthetist_name" varchar(255) NOT NULL,
	"anaesthesia_tech_name" varchar(255),
	"scrub_nurse_name" varchar(255) NOT NULL,
	"circulating_nurse_name" varchar(255) NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'CONFIRMED' NOT NULL,
	"delay_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."ot_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transfer_number" varchar(50) NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"source_location" varchar(255) NOT NULL,
	"destination_room_id" uuid NOT NULL,
	"destination_room_name" varchar(255) NOT NULL,
	"transport_staff_name" varchar(255) NOT NULL,
	"handover_given_by" varchar(255) NOT NULL,
	"handover_received_by" varchar(255) NOT NULL,
	"departure_time" timestamp with time zone DEFAULT now() NOT NULL,
	"arrival_time" timestamp with time zone,
	"patient_condition_on_arrival" varchar(100) DEFAULT 'STABLE' NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pacu_recovery_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"recovery_bed_number" varchar(50) NOT NULL,
	"pacu_nurse_name" varchar(255) NOT NULL,
	"arrival_time" timestamp with time zone DEFAULT now() NOT NULL,
	"initial_aldrete_score" integer DEFAULT 8 NOT NULL,
	"current_aldrete_score" integer DEFAULT 9 NOT NULL,
	"consciousness_level" varchar(100) DEFAULT 'AWAKE_ALERT' NOT NULL,
	"airway_status" varchar(100) DEFAULT 'PATENT_CLEAR' NOT NULL,
	"oxygen_support_lpm" numeric(4, 1) DEFAULT '2.0' NOT NULL,
	"spo2_percentage" integer DEFAULT 98 NOT NULL,
	"systolic_bp_mm_hg" integer DEFAULT 120 NOT NULL,
	"diastolic_bp_mm_hg" integer DEFAULT 80 NOT NULL,
	"heart_rate_bpm" integer DEFAULT 75 NOT NULL,
	"pain_score_numeric" integer DEFAULT 2 NOT NULL,
	"nausea_vomiting_status" varchar(100) DEFAULT 'NONE' NOT NULL,
	"wound_drain_output_ml" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'RECOVERING' NOT NULL,
	"discharge_criteria_met" boolean DEFAULT false NOT NULL,
	"authorized_transfer_destination" varchar(100) DEFAULT 'INPATIENT_POST_OP_WARD' NOT NULL,
	"discharged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."postoperative_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"ordered_by_doctor" varchar(255) NOT NULL,
	"medication_orders_summary" text NOT NULL,
	"wound_care_instructions" text NOT NULL,
	"drain_care_instructions" text,
	"diet_instructions" varchar(255) DEFAULT 'NPO_UNTIL_BOWEL_SOUNDS' NOT NULL,
	"mobilization_instructions" varchar(255) DEFAULT 'BED_REST_24H' NOT NULL,
	"vitals_monitoring_frequency" varchar(100) DEFAULT 'Q2H_FOR_6H' NOT NULL,
	"special_precautions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."postoperative_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transfer_number" varchar(50) NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"origin_location" varchar(100) DEFAULT 'PACU_RECOVERY' NOT NULL,
	"destination_ward_or_icu" varchar(255) NOT NULL,
	"destination_bed_number" varchar(50) NOT NULL,
	"transferring_nurse" varchar(255) NOT NULL,
	"receiving_nurse" varchar(255) NOT NULL,
	"clinical_condition_summary" text NOT NULL,
	"transfer_time" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pre_op_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"verified_by_nurse" varchar(255) NOT NULL,
	"patient_identity_verified" boolean DEFAULT true NOT NULL,
	"surgical_site_marked" boolean DEFAULT true NOT NULL,
	"consent_verified" boolean DEFAULT true NOT NULL,
	"npo_verified" boolean DEFAULT true NOT NULL,
	"allergies_checked" boolean DEFAULT true NOT NULL,
	"pre_op_vitals_checked" boolean DEFAULT true NOT NULL,
	"lab_reports_available" boolean DEFAULT true NOT NULL,
	"imaging_available" boolean DEFAULT true NOT NULL,
	"blood_reserved_and_checked" boolean DEFAULT true NOT NULL,
	"implants_verified_in_ot" boolean DEFAULT true NOT NULL,
	"dentures_jewelry_removed" boolean DEFAULT true NOT NULL,
	"pre_medication_administered" boolean DEFAULT true NOT NULL,
	"is_cleared_for_ot" boolean DEFAULT true NOT NULL,
	"notes" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pre_operative_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"surgery_request_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"assessed_by_anaesthetist" varchar(255) NOT NULL,
	"assessment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"asa_classification" varchar(50) DEFAULT 'ASA_I_NORMAL_HEALTHY' NOT NULL,
	"airway_mallampati_score" integer DEFAULT 1 NOT NULL,
	"npo_status_hours" integer DEFAULT 8 NOT NULL,
	"cardiac_clearance_given" boolean DEFAULT true NOT NULL,
	"respiratory_clearance_given" boolean DEFAULT true NOT NULL,
	"allergies_noted" text,
	"current_medications_noted" text,
	"last_haemoglobin_gdl" numeric(4, 1),
	"coagulation_profile_status" varchar(100),
	"blood_arrangement_units" integer DEFAULT 0 NOT NULL,
	"fitness_status" varchar(50) DEFAULT 'CLEARED' NOT NULL,
	"anaesthesia_plan_notes" text NOT NULL,
	"risk_factors_summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgery_cancellations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cancellation_number" varchar(50) NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"cancellation_reason" text NOT NULL,
	"cancelled_by" varchar(255) NOT NULL,
	"cancelled_by_role" varchar(100) NOT NULL,
	"rescheduling_requested" boolean DEFAULT true NOT NULL,
	"notes" text,
	"cancelled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgery_request_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgery_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(100) NOT NULL,
	"patient_age" integer DEFAULT 35 NOT NULL,
	"patient_gender" varchar(20) DEFAULT 'M' NOT NULL,
	"encounter_id" uuid,
	"admission_id" uuid,
	"requesting_doctor_name" varchar(255) NOT NULL,
	"primary_surgeon_name" varchar(255) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"procedure_id" uuid NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"pre_operative_diagnosis" text NOT NULL,
	"clinical_indication" text NOT NULL,
	"category" varchar(50) DEFAULT 'ELECTIVE' NOT NULL,
	"priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"proposed_surgery_date" timestamp with time zone NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 60 NOT NULL,
	"required_anaesthesia" varchar(50) DEFAULT 'GENERAL_ANAESTHESIA' NOT NULL,
	"implant_requirement_details" text,
	"blood_components_required" varchar(255),
	"special_equipment_required" text,
	"pac_clearance_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"status" varchar(50) DEFAULT 'SUBMITTED' NOT NULL,
	"decision_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"surgery_request_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"consent_number" varchar(50) NOT NULL,
	"procedure_consent_given" boolean DEFAULT true NOT NULL,
	"anaesthesia_consent_given" boolean DEFAULT true NOT NULL,
	"blood_transfusion_consent_given" boolean DEFAULT true NOT NULL,
	"high_risk_consent_given" boolean DEFAULT false NOT NULL,
	"implant_consent_given" boolean DEFAULT false NOT NULL,
	"consenting_person_name" varchar(255) NOT NULL,
	"relationship_to_patient" varchar(100) DEFAULT 'SELF' NOT NULL,
	"counselled_by_doctor" varchar(255) NOT NULL,
	"witness_name" varchar(255) NOT NULL,
	"is_signed_digitally" boolean DEFAULT true NOT NULL,
	"consent_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'VALID_SIGNED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_consumable_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"quantity_used" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'UNIT' NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"recorded_by" varchar(255) NOT NULL,
	"inventory_deduction_status" varchar(50) DEFAULT 'DEDUCTED' NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_implants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"implant_tracking_number" varchar(50) NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"implant_name" varchar(255) NOT NULL,
	"implant_type" varchar(100) NOT NULL,
	"manufacturer_name" varchar(255) NOT NULL,
	"model_number" varchar(100) NOT NULL,
	"serial_or_lot_number" varchar(100) NOT NULL,
	"udi_barcode" varchar(255),
	"expiry_date" timestamp with time zone,
	"anatomic_placement_site" varchar(255) NOT NULL,
	"implanted_by_surgeon" varchar(255) NOT NULL,
	"implant_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"supplier_or_vendor" varchar(255) NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'IMPLANTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_procedure_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	"requirement_type" varchar(50) NOT NULL,
	"resource_name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"procedure_code" varchar(50) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"category" varchar(50) DEFAULT 'MAJOR_PROCEDURE' NOT NULL,
	"default_duration_minutes" integer DEFAULT 60 NOT NULL,
	"recommended_anaesthesia" varchar(50) DEFAULT 'GENERAL_ANAESTHESIA' NOT NULL,
	"requires_implant" boolean DEFAULT false NOT NULL,
	"requires_blood_crossmatch" boolean DEFAULT false NOT NULL,
	"requires_icu_stay" boolean DEFAULT false NOT NULL,
	"base_procedure_charge" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"cpt_or_icd_code" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_safety_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"stage" varchar(50) NOT NULL,
	"conducted_by" varchar(255) NOT NULL,
	"conducted_role" varchar(100) NOT NULL,
	"patient_confirmed" boolean DEFAULT true NOT NULL,
	"site_marking_confirmed" boolean DEFAULT true NOT NULL,
	"anaesthesia_machine_checked" boolean DEFAULT true NOT NULL,
	"pulse_oximeter_functioning" boolean DEFAULT true NOT NULL,
	"known_allergy_confirmed" boolean DEFAULT true NOT NULL,
	"difficult_airway_risk_evaluated" boolean DEFAULT true NOT NULL,
	"blood_loss_risk_evaluated" boolean DEFAULT true NOT NULL,
	"team_introduced_roles" boolean DEFAULT true NOT NULL,
	"antibiotic_prophylaxis_given" boolean DEFAULT true NOT NULL,
	"essential_imaging_displayed" boolean DEFAULT true NOT NULL,
	"sponge_count_correct" boolean DEFAULT true NOT NULL,
	"needle_count_correct" boolean DEFAULT true NOT NULL,
	"instrument_count_correct" boolean DEFAULT true NOT NULL,
	"specimen_properly_labeled" boolean DEFAULT true NOT NULL,
	"equipment_issues_identified" boolean DEFAULT false NOT NULL,
	"recovery_concerns_addressed" boolean DEFAULT true NOT NULL,
	"is_exception_overridden" boolean DEFAULT false,
	"override_reason" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."surgical_specimens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"specimen_number" varchar(50) NOT NULL,
	"schedule_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"anatomic_origin_site" varchar(255) NOT NULL,
	"specimen_description" text NOT NULL,
	"fixative_used" varchar(100) DEFAULT '10% BUFFERED FORMALIN' NOT NULL,
	"ordered_investigation" varchar(255) NOT NULL,
	"destination_lab" varchar(255) DEFAULT 'HISTOPATHOLOGY_LAB' NOT NULL,
	"collected_by_surgeon" varchar(255) NOT NULL,
	"collection_time" timestamp with time zone DEFAULT now() NOT NULL,
	"label_verified_by_nurse" varchar(255) NOT NULL,
	"lab_handover_status" varchar(50) DEFAULT 'TRANSIT_TO_LAB' NOT NULL,
	"lab_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."anaesthesia_records" ADD CONSTRAINT "anaesthesia_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."anaesthesia_records" ADD CONSTRAINT "anaesthesia_records_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."intraoperative_records" ADD CONSTRAINT "intraoperative_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."intraoperative_records" ADD CONSTRAINT "intraoperative_records_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operation_theatre_complexes" ADD CONSTRAINT "operation_theatre_complexes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operation_theatre_rooms" ADD CONSTRAINT "operation_theatre_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operation_theatre_rooms" ADD CONSTRAINT "operation_theatre_rooms_complex_id_operation_theatre_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "clinical"."operation_theatre_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operative_notes" ADD CONSTRAINT "operative_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operative_notes" ADD CONSTRAINT "operative_notes_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_audit_traces" ADD CONSTRAINT "ot_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_nursing_notes" ADD CONSTRAINT "ot_nursing_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_nursing_notes" ADD CONSTRAINT "ot_nursing_notes_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_resource_allocations" ADD CONSTRAINT "ot_resource_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_resource_allocations" ADD CONSTRAINT "ot_resource_allocations_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_schedule_staff" ADD CONSTRAINT "ot_schedule_staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_schedule_staff" ADD CONSTRAINT "ot_schedule_staff_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_schedules" ADD CONSTRAINT "ot_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_schedules" ADD CONSTRAINT "ot_schedules_surgery_request_id_surgery_requests_id_fk" FOREIGN KEY ("surgery_request_id") REFERENCES "clinical"."surgery_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_schedules" ADD CONSTRAINT "ot_schedules_room_id_operation_theatre_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "clinical"."operation_theatre_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_transfers" ADD CONSTRAINT "ot_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_transfers" ADD CONSTRAINT "ot_transfers_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."ot_transfers" ADD CONSTRAINT "ot_transfers_destination_room_id_operation_theatre_rooms_id_fk" FOREIGN KEY ("destination_room_id") REFERENCES "clinical"."operation_theatre_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pacu_recovery_records" ADD CONSTRAINT "pacu_recovery_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pacu_recovery_records" ADD CONSTRAINT "pacu_recovery_records_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."postoperative_orders" ADD CONSTRAINT "postoperative_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."postoperative_orders" ADD CONSTRAINT "postoperative_orders_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."postoperative_transfers" ADD CONSTRAINT "postoperative_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."postoperative_transfers" ADD CONSTRAINT "postoperative_transfers_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pre_op_checklists" ADD CONSTRAINT "pre_op_checklists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pre_op_checklists" ADD CONSTRAINT "pre_op_checklists_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pre_operative_assessments" ADD CONSTRAINT "pre_operative_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pre_operative_assessments" ADD CONSTRAINT "pre_operative_assessments_surgery_request_id_surgery_requests_id_fk" FOREIGN KEY ("surgery_request_id") REFERENCES "clinical"."surgery_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_cancellations" ADD CONSTRAINT "surgery_cancellations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_cancellations" ADD CONSTRAINT "surgery_cancellations_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_request_items" ADD CONSTRAINT "surgery_request_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_request_items" ADD CONSTRAINT "surgery_request_items_request_id_surgery_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "clinical"."surgery_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_request_items" ADD CONSTRAINT "surgery_request_items_procedure_id_surgical_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "clinical"."surgical_procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_requests" ADD CONSTRAINT "surgery_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgery_requests" ADD CONSTRAINT "surgery_requests_procedure_id_surgical_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "clinical"."surgical_procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_consents" ADD CONSTRAINT "surgical_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_consents" ADD CONSTRAINT "surgical_consents_surgery_request_id_surgery_requests_id_fk" FOREIGN KEY ("surgery_request_id") REFERENCES "clinical"."surgery_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_consumable_usage" ADD CONSTRAINT "surgical_consumable_usage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_consumable_usage" ADD CONSTRAINT "surgical_consumable_usage_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_implants" ADD CONSTRAINT "surgical_implants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_implants" ADD CONSTRAINT "surgical_implants_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_procedure_requirements" ADD CONSTRAINT "surgical_procedure_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_procedure_requirements" ADD CONSTRAINT "surgical_procedure_requirements_procedure_id_surgical_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "clinical"."surgical_procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_procedures" ADD CONSTRAINT "surgical_procedures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_safety_checklists" ADD CONSTRAINT "surgical_safety_checklists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_safety_checklists" ADD CONSTRAINT "surgical_safety_checklists_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_specimens" ADD CONSTRAINT "surgical_specimens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."surgical_specimens" ADD CONSTRAINT "surgical_specimens_schedule_id_ot_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."ot_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_anaesthesia_rec_schedule" ON "clinical"."anaesthesia_records" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_intraop_rec_schedule" ON "clinical"."intraoperative_records" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_ot_complexes_tenant_branch" ON "clinical"."operation_theatre_complexes" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ot_complexes_code_tenant" ON "clinical"."operation_theatre_complexes" USING btree ("tenant_id","complex_code");--> statement-breakpoint
CREATE INDEX "idx_ot_rooms_complex" ON "clinical"."operation_theatre_rooms" USING btree ("complex_id");--> statement-breakpoint
CREATE INDEX "idx_ot_rooms_tenant_branch" ON "clinical"."operation_theatre_rooms" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ot_rooms_code_tenant" ON "clinical"."operation_theatre_rooms" USING btree ("tenant_id","complex_id","room_number");--> statement-breakpoint
CREATE INDEX "idx_op_notes_schedule" ON "clinical"."operative_notes" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_op_notes_num" ON "clinical"."operative_notes" USING btree ("tenant_id","note_number");--> statement-breakpoint
CREATE INDEX "idx_ot_audit_tenant" ON "clinical"."ot_audit_traces" USING btree ("tenant_id","action");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ot_audit_num" ON "clinical"."ot_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_ot_nursing_notes_schedule" ON "clinical"."ot_nursing_notes" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_ot_resource_sched" ON "clinical"."ot_resource_allocations" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_ot_sched_staff" ON "clinical"."ot_schedule_staff" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_ot_schedules_tenant_room" ON "clinical"."ot_schedules" USING btree ("tenant_id","room_id","start_time");--> statement-breakpoint
CREATE INDEX "idx_ot_schedules_patient" ON "clinical"."ot_schedules" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ot_schedules_num" ON "clinical"."ot_schedules" USING btree ("tenant_id","schedule_number");--> statement-breakpoint
CREATE INDEX "idx_ot_transfers_schedule" ON "clinical"."ot_transfers" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ot_transfers_num" ON "clinical"."ot_transfers" USING btree ("tenant_id","transfer_number");--> statement-breakpoint
CREATE INDEX "idx_pacu_rec_schedule" ON "clinical"."pacu_recovery_records" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_pacu_rec_patient" ON "clinical"."pacu_recovery_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_postop_orders_schedule" ON "clinical"."postoperative_orders" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_postop_transfers_schedule" ON "clinical"."postoperative_transfers" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_postop_transfers_num" ON "clinical"."postoperative_transfers" USING btree ("tenant_id","transfer_number");--> statement-breakpoint
CREATE INDEX "idx_preop_chk_schedule" ON "clinical"."pre_op_checklists" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_preop_assess_request" ON "clinical"."pre_operative_assessments" USING btree ("surgery_request_id");--> statement-breakpoint
CREATE INDEX "idx_preop_assess_patient" ON "clinical"."pre_operative_assessments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_surgery_cancel_schedule" ON "clinical"."surgery_cancellations" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_surgery_cancel_num" ON "clinical"."surgery_cancellations" USING btree ("tenant_id","cancellation_number");--> statement-breakpoint
CREATE INDEX "idx_surgery_req_items_req" ON "clinical"."surgery_request_items" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_surgery_req_tenant_branch" ON "clinical"."surgery_requests" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_surgery_req_patient" ON "clinical"."surgery_requests" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_surgery_req_num_tenant" ON "clinical"."surgery_requests" USING btree ("tenant_id","request_number");--> statement-breakpoint
CREATE INDEX "idx_surgical_consents_request" ON "clinical"."surgical_consents" USING btree ("surgery_request_id");--> statement-breakpoint
CREATE INDEX "idx_surgical_consents_patient" ON "clinical"."surgical_consents" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_surgical_consents_num" ON "clinical"."surgical_consents" USING btree ("tenant_id","consent_number");--> statement-breakpoint
CREATE INDEX "idx_consumable_usage_schedule" ON "clinical"."surgical_consumable_usage" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_implants_schedule" ON "clinical"."surgical_implants" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_implants_track_num" ON "clinical"."surgical_implants" USING btree ("tenant_id","implant_tracking_number");--> statement-breakpoint
CREATE INDEX "idx_proc_req_procedure" ON "clinical"."surgical_procedure_requirements" USING btree ("procedure_id");--> statement-breakpoint
CREATE INDEX "idx_surgical_procedures_tenant" ON "clinical"."surgical_procedures" USING btree ("tenant_id","specialty");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_surgical_procedures_code" ON "clinical"."surgical_procedures" USING btree ("tenant_id","procedure_code");--> statement-breakpoint
CREATE INDEX "idx_who_safety_schedule" ON "clinical"."surgical_safety_checklists" USING btree ("schedule_id","stage");--> statement-breakpoint
CREATE INDEX "idx_specimens_schedule" ON "clinical"."surgical_specimens" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_specimens_num" ON "clinical"."surgical_specimens" USING btree ("tenant_id","specimen_number");