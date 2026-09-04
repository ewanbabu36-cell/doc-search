CREATE UNIQUE INDEX IF NOT EXISTS "idx_patient_contacts_tenant_primary_mobile_uidx" ON "clinical"."patient_contacts" USING btree ("tenant_id", "primary_mobile");
