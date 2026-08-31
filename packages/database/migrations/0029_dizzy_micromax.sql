CREATE TABLE "clinical"."birth_registry_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"birth_registration_number" varchar(64) NOT NULL,
	"mother_encounter_id" uuid NOT NULL,
	"mother_patient_name" varchar(255) NOT NULL,
	"mother_mrn" varchar(64) NOT NULL,
	"baby_name_or_identifier" varchar(255) NOT NULL,
	"birth_timestamp" timestamp with time zone NOT NULL,
	"delivery_type" varchar(64) NOT NULL,
	"gender" varchar(32) NOT NULL,
	"birth_weight_kg" numeric(4, 2) NOT NULL,
	"attending_obstetrician" varchar(255) NOT NULL,
	"attending_paediatrician" varchar(255) NOT NULL,
	"birth_certificate_reference_number" varchar(64) NOT NULL,
	"government_portal_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."clinical_documentation_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"query_number" varchar(64) NOT NULL,
	"query_title" varchar(255) NOT NULL,
	"initiated_by_coder" varchar(255) NOT NULL,
	"assigned_doctor_name" varchar(255) NOT NULL,
	"clinical_reason" text NOT NULL,
	"supporting_documentation_snippet" text NOT NULL,
	"clinician_clarification_response" text,
	"status" varchar(64) DEFAULT 'OPEN' NOT NULL,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clinical"."coding_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"review_number" varchar(64) NOT NULL,
	"reviewer_name" varchar(255) NOT NULL,
	"reviewer_role" varchar(64) NOT NULL,
	"review_level" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'CODED_AWAITING_REVIEW' NOT NULL,
	"findings_and_errors_notes" text NOT NULL,
	"coding_accuracy_score_percent" integer DEFAULT 100 NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."death_registry_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"death_registration_number" varchar(64) NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"declared_dead_timestamp" timestamp with time zone NOT NULL,
	"declaring_physician" varchar(255) NOT NULL,
	"primary_cause_of_death" text NOT NULL,
	"secondary_causes" text,
	"death_certificate_number" varchar(64) NOT NULL,
	"coroner_police_informed" boolean DEFAULT false NOT NULL,
	"statutory_death_portal_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."legal_record_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"legal_request_number" varchar(64) NOT NULL,
	"record_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"court_or_agency_name" varchar(255) NOT NULL,
	"legal_notice_reference_number" varchar(64) NOT NULL,
	"officer_in_charge_name" varchar(255) NOT NULL,
	"subpoena_details" text NOT NULL,
	"is_preservation_order" boolean DEFAULT false NOT NULL,
	"legal_hold_applied" boolean DEFAULT false NOT NULL,
	"served_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."medical_diagnosis_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"icd_code" varchar(32) NOT NULL,
	"icd_description" text NOT NULL,
	"code_type" varchar(64) DEFAULT 'PRIMARY_DIAGNOSIS' NOT NULL,
	"poa_indicator" varchar(64) DEFAULT 'YES_PRESENT_ON_ADMISSION' NOT NULL,
	"sequencing_order" integer DEFAULT 1 NOT NULL,
	"assigned_by_coder" varchar(255) NOT NULL,
	"coder_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."medical_record_audit_events" (
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
CREATE TABLE "clinical"."medical_record_completion_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"task_code" varchar(64) NOT NULL,
	"deficiency_type" varchar(255) NOT NULL,
	"responsible_staff_name" varchar(255) NOT NULL,
	"responsible_staff_role" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_staff" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."medical_record_indexes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"record_number" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"encounter_id" uuid NOT NULL,
	"encounter_number" varchar(64) NOT NULL,
	"encounter_type" varchar(64) NOT NULL,
	"admission_date" timestamp with time zone NOT NULL,
	"discharge_date" timestamp with time zone,
	"primary_attending_doctor" varchar(255) NOT NULL,
	"completion_status" varchar(64) DEFAULT 'OPEN' NOT NULL,
	"coding_status" varchar(64) DEFAULT 'PENDING_INITIAL_CODE' NOT NULL,
	"storage_type" varchar(64) DEFAULT 'DIGITAL_ONLY_EHR' NOT NULL,
	"physical_shelf_number" varchar(64),
	"physical_box_number" varchar(64),
	"is_legal_hold_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."medical_record_legal_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"hold_code" varchar(64) NOT NULL,
	"record_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"legal_matter_title" varchar(255) NOT NULL,
	"reason_for_hold" text NOT NULL,
	"authorized_by_legal_counsel" varchar(255) NOT NULL,
	"status" varchar(64) DEFAULT 'ACTIVE_LEGAL_HOLD' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clinical"."mr_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_code" varchar(64) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"head_of_mrd_name" varchar(255) NOT NULL,
	"lead_him_officer_name" varchar(255) NOT NULL,
	"lead_coding_auditor_name" varchar(255) NOT NULL,
	"physical_vault_location" varchar(255) NOT NULL,
	"total_indexed_records" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."release_of_information_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"request_number" varchar(64) NOT NULL,
	"record_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"request_type" varchar(64) NOT NULL,
	"requestor_name" varchar(255) NOT NULL,
	"requestor_organization" varchar(255),
	"purpose_of_request" text NOT NULL,
	"authorized_by_officer" varchar(255),
	"status" varchar(64) DEFAULT 'REQUESTED' NOT NULL,
	"delivery_method" varchar(64) DEFAULT 'ELECTRONIC_SECURE_PORTAL' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical"."clinical_documentation_queries" ADD CONSTRAINT "clinical_documentation_queries_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."coding_reviews" ADD CONSTRAINT "coding_reviews_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."legal_record_requests" ADD CONSTRAINT "legal_record_requests_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medical_diagnosis_codes" ADD CONSTRAINT "medical_diagnosis_codes_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medical_record_completion_tasks" ADD CONSTRAINT "medical_record_completion_tasks_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medical_record_legal_holds" ADD CONSTRAINT "medical_record_legal_holds_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."release_of_information_requests" ADD CONSTRAINT "release_of_information_requests_record_id_medical_record_indexes_id_fk" FOREIGN KEY ("record_id") REFERENCES "clinical"."medical_record_indexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_brr_tenant_branch" ON "clinical"."birth_registry_records" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_brr_reg_num" ON "clinical"."birth_registry_records" USING btree ("tenant_id","birth_registration_number");--> statement-breakpoint
