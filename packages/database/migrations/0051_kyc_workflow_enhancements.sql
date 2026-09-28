ALTER TABLE "company"."partner_onboarding_staged_registrations" 
  DROP CONSTRAINT IF EXISTS "chk_partner_onboarding_status";
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations"
  ALTER COLUMN "status" TYPE varchar(50);
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations"
  ADD CONSTRAINT "chk_partner_onboarding_status" 
  CHECK ("status" IN ('PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE'));
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations"
  ADD COLUMN IF NOT EXISTS "registered_by_user_id" text,
  ADD COLUMN IF NOT EXISTS "registered_by_name" text,
  ADD COLUMN IF NOT EXISTS "registered_by_email" text,
  ADD COLUMN IF NOT EXISTS "registered_by_role" text,
  ADD COLUMN IF NOT EXISTS "registration_source" varchar(64) DEFAULT 'SELF_REGISTRATION_PORTAL';
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations"
  ADD COLUMN IF NOT EXISTS "assigned_reviewer_id" uuid REFERENCES "core"."users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "assigned_reviewer_name" text,
  ADD COLUMN IF NOT EXISTS "assigned_reviewer_email" text,
  ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "company"."partner_onboarding_staged_registrations"
  ADD COLUMN IF NOT EXISTS "review_started_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "review_started_by" text,
  ADD COLUMN IF NOT EXISTS "requested_info_reason" text,
  ADD COLUMN IF NOT EXISTS "info_requested_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "resubmitted_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_reviewer" ON "company"."partner_onboarding_staged_registrations" USING btree ("assigned_reviewer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_registered_by" ON "company"."partner_onboarding_staged_registrations" USING btree ("registered_by_email");
