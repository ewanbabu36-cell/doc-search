CREATE TABLE "clinical"."patient_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"address_type" varchar(50) DEFAULT 'RESIDENTIAL' NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"country" varchar(100) DEFAULT 'USA' NOT NULL,
	"postal_code" varchar(50) NOT NULL,
	"is_primary" varchar(10) DEFAULT 'TRUE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"consent_status" varchar(50) DEFAULT 'GRANTED' NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"recorded_by" varchar(255) NOT NULL,
	"audit_reference" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"primary_mobile" varchar(50) NOT NULL,
	"alternate_mobile" varchar(50),
	"email" varchar(255),
	"preferred_contact_method" varchar(50) DEFAULT 'MOBILE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_duplicate_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_patient_id" uuid NOT NULL,
	"matched_patient_id" uuid NOT NULL,
	"confidence_score" numeric(5, 2) NOT NULL,
	"match_category" varchar(50) NOT NULL,
	"matching_signals" jsonb DEFAULT '[]'::jsonb,
	"review_status" varchar(50) DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reviewed_by" varchar(255),
	"review_notes" text,
	"reviewed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"relationship" varchar(100) NOT NULL,
	"primary_phone" varchar(50) NOT NULL,
	"alternate_phone" varchar(50),
	"address" text,
	"is_primary" varchar(10) DEFAULT 'TRUE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"identifier_type" varchar(50) NOT NULL,
	"identifier_value" varchar(255) NOT NULL,
	"issuing_authority" varchar(255),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"payer_name" varchar(255) NOT NULL,
	"policy_number" varchar(100) NOT NULL,
	"member_id" varchar(100) NOT NULL,
	"plan_name" varchar(255) NOT NULL,
	"tpa_name" varchar(255),
	"coverage_type" varchar(50) DEFAULT 'PRIMARY' NOT NULL,
	"eligibility_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"coverage_start_date" timestamp with time zone NOT NULL,
	"coverage_end_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_merge_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"canonical_patient_id" uuid NOT NULL,
	"merged_patient_id" uuid NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"merge_reason" text NOT NULL,
	"merged_snapshot" jsonb DEFAULT '{}'::jsonb,
	"correlation_id" varchar(255) NOT NULL,
	"merged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."patient_registration_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid,
	"actor_id" varchar(100) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"target_entity_id" varchar(100) NOT NULL,
	"justification" text NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_registration_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"mrn" varchar(100) NOT NULL,
	"patient_code" varchar(100) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"preferred_name" varchar(100),
	"date_of_birth" varchar(50) NOT NULL,
	"gender" varchar(50) NOT NULL,
	"blood_group" varchar(20),
	"marital_status" varchar(50),
	"nationality" varchar(100),
	"preferred_language" varchar(100) DEFAULT 'English' NOT NULL,
	"occupation" varchar(150),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"registration_source" varchar(100) DEFAULT 'RECEPTION_DESK' NOT NULL,
	"merged_into_patient_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."patient_addresses" ADD CONSTRAINT "patient_addresses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_addresses" ADD CONSTRAINT "patient_addresses_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_addresses" ADD CONSTRAINT "patient_addresses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_consents" ADD CONSTRAINT "patient_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_consents" ADD CONSTRAINT "patient_consents_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_consents" ADD CONSTRAINT "patient_consents_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_consents" ADD CONSTRAINT "patient_consents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_contacts" ADD CONSTRAINT "patient_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_contacts" ADD CONSTRAINT "patient_contacts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_contacts" ADD CONSTRAINT "patient_contacts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_duplicate_candidates" ADD CONSTRAINT "patient_duplicate_candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_duplicate_candidates" ADD CONSTRAINT "patient_duplicate_candidates_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_duplicate_candidates" ADD CONSTRAINT "patient_duplicate_candidates_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_duplicate_candidates" ADD CONSTRAINT "patient_duplicate_candidates_source_patient_id_patients_id_fk" FOREIGN KEY ("source_patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_duplicate_candidates" ADD CONSTRAINT "patient_duplicate_candidates_matched_patient_id_patients_id_fk" FOREIGN KEY ("matched_patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_emergency_contacts" ADD CONSTRAINT "patient_emergency_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_emergency_contacts" ADD CONSTRAINT "patient_emergency_contacts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_emergency_contacts" ADD CONSTRAINT "patient_emergency_contacts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_identifiers" ADD CONSTRAINT "patient_identifiers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_identifiers" ADD CONSTRAINT "patient_identifiers_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_identifiers" ADD CONSTRAINT "patient_identifiers_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_identifiers" ADD CONSTRAINT "patient_identifiers_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_insurance_policies" ADD CONSTRAINT "patient_insurance_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_insurance_policies" ADD CONSTRAINT "patient_insurance_policies_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_insurance_policies" ADD CONSTRAINT "patient_insurance_policies_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_insurance_policies" ADD CONSTRAINT "patient_insurance_policies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_merge_events" ADD CONSTRAINT "patient_merge_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_merge_events" ADD CONSTRAINT "patient_merge_events_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_merge_events" ADD CONSTRAINT "patient_merge_events_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_merge_events" ADD CONSTRAINT "patient_merge_events_canonical_patient_id_patients_id_fk" FOREIGN KEY ("canonical_patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_merge_events" ADD CONSTRAINT "patient_merge_events_merged_patient_id_patients_id_fk" FOREIGN KEY ("merged_patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_registration_audit_traces" ADD CONSTRAINT "patient_registration_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_registration_audit_traces" ADD CONSTRAINT "patient_registration_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_registration_audit_traces" ADD CONSTRAINT "patient_registration_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patient_registration_audit_traces" ADD CONSTRAINT "patient_registration_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patients" ADD CONSTRAINT "patients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patients" ADD CONSTRAINT "patients_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patients" ADD CONSTRAINT "patients_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patients" ADD CONSTRAINT "patients_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."patients" ADD CONSTRAINT "patients_merged_into_patient_id_patients_id_fk" FOREIGN KEY ("merged_into_patient_id") REFERENCES "clinical"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_patient_addresses_tenant" ON "clinical"."patient_addresses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_addresses_patient" ON "clinical"."patient_addresses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_addresses_city" ON "clinical"."patient_addresses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_patient_consents_tenant" ON "clinical"."patient_consents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_consents_patient" ON "clinical"."patient_consents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_consents_type" ON "clinical"."patient_consents" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "idx_patient_contacts_tenant" ON "clinical"."patient_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_contacts_patient" ON "clinical"."patient_contacts" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_contacts_mobile" ON "clinical"."patient_contacts" USING btree ("primary_mobile");--> statement-breakpoint
