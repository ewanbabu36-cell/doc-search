CREATE TABLE "company"."baa_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baa_code" varchar(100) NOT NULL,
	"partner_id" uuid,
	"partner_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"signed_reference" varchar(255) NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"review_due_date" timestamp with time zone,
	"termination_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "baa_records_baa_code_unique" UNIQUE("baa_code")
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_control_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"control_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"mapping_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"mapping_notes" text,
	"mapped_by_id" uuid,
	"mapped_by_email" varchar(255) NOT NULL,
	"mapped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework_id" uuid NOT NULL,
	"control_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"control_category" varchar(100) NOT NULL,
	"control_status" varchar(50) DEFAULT 'NOT_STARTED' NOT NULL,
	"requirement_summary" text NOT NULL,
	"implementation_notes" text,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"review_due_date" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_code" varchar(100) NOT NULL,
	"evidence_type" varchar(50) DEFAULT 'POLICY_DOCUMENT' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"source_domain" varchar(100) NOT NULL,
	"source_reference" varchar(255) NOT NULL,
	"evidence_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"submitted_by_id" uuid,
	"submitted_by_email" varchar(255) NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_by_email" varchar(255),
	"reviewed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_evidence_evidence_code_unique" UNIQUE("evidence_code")
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework_code" varchar(100) NOT NULL,
	"framework_type" varchar(50) DEFAULT 'HIPAA' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_frameworks_framework_code_unique" UNIQUE("framework_code")
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_code" varchar(100) NOT NULL,
	"report_name" varchar(255) NOT NULL,
	"framework_type" varchar(50) DEFAULT 'HIPAA' NOT NULL,
	"reporting_period_start" timestamp with time zone NOT NULL,
	"reporting_period_end" timestamp with time zone NOT NULL,
	"output_format" varchar(50) DEFAULT 'PDF_AND_JSON' NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by_id" uuid,
	"generated_by_email" varchar(255) NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_reports_report_code_unique" UNIQUE("report_code")
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_code" varchar(100) NOT NULL,
	"control_id" uuid NOT NULL,
	"verification_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"verifier_id" uuid,
	"verifier_email" varchar(255) NOT NULL,
	"verification_date" timestamp with time zone DEFAULT now() NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"findings" text NOT NULL,
	"remediation_required" boolean DEFAULT false NOT NULL,
	"remediation_due_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_verifications_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "company"."data_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classification_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"classification_level" varchar(50) DEFAULT 'INTERNAL' NOT NULL,
	"description" text NOT NULL,
	"handling_requirements" jsonb DEFAULT '[]'::jsonb,
	"export_allowed" boolean DEFAULT false NOT NULL,
	"external_sharing_allowed" boolean DEFAULT false NOT NULL,
	"retention_required" boolean DEFAULT true NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_classifications_classification_code_unique" UNIQUE("classification_code")
);
--> statement-breakpoint
CREATE TABLE "company"."data_retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"default_retention_days" integer DEFAULT 2555 NOT NULL,
	"legal_hold_supported" boolean DEFAULT true NOT NULL,
	"deletion_method" varchar(100) DEFAULT 'CRYPTOGRAPHIC_ERASURE' NOT NULL,
	"archive_before_delete" boolean DEFAULT true NOT NULL,
	"approval_required" boolean DEFAULT true NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_retention_policies_policy_code_unique" UNIQUE("policy_code")
);
--> statement-breakpoint
CREATE TABLE "company"."data_retention_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retention_policy_id" uuid NOT NULL,
	"data_domain" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"classification_level" varchar(50) DEFAULT 'INTERNAL' NOT NULL,
	"retention_days" integer NOT NULL,
	"legal_hold_behavior" varchar(100) DEFAULT 'SUSPEND_DELETION' NOT NULL,
	"deletion_behavior" varchar(100) DEFAULT 'PURGE_AND_AUDIT' NOT NULL,
	"archive_behavior" varchar(100) DEFAULT 'COLD_STORAGE_ENCRYPTED' NOT NULL,
	"exception_allowed" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."governance_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exception_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"framework_id" uuid,
	"control_id" uuid,
	"requested_by_id" uuid,
	"requested_by_email" varchar(255) NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'REQUESTED' NOT NULL,
	"risk_level" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"justification" text NOT NULL,
	"compensating_controls" text NOT NULL,
	"requested_expiration_date" timestamp with time zone,
	"approved_by_id" uuid,
	"approved_by_email" varchar(255),
	"approved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"closure_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_exceptions_exception_code_unique" UNIQUE("exception_code")
);
--> statement-breakpoint
ALTER TABLE "company"."baa_records" ADD CONSTRAINT "baa_records_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."baa_records" ADD CONSTRAINT "baa_records_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_control_mappings" ADD CONSTRAINT "compliance_control_mappings_control_id_compliance_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "company"."compliance_controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_control_mappings" ADD CONSTRAINT "compliance_control_mappings_evidence_id_compliance_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "company"."compliance_evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_control_mappings" ADD CONSTRAINT "compliance_control_mappings_mapped_by_id_users_id_fk" FOREIGN KEY ("mapped_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_controls" ADD CONSTRAINT "compliance_controls_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "company"."compliance_frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_controls" ADD CONSTRAINT "compliance_controls_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_evidence" ADD CONSTRAINT "compliance_evidence_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_evidence" ADD CONSTRAINT "compliance_evidence_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_frameworks" ADD CONSTRAINT "compliance_frameworks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_reports" ADD CONSTRAINT "compliance_reports_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_verifications" ADD CONSTRAINT "compliance_verifications_control_id_compliance_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "company"."compliance_controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_verifications" ADD CONSTRAINT "compliance_verifications_verifier_id_users_id_fk" FOREIGN KEY ("verifier_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."data_classifications" ADD CONSTRAINT "data_classifications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."data_retention_policies" ADD CONSTRAINT "data_retention_policies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."data_retention_rules" ADD CONSTRAINT "data_retention_rules_retention_policy_id_data_retention_policies_id_fk" FOREIGN KEY ("retention_policy_id") REFERENCES "company"."data_retention_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."governance_exceptions" ADD CONSTRAINT "governance_exceptions_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "company"."compliance_frameworks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."governance_exceptions" ADD CONSTRAINT "governance_exceptions_control_id_compliance_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "company"."compliance_controls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."governance_exceptions" ADD CONSTRAINT "governance_exceptions_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."governance_exceptions" ADD CONSTRAINT "governance_exceptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."governance_exceptions" ADD CONSTRAINT "governance_exceptions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_baa_records_partner" ON "company"."baa_records" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_baa_records_status" ON "company"."baa_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_baa_records_exp" ON "company"."baa_records" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "idx_baa_records_review" ON "company"."baa_records" USING btree ("review_due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_comp_mapping_ctrl_ev" ON "company"."compliance_control_mappings" USING btree ("control_id","evidence_id");--> statement-breakpoint
CREATE INDEX "idx_comp_mappings_control" ON "company"."compliance_control_mappings" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "idx_comp_mappings_evidence" ON "company"."compliance_control_mappings" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_comp_mappings_status" ON "company"."compliance_control_mappings" USING btree ("mapping_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_compliance_control_framework_code" ON "company"."compliance_controls" USING btree ("framework_id","control_code");--> statement-breakpoint
CREATE INDEX "idx_comp_controls_framework" ON "company"."compliance_controls" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "idx_comp_controls_status" ON "company"."compliance_controls" USING btree ("control_status");--> statement-breakpoint
CREATE INDEX "idx_comp_controls_review_due" ON "company"."compliance_controls" USING btree ("review_due_date");--> statement-breakpoint
CREATE INDEX "idx_comp_evidence_type" ON "company"."compliance_evidence" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "idx_comp_evidence_status" ON "company"."compliance_evidence" USING btree ("evidence_status");--> statement-breakpoint
CREATE INDEX "idx_comp_evidence_valid_until" ON "company"."compliance_evidence" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_comp_evidence_source_domain" ON "company"."compliance_evidence" USING btree ("source_domain");--> statement-breakpoint
CREATE INDEX "idx_comp_framework_type" ON "company"."compliance_frameworks" USING btree ("framework_type");--> statement-breakpoint
CREATE INDEX "idx_comp_framework_status" ON "company"."compliance_frameworks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_comp_framework_code" ON "company"."compliance_frameworks" USING btree ("framework_code");--> statement-breakpoint
CREATE INDEX "idx_comp_reports_framework" ON "company"."compliance_reports" USING btree ("framework_type");--> statement-breakpoint
CREATE INDEX "idx_comp_reports_status" ON "company"."compliance_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_comp_reports_gen_at" ON "company"."compliance_reports" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "idx_comp_verif_control" ON "company"."compliance_verifications" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "idx_comp_verif_status" ON "company"."compliance_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_comp_verif_date" ON "company"."compliance_verifications" USING btree ("verification_date");--> statement-breakpoint
CREATE INDEX "idx_data_class_level" ON "company"."data_classifications" USING btree ("classification_level");--> statement-breakpoint
CREATE INDEX "idx_data_class_status" ON "company"."data_classifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retention_policy_status" ON "company"."data_retention_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retention_policy_code" ON "company"."data_retention_policies" USING btree ("policy_code");--> statement-breakpoint
CREATE INDEX "idx_retention_rules_policy" ON "company"."data_retention_rules" USING btree ("retention_policy_id");--> statement-breakpoint
CREATE INDEX "idx_retention_rules_domain" ON "company"."data_retention_rules" USING btree ("data_domain");--> statement-breakpoint
CREATE INDEX "idx_retention_rules_class" ON "company"."data_retention_rules" USING btree ("classification_level");--> statement-breakpoint
CREATE INDEX "idx_gov_exceptions_framework" ON "company"."governance_exceptions" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "idx_gov_exceptions_control" ON "company"."governance_exceptions" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "idx_gov_exceptions_status" ON "company"."governance_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gov_exceptions_risk" ON "company"."governance_exceptions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_gov_exceptions_exp" ON "company"."governance_exceptions" USING btree ("requested_expiration_date");