-- Migration: 0057_patient_uhid_unique.sql
-- Description: Adds unique UHID index to enforce database-level uniqueness across patients per tenant

ALTER TABLE "clinical"."patients" ADD COLUMN IF NOT EXISTS "uhid" varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_patients_tenant_uhid_uidx" ON "clinical"."patients" USING btree ("tenant_id", "uhid");
