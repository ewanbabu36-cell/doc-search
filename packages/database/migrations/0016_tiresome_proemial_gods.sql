CREATE TABLE "clinical"."operational_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"department_code" varchar(100) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"parent_department_id" uuid,
	"department_head_id" varchar(100),
	"department_head_name" varchar(255),
	"cost_center_code" varchar(100),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_departments_department_code_unique" UNIQUE("department_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"staff_code" varchar(100) NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"work_phone" varchar(50),
	"staff_type" varchar(50) DEFAULT 'DOCTOR' NOT NULL,
	"primary_role" varchar(100) DEFAULT 'ATTENDING_PHYSICIAN' NOT NULL,
	"employment_type" varchar(50) DEFAULT 'FULL_TIME' NOT NULL,
	"employment_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"joining_date" timestamp with time zone NOT NULL,
	"professional_profile_ref" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_staff_staff_code_unique" UNIQUE("staff_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_staff_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid,
	"branch_id" uuid,
	"department_id" uuid,
	"staff_id" uuid,
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
	CONSTRAINT "operational_staff_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."staff_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"credential_type" varchar(50) NOT NULL,
	"registration_number" varchar(100) NOT NULL,
	"issuing_authority" varchar(255) NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"verification_reference" varchar(255),
	"document_reference" varchar(255),
	"verified_by" varchar(100),
	"verified_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."staff_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"department_id" uuid,
	"staff_id" uuid NOT NULL,
	"role_code" varchar(100) NOT NULL,
	"data_scope" varchar(50) DEFAULT 'BRANCH' NOT NULL,
	"is_primary" varchar(10) DEFAULT 'TRUE' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"assigned_by" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."staff_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"from_organization_id" uuid NOT NULL,
	"to_organization_id" uuid NOT NULL,
	"from_branch_id" uuid NOT NULL,
	"to_branch_id" uuid NOT NULL,
	"from_department_id" uuid NOT NULL,
	"to_department_id" uuid NOT NULL,
	"transfer_type" varchar(50) DEFAULT 'INTRA_BRANCH' NOT NULL,
	"transfer_status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"authorized_by" varchar(100) NOT NULL,
	"justification" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."operational_departments" ADD CONSTRAINT "operational_departments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_departments" ADD CONSTRAINT "operational_departments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_departments" ADD CONSTRAINT "operational_departments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_departments" ADD CONSTRAINT "operational_departments_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_departments" ADD CONSTRAINT "operational_departments_parent_department_id_operational_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff" ADD CONSTRAINT "operational_staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff" ADD CONSTRAINT "operational_staff_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff" ADD CONSTRAINT "operational_staff_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff" ADD CONSTRAINT "operational_staff_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff" ADD CONSTRAINT "operational_staff_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_staff_audit_traces" ADD CONSTRAINT "operational_staff_audit_traces_staff_id_operational_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "clinical"."operational_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_credentials" ADD CONSTRAINT "staff_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_credentials" ADD CONSTRAINT "staff_credentials_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_credentials" ADD CONSTRAINT "staff_credentials_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_credentials" ADD CONSTRAINT "staff_credentials_staff_id_operational_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "clinical"."operational_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_staff_id_operational_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "clinical"."operational_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_staff_id_operational_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "clinical"."operational_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_from_organization_id_operational_organizations_id_fk" FOREIGN KEY ("from_organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_to_organization_id_operational_organizations_id_fk" FOREIGN KEY ("to_organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_from_branch_id_operational_facilities_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_to_branch_id_operational_facilities_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_from_department_id_operational_departments_id_fk" FOREIGN KEY ("from_department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."staff_transfers" ADD CONSTRAINT "staff_transfers_to_department_id_operational_departments_id_fk" FOREIGN KEY ("to_department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_op_dept_tenant" ON "clinical"."operational_departments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_dept_org" ON "clinical"."operational_departments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_dept_branch" ON "clinical"."operational_departments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_op_dept_parent" ON "clinical"."operational_departments" USING btree ("parent_department_id");--> statement-breakpoint
CREATE INDEX "idx_op_dept_status" ON "clinical"."operational_departments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_op_staff_tenant" ON "clinical"."operational_staff" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_org" ON "clinical"."operational_staff" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_branch" ON "clinical"."operational_staff" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_dept" ON "clinical"."operational_staff" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_type" ON "clinical"."operational_staff" USING btree ("staff_type");--> statement-breakpoint
CREATE INDEX "idx_op_staff_status" ON "clinical"."operational_staff" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "idx_op_staff_email" ON "clinical"."operational_staff" USING btree ("work_email");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_tenant" ON "clinical"."operational_staff_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_partner" ON "clinical"."operational_staff_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_org" ON "clinical"."operational_staff_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_staff" ON "clinical"."operational_staff_audit_traces" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_status" ON "clinical"."operational_staff_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_op_staff_audit_occurred" ON "clinical"."operational_staff_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_staff_cred_tenant" ON "clinical"."staff_credentials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_staff_cred_staff" ON "clinical"."staff_credentials" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_staff_cred_type" ON "clinical"."staff_credentials" USING btree ("credential_type");--> statement-breakpoint
CREATE INDEX "idx_staff_cred_status" ON "clinical"."staff_credentials" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_staff_cred_expiry" ON "clinical"."staff_credentials" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_staff_roles_tenant" ON "clinical"."staff_role_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_staff_roles_staff" ON "clinical"."staff_role_assignments" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_staff_roles_role" ON "clinical"."staff_role_assignments" USING btree ("role_code");--> statement-breakpoint
CREATE INDEX "idx_staff_roles_scope" ON "clinical"."staff_role_assignments" USING btree ("data_scope");--> statement-breakpoint
CREATE INDEX "idx_staff_trans_tenant" ON "clinical"."staff_transfers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_staff_trans_staff" ON "clinical"."staff_transfers" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_staff_trans_type" ON "clinical"."staff_transfers" USING btree ("transfer_type");--> statement-breakpoint
CREATE INDEX "idx_staff_trans_status" ON "clinical"."staff_transfers" USING btree ("transfer_status");