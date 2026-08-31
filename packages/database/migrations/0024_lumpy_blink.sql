CREATE TABLE "clinical"."insurance_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"patient_id" uuid,
	"claim_id" uuid,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"financial_impact" numeric(12, 2) DEFAULT '0.00',
	"reason" text NOT NULL,
	"ip_address" varchar(100),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"hash_pointer" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"encounter_id" uuid,
	"authorization_number" varchar(100) NOT NULL,
	"requested_services" text NOT NULL,
	"diagnosis_context" text NOT NULL,
	"requested_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"approved_units" integer DEFAULT 1,
	"status" varchar(50) DEFAULT 'REQUESTED' NOT NULL,
	"payer_remarks" text,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"adjudicated_at" timestamp with time zone,
	"submitted_by" varchar(255),
	"adjudicated_by" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_authorizations_authorization_number_unique" UNIQUE("authorization_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claim_adjudications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"adjudication_reference" varchar(100) NOT NULL,
	"adjudication_status" varchar(50) NOT NULL,
	"total_billed" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2) NOT NULL,
	"denied_amount" numeric(12, 2) NOT NULL,
	"patient_responsibility" numeric(12, 2) NOT NULL,
	"contractual_adjustment" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"payer_remarks" text,
	"eob_document_url" varchar(500),
	"adjudicated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"adjudicated_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claim_adjudications_adjudication_reference_unique" UNIQUE("adjudication_reference")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claim_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"denial_id" uuid NOT NULL,
	"appeal_number" varchar(100) NOT NULL,
	"appeal_level" integer DEFAULT 1 NOT NULL,
	"appeal_reason" text NOT NULL,
	"supporting_documents_summary" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_by" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'SUBMITTED' NOT NULL,
	"outcome_notes" text,
	"recovered_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claim_appeals_appeal_number_unique" UNIQUE("appeal_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claim_denials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"claim_item_id" uuid,
	"denial_number" varchar(100) NOT NULL,
	"denial_code" varchar(50) NOT NULL,
	"denial_category" varchar(50) NOT NULL,
	"denial_reason" text NOT NULL,
	"denied_amount" numeric(12, 2) NOT NULL,
	"appeal_eligible" boolean DEFAULT true NOT NULL,
	"appeal_deadline" timestamp with time zone,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claim_denials_denial_number_unique" UNIQUE("denial_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claim_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"invoice_item_id" uuid,
	"charge_item_id" uuid,
	"service_code" varchar(50) NOT NULL,
	"service_description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"billed_amount" numeric(12, 2) NOT NULL,
	"allowed_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"approved_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"denied_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"patient_responsibility" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"denial_reason" text,
	"denial_code" varchar(50),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claim_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"submission_number" varchar(100) NOT NULL,
	"transmission_batch_id" varchar(100),
	"submission_payload_reference" text,
	"transmission_status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"payer_acknowledgement" text,
	"acknowledgement_reference" varchar(100),
	"submitted_by" varchar(255) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claim_submissions_submission_number_unique" UNIQUE("submission_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"encounter_id" uuid,
	"invoice_id" uuid,
	"authorization_id" uuid,
	"claim_number" varchar(100) NOT NULL,
	"claim_type" varchar(50) DEFAULT 'OUTPATIENT' NOT NULL,
	"submission_mode" varchar(50) DEFAULT 'ELECTRONIC_EDI' NOT NULL,
	"total_claim_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"denied_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"patient_responsibility" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"adjustment_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"primary_diagnosis_code" varchar(50),
	"primary_diagnosis_description" text,
	"attending_doctor_name" varchar(255),
	"submitted_at" timestamp with time zone,
	"submitted_by" varchar(255),
	"adjudicated_at" timestamp with time zone,
	"adjudicated_by" varchar(255),
	"settled_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_document_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"claim_id" uuid,
	"policy_id" uuid,
	"authorization_id" uuid,
	"document_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"mime_type" varchar(100) DEFAULT 'application/pdf' NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"uploaded_by" varchar(255) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_eligibility_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"check_reference_number" varchar(100) NOT NULL,
	"eligibility_status" varchar(50) DEFAULT 'PROCESSING' NOT NULL,
	"copay_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"copay_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"deductible_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"deductible_remaining" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"annual_benefit_limit" numeric(12, 2),
	"annual_benefit_remaining" numeric(12, 2),
	"pre_auth_required" boolean DEFAULT false NOT NULL,
	"benefits_summary" text,
	"payer_response_payload" jsonb DEFAULT '{}'::jsonb,
	"checked_by" varchar(255) NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_eligibility_checks_check_reference_number_unique" UNIQUE("check_reference_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_patient_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"member_id" varchar(100) NOT NULL,
	"policy_number" varchar(100) NOT NULL,
	"group_number" varchar(100),
	"subscriber_name" varchar(255) NOT NULL,
	"subscriber_relationship" varchar(50) DEFAULT 'SELF' NOT NULL,
	"subscriber_dob" timestamp with time zone,
	"subscriber_gender" varchar(20),
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"priority" varchar(20) DEFAULT 'PRIMARY' NOT NULL,
	"coverage_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"card_front_url" varchar(500),
	"card_back_url" varchar(500),
	"verified_at" timestamp with time zone,
	"verified_by" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_payers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"payer_code" varchar(50) NOT NULL,
	"payer_name" varchar(255) NOT NULL,
	"payer_type" varchar(50) NOT NULL,
	"tpa_name" varchar(255),
	"contact_person" varchar(150),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"claim_submission_mode" varchar(50) DEFAULT 'EDI_ELECTRONIC' NOT NULL,
	"electronic_payer_id" varchar(100),
	"settlement_period_days" integer DEFAULT 30 NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"plan_code" varchar(50) NOT NULL,
	"plan_name" varchar(255) NOT NULL,
	"plan_type" varchar(50) NOT NULL,
	"network_type" varchar(50) DEFAULT 'TIER_1_IN_NETWORK' NOT NULL,
	"copay_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"standard_deductible" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"pre_auth_threshold" numeric(12, 2) DEFAULT '500.00' NOT NULL,
	"authorization_rules" jsonb DEFAULT '{}'::jsonb,
	"coverage_rules" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"settlement_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"reconciliation_reference" varchar(100) NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"received_amount" numeric(12, 2) NOT NULL,
	"variance" numeric(12, 2) NOT NULL,
	"reconciliation_status" varchar(50) NOT NULL,
	"reason" text,
	"resolved_by" varchar(255) NOT NULL,
	"resolved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_reconciliations_reconciliation_reference_unique" UNIQUE("reconciliation_reference")
);
--> statement-breakpoint
CREATE TABLE "clinical"."insurance_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"payer_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"settlement_reference" varchar(100) NOT NULL,
	"eft_transaction_number" varchar(100),
	"settlement_amount" numeric(12, 2) NOT NULL,
	"settlement_date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'RECEIVED' NOT NULL,
	"payment_reference" varchar(100),
	"recorded_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_settlements_settlement_reference_unique" UNIQUE("settlement_reference")
);
--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_audit_traces" ADD CONSTRAINT "insurance_audit_traces_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_policy_id_insurance_patient_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "clinical"."insurance_patient_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_adjudications" ADD CONSTRAINT "insurance_claim_adjudications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_adjudications" ADD CONSTRAINT "insurance_claim_adjudications_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_appeals" ADD CONSTRAINT "insurance_claim_appeals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_appeals" ADD CONSTRAINT "insurance_claim_appeals_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_appeals" ADD CONSTRAINT "insurance_claim_appeals_denial_id_insurance_claim_denials_id_fk" FOREIGN KEY ("denial_id") REFERENCES "clinical"."insurance_claim_denials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_denials" ADD CONSTRAINT "insurance_claim_denials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_denials" ADD CONSTRAINT "insurance_claim_denials_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_denials" ADD CONSTRAINT "insurance_claim_denials_claim_item_id_insurance_claim_items_id_fk" FOREIGN KEY ("claim_item_id") REFERENCES "clinical"."insurance_claim_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_items" ADD CONSTRAINT "insurance_claim_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_items" ADD CONSTRAINT "insurance_claim_items_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_items" ADD CONSTRAINT "insurance_claim_items_invoice_item_id_billing_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "clinical"."billing_invoice_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_items" ADD CONSTRAINT "insurance_claim_items_charge_item_id_billing_charge_items_id_fk" FOREIGN KEY ("charge_item_id") REFERENCES "clinical"."billing_charge_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_submissions" ADD CONSTRAINT "insurance_claim_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claim_submissions" ADD CONSTRAINT "insurance_claim_submissions_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_policy_id_insurance_patient_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "clinical"."insurance_patient_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_claims" ADD CONSTRAINT "insurance_claims_authorization_id_insurance_authorizations_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "clinical"."insurance_authorizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_policy_id_insurance_patient_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "clinical"."insurance_patient_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_document_records" ADD CONSTRAINT "insurance_document_records_authorization_id_insurance_authorizations_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "clinical"."insurance_authorizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_policy_id_insurance_patient_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "clinical"."insurance_patient_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_eligibility_checks" ADD CONSTRAINT "insurance_eligibility_checks_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_patient_policies" ADD CONSTRAINT "insurance_patient_policies_plan_id_insurance_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "clinical"."insurance_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_payers" ADD CONSTRAINT "insurance_payers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_payers" ADD CONSTRAINT "insurance_payers_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_payers" ADD CONSTRAINT "insurance_payers_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_payers" ADD CONSTRAINT "insurance_payers_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_plans" ADD CONSTRAINT "insurance_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_plans" ADD CONSTRAINT "insurance_plans_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_plans" ADD CONSTRAINT "insurance_plans_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_plans" ADD CONSTRAINT "insurance_plans_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_settlement_id_insurance_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "clinical"."insurance_settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_reconciliations" ADD CONSTRAINT "insurance_reconciliations_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "clinical"."insurance_payers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."insurance_settlements" ADD CONSTRAINT "insurance_settlements_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "clinical"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ins_audit_tenant" ON "clinical"."insurance_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_audit_trace" ON "clinical"."insurance_audit_traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_ins_audit_entity" ON "clinical"."insurance_audit_traces" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_ins_audit_claim" ON "clinical"."insurance_audit_traces" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_audit_op" ON "clinical"."insurance_audit_traces" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "idx_ins_auth_tenant" ON "clinical"."insurance_authorizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_auth_patient" ON "clinical"."insurance_authorizations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ins_auth_payer" ON "clinical"."insurance_authorizations" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_ins_auth_number" ON "clinical"."insurance_authorizations" USING btree ("authorization_number");--> statement-breakpoint
CREATE INDEX "idx_ins_auth_status" ON "clinical"."insurance_authorizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ins_adj_tenant" ON "clinical"."insurance_claim_adjudications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_adj_claim" ON "clinical"."insurance_claim_adjudications" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_adj_status" ON "clinical"."insurance_claim_adjudications" USING btree ("adjudication_status");--> statement-breakpoint
CREATE INDEX "idx_ins_appeal_tenant" ON "clinical"."insurance_claim_appeals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_appeal_claim" ON "clinical"."insurance_claim_appeals" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_appeal_denial" ON "clinical"."insurance_claim_appeals" USING btree ("denial_id");--> statement-breakpoint
CREATE INDEX "idx_ins_appeal_status" ON "clinical"."insurance_claim_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ins_denial_tenant" ON "clinical"."insurance_claim_denials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_denial_claim" ON "clinical"."insurance_claim_denials" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_denial_code" ON "clinical"."insurance_claim_denials" USING btree ("denial_code");--> statement-breakpoint
CREATE INDEX "idx_ins_denial_cat" ON "clinical"."insurance_claim_denials" USING btree ("denial_category");--> statement-breakpoint
CREATE INDEX "idx_ins_item_tenant" ON "clinical"."insurance_claim_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_item_claim" ON "clinical"."insurance_claim_items" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_item_service" ON "clinical"."insurance_claim_items" USING btree ("service_code");--> statement-breakpoint
CREATE INDEX "idx_ins_sub_tenant" ON "clinical"."insurance_claim_submissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_sub_claim" ON "clinical"."insurance_claim_submissions" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_sub_batch" ON "clinical"."insurance_claim_submissions" USING btree ("transmission_batch_id");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_tenant" ON "clinical"."insurance_claims" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_patient" ON "clinical"."insurance_claims" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_payer" ON "clinical"."insurance_claims" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_number" ON "clinical"."insurance_claims" USING btree ("claim_number");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_status" ON "clinical"."insurance_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ins_claim_invoice" ON "clinical"."insurance_claims" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ins_doc_tenant" ON "clinical"."insurance_document_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_doc_claim" ON "clinical"."insurance_document_records" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_doc_policy" ON "clinical"."insurance_document_records" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_ins_elig_tenant" ON "clinical"."insurance_eligibility_checks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_elig_patient" ON "clinical"."insurance_eligibility_checks" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ins_elig_policy" ON "clinical"."insurance_eligibility_checks" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_ins_elig_status" ON "clinical"."insurance_eligibility_checks" USING btree ("eligibility_status");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_tenant" ON "clinical"."insurance_patient_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_patient" ON "clinical"."insurance_patient_policies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_payer" ON "clinical"."insurance_patient_policies" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_plan" ON "clinical"."insurance_patient_policies" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_member" ON "clinical"."insurance_patient_policies" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_ins_policy_status" ON "clinical"."insurance_patient_policies" USING btree ("coverage_status");--> statement-breakpoint
CREATE INDEX "idx_ins_payer_tenant" ON "clinical"."insurance_payers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_payer_partner" ON "clinical"."insurance_payers" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_ins_payer_org" ON "clinical"."insurance_payers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ins_payer_code" ON "clinical"."insurance_payers" USING btree ("payer_code");--> statement-breakpoint
CREATE INDEX "idx_ins_payer_status" ON "clinical"."insurance_payers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ins_plan_tenant" ON "clinical"."insurance_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_plan_payer" ON "clinical"."insurance_plans" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_ins_plan_code" ON "clinical"."insurance_plans" USING btree ("plan_code");--> statement-breakpoint
CREATE INDEX "idx_ins_plan_status" ON "clinical"."insurance_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ins_rec_tenant" ON "clinical"."insurance_reconciliations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_rec_settle" ON "clinical"."insurance_reconciliations" USING btree ("settlement_id");--> statement-breakpoint
CREATE INDEX "idx_ins_rec_claim" ON "clinical"."insurance_reconciliations" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_rec_status" ON "clinical"."insurance_reconciliations" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "idx_ins_settle_tenant" ON "clinical"."insurance_settlements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ins_settle_payer" ON "clinical"."insurance_settlements" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_ins_settle_claim" ON "clinical"."insurance_settlements" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_ins_settle_ref" ON "clinical"."insurance_settlements" USING btree ("settlement_reference");