CREATE INDEX "idx_patient_contacts_email" ON "clinical"."patient_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_patient_dup_tenant" ON "clinical"."patient_duplicate_candidates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_dup_source" ON "clinical"."patient_duplicate_candidates" USING btree ("source_patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_dup_matched" ON "clinical"."patient_duplicate_candidates" USING btree ("matched_patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_dup_status" ON "clinical"."patient_duplicate_candidates" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_patient_emerg_tenant" ON "clinical"."patient_emergency_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_emerg_patient" ON "clinical"."patient_emergency_contacts" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_ident_tenant" ON "clinical"."patient_identifiers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_ident_patient" ON "clinical"."patient_identifiers" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_ident_val" ON "clinical"."patient_identifiers" USING btree ("identifier_type","identifier_value");--> statement-breakpoint
CREATE INDEX "idx_patient_ins_tenant" ON "clinical"."patient_insurance_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_ins_patient" ON "clinical"."patient_insurance_policies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_ins_policy" ON "clinical"."patient_insurance_policies" USING btree ("policy_number");--> statement-breakpoint
CREATE INDEX "idx_patient_merge_tenant" ON "clinical"."patient_merge_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_merge_canonical" ON "clinical"."patient_merge_events" USING btree ("canonical_patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_merge_merged" ON "clinical"."patient_merge_events" USING btree ("merged_patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_tenant" ON "clinical"."patient_registration_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_partner" ON "clinical"."patient_registration_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_org" ON "clinical"."patient_registration_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_patient" ON "clinical"."patient_registration_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_status" ON "clinical"."patient_registration_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_patient_audit_occurred" ON "clinical"."patient_registration_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_patients_tenant" ON "clinical"."patients" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_patients_partner" ON "clinical"."patients" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_patients_org" ON "clinical"."patients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_patients_branch" ON "clinical"."patients" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_patients_mrn" ON "clinical"."patients" USING btree ("mrn");--> statement-breakpoint
CREATE INDEX "idx_patients_status" ON "clinical"."patients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_patients_dob" ON "clinical"."patients" USING btree ("date_of_birth");--> statement-breakpoint
CREATE INDEX "idx_patients_name" ON "clinical"."patients" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_patients_tenant_mrn" ON "clinical"."patients" USING btree ("tenant_id","mrn");