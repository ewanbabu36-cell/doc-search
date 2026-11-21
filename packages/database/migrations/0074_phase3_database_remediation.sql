-- =========================================================================
-- Migration 0074: Phase 3 Master Database Remediation
-- Clinical Integrity, Multi-Tenant RLS Hardening, Referential Integrity, and Performance Indexes
-- =========================================================================

-- 1. STAGE 1: Recover Missing Controlled Substances Pharmacy Table (P1-DB-03)
CREATE TABLE IF NOT EXISTS clinical.pharmacy_controlled_substances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  partner_id uuid REFERENCES clinical.operational_partners(id),
  organization_id uuid REFERENCES clinical.operational_organizations(id),
  branch_id uuid REFERENCES clinical.operational_facilities(id),
  medication_id uuid,
  drug_name varchar(255) NOT NULL,
  schedule varchar(50) NOT NULL,
  quantity numeric(10,2) NOT NULL,
  dispensed_to varchar(255),
  prescribed_by varchar(255),
  batch_number varchar(100),
  witnessed_by varchar(255),
  verification_status varchar(50) DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE clinical.pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical.pharmacy_controlled_substances FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'clinical' 
      AND tablename = 'pharmacy_controlled_substances' 
      AND policyname = 'p_clinical_pharmacy_controlled_substances_tenant_isolation'
  ) THEN
    CREATE POLICY p_clinical_pharmacy_controlled_substances_tenant_isolation 
      ON clinical.pharmacy_controlled_substances
      FOR ALL
      TO public
      USING (
        (core.is_super_admin() = true) OR 
        (tenant_id = core.get_current_tenant_id())
      )
      WITH CHECK (
        (core.is_super_admin() = true) OR 
        (tenant_id = core.get_current_tenant_id())
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pharmacy_controlled_substances_tenant ON clinical.pharmacy_controlled_substances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_controlled_substances_schedule ON clinical.pharmacy_controlled_substances(schedule);
CREATE INDEX IF NOT EXISTS idx_pharmacy_controlled_substances_created ON clinical.pharmacy_controlled_substances(created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON clinical.pharmacy_controlled_substances TO docsearch_app;

-- 2. STAGE 2: Enforce Strict RLS on Doctor Cartel Radar (P1-DB-01)
ALTER TABLE public.company_doctor_cartel_radar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_doctor_cartel_radar FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'company_doctor_cartel_radar' 
      AND policyname = 'p_public_company_doctor_cartel_radar_tenant_isolation'
  ) THEN
    CREATE POLICY p_public_company_doctor_cartel_radar_tenant_isolation 
      ON public.company_doctor_cartel_radar
      FOR ALL
      TO public
      USING (
        (core.is_super_admin() = true) OR 
        (hospital_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
      )
      WITH CHECK (
        (core.is_super_admin() = true) OR 
        (hospital_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_doctor_cartel_radar TO docsearch_app;

-- 3. STAGE 5: Clean Referential Integrity Constraints (P1-DATA-01)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_anaesthesia_records_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."anaesthesia_records"
      ADD CONSTRAINT "fk_anaesthesia_records_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_appointments_partitioned_doctor_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."appointments_partitioned"
      ADD CONSTRAINT "fk_appointments_partitioned_doctor_id"
      FOREIGN KEY ("doctor_id")
      REFERENCES clinical.doctor_profiles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_billing_invoices_partitioned_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."billing_invoices_partitioned"
      ADD CONSTRAINT "fk_billing_invoices_partitioned_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_blood_requests_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."blood_requests"
      ADD CONSTRAINT "fk_blood_requests_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_blood_requests_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."blood_requests"
      ADD CONSTRAINT "fk_blood_requests_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_consultation_audit_traces_consultation_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."consultation_audit_traces"
      ADD CONSTRAINT "fk_consultation_audit_traces_consultation_id"
      FOREIGN KEY ("consultation_id")
      REFERENCES clinical.consultations(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_consultation_audit_traces_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."consultation_audit_traces"
      ADD CONSTRAINT "fk_consultation_audit_traces_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_consultation_audit_traces_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."consultation_audit_traces"
      ADD CONSTRAINT "fk_consultation_audit_traces_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_death_registry_records_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."death_registry_records"
      ADD CONSTRAINT "fk_death_registry_records_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_dietary_assessments_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."dietary_assessments"
      ADD CONSTRAINT "fk_dietary_assessments_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_dietary_billing_references_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."dietary_billing_references"
      ADD CONSTRAINT "fk_dietary_billing_references_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_dietary_orders_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."dietary_orders"
      ADD CONSTRAINT "fk_dietary_orders_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_doctor_payout_configurations_doctor_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."doctor_payout_configurations"
      ADD CONSTRAINT "fk_doctor_payout_configurations_doctor_id"
      FOREIGN KEY ("doctor_id")
      REFERENCES clinical.doctor_profiles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_doctor_settlement_vouchers_doctor_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."doctor_settlement_vouchers"
      ADD CONSTRAINT "fk_doctor_settlement_vouchers_doctor_id"
      FOREIGN KEY ("doctor_id")
      REFERENCES clinical.doctor_profiles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_doctor_volume_payout_tiers_doctor_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."doctor_volume_payout_tiers"
      ADD CONSTRAINT "fk_doctor_volume_payout_tiers_doctor_id"
      FOREIGN KEY ("doctor_id")
      REFERENCES clinical.doctor_profiles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_emergency_triage_assessments_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."emergency_triage_assessments"
      ADD CONSTRAINT "fk_emergency_triage_assessments_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_encounter_audit_traces_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."encounter_audit_traces"
      ADD CONSTRAINT "fk_encounter_audit_traces_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_encounter_audit_traces_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."encounter_audit_traces"
      ADD CONSTRAINT "fk_encounter_audit_traces_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_financial_transactions_partitioned_invoice_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."financial_transactions_partitioned"
      ADD CONSTRAINT "fk_financial_transactions_partitioned_invoice_id"
      FOREIGN KEY ("invoice_id")
      REFERENCES clinical.billing_invoices(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_hai_surveillance_records_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."hai_surveillance_records"
      ADD CONSTRAINT "fk_hai_surveillance_records_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_admission_requests_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_admission_requests"
      ADD CONSTRAINT "fk_inpatient_admission_requests_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_admission_requests_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_admission_requests"
      ADD CONSTRAINT "fk_inpatient_admission_requests_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_admissions_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_admissions"
      ADD CONSTRAINT "fk_inpatient_admissions_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_audit_traces_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_audit_traces"
      ADD CONSTRAINT "fk_inpatient_audit_traces_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_bed_allocations_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_bed_allocations"
      ADD CONSTRAINT "fk_inpatient_bed_allocations_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_bed_reservations_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_bed_reservations"
      ADD CONSTRAINT "fk_inpatient_bed_reservations_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_bed_status_history_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_bed_status_history"
      ADD CONSTRAINT "fk_inpatient_bed_status_history_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_care_plans_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_care_plans"
      ADD CONSTRAINT "fk_inpatient_care_plans_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_discharge_plans_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_discharge_plans"
      ADD CONSTRAINT "fk_inpatient_discharge_plans_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_discharge_requests_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_discharge_requests"
      ADD CONSTRAINT "fk_inpatient_discharge_requests_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_discharge_summaries_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_discharge_summaries"
      ADD CONSTRAINT "fk_inpatient_discharge_summaries_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_doctor_rounds_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_doctor_rounds"
      ADD CONSTRAINT "fk_inpatient_doctor_rounds_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_intake_output_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_intake_output"
      ADD CONSTRAINT "fk_inpatient_intake_output_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_nursing_assessments_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_nursing_assessments"
      ADD CONSTRAINT "fk_inpatient_nursing_assessments_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_nursing_notes_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_nursing_notes"
      ADD CONSTRAINT "fk_inpatient_nursing_notes_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_patient_locations_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_patient_locations"
      ADD CONSTRAINT "fk_inpatient_patient_locations_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_transfers_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_transfers"
      ADD CONSTRAINT "fk_inpatient_transfers_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_inpatient_vital_observations_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."inpatient_vital_observations"
      ADD CONSTRAINT "fk_inpatient_vital_observations_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_intraoperative_records_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."intraoperative_records"
      ADD CONSTRAINT "fk_intraoperative_records_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_operative_notes_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."operative_notes"
      ADD CONSTRAINT "fk_operative_notes_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_ot_schedules_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."ot_schedules"
      ADD CONSTRAINT "fk_ot_schedules_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_ot_transfers_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."ot_transfers"
      ADD CONSTRAINT "fk_ot_transfers_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_pacu_recovery_records_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."pacu_recovery_records"
      ADD CONSTRAINT "fk_pacu_recovery_records_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_care_passes_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_care_passes"
      ADD CONSTRAINT "fk_patient_care_passes_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_credit_accounts_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_credit_accounts"
      ADD CONSTRAINT "fk_patient_credit_accounts_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_health_wallets_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_health_wallets"
      ADD CONSTRAINT "fk_patient_health_wallets_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_package_consumptions_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_package_consumptions"
      ADD CONSTRAINT "fk_patient_package_consumptions_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_packages_invoice_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_packages"
      ADD CONSTRAINT "fk_patient_packages_invoice_id"
      FOREIGN KEY ("invoice_id")
      REFERENCES clinical.billing_invoices(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_packages_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_packages"
      ADD CONSTRAINT "fk_patient_packages_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_patient_registration_audit_traces_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."patient_registration_audit_traces"
      ADD CONSTRAINT "fk_patient_registration_audit_traces_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_pharmacy_chronic_refill_radars_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."pharmacy_chronic_refill_radars"
      ADD CONSTRAINT "fk_pharmacy_chronic_refill_radars_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_postoperative_transfers_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."postoperative_transfers"
      ADD CONSTRAINT "fk_postoperative_transfers_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_pre_op_checklists_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."pre_op_checklists"
      ADD CONSTRAINT "fk_pre_op_checklists_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_pre_operative_assessments_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."pre_operative_assessments"
      ADD CONSTRAINT "fk_pre_operative_assessments_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_prescription_templates_doctor_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."prescription_templates"
      ADD CONSTRAINT "fk_prescription_templates_doctor_id"
      FOREIGN KEY ("doctor_id")
      REFERENCES clinical.doctor_profiles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_radiology_orders_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."radiology_orders"
      ADD CONSTRAINT "fk_radiology_orders_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_supply_chain_consumptions_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."supply_chain_consumptions"
      ADD CONSTRAINT "fk_supply_chain_consumptions_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_supply_chain_consumptions_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."supply_chain_consumptions"
      ADD CONSTRAINT "fk_supply_chain_consumptions_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgery_cancellations_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgery_cancellations"
      ADD CONSTRAINT "fk_surgery_cancellations_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgery_emi_applications_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgery_emi_applications"
      ADD CONSTRAINT "fk_surgery_emi_applications_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgical_consents_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgical_consents"
      ADD CONSTRAINT "fk_surgical_consents_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgical_consumable_usage_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgical_consumable_usage"
      ADD CONSTRAINT "fk_surgical_consumable_usage_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgical_implants_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgical_implants"
      ADD CONSTRAINT "fk_surgical_implants_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgical_safety_checklists_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgical_safety_checklists"
      ADD CONSTRAINT "fk_surgical_safety_checklists_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_surgical_specimens_patient_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."surgical_specimens"
      ADD CONSTRAINT "fk_surgical_specimens_patient_id"
      FOREIGN KEY ("patient_id")
      REFERENCES clinical.patients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fk_transfusion_records_encounter_id' AND n.nspname = 'clinical'
  ) THEN
    ALTER TABLE "clinical"."transfusion_records"
      ADD CONSTRAINT "fk_transfusion_records_encounter_id"
      FOREIGN KEY ("encounter_id")
      REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 4. STAGE 6: High-Performance Foreign Key Indexing (P1-PERF-01)
CREATE INDEX IF NOT EXISTS "idx_billing_advances_organization_id" ON "clinical"."billing_advances" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_advances_partner_id" ON "clinical"."billing_advances" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_advances_payment_id" ON "clinical"."billing_advances" ("payment_id");
CREATE INDEX IF NOT EXISTS "idx_billing_audit_traces_organization_id" ON "clinical"."billing_audit_traces" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_audit_traces_partner_id" ON "clinical"."billing_audit_traces" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_cashier_sessions_organization_id" ON "clinical"."billing_cashier_sessions" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_cashier_sessions_partner_id" ON "clinical"."billing_cashier_sessions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_charges_consultation_id" ON "clinical"."billing_charges" ("consultation_id");
CREATE INDEX IF NOT EXISTS "idx_billing_charges_organization_id" ON "clinical"."billing_charges" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_charges_partner_id" ON "clinical"."billing_charges" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_credit_notes_organization_id" ON "clinical"."billing_credit_notes" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_credit_notes_partner_id" ON "clinical"."billing_credit_notes" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_credit_notes_patient_id" ON "clinical"."billing_credit_notes" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_billing_debit_adjustments_organization_id" ON "clinical"."billing_debit_adjustments" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_debit_adjustments_partner_id" ON "clinical"."billing_debit_adjustments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_debit_adjustments_patient_id" ON "clinical"."billing_debit_adjustments" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_billing_discounts_branch_id" ON "clinical"."billing_discounts" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_billing_discounts_organization_id" ON "clinical"."billing_discounts" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_discounts_partner_id" ON "clinical"."billing_discounts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_financial_transactions_organization_id" ON "clinical"."billing_financial_transactions" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_financial_transactions_partner_id" ON "clinical"."billing_financial_transactions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_invoice_items_charge_item_id" ON "clinical"."billing_invoice_items" ("charge_item_id");
CREATE INDEX IF NOT EXISTS "idx_billing_invoice_items_service_catalog_id" ON "clinical"."billing_invoice_items" ("service_catalog_id");
CREATE INDEX IF NOT EXISTS "idx_billing_invoices_organization_id" ON "clinical"."billing_invoices" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_invoices_partner_id" ON "clinical"."billing_invoices" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_payments_organization_id" ON "clinical"."billing_payments" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_payments_partner_id" ON "clinical"."billing_payments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_price_lists_organization_id" ON "clinical"."billing_price_lists" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_price_lists_partner_id" ON "clinical"."billing_price_lists" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_receipts_organization_id" ON "clinical"."billing_receipts" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_receipts_partner_id" ON "clinical"."billing_receipts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_receipts_patient_id" ON "clinical"."billing_receipts" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_billing_reconciliations_organization_id" ON "clinical"."billing_reconciliations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_reconciliations_partner_id" ON "clinical"."billing_reconciliations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_refunds_organization_id" ON "clinical"."billing_refunds" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_billing_refunds_partner_id" ON "clinical"."billing_refunds" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_billing_service_catalog_partner_id" ON "clinical"."billing_service_catalog" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_blood_components_donation_id" ON "clinical"."blood_components" ("donation_id");
CREATE INDEX IF NOT EXISTS "idx_blood_crossmatches_component_id" ON "clinical"."blood_crossmatches" ("component_id");
CREATE INDEX IF NOT EXISTS "idx_blood_crossmatches_request_id" ON "clinical"."blood_crossmatches" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_blood_donations_donor_id" ON "clinical"."blood_donations" ("donor_id");
CREATE INDEX IF NOT EXISTS "idx_blood_donor_screenings_donor_id" ON "clinical"."blood_donor_screenings" ("donor_id");
CREATE INDEX IF NOT EXISTS "idx_blood_issues_component_id" ON "clinical"."blood_issues" ("component_id");
CREATE INDEX IF NOT EXISTS "idx_blood_issues_request_id" ON "clinical"."blood_issues" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_blood_tests_donation_id" ON "clinical"."blood_tests" ("donation_id");
CREATE INDEX IF NOT EXISTS "idx_clinical_documentation_queries_record_id" ON "clinical"."clinical_documentation_queries" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_coding_reviews_record_id" ON "clinical"."coding_reviews" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_audit_traces_branch_id" ON "clinical"."consultation_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_diagnoses_organization_id" ON "clinical"."consultation_diagnoses" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_diagnoses_partner_id" ON "clinical"."consultation_diagnoses" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_examinations_organization_id" ON "clinical"."consultation_examinations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_examinations_partner_id" ON "clinical"."consultation_examinations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_fee_matrices_branch_id" ON "clinical"."consultation_fee_matrices" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_fee_matrices_partner_id" ON "clinical"."consultation_fee_matrices" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_followups_organization_id" ON "clinical"."consultation_followups" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_followups_partner_id" ON "clinical"."consultation_followups" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_instructions_organization_id" ON "clinical"."consultation_instructions" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_instructions_partner_id" ON "clinical"."consultation_instructions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_medications_organization_id" ON "clinical"."consultation_medications" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_medications_partner_id" ON "clinical"."consultation_medications" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_vitals_organization_id" ON "clinical"."consultation_vitals" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_vitals_partner_id" ON "clinical"."consultation_vitals" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_diet_plans_order_id" ON "clinical"."dietary_diet_plans" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_meal_schedules_order_id" ON "clinical"."dietary_meal_schedules" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_menu_templates_kitchen_id" ON "clinical"."dietary_menu_templates" ("kitchen_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_orders_diet_type_id" ON "clinical"."dietary_orders" ("diet_type_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_preparation_records_production_plan_id" ON "clinical"."dietary_preparation_records" ("production_plan_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_production_plans_kitchen_id" ON "clinical"."dietary_production_plans" ("kitchen_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_tray_assemblies_order_id" ON "clinical"."dietary_tray_assemblies" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_leaves_branch_id" ON "clinical"."doctor_leaves" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_leaves_organization_id" ON "clinical"."doctor_leaves" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_leaves_partner_id" ON "clinical"."doctor_leaves" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_opd_audit_traces_branch_id" ON "clinical"."doctor_opd_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_profiles_partner_id" ON "clinical"."doctor_profiles" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_schedule_breaks_partner_id" ON "clinical"."doctor_schedule_breaks" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_schedules_organization_id" ON "clinical"."doctor_schedules" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_schedules_partner_id" ON "clinical"."doctor_schedules" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_specializations_partner_id" ON "clinical"."doctor_specializations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_ambulance_transfers_encounter_id" ON "clinical"."emergency_ambulance_transfers" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_death_records_encounter_id" ON "clinical"."emergency_death_records" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_disposition_records_encounter_id" ON "clinical"."emergency_disposition_records" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_encounters_current_zone_id" ON "clinical"."emergency_encounters" ("current_zone_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_mlc_cases_encounter_id" ON "clinical"."emergency_mlc_cases" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_observation_cases_encounter_id" ON "clinical"."emergency_observation_cases" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_resuscitation_events_encounter_id" ON "clinical"."emergency_resuscitation_events" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_triage_assessments_encounter_id" ON "clinical"."emergency_triage_assessments" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_triage_reassessments_encounter_id" ON "clinical"."emergency_triage_reassessments" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_zones_department_id" ON "clinical"."emergency_zones" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_audit_traces_branch_id" ON "clinical"."encounter_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_queues_encounter_id" ON "clinical"."encounter_queues" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_queues_partner_id" ON "clinical"."encounter_queues" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_referrals_destination_department_id" ON "clinical"."encounter_referrals" ("destination_department_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_referrals_destination_doctor_id" ON "clinical"."encounter_referrals" ("destination_doctor_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_referrals_organization_id" ON "clinical"."encounter_referrals" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_referrals_partner_id" ON "clinical"."encounter_referrals" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_referrals_referring_doctor_id" ON "clinical"."encounter_referrals" ("referring_doctor_id");
CREATE INDEX IF NOT EXISTS "idx_encounters_opd_slot_id" ON "clinical"."encounters" ("opd_slot_id");
CREATE INDEX IF NOT EXISTS "idx_facility_registry_branch_id" ON "clinical"."facility_registry" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_items_procurement_item_id" ON "clinical"."goods_receipt_items" ("procurement_item_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_items_purchase_order_item_id" ON "clinical"."goods_receipt_items" ("purchase_order_item_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipts_branch_id" ON "clinical"."goods_receipts" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipts_partner_id" ON "clinical"."goods_receipts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipts_vendor_id" ON "clinical"."goods_receipts" ("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_incident_rca_investigations_incident_id" ON "clinical"."incident_rca_investigations" ("incident_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admission_approvals_branch_id" ON "clinical"."inpatient_admission_approvals" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admission_requests_branch_id" ON "clinical"."inpatient_admission_requests" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admissions_admission_request_id" ON "clinical"."inpatient_admissions" ("admission_request_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admissions_bed_id" ON "clinical"."inpatient_admissions" ("bed_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admissions_branch_id" ON "clinical"."inpatient_admissions" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_audit_traces_branch_id" ON "clinical"."inpatient_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_allocations_bed_id" ON "clinical"."inpatient_bed_allocations" ("bed_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_allocations_branch_id" ON "clinical"."inpatient_bed_allocations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_allocations_ward_id" ON "clinical"."inpatient_bed_allocations" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_blocks_branch_id" ON "clinical"."inpatient_bed_blocks" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_blocks_ward_id" ON "clinical"."inpatient_bed_blocks" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_reservations_branch_id" ON "clinical"."inpatient_bed_reservations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_reservations_ward_id" ON "clinical"."inpatient_bed_reservations" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_status_history_branch_id" ON "clinical"."inpatient_bed_status_history" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_turnaround_branch_id" ON "clinical"."inpatient_bed_turnaround" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_turnaround_ward_id" ON "clinical"."inpatient_bed_turnaround" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_beds_branch_id" ON "clinical"."inpatient_beds" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_beds_room_id" ON "clinical"."inpatient_beds" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_care_plans_branch_id" ON "clinical"."inpatient_care_plans" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_care_teams_branch_id" ON "clinical"."inpatient_care_teams" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_plans_branch_id" ON "clinical"."inpatient_discharge_plans" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_requests_branch_id" ON "clinical"."inpatient_discharge_requests" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_summaries_branch_id" ON "clinical"."inpatient_discharge_summaries" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_doctor_rounds_branch_id" ON "clinical"."inpatient_doctor_rounds" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_intake_output_branch_id" ON "clinical"."inpatient_intake_output" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_assessments_branch_id" ON "clinical"."inpatient_nursing_assessments" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_notes_branch_id" ON "clinical"."inpatient_nursing_notes" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_patient_locations_bed_id" ON "clinical"."inpatient_patient_locations" ("bed_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_patient_locations_branch_id" ON "clinical"."inpatient_patient_locations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_patient_locations_ward_id" ON "clinical"."inpatient_patient_locations" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_rooms_branch_id" ON "clinical"."inpatient_rooms" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_rooms_ward_id" ON "clinical"."inpatient_rooms" ("ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfer_approvals_branch_id" ON "clinical"."inpatient_transfer_approvals" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_admission_id" ON "clinical"."inpatient_transfers" ("admission_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_branch_id" ON "clinical"."inpatient_transfers" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_destination_bed_id" ON "clinical"."inpatient_transfers" ("destination_bed_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_destination_ward_id" ON "clinical"."inpatient_transfers" ("destination_ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_source_bed_id" ON "clinical"."inpatient_transfers" ("source_bed_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_source_ward_id" ON "clinical"."inpatient_transfers" ("source_ward_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_units_branch_id" ON "clinical"."inpatient_units" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_vital_observations_branch_id" ON "clinical"."inpatient_vital_observations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_wards_branch_id" ON "clinical"."inpatient_wards" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_wards_unit_id" ON "clinical"."inpatient_wards" ("unit_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_audit_traces_branch_id" ON "clinical"."insurance_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_audit_traces_organization_id" ON "clinical"."insurance_audit_traces" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_audit_traces_partner_id" ON "clinical"."insurance_audit_traces" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_audit_traces_patient_id" ON "clinical"."insurance_audit_traces" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_authorizations_branch_id" ON "clinical"."insurance_authorizations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_authorizations_encounter_id" ON "clinical"."insurance_authorizations" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_authorizations_organization_id" ON "clinical"."insurance_authorizations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_authorizations_partner_id" ON "clinical"."insurance_authorizations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_authorizations_policy_id" ON "clinical"."insurance_authorizations" ("policy_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claim_denials_claim_item_id" ON "clinical"."insurance_claim_denials" ("claim_item_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claim_items_charge_item_id" ON "clinical"."insurance_claim_items" ("charge_item_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claim_items_invoice_item_id" ON "clinical"."insurance_claim_items" ("invoice_item_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_authorization_id" ON "clinical"."insurance_claims" ("authorization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_branch_id" ON "clinical"."insurance_claims" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_encounter_id" ON "clinical"."insurance_claims" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_organization_id" ON "clinical"."insurance_claims" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_partner_id" ON "clinical"."insurance_claims" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_policy_id" ON "clinical"."insurance_claims" ("policy_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_document_records_authorization_id" ON "clinical"."insurance_document_records" ("authorization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_document_records_branch_id" ON "clinical"."insurance_document_records" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_document_records_organization_id" ON "clinical"."insurance_document_records" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_document_records_partner_id" ON "clinical"."insurance_document_records" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_eligibility_checks_branch_id" ON "clinical"."insurance_eligibility_checks" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_eligibility_checks_organization_id" ON "clinical"."insurance_eligibility_checks" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_eligibility_checks_partner_id" ON "clinical"."insurance_eligibility_checks" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_eligibility_checks_payer_id" ON "clinical"."insurance_eligibility_checks" ("payer_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_patient_policies_branch_id" ON "clinical"."insurance_patient_policies" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_patient_policies_organization_id" ON "clinical"."insurance_patient_policies" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_patient_policies_partner_id" ON "clinical"."insurance_patient_policies" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_payers_branch_id" ON "clinical"."insurance_payers" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_plans_organization_id" ON "clinical"."insurance_plans" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_plans_partner_id" ON "clinical"."insurance_plans" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_reconciliations_branch_id" ON "clinical"."insurance_reconciliations" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_reconciliations_organization_id" ON "clinical"."insurance_reconciliations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_reconciliations_partner_id" ON "clinical"."insurance_reconciliations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_settlements_branch_id" ON "clinical"."insurance_settlements" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_settlements_organization_id" ON "clinical"."insurance_settlements" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_settlements_partner_id" ON "clinical"."insurance_settlements" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_audit_traces_branch_id" ON "clinical"."investigation_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_catalog_branch_id" ON "clinical"."investigation_catalog" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_catalog_partner_id" ON "clinical"."investigation_catalog" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_orders_branch_id" ON "clinical"."investigation_orders" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_orders_investigation_id" ON "clinical"."investigation_orders" ("investigation_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_orders_panel_id" ON "clinical"."investigation_orders" ("panel_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_orders_partner_id" ON "clinical"."investigation_orders" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_panel_items_organization_id" ON "clinical"."investigation_panel_items" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_panel_items_partner_id" ON "clinical"."investigation_panel_items" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_panels_partner_id" ON "clinical"."investigation_panels" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_reports_organization_id" ON "clinical"."investigation_reports" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_reports_partner_id" ON "clinical"."investigation_reports" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_result_amendments_organization_id" ON "clinical"."investigation_result_amendments" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_result_amendments_partner_id" ON "clinical"."investigation_result_amendments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_result_amendments_report_id" ON "clinical"."investigation_result_amendments" ("report_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_results_organization_id" ON "clinical"."investigation_results" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_results_partner_id" ON "clinical"."investigation_results" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_results_specimen_id" ON "clinical"."investigation_results" ("specimen_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_specimens_organization_id" ON "clinical"."investigation_specimens" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_investigation_specimens_partner_id" ON "clinical"."investigation_specimens" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_legal_record_requests_record_id" ON "clinical"."legal_record_requests" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_medical_diagnosis_codes_record_id" ON "clinical"."medical_diagnosis_codes" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_medical_record_completion_tasks_record_id" ON "clinical"."medical_record_completion_tasks" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_medical_record_legal_holds_record_id" ON "clinical"."medical_record_legal_holds" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_medication_catalog_branch_id" ON "clinical"."medication_catalog" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_opd_slots_organization_id" ON "clinical"."opd_slots" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_opd_slots_partner_id" ON "clinical"."opd_slots" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_opd_slots_schedule_id" ON "clinical"."opd_slots" ("schedule_id");
CREATE INDEX IF NOT EXISTS "idx_operational_departments_partner_id" ON "clinical"."operational_departments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_operational_staff_partner_id" ON "clinical"."operational_staff" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_operational_staff_audit_traces_branch_id" ON "clinical"."operational_staff_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_operational_staff_audit_traces_department_id" ON "clinical"."operational_staff_audit_traces" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_ot_schedules_room_id" ON "clinical"."ot_schedules" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_ot_schedules_surgery_request_id" ON "clinical"."ot_schedules" ("surgery_request_id");
CREATE INDEX IF NOT EXISTS "idx_ot_transfers_destination_room_id" ON "clinical"."ot_transfers" ("destination_room_id");
CREATE INDEX IF NOT EXISTS "idx_patient_addresses_partner_id" ON "clinical"."patient_addresses" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_consents_organization_id" ON "clinical"."patient_consents" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_patient_consents_partner_id" ON "clinical"."patient_consents" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_contacts_partner_id" ON "clinical"."patient_contacts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_duplicate_candidates_organization_id" ON "clinical"."patient_duplicate_candidates" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_patient_duplicate_candidates_partner_id" ON "clinical"."patient_duplicate_candidates" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_emergency_contacts_partner_id" ON "clinical"."patient_emergency_contacts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_identifiers_organization_id" ON "clinical"."patient_identifiers" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_patient_identifiers_partner_id" ON "clinical"."patient_identifiers" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_insurance_policies_organization_id" ON "clinical"."patient_insurance_policies" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_patient_insurance_policies_partner_id" ON "clinical"."patient_insurance_policies" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_merge_events_organization_id" ON "clinical"."patient_merge_events" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_patient_merge_events_partner_id" ON "clinical"."patient_merge_events" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_patient_registration_audit_traces_branch_id" ON "clinical"."patient_registration_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_patients_merged_into_patient_id" ON "clinical"."patients" ("merged_into_patient_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_batches_organization_id" ON "clinical"."pharmacy_batches" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_batches_partner_id" ON "clinical"."pharmacy_batches" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_dispensing_items_medication_id" ON "clinical"."pharmacy_dispensing_items" ("medication_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_dispensing_items_substituted_medication_id" ON "clinical"."pharmacy_dispensing_items" ("substituted_medication_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_inventory_partner_id" ON "clinical"."pharmacy_inventory" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_returns_batch_id" ON "clinical"."pharmacy_returns" ("batch_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_returns_medication_id" ON "clinical"."pharmacy_returns" ("medication_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_returns_organization_id" ON "clinical"."pharmacy_returns" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_returns_partner_id" ON "clinical"."pharmacy_returns" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_adjustments_organization_id" ON "clinical"."pharmacy_stock_adjustments" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_adjustments_partner_id" ON "clinical"."pharmacy_stock_adjustments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_movements_organization_id" ON "clinical"."pharmacy_stock_movements" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_movements_partner_id" ON "clinical"."pharmacy_stock_movements" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_reservations_medication_id" ON "clinical"."pharmacy_stock_reservations" ("medication_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_reservations_organization_id" ON "clinical"."pharmacy_stock_reservations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_reservations_partner_id" ON "clinical"."pharmacy_stock_reservations" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_stock_reservations_prescription_item_id" ON "clinical"."pharmacy_stock_reservations" ("prescription_item_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_substitution_requests_organization_id" ON "clinical"."pharmacy_substitution_requests" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_substitution_requests_original_medication_id" ON "clinical"."pharmacy_substitution_requests" ("original_medication_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_substitution_requests_partner_id" ON "clinical"."pharmacy_substitution_requests" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_substitution_requests_prescription_item_id" ON "clinical"."pharmacy_substitution_requests" ("prescription_item_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_substitution_requests_requested_medication_id" ON "clinical"."pharmacy_substitution_requests" ("requested_medication_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_branch_id" ON "clinical"."procurement_audit_traces" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_goods_receipt_id" ON "clinical"."procurement_audit_traces" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_organization_id" ON "clinical"."procurement_audit_traces" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_partner_id" ON "clinical"."procurement_audit_traces" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_purchase_invoice_id" ON "clinical"."procurement_audit_traces" ("purchase_invoice_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_audit_traces_vendor_id" ON "clinical"."procurement_audit_traces" ("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_branch_id" ON "clinical"."procurement_exceptions" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_goods_receipt_id" ON "clinical"."procurement_exceptions" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_partner_id" ON "clinical"."procurement_exceptions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_purchase_invoice_id" ON "clinical"."procurement_exceptions" ("purchase_invoice_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_purchase_order_id" ON "clinical"."procurement_exceptions" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_exceptions_vendor_id" ON "clinical"."procurement_exceptions" ("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_inspection_items_goods_receipt_item_id" ON "clinical"."procurement_inspection_items" ("goods_receipt_item_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_inspection_items_procurement_item_id" ON "clinical"."procurement_inspection_items" ("procurement_item_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_inspections_branch_id" ON "clinical"."procurement_inspections" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_inspections_partner_id" ON "clinical"."procurement_inspections" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_items_branch_id" ON "clinical"."procurement_items" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_items_medication_catalog_id" ON "clinical"."procurement_items" ("medication_catalog_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_items_partner_id" ON "clinical"."procurement_items" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_vendor_contracts_branch_id" ON "clinical"."procurement_vendor_contracts" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_vendor_contracts_partner_id" ON "clinical"."procurement_vendor_contracts" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_vendors_branch_id" ON "clinical"."procurement_vendors" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_procurement_vendors_partner_id" ON "clinical"."procurement_vendors" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoice_matches_goods_receipt_id" ON "clinical"."purchase_invoice_matches" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoice_matches_purchase_order_id" ON "clinical"."purchase_invoice_matches" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_branch_id" ON "clinical"."purchase_invoices" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_goods_receipt_id" ON "clinical"."purchase_invoices" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_partner_id" ON "clinical"."purchase_invoices" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_purchase_order_id" ON "clinical"."purchase_invoices" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_order_items_procurement_item_id" ON "clinical"."purchase_order_items" ("procurement_item_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_branch_id" ON "clinical"."purchase_orders" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_contract_id" ON "clinical"."purchase_orders" ("contract_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_partner_id" ON "clinical"."purchase_orders" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_requisition_id" ON "clinical"."purchase_orders" ("requisition_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_requisition_items_procurement_item_id" ON "clinical"."purchase_requisition_items" ("procurement_item_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_branch_id" ON "clinical"."purchase_requisitions" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_department_id" ON "clinical"."purchase_requisitions" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_partner_id" ON "clinical"."purchase_requisitions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_suggested_vendor_id" ON "clinical"."purchase_requisitions" ("suggested_vendor_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_appointments_modality_id" ON "clinical"."radiology_appointments" ("modality_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_appointments_order_id" ON "clinical"."radiology_appointments" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_critical_findings_report_id" ON "clinical"."radiology_critical_findings" ("report_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_preparation_records_order_id" ON "clinical"."radiology_preparation_records" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_quality_events_study_id" ON "clinical"."radiology_quality_events" ("study_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_reports_order_id" ON "clinical"."radiology_reports" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_reports_study_id" ON "clinical"."radiology_reports" ("study_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_studies_order_id" ON "clinical"."radiology_studies" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_release_of_information_requests_record_id" ON "clinical"."release_of_information_requests" ("record_id");
CREATE INDEX IF NOT EXISTS "idx_staff_credentials_organization_id" ON "clinical"."staff_credentials" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_staff_credentials_partner_id" ON "clinical"."staff_credentials" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_staff_role_assignments_branch_id" ON "clinical"."staff_role_assignments" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_staff_role_assignments_department_id" ON "clinical"."staff_role_assignments" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_staff_role_assignments_organization_id" ON "clinical"."staff_role_assignments" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_staff_role_assignments_partner_id" ON "clinical"."staff_role_assignments" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_from_branch_id" ON "clinical"."staff_transfers" ("from_branch_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_from_department_id" ON "clinical"."staff_transfers" ("from_department_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_from_organization_id" ON "clinical"."staff_transfers" ("from_organization_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_partner_id" ON "clinical"."staff_transfers" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_to_branch_id" ON "clinical"."staff_transfers" ("to_branch_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_to_department_id" ON "clinical"."staff_transfers" ("to_department_id");
CREATE INDEX IF NOT EXISTS "idx_staff_transfers_to_organization_id" ON "clinical"."staff_transfers" ("to_organization_id");
CREATE INDEX IF NOT EXISTS "idx_surgery_request_items_procedure_id" ON "clinical"."surgery_request_items" ("procedure_id");
CREATE INDEX IF NOT EXISTS "idx_surgery_requests_procedure_id" ON "clinical"."surgery_requests" ("procedure_id");
CREATE INDEX IF NOT EXISTS "idx_transfusion_reactions_transfusion_id" ON "clinical"."transfusion_reactions" ("transfusion_id");
CREATE INDEX IF NOT EXISTS "idx_trauma_activations_encounter_id" ON "clinical"."trauma_activations" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_return_items_procurement_item_id" ON "clinical"."vendor_return_items" ("procurement_item_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_returns_branch_id" ON "clinical"."vendor_returns" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_returns_goods_receipt_id" ON "clinical"."vendor_returns" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_returns_partner_id" ON "clinical"."vendor_returns" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_returns_purchase_order_id" ON "clinical"."vendor_returns" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "idx_ai_audit_traces_actor_id" ON "company"."ai_audit_traces" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_ai_audit_traces_governance_policy_id" ON "company"."ai_audit_traces" ("governance_policy_id");
CREATE INDEX IF NOT EXISTS "idx_ai_audit_traces_partner_id" ON "company"."ai_audit_traces" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_ai_audit_traces_prompt_template_id" ON "company"."ai_audit_traces" ("prompt_template_id");
CREATE INDEX IF NOT EXISTS "idx_ai_governance_policies_approved_by_id" ON "company"."ai_governance_policies" ("approved_by_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_templates_owner_id" ON "company"."ai_prompt_templates" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_versions_approved_by_id" ON "company"."ai_prompt_versions" ("approved_by_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_versions_created_by_id" ON "company"."ai_prompt_versions" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_ai_safety_events_acknowledged_by_id" ON "company"."ai_safety_events" ("acknowledged_by_id");
CREATE INDEX IF NOT EXISTS "idx_ai_safety_events_governance_policy_id" ON "company"."ai_safety_events" ("governance_policy_id");
CREATE INDEX IF NOT EXISTS "idx_ai_safety_events_model_id" ON "company"."ai_safety_events" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_ai_safety_events_prompt_template_id" ON "company"."ai_safety_events" ("prompt_template_id");
CREATE INDEX IF NOT EXISTS "idx_analytics_reports_created_by_id" ON "company"."analytics_reports" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_api_rate_limit_policies_owner_id" ON "company"."api_rate_limit_policies" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_api_routes_owner_id" ON "company"."api_routes" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_api_versions_owner_id" ON "company"."api_versions" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_artifact_repositories_owner_id" ON "company"."artifact_repositories" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_baa_records_owner_id" ON "company"."baa_records" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_backup_policies_owner_id" ON "company"."backup_policies" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_build_pipelines_owner_id" ON "company"."build_pipelines" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_build_runs_triggered_by_id" ON "company"."build_runs" ("triggered_by_id");
CREATE INDEX IF NOT EXISTS "idx_cicd_pipelines_owner_id" ON "company"."cicd_pipelines" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_company_audit_traces_actor_id" ON "company"."company_audit_traces" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_control_mappings_mapped_by_id" ON "company"."compliance_control_mappings" ("mapped_by_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_controls_owner_id" ON "company"."compliance_controls" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_evidence_reviewed_by_id" ON "company"."compliance_evidence" ("reviewed_by_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_evidence_submitted_by_id" ON "company"."compliance_evidence" ("submitted_by_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_frameworks_owner_id" ON "company"."compliance_frameworks" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_officers_employee_id" ON "company"."compliance_officers" ("employee_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_generated_by_id" ON "company"."compliance_reports" ("generated_by_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_verifications_verifier_id" ON "company"."compliance_verifications" ("verifier_id");
CREATE INDEX IF NOT EXISTS "idx_content_items_author_id" ON "company"."content_items" ("author_id");
CREATE INDEX IF NOT EXISTS "idx_corporate_policies_legal_entity_id" ON "company"."corporate_policies" ("legal_entity_id");
CREATE INDEX IF NOT EXISTS "idx_data_classifications_owner_id" ON "company"."data_classifications" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_data_retention_policies_owner_id" ON "company"."data_retention_policies" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_departments_parent_department_id" ON "company"."departments" ("parent_department_id");
CREATE INDEX IF NOT EXISTS "idx_disaster_recovery_drills_conducted_by_id" ON "company"."disaster_recovery_drills" ("conducted_by_id");
CREATE INDEX IF NOT EXISTS "idx_disaster_recovery_plans_owner_id" ON "company"."disaster_recovery_plans" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_environment_configurations_updated_by_id" ON "company"."environment_configurations" ("updated_by_id");
CREATE INDEX IF NOT EXISTS "idx_failover_events_initiated_by_id" ON "company"."failover_events" ("initiated_by_id");
CREATE INDEX IF NOT EXISTS "idx_failover_events_source_region_id" ON "company"."failover_events" ("source_region_id");
CREATE INDEX IF NOT EXISTS "idx_failover_events_target_region_id" ON "company"."failover_events" ("target_region_id");
CREATE INDEX IF NOT EXISTS "idx_governance_exceptions_approved_by_id" ON "company"."governance_exceptions" ("approved_by_id");
CREATE INDEX IF NOT EXISTS "idx_governance_exceptions_owner_id" ON "company"."governance_exceptions" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_governance_exceptions_requested_by_id" ON "company"."governance_exceptions" ("requested_by_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_alerts_assigned_to_id" ON "company"."infrastructure_alerts" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_audit_traces_actor_id" ON "company"."infrastructure_audit_traces" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_clusters_owner_id" ON "company"."infrastructure_clusters" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_databases_backup_policy_id" ON "company"."infrastructure_databases" ("backup_policy_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_databases_cluster_id" ON "company"."infrastructure_databases" ("cluster_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_databases_owner_id" ON "company"."infrastructure_databases" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_incidents_assigned_to_id" ON "company"."infrastructure_incidents" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_replication_links_source_region_id" ON "company"."infrastructure_replication_links" ("source_region_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_replication_links_target_region_id" ON "company"."infrastructure_replication_links" ("target_region_id");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_services_owner_id" ON "company"."infrastructure_services" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_integration_audit_traces_actor_id" ON "company"."integration_audit_traces" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_integration_audit_traces_webhook_delivery_id" ON "company"."integration_audit_traces" ("webhook_delivery_id");
CREATE INDEX IF NOT EXISTS "idx_integration_connections_endpoint_id" ON "company"."integration_connections" ("endpoint_id");
CREATE INDEX IF NOT EXISTS "idx_integration_credentials_created_by_id" ON "company"."integration_credentials" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_integration_endpoints_owner_id" ON "company"."integration_endpoints" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_integration_incidents_assigned_to_id" ON "company"."integration_incidents" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_integration_providers_owner_id" ON "company"."integration_providers" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_internal_employees_manager_employee_id" ON "company"."internal_employees" ("manager_employee_id");
CREATE INDEX IF NOT EXISTS "idx_internal_employees_user_id" ON "company"."internal_employees" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_marketing_campaigns_owner_id" ON "company"."marketing_campaigns" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_package_releases_released_by_id" ON "company"."package_releases" ("released_by_id");
CREATE INDEX IF NOT EXISTS "idx_partner_configuration_versions_applied_template_id" ON "company"."partner_configuration_versions" ("applied_template_id");
CREATE INDEX IF NOT EXISTS "idx_partner_health_profiles_assigned_success_lead_id" ON "company"."partner_health_profiles" ("assigned_success_lead_id");
CREATE INDEX IF NOT EXISTS "idx_partner_lifecycle_transitions_actor_id" ON "company"."partner_lifecycle_transitions" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_partner_onboarding_staged_registrations_approved_by" ON "company"."partner_onboarding_staged_registrations" ("approved_by");
CREATE INDEX IF NOT EXISTS "idx_partner_plan_assignments_assigned_by_id" ON "company"."partner_plan_assignments" ("assigned_by_id");
CREATE INDEX IF NOT EXISTS "idx_partner_plan_assignments_product_id" ON "company"."partner_plan_assignments" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_partner_profiles_applied_template_id" ON "company"."partner_profiles" ("applied_template_id");
CREATE INDEX IF NOT EXISTS "idx_platform_artifacts_build_run_id" ON "company"."platform_artifacts" ("build_run_id");
CREATE INDEX IF NOT EXISTS "idx_platform_audit_traces_actor_id" ON "company"."platform_audit_traces" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_platform_deployments_deployed_by_id" ON "company"."platform_deployments" ("deployed_by_id");
CREATE INDEX IF NOT EXISTS "idx_platform_environments_owner_id" ON "company"."platform_environments" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_platform_incidents_assigned_to_id" ON "company"."platform_incidents" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_restore_verifications_verified_by_id" ON "company"."restore_verifications" ("verified_by_id");
CREATE INDEX IF NOT EXISTS "idx_sales_leads_assigned_owner_id" ON "company"."sales_leads" ("assigned_owner_id");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_assigned_owner_id" ON "company"."sales_opportunities" ("assigned_owner_id");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_lead_id" ON "company"."sales_opportunities" ("lead_id");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_product_id" ON "company"."sales_opportunities" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_target_plan_id" ON "company"."sales_opportunities" ("target_plan_id");
CREATE INDEX IF NOT EXISTS "idx_sales_tasks_assigned_user_id" ON "company"."sales_tasks" ("assigned_user_id");
CREATE INDEX IF NOT EXISTS "idx_sales_tasks_lead_id" ON "company"."sales_tasks" ("lead_id");
CREATE INDEX IF NOT EXISTS "idx_sales_tasks_opportunity_id" ON "company"."sales_tasks" ("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_sales_tasks_partner_id" ON "company"."sales_tasks" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_security_audit_verifications_verified_by_id" ON "company"."security_audit_verifications" ("verified_by_id");
CREATE INDEX IF NOT EXISTS "idx_security_credentials_created_by_id" ON "company"."security_credentials" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_security_incidents_assigned_to_id" ON "company"."security_incidents" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_security_policies_approved_by_id" ON "company"."security_policies" ("approved_by_id");
CREATE INDEX IF NOT EXISTS "idx_security_policies_owner_id" ON "company"."security_policies" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_security_role_permissions_granted_by_id" ON "company"."security_role_permissions" ("granted_by_id");
CREATE INDEX IF NOT EXISTS "idx_security_roles_created_by_id" ON "company"."security_roles" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_security_user_roles_assigned_by_id" ON "company"."security_user_roles" ("assigned_by_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_plan_id" ON "company"."subscriptions" ("plan_id");
CREATE INDEX IF NOT EXISTS "idx_success_checkins_host_lead_id" ON "company"."success_checkins" ("host_lead_id");
CREATE INDEX IF NOT EXISTS "idx_support_ticket_comments_author_id" ON "company"."support_ticket_comments" ("author_id");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_assigned_agent_id" ON "company"."support_tickets" ("assigned_agent_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_branch_id" ON "core"."sessions" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_requirements_stage_id" ON "public"."workflow_requirements" ("stage_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_stages_version_id" ON "public"."workflow_stages" ("version_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_stages_workflow_id" ON "public"."workflow_stages" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_transitions_from_stage_id" ON "public"."workflow_transitions" ("from_stage_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_transitions_to_stage_id" ON "public"."workflow_transitions" ("to_stage_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_transitions_version_id" ON "public"."workflow_transitions" ("version_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_transitions_workflow_id" ON "public"."workflow_transitions" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_versions_workflow_id" ON "public"."workflow_versions" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_anaesthesia_records_patient_id" ON "clinical"."anaesthesia_records" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_partitioned_doctor_id" ON "clinical"."appointments_partitioned" ("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_billing_invoices_partitioned_patient_id" ON "clinical"."billing_invoices_partitioned" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_blood_requests_encounter_id" ON "clinical"."blood_requests" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_blood_requests_patient_id" ON "clinical"."blood_requests" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_audit_traces_consultation_id" ON "clinical"."consultation_audit_traces" ("consultation_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_audit_traces_encounter_id" ON "clinical"."consultation_audit_traces" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_consultation_audit_traces_patient_id" ON "clinical"."consultation_audit_traces" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_death_registry_records_encounter_id" ON "clinical"."death_registry_records" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_assessments_patient_id" ON "clinical"."dietary_assessments" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_billing_references_patient_id" ON "clinical"."dietary_billing_references" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_dietary_orders_patient_id" ON "clinical"."dietary_orders" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_payout_configurations_doctor_id" ON "clinical"."doctor_payout_configurations" ("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_settlement_vouchers_doctor_id" ON "clinical"."doctor_settlement_vouchers" ("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_volume_payout_tiers_doctor_id" ON "clinical"."doctor_volume_payout_tiers" ("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_emergency_triage_assessments_patient_id" ON "clinical"."emergency_triage_assessments" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_audit_traces_encounter_id" ON "clinical"."encounter_audit_traces" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_encounter_audit_traces_patient_id" ON "clinical"."encounter_audit_traces" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_partitioned_invoice_id" ON "clinical"."financial_transactions_partitioned" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_hai_surveillance_records_patient_id" ON "clinical"."hai_surveillance_records" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admission_requests_encounter_id" ON "clinical"."inpatient_admission_requests" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admission_requests_patient_id" ON "clinical"."inpatient_admission_requests" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_admissions_encounter_id" ON "clinical"."inpatient_admissions" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_audit_traces_patient_id" ON "clinical"."inpatient_audit_traces" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_allocations_patient_id" ON "clinical"."inpatient_bed_allocations" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_reservations_patient_id" ON "clinical"."inpatient_bed_reservations" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_status_history_patient_id" ON "clinical"."inpatient_bed_status_history" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_care_plans_patient_id" ON "clinical"."inpatient_care_plans" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_plans_patient_id" ON "clinical"."inpatient_discharge_plans" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_requests_patient_id" ON "clinical"."inpatient_discharge_requests" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_discharge_summaries_patient_id" ON "clinical"."inpatient_discharge_summaries" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_doctor_rounds_patient_id" ON "clinical"."inpatient_doctor_rounds" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_intake_output_patient_id" ON "clinical"."inpatient_intake_output" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_assessments_patient_id" ON "clinical"."inpatient_nursing_assessments" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_notes_patient_id" ON "clinical"."inpatient_nursing_notes" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_patient_locations_patient_id" ON "clinical"."inpatient_patient_locations" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_transfers_patient_id" ON "clinical"."inpatient_transfers" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_inpatient_vital_observations_patient_id" ON "clinical"."inpatient_vital_observations" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_intraoperative_records_patient_id" ON "clinical"."intraoperative_records" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_operative_notes_patient_id" ON "clinical"."operative_notes" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_ot_schedules_patient_id" ON "clinical"."ot_schedules" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_ot_transfers_patient_id" ON "clinical"."ot_transfers" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_pacu_recovery_records_patient_id" ON "clinical"."pacu_recovery_records" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_care_passes_patient_id" ON "clinical"."patient_care_passes" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_credit_accounts_patient_id" ON "clinical"."patient_credit_accounts" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_health_wallets_patient_id" ON "clinical"."patient_health_wallets" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_package_consumptions_encounter_id" ON "clinical"."patient_package_consumptions" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_patient_packages_invoice_id" ON "clinical"."patient_packages" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_patient_packages_patient_id" ON "clinical"."patient_packages" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_patient_registration_audit_traces_patient_id" ON "clinical"."patient_registration_audit_traces" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_pharmacy_chronic_refill_radars_patient_id" ON "clinical"."pharmacy_chronic_refill_radars" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_postoperative_transfers_patient_id" ON "clinical"."postoperative_transfers" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_pre_op_checklists_patient_id" ON "clinical"."pre_op_checklists" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_pre_operative_assessments_patient_id" ON "clinical"."pre_operative_assessments" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_prescription_templates_doctor_id" ON "clinical"."prescription_templates" ("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_radiology_orders_encounter_id" ON "clinical"."radiology_orders" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_supply_chain_consumptions_encounter_id" ON "clinical"."supply_chain_consumptions" ("encounter_id");
CREATE INDEX IF NOT EXISTS "idx_supply_chain_consumptions_patient_id" ON "clinical"."supply_chain_consumptions" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgery_cancellations_patient_id" ON "clinical"."surgery_cancellations" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgery_emi_applications_patient_id" ON "clinical"."surgery_emi_applications" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgical_consents_patient_id" ON "clinical"."surgical_consents" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgical_consumable_usage_patient_id" ON "clinical"."surgical_consumable_usage" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgical_implants_patient_id" ON "clinical"."surgical_implants" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgical_safety_checklists_patient_id" ON "clinical"."surgical_safety_checklists" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_surgical_specimens_patient_id" ON "clinical"."surgical_specimens" ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_transfusion_records_encounter_id" ON "clinical"."transfusion_records" ("encounter_id");
