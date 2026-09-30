-- Migration: 0053_hq_master_control_plane.sql
-- Description: Centralized HQ Master Control Plane Schema Extensions (Plans, Governance Overrides, Revocations)

-- 1. Extend company.plans with authoritative pricing and resource quotas
ALTER TABLE "company"."plans"
  ADD COLUMN IF NOT EXISTS "base_price" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "billing_interval" varchar(50) DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "trial_duration_days" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "max_concurrent_users" integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "max_doctors" integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "max_branches" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "max_beds" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "storage_quota_gb" integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "monthly_whatsapp_credits" integer DEFAULT 500;

-- 2. Create authoritative partner governance overrides table in PostgreSQL (replacing flat JSON file)
CREATE TABLE IF NOT EXISTS "company"."partner_governance_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" varchar(100) NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "core"."tenants"("id") ON DELETE CASCADE,
  "module_code" varchar(100) NOT NULL,
  "feature_code" varchar(100),
  "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
  "trial_ends_at" timestamp with time zone,
  "max_beds" integer,
  "max_doctor_seats" integer,
  "storage_quota_gb" integer,
  "monthly_whatsapp_credits" integer,
  "global_freeze" boolean DEFAULT false,
  "billing_freeze" boolean DEFAULT false,
  "communication_freeze" boolean DEFAULT false,
  "reason" text,
  "updated_by" varchar(255),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_partner_gov_tenant_module" ON "company"."partner_governance_overrides" ("tenant_id", "module_code");
CREATE INDEX IF NOT EXISTS "idx_partner_gov_partner" ON "company"."partner_governance_overrides" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_partner_gov_tenant" ON "company"."partner_governance_overrides" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_partner_gov_status" ON "company"."partner_governance_overrides" ("status");

-- 3. Create server-side revocations table for immediate instant session & entity termination
CREATE TABLE IF NOT EXISTS "core"."revocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "target_type" varchar(50) NOT NULL,
  "target_id" varchar(255) NOT NULL,
  "revoked_at" timestamp with time zone NOT NULL DEFAULT now(),
  "reason" text,
  "revoked_by" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_revocations_target" ON "core"."revocations" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_revocations_revoked_at" ON "core"."revocations" ("revoked_at");