CREATE INDEX "idx_cdq_tenant_record" ON "clinical"."clinical_documentation_queries" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cdq_query_num" ON "clinical"."clinical_documentation_queries" USING btree ("tenant_id","query_number");--> statement-breakpoint
CREATE INDEX "idx_cr_tenant_record" ON "clinical"."coding_reviews" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cr_review_num" ON "clinical"."coding_reviews" USING btree ("tenant_id","review_number");--> statement-breakpoint
CREATE INDEX "idx_drr_tenant_branch" ON "clinical"."death_registry_records" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_drr_reg_num" ON "clinical"."death_registry_records" USING btree ("tenant_id","death_registration_number");--> statement-breakpoint
CREATE INDEX "idx_lrr_tenant_record" ON "clinical"."legal_record_requests" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lrr_req_num" ON "clinical"."legal_record_requests" USING btree ("tenant_id","legal_request_number");--> statement-breakpoint
CREATE INDEX "idx_mdc_tenant_record" ON "clinical"."medical_diagnosis_codes" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE INDEX "idx_mdc_code" ON "clinical"."medical_diagnosis_codes" USING btree ("tenant_id","icd_code");--> statement-breakpoint
CREATE INDEX "idx_mrae_tenant_branch" ON "clinical"."medical_record_audit_events" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mrae_trace_num" ON "clinical"."medical_record_audit_events" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_mrct_tenant_record" ON "clinical"."medical_record_completion_tasks" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mrct_task_code" ON "clinical"."medical_record_completion_tasks" USING btree ("tenant_id","task_code");--> statement-breakpoint
CREATE INDEX "idx_mri_tenant_patient" ON "clinical"."medical_record_indexes" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "idx_mri_tenant_encounter" ON "clinical"."medical_record_indexes" USING btree ("tenant_id","encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mri_record_num" ON "clinical"."medical_record_indexes" USING btree ("tenant_id","record_number");--> statement-breakpoint
CREATE INDEX "idx_mrlh_tenant_record" ON "clinical"."medical_record_legal_holds" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mrlh_hold_code" ON "clinical"."medical_record_legal_holds" USING btree ("tenant_id","hold_code");--> statement-breakpoint
CREATE INDEX "idx_mrd_tenant_branch" ON "clinical"."mr_departments" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mrd_code_branch" ON "clinical"."mr_departments" USING btree ("tenant_id","branch_id","department_code");--> statement-breakpoint
CREATE INDEX "idx_roi_tenant_record" ON "clinical"."release_of_information_requests" USING btree ("tenant_id","record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_roi_req_num" ON "clinical"."release_of_information_requests" USING btree ("tenant_id","request_number");