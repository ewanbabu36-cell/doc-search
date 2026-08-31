CREATE TABLE "clinical"."radiology_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"appointment_code" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"modality_id" uuid NOT NULL,
	"modality_name" varchar(255) NOT NULL,
	"room_number" varchar(64) NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"assigned_technologist_name" varchar(255) NOT NULL,
	"status" varchar(64) DEFAULT 'SCHEDULED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_audit_traces" (
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
CREATE TABLE "clinical"."radiology_critical_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"alert_code" varchar(64) NOT NULL,
	"report_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"ordering_doctor_name" varchar(255) NOT NULL,
	"ordering_department" varchar(255) NOT NULL,
	"finding_description" text NOT NULL,
	"severity" varchar(64) NOT NULL,
	"flagged_by_radiologist" varchar(255) NOT NULL,
	"notified_recipient" varchar(255) NOT NULL,
	"acknowledged_by" varchar(255),
	"acknowledged_timestamp" timestamp with time zone,
	"status" varchar(64) DEFAULT 'FLAGGED_PENDING_NOTIFICATION' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_code" varchar(64) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"hod_radiologist_name" varchar(255) NOT NULL,
	"chief_technologist_name" varchar(255) NOT NULL,
	"location_description" text NOT NULL,
	"total_modalities_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_modalities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"modality_code" varchar(64) NOT NULL,
	"modality_name" varchar(255) NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"room_number" varchar(64) NOT NULL,
	"manufacturer_and_model" varchar(255) NOT NULL,
	"aetitle" varchar(64) NOT NULL,
	"ip_address" varchar(64) NOT NULL,
	"dicom_port" integer DEFAULT 104 NOT NULL,
	"status" varchar(64) DEFAULT 'AVAILABLE' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"last_calibration_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_number" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"encounter_id" uuid NOT NULL,
	"ordering_doctor_name" varchar(255) NOT NULL,
	"ordering_department" varchar(255) NOT NULL,
	"procedure_id" varchar(64) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"priority" varchar(64) DEFAULT 'ROUTINE_ELECTIVE' NOT NULL,
	"clinical_indication" text NOT NULL,
	"requires_contrast" boolean DEFAULT false NOT NULL,
	"pregnancy_screening_result" varchar(64),
	"renal_egfr_result" varchar(64),
	"known_allergies" text,
	"status" varchar(64) DEFAULT 'ORDERED' NOT NULL,
	"scheduled_time" timestamp with time zone,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_preparation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"preparation_code" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"fasting_confirmed" boolean DEFAULT false NOT NULL,
	"mri_metal_screening_cleared" boolean DEFAULT true NOT NULL,
	"pregnancy_status_confirmed_negative" boolean DEFAULT true NOT NULL,
	"renal_egfr_adequate" boolean DEFAULT true NOT NULL,
	"iv_cannula_secured" boolean DEFAULT false NOT NULL,
	"informed_consent_signed" boolean DEFAULT true NOT NULL,
	"preparation_nurse_name" varchar(255) NOT NULL,
	"is_ready_for_scan" boolean DEFAULT true NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_procedure_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"procedure_code" varchar(64) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"body_part" varchar(128) NOT NULL,
	"requires_contrast" boolean DEFAULT false NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 30 NOT NULL,
	"preparation_instructions" text NOT NULL,
	"cpt_code_reference" varchar(64),
	"price_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_quality_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"event_code" varchar(64) NOT NULL,
	"study_id" uuid NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"reason_description" text NOT NULL,
	"technologist_name" varchar(255) NOT NULL,
	"corrective_action_taken" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"report_number" varchar(64) NOT NULL,
	"study_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"procedure_name" varchar(255) NOT NULL,
	"clinical_history" text NOT NULL,
	"imaging_technique" text NOT NULL,
	"comparison_study_reference" text,
	"findings" text NOT NULL,
	"impression" text NOT NULL,
	"recommendations" text,
	"has_critical_finding" boolean DEFAULT false NOT NULL,
	"reporting_radiologist_name" varchar(255) NOT NULL,
	"verifying_radiologist_name" varchar(255),
	"status" varchar(64) DEFAULT 'DRAFT' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"finalized_at" timestamp with time zone,
	"amendment_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."radiology_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"study_instance_uid" varchar(128) NOT NULL,
	"accession_number" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"modality_type" varchar(64) NOT NULL,
	"study_description" text NOT NULL,
	"study_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"series_count" integer DEFAULT 1 NOT NULL,
	"instances_count" integer DEFAULT 1 NOT NULL,
	"radiation_dose_dlp_mgy_cm" numeric(8, 2),
	"contrast_administered_ml" numeric(6, 1),
	"technologist_name" varchar(255) NOT NULL,
	"pacs_viewer_url" text NOT NULL,
	"pacs_sync_status" varchar(64) DEFAULT 'SYNCED' NOT NULL,
	"status" varchar(64) DEFAULT 'ACQUIRED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."radiology_appointments" ADD CONSTRAINT "radiology_appointments_order_id_radiology_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."radiology_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_appointments" ADD CONSTRAINT "radiology_appointments_modality_id_radiology_modalities_id_fk" FOREIGN KEY ("modality_id") REFERENCES "clinical"."radiology_modalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_critical_findings" ADD CONSTRAINT "radiology_critical_findings_report_id_radiology_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "clinical"."radiology_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_preparation_records" ADD CONSTRAINT "radiology_preparation_records_order_id_radiology_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."radiology_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_quality_events" ADD CONSTRAINT "radiology_quality_events_study_id_radiology_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "clinical"."radiology_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_reports" ADD CONSTRAINT "radiology_reports_study_id_radiology_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "clinical"."radiology_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_reports" ADD CONSTRAINT "radiology_reports_order_id_radiology_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."radiology_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."radiology_studies" ADD CONSTRAINT "radiology_studies_order_id_radiology_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."radiology_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ra_tenant_modality" ON "clinical"."radiology_appointments" USING btree ("tenant_id","modality_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ra_code" ON "clinical"."radiology_appointments" USING btree ("tenant_id","appointment_code");--> statement-breakpoint
CREATE INDEX "idx_rad_at_tenant_branch" ON "clinical"."radiology_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rad_at_num" ON "clinical"."radiology_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_rcf_tenant_report" ON "clinical"."radiology_critical_findings" USING btree ("tenant_id","report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rcf_code" ON "clinical"."radiology_critical_findings" USING btree ("tenant_id","alert_code");--> statement-breakpoint
CREATE INDEX "idx_rd_tenant_branch" ON "clinical"."radiology_departments" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rd_code" ON "clinical"."radiology_departments" USING btree ("tenant_id","department_code");--> statement-breakpoint
CREATE INDEX "idx_rm_tenant_branch" ON "clinical"."radiology_modalities" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rm_code" ON "clinical"."radiology_modalities" USING btree ("tenant_id","modality_code");--> statement-breakpoint
CREATE INDEX "idx_ro_tenant_patient" ON "clinical"."radiology_orders" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ro_number" ON "clinical"."radiology_orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_rpr_tenant_order" ON "clinical"."radiology_preparation_records" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rpr_code" ON "clinical"."radiology_preparation_records" USING btree ("tenant_id","preparation_code");--> statement-breakpoint
CREATE INDEX "idx_rpc_tenant_branch" ON "clinical"."radiology_procedure_catalog" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rpc_code" ON "clinical"."radiology_procedure_catalog" USING btree ("tenant_id","procedure_code");--> statement-breakpoint
CREATE INDEX "idx_rqe_tenant_branch" ON "clinical"."radiology_quality_events" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rqe_code" ON "clinical"."radiology_quality_events" USING btree ("tenant_id","event_code");--> statement-breakpoint
CREATE INDEX "idx_rr_tenant_study" ON "clinical"."radiology_reports" USING btree ("tenant_id","study_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rr_number" ON "clinical"."radiology_reports" USING btree ("tenant_id","report_number");--> statement-breakpoint
CREATE INDEX "idx_rs_tenant_order" ON "clinical"."radiology_studies" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rs_acc_num" ON "clinical"."radiology_studies" USING btree ("tenant_id","accession_number");