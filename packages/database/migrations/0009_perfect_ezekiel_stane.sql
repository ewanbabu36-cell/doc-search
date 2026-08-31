CREATE TABLE "company"."security_audit_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_code" varchar(100) NOT NULL,
	"audit_event_reference" varchar(100) NOT NULL,
	"verification_type" varchar(100) NOT NULL,
	"verification_status" varchar(50) DEFAULT 'VERIFIED_VALID' NOT NULL,
	"verified_by_id" uuid,
	"verified_by_email" varchar(255) NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_code" varchar(100) NOT NULL,
	"credential_type" varchar(50) DEFAULT 'API_KEY' NOT NULL,
	"owner_type" varchar(50) NOT NULL,
	"owner_reference" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_by_id" uuid,
	"created_by_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_rotated_at" timestamp with time zone,
	"next_rotation_due" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."security_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_code" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"source" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_to_email" varchar(255),
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_code" varchar(100) NOT NULL,
	"permission_name" varchar(255) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"risk_level" varchar(50) DEFAULT 'LOW' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"policy_type" varchar(50) DEFAULT 'ACCESS_CONTROL' NOT NULL,
	"severity" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb,
	"enforcement_mode" varchar(50) DEFAULT 'ENFORCED' NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"approved_by_id" uuid,
	"approved_by_email" varchar(255),
	"approved_at" timestamp with time zone,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted_by_id" uuid,
	"granted_by_email" varchar(255) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_code" varchar(100) NOT NULL,
	"role_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"role_type" varchar(50) DEFAULT 'COMPANY' NOT NULL,
	"scope_type" varchar(50) DEFAULT 'COMPANY' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid,
	"created_by_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."security_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"authentication_method" varchar(50) DEFAULT 'PASSWORD_MFA' NOT NULL,
	"ip_hash" varchar(128) NOT NULL,
	"device_fingerprint_hash" varchar(128) NOT NULL,
	"user_agent_summary" varchar(255) NOT NULL,
	"scope" varchar(50) DEFAULT 'COMPANY' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"terminated_at" timestamp with time zone,
	"termination_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."security_user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" varchar(50) DEFAULT 'COMPANY' NOT NULL,
	"scope_reference" varchar(100) NOT NULL,
	"assigned_by_id" uuid,
	"assigned_by_email" varchar(255) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."security_audit_verifications" ADD CONSTRAINT "security_audit_verifications_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_credentials" ADD CONSTRAINT "security_credentials_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_incidents" ADD CONSTRAINT "security_incidents_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_policies" ADD CONSTRAINT "security_policies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_policies" ADD CONSTRAINT "security_policies_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_role_permissions" ADD CONSTRAINT "security_role_permissions_role_id_security_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "company"."security_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_role_permissions" ADD CONSTRAINT "security_role_permissions_permission_id_security_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "company"."security_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_role_permissions" ADD CONSTRAINT "security_role_permissions_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_roles" ADD CONSTRAINT "security_roles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_sessions" ADD CONSTRAINT "security_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_user_roles" ADD CONSTRAINT "security_user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_user_roles" ADD CONSTRAINT "security_user_roles_role_id_security_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "company"."security_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."security_user_roles" ADD CONSTRAINT "security_user_roles_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sec_audit_verif_code" ON "company"."security_audit_verifications" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_verif_ref" ON "company"."security_audit_verifications" USING btree ("audit_event_reference");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_verif_status" ON "company"."security_audit_verifications" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sec_credentials_code" ON "company"."security_credentials" USING btree ("credential_code");--> statement-breakpoint
CREATE INDEX "idx_sec_credentials_type" ON "company"."security_credentials" USING btree ("credential_type");--> statement-breakpoint
CREATE INDEX "idx_sec_credentials_status" ON "company"."security_credentials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sec_credentials_owner" ON "company"."security_credentials" USING btree ("owner_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sec_incidents_code" ON "company"."security_incidents" USING btree ("incident_code");--> statement-breakpoint
CREATE INDEX "idx_sec_incidents_severity" ON "company"."security_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_sec_incidents_status" ON "company"."security_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sec_incidents_detected" ON "company"."security_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_security_permissions_code" ON "company"."security_permissions" USING btree ("permission_code");--> statement-breakpoint
CREATE INDEX "idx_security_permissions_domain" ON "company"."security_permissions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_security_permissions_action" ON "company"."security_permissions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_security_permissions_risk" ON "company"."security_permissions" USING btree ("risk_level");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sec_policies_code" ON "company"."security_policies" USING btree ("policy_code");--> statement-breakpoint
CREATE INDEX "idx_sec_policies_type" ON "company"."security_policies" USING btree ("policy_type");--> statement-breakpoint
CREATE INDEX "idx_sec_policies_status" ON "company"."security_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sec_policies_severity" ON "company"."security_policies" USING btree ("severity");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_security_role_permissions" ON "company"."security_role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "idx_sec_role_perm_role" ON "company"."security_role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_sec_role_perm_perm" ON "company"."security_role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_security_roles_code" ON "company"."security_roles" USING btree ("role_code");--> statement-breakpoint
CREATE INDEX "idx_security_roles_type" ON "company"."security_roles" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX "idx_security_roles_scope" ON "company"."security_roles" USING btree ("scope_type");--> statement-breakpoint
CREATE INDEX "idx_security_roles_status" ON "company"."security_roles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sec_sessions_id" ON "company"."security_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sec_sessions_user" ON "company"."security_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sec_sessions_status" ON "company"."security_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sec_sessions_expires" ON "company"."security_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_sec_user_roles_user" ON "company"."security_user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sec_user_roles_role" ON "company"."security_user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_sec_user_roles_status" ON "company"."security_user_roles" USING btree ("status");