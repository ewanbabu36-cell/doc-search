CREATE TABLE "clinical"."abdm_audit_traces" (
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
CREATE TABLE "clinical"."abdm_care_context_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"abha_address" varchar(128) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"care_context_type" varchar(64) NOT NULL,
	"care_context_ref" varchar(64) NOT NULL,
	"display_title" varchar(255) NOT NULL,
	"encounter_date" varchar(32) NOT NULL,
	"doctor_name" varchar(128) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"is_linked_abdm" boolean DEFAULT true NOT NULL,
	"fhir_bundle_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."abdm_consent_artefacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"consent_request_id" varchar(64) NOT NULL,
	"artefact_id" varchar(64) NOT NULL,
	"patient_abha_address" varchar(128) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"requester_hip_hiu" varchar(255) NOT NULL,
	"purpose_code" varchar(32) NOT NULL,
	"purpose_description" varchar(255) NOT NULL,
	"date_from" varchar(32) NOT NULL,
	"date_to" varchar(32) NOT NULL,
	"data_erase_date" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'GRANTED' NOT NULL,
	"granted_at" timestamp with time zone,
	"linked_care_context_refs" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."fhir_bundles_repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"bundle_id" varchar(64) NOT NULL,
	"profile_type" varchar(64) NOT NULL,
	"patient_abha_address" varchar(128) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"care_context_ref" varchar(64) NOT NULL,
	"document_date" varchar(32) NOT NULL,
	"author_hpr_id" varchar(64) NOT NULL,
	"author_practitioner_name" varchar(128) NOT NULL,
	"facility_hfr_id" varchar(64) NOT NULL,
	"fhir_json_payload" text NOT NULL,
	"validation_status" varchar(32) DEFAULT 'VALID_FHIR_R4' NOT NULL,
	"digital_signature_hash" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_abha_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"abha_number" varchar(32) NOT NULL,
	"abha_address" varchar(128) NOT NULL,
	"mobile_number" varchar(32) NOT NULL,
	"gender" varchar(8) NOT NULL,
	"date_of_birth" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"kyc_status" varchar(32) DEFAULT 'VERIFIED_AADHAAR' NOT NULL,
	"abha_card_qr_payload" text NOT NULL,
	"linked_care_contexts_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_abtr_tenant_branch" ON "clinical"."abdm_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_abtr_num" ON "clinical"."abdm_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_accm_tenant_abha" ON "clinical"."abdm_care_context_mappings" USING btree ("tenant_id","abha_address");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_accm_ref" ON "clinical"."abdm_care_context_mappings" USING btree ("tenant_id","care_context_ref");--> statement-breakpoint
CREATE INDEX "idx_aca_tenant_abha" ON "clinical"."abdm_consent_artefacts" USING btree ("tenant_id","patient_abha_address");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_aca_artefact" ON "clinical"."abdm_consent_artefacts" USING btree ("tenant_id","artefact_id");--> statement-breakpoint
CREATE INDEX "idx_fbr_tenant_care_ctx" ON "clinical"."fhir_bundles_repository" USING btree ("tenant_id","care_context_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fbr_bundle" ON "clinical"."fhir_bundles_repository" USING btree ("tenant_id","bundle_id");--> statement-breakpoint
CREATE INDEX "idx_paa_tenant_patient" ON "clinical"."patient_abha_accounts" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_paa_abha_addr" ON "clinical"."patient_abha_accounts" USING btree ("tenant_id","abha_address");