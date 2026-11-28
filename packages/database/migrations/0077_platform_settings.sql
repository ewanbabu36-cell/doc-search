-- ==============================================================================
-- Migration: 0077_platform_settings.sql
-- Description: Persist system-wide governance toggles (e.g. auto-onboard policy)
--              in PostgreSQL instead of volatile in-memory booleans.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "core"."platform_settings" (
  "key" varchar(120) PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_by" varchar(255),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "core"."platform_settings" ("key", "value", "updated_by")
VALUES ('AUTO_ONBOARD_POLICY_ENABLED', '{"enabled": false}'::jsonb, 'SYSTEM_SECURITY_BASELINE')
ON CONFLICT ("key") DO NOTHING;
