CREATE TABLE IF NOT EXISTS "company"."capabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(50) NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "category" varchar(50) NOT NULL DEFAULT 'CLINICAL',
  "description" text,
  "dependencies" jsonb DEFAULT '[]'::jsonb,
  "entitlement_required" varchar(100),
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capabilities_code" ON "company"."capabilities" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capabilities_category" ON "company"."capabilities" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capabilities_status" ON "company"."capabilities" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."partner_capabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" varchar(100) NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
  "capability_code" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
  "trial_ends_at" timestamp with time zone,
  "is_hq_override" boolean DEFAULT false,
  "override_reason" text,
  "updated_by" varchar(255),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_partner_cap_tenant_code" ON "company"."partner_capabilities" ("tenant_id", "capability_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_cap_partner" ON "company"."partner_capabilities" ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_cap_tenant" ON "company"."partner_capabilities" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_cap_status" ON "company"."partner_capabilities" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."partner_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(100) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(50) NOT NULL DEFAULT 'HOSPITAL',
  "is_system" boolean DEFAULT false,
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
  "current_version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_templates_code" ON "company"."partner_templates" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_templates_category" ON "company"."partner_templates" ("category");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."template_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" uuid NOT NULL REFERENCES "company"."partner_templates"("id") ON DELETE CASCADE,
  "version_number" integer NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'PUBLISHED',
  "supported_profiles" jsonb DEFAULT '[]'::jsonb,
  "capabilities" jsonb DEFAULT '[]'::jsonb,
  "departments" jsonb DEFAULT '[]'::jsonb,
  "default_roles" jsonb DEFAULT '[]'::jsonb,
  "permission_packs" jsonb DEFAULT '[]'::jsonb,
  "features" jsonb DEFAULT '[]'::jsonb,
  "limits" jsonb DEFAULT '{}'::jsonb,
  "policies" jsonb DEFAULT '[]'::jsonb,
  "change_summary" text,
  "created_by" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tpl_versions_tpl_num" ON "company"."template_versions" ("template_id", "version_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tpl_versions_template" ON "company"."template_versions" ("template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tpl_versions_status" ON "company"."template_versions" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."permission_packs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(100) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(50) NOT NULL DEFAULT 'GENERAL',
  "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_system" boolean DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_packs_code" ON "company"."permission_packs" ("code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."feature_dependencies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_code" varchar(100) NOT NULL,
  "depends_on_code" varchar(100) NOT NULL,
  "dependency_type" varchar(50) NOT NULL DEFAULT 'CAPABILITY',
  "error_message" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_feature_deps_src_dep" ON "company"."feature_dependencies" ("source_code", "depends_on_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feature_deps_src" ON "company"."feature_dependencies" ("source_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."access_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
  "partner_id" varchar(100),
  "code" varchar(100) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "effect" varchar(10) NOT NULL DEFAULT 'ALLOW',
  "priority" integer NOT NULL DEFAULT 100,
  "conditions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "time_window" jsonb,
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
  "is_system" boolean DEFAULT false,
  "created_by" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_policies_tenant" ON "company"."access_policies" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_policies_code" ON "company"."access_policies" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_policies_status" ON "company"."access_policies" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."break_glass_access" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
  "partner_id" varchar(100) NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "core"."users"("id") ON DELETE CASCADE,
  "user_email" varchar(255) NOT NULL,
  "patient_id" varchar(255),
  "encounter_id" varchar(255),
  "reason" text NOT NULL,
  "scope" varchar(100) NOT NULL DEFAULT 'CLINICAL_EMERGENCY',
  "triggered_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "revoked_by" varchar(255),
  "ip_address" varchar(100)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_break_glass_tenant" ON "company"."break_glass_access" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_break_glass_user" ON "company"."break_glass_access" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_break_glass_expires" ON "company"."break_glass_access" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."partner_configuration_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
  "partner_id" varchar(100) NOT NULL,
  "version_number" integer NOT NULL,
  "applied_template_id" uuid REFERENCES "company"."partner_templates"("id") ON DELETE SET NULL,
  "applied_template_version" integer,
  "snapshot" jsonb NOT NULL,
  "diff_summary" text,
  "change_reason" text NOT NULL,
  "changed_by" varchar(255) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_cfg_versions_tenant_num" ON "company"."partner_configuration_versions" ("tenant_id", "version_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfg_versions_tenant" ON "company"."partner_configuration_versions" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfg_versions_partner" ON "company"."partner_configuration_versions" ("partner_id");
--> statement-breakpoint
ALTER TABLE "company"."partner_profiles"
  ADD COLUMN IF NOT EXISTS "applied_template_id" uuid REFERENCES "company"."partner_templates"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "applied_template_version" integer,
  ADD COLUMN IF NOT EXISTS "configuration_version" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "active_profiles" jsonb DEFAULT '[]'::jsonb;
