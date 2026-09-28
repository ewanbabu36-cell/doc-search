CREATE TABLE IF NOT EXISTS "company"."partner_onboarding_staged_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_draft_id" uuid REFERENCES "core"."tenants"("id") ON DELETE SET NULL,
	"organization_name" text NOT NULL,
	"organization_type" varchar(50) NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"registration_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid REFERENCES "core"."users"("id") ON DELETE SET NULL,
	CONSTRAINT "chk_partner_onboarding_status" CHECK ("status" IN ('PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_status" ON "company"."partner_onboarding_staged_registrations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_email" ON "company"."partner_onboarding_staged_registrations" USING btree ("contact_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_tenant_draft" ON "company"."partner_onboarding_staged_registrations" USING btree ("tenant_draft_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_org_type" ON "company"."partner_onboarding_staged_registrations" USING btree ("organization_type");
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS p_partner_onboarding_isolation ON "company"."partner_onboarding_staged_registrations";
--> statement-breakpoint
CREATE POLICY p_partner_onboarding_isolation ON "company"."partner_onboarding_staged_registrations"
  USING (
    core.is_super_admin() 
    OR (tenant_draft_id IS NOT NULL AND tenant_draft_id = core.get_current_tenant_id())
  )
  WITH CHECK (
    core.is_super_admin() 
    OR (tenant_draft_id IS NOT NULL AND tenant_draft_id = core.get_current_tenant_id())
  );
