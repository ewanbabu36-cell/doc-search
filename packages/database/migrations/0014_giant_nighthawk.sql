CREATE TABLE "company"."board_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_code" varchar(100) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role_type" varchar(50) DEFAULT 'INDEPENDENT_DIRECTOR' NOT NULL,
	"representing_entity" varchar(255) NOT NULL,
	"voting_status" varchar(50) DEFAULT 'VOTING' NOT NULL,
	"term_start_date" timestamp with time zone NOT NULL,
	"term_end_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_members_member_code_unique" UNIQUE("member_code")
);
--> statement-breakpoint
CREATE TABLE "company"."committee_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_id" uuid NOT NULL,
	"member_id" uuid,
	"member_type" varchar(50) DEFAULT 'BOARD_MEMBER' NOT NULL,
	"member_name" varchar(255) NOT NULL,
	"member_email" varchar(255) NOT NULL,
	"role_in_committee" varchar(50) DEFAULT 'REGULAR_MEMBER' NOT NULL,
	"joined_date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."company_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_reference" varchar(255) NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_reference" varchar(255),
	"evidence_reference" varchar(255),
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "company_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "company"."compliance_officers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"officer_code" varchar(100) NOT NULL,
	"officer_role" varchar(50) DEFAULT 'HIPAA_PRIVACY_OFFICER' NOT NULL,
	"employee_id" uuid,
	"officer_name" varchar(255) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"appointment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"regulatory_authority_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_officers_officer_code_unique" UNIQUE("officer_code")
);
--> statement-breakpoint
CREATE TABLE "company"."corporate_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'BYLAWS' NOT NULL,
	"version_reference" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"legal_entity_id" uuid,
	"approved_by_board_at" timestamp with time zone,
	"review_cycle_months" integer DEFAULT 12 NOT NULL,
	"next_review_due" timestamp with time zone NOT NULL,
	"document_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "corporate_policies_policy_code_unique" UNIQUE("policy_code")
);
--> statement-breakpoint
CREATE TABLE "company"."departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_code" varchar(100) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"cost_center_code" varchar(50) NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"parent_department_id" uuid,
	"lead_employee_id" uuid,
	"lead_email" varchar(255),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_department_code_unique" UNIQUE("department_code")
);
--> statement-breakpoint
CREATE TABLE "company"."designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"designation_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"band_level" varchar(50) DEFAULT 'MID' NOT NULL,
	"department_id" uuid,
	"job_family" varchar(100) NOT NULL,
	"is_executive" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designations_designation_code_unique" UNIQUE("designation_code")
);
--> statement-breakpoint
CREATE TABLE "company"."governance_committees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_code" varchar(100) NOT NULL,
	"committee_name" varchar(255) NOT NULL,
	"committee_type" varchar(50) DEFAULT 'AUDIT' NOT NULL,
	"chair_person_id" uuid,
	"chair_email" varchar(255) NOT NULL,
	"charter_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_committees_committee_code_unique" UNIQUE("committee_code")
);
--> statement-breakpoint
CREATE TABLE "company"."governance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_code" varchar(100) NOT NULL,
	"event_type" varchar(50) DEFAULT 'BOARD_MEETING' NOT NULL,
	"title" varchar(255) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"organizer_email" varchar(255) NOT NULL,
	"minutes_reference" varchar(255),
	"resolution_reference" varchar(255),
	"status" varchar(50) DEFAULT 'SCHEDULED' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_events_event_code_unique" UNIQUE("event_code")
);
--> statement-breakpoint
CREATE TABLE "company"."internal_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_code" varchar(100) NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"designation_id" uuid NOT NULL,
	"manager_employee_id" uuid,
	"employment_type" varchar(50) DEFAULT 'FULL_TIME' NOT NULL,
	"employment_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "internal_employees_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "internal_employees_work_email_unique" UNIQUE("work_email")
);
--> statement-breakpoint
CREATE TABLE "company"."legal_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_code" varchar(100) NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"entity_type" varchar(50) DEFAULT 'C_CORP' NOT NULL,
	"jurisdiction" varchar(100) NOT NULL,
	"registration_number" varchar(100) NOT NULL,
	"incorporation_date" timestamp with time zone NOT NULL,
	"tax_identifier_reference" varchar(100) NOT NULL,
	"registered_address" text NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"parent_entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_entities_entity_code_unique" UNIQUE("entity_code")
);
--> statement-breakpoint
ALTER TABLE "company"."committee_memberships" ADD CONSTRAINT "committee_memberships_committee_id_governance_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "company"."governance_committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."company_audit_traces" ADD CONSTRAINT "company_audit_traces_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."compliance_officers" ADD CONSTRAINT "compliance_officers_employee_id_internal_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "company"."internal_employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."corporate_policies" ADD CONSTRAINT "corporate_policies_legal_entity_id_legal_entities_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "company"."legal_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."departments" ADD CONSTRAINT "departments_legal_entity_id_legal_entities_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "company"."legal_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."departments" ADD CONSTRAINT "departments_parent_department_id_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "company"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "company"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."internal_employees" ADD CONSTRAINT "internal_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."internal_employees" ADD CONSTRAINT "internal_employees_legal_entity_id_legal_entities_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "company"."legal_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."internal_employees" ADD CONSTRAINT "internal_employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "company"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."internal_employees" ADD CONSTRAINT "internal_employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "company"."designations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."internal_employees" ADD CONSTRAINT "internal_employees_manager_employee_id_internal_employees_id_fk" FOREIGN KEY ("manager_employee_id") REFERENCES "company"."internal_employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."legal_entities" ADD CONSTRAINT "legal_entities_parent_entity_id_legal_entities_id_fk" FOREIGN KEY ("parent_entity_id") REFERENCES "company"."legal_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_board_member_role" ON "company"."board_members" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX "idx_board_member_status" ON "company"."board_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_board_member_voting" ON "company"."board_members" USING btree ("voting_status");--> statement-breakpoint
CREATE INDEX "idx_comm_member_comm" ON "company"."committee_memberships" USING btree ("committee_id");--> statement-breakpoint
CREATE INDEX "idx_comm_member_status" ON "company"."committee_memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_company_trace_actor" ON "company"."company_audit_traces" USING btree ("actor_email");--> statement-breakpoint
CREATE INDEX "idx_company_trace_status" ON "company"."company_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_company_trace_occurred" ON "company"."company_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_comp_officer_role" ON "company"."compliance_officers" USING btree ("officer_role");--> statement-breakpoint
CREATE INDEX "idx_comp_officer_status" ON "company"."compliance_officers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_corp_policy_cat" ON "company"."corporate_policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_corp_policy_status" ON "company"."corporate_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_corp_policy_review" ON "company"."corporate_policies" USING btree ("next_review_due");--> statement-breakpoint
CREATE INDEX "idx_departments_entity" ON "company"."departments" USING btree ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_departments_status" ON "company"."departments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_departments_cost_center" ON "company"."departments" USING btree ("cost_center_code");--> statement-breakpoint
CREATE INDEX "idx_designations_band" ON "company"."designations" USING btree ("band_level");--> statement-breakpoint
CREATE INDEX "idx_designations_dept" ON "company"."designations" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_designations_status" ON "company"."designations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gov_comm_type" ON "company"."governance_committees" USING btree ("committee_type");--> statement-breakpoint
CREATE INDEX "idx_gov_comm_status" ON "company"."governance_committees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gov_event_type" ON "company"."governance_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_gov_event_status" ON "company"."governance_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gov_event_scheduled" ON "company"."governance_events" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_emp_legal_entity" ON "company"."internal_employees" USING btree ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_emp_department" ON "company"."internal_employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_emp_designation" ON "company"."internal_employees" USING btree ("designation_id");--> statement-breakpoint
CREATE INDEX "idx_emp_status" ON "company"."internal_employees" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "idx_legal_entities_type" ON "company"."legal_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_legal_entities_status" ON "company"."legal_entities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_legal_entities_parent" ON "company"."legal_entities" USING btree ("parent_entity_id");