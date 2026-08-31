CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "company";
--> statement-breakpoint
CREATE SCHEMA "clinical";
--> statement-breakpoint
CREATE TABLE "core"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"type" varchar(50) DEFAULT 'CLINIC' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "core"."branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_home_branch" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"scope" varchar(50) DEFAULT 'tenant' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"branch_id" uuid,
	"actor_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"correlation_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."partner_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"terms_version" varchar(20) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."facility_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"facility_type" varchar(50) DEFAULT 'OUTPATIENT' NOT NULL,
	"license_number" varchar(100),
	"operational_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."branches" ADD CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_branches" ADD CONSTRAINT "user_branches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_branches" ADD CONSTRAINT "user_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_branches" ADD CONSTRAINT "user_branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_tenants" ADD CONSTRAINT "user_tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_tenants" ADD CONSTRAINT "user_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "core"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_roles" ADD CONSTRAINT "user_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_roles" ADD CONSTRAINT "user_roles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."audit_events" ADD CONSTRAINT "audit_events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_agreements" ADD CONSTRAINT "partner_agreements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."facility_registry" ADD CONSTRAINT "facility_registry_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."facility_registry" ADD CONSTRAINT "facility_registry_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tenants_slug" ON "core"."tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tenants_status" ON "core"."tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tenants_created_at" ON "core"."tenants" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_branches_tenant_code" ON "core"."branches" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_branches_tenant_id" ON "core"."branches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_branches_status" ON "core"."branches" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email" ON "core"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "core"."users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "core"."users" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_branches_user_branch" ON "core"."user_branches" USING btree ("user_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_user_branches_user_id" ON "core"."user_branches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_branches_branch_id" ON "core"."user_branches" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_user_branches_tenant_branch" ON "core"."user_branches" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_tenants_user_tenant" ON "core"."user_tenants" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_tenants_user_id" ON "core"."user_tenants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_tenants_tenant_id" ON "core"."user_tenants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_tenants_status" ON "core"."user_tenants" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_permissions_resource_action_scope" ON "core"."permissions" USING btree ("resource","action","scope");--> statement-breakpoint
CREATE INDEX "idx_permissions_resource" ON "core"."permissions" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_permissions_action" ON "core"."permissions" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permissions_role_perm" ON "core"."role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "core"."role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_perm_id" ON "core"."role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_tenant_code" ON "core"."roles" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_roles_tenant_id" ON "core"."roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_roles_code" ON "core"."roles" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_roles_user_role_tenant_branch" ON "core"."user_roles" USING btree ("user_id","role_id","tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_tenant" ON "core"."user_roles" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "core"."user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_branch_id" ON "core"."user_roles" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_tenant_time" ON "core"."audit_events" USING btree ("tenant_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_events_actor_time" ON "core"."audit_events" USING btree ("actor_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_events_resource" ON "core"."audit_events" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_correlation" ON "core"."audit_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_event_type" ON "core"."audit_events" USING btree ("event_type");