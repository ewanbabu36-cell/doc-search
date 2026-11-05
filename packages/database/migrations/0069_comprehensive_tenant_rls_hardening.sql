-- ==============================================================================
-- Migration: 0070_comprehensive_tenant_rls_hardening.sql
-- Description: Comprehensive Row-Level Security (RLS) hardening across all tenant-bound
--              and partner-bound entity tables in docsearch.
-- Enforces: SuperAdmin bypass, Tenant Isolation via core.get_current_tenant_id(),
--           and FORCE ROW LEVEL SECURITY to prevent tenant leaks across all roles.
-- ==============================================================================

BEGIN;

-- Table: "clinical"."abdm_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."abdm_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."abdm_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_abdm_audit_traces_tenant_isolation" ON "clinical"."abdm_audit_traces";
CREATE POLICY "p_clinical_abdm_audit_traces_tenant_isolation" ON "clinical"."abdm_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."abdm_care_context_mappings" (Type: uuid)
ALTER TABLE "clinical"."abdm_care_context_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."abdm_care_context_mappings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_abdm_care_context_mappings_tenant_isolation" ON "clinical"."abdm_care_context_mappings";
CREATE POLICY "p_clinical_abdm_care_context_mappings_tenant_isolation" ON "clinical"."abdm_care_context_mappings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."abdm_consent_artefacts" (Type: uuid)
ALTER TABLE "clinical"."abdm_consent_artefacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."abdm_consent_artefacts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_abdm_consent_artefacts_tenant_isolation" ON "clinical"."abdm_consent_artefacts";
CREATE POLICY "p_clinical_abdm_consent_artefacts_tenant_isolation" ON "clinical"."abdm_consent_artefacts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ambient_ai_scribe_transcripts" (Type: uuid)
ALTER TABLE "clinical"."ambient_ai_scribe_transcripts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ambient_ai_scribe_transcripts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ambient_ai_scribe_transcripts_tenant_isolation" ON "clinical"."ambient_ai_scribe_transcripts";
CREATE POLICY "p_clinical_ambient_ai_scribe_transcripts_tenant_isolation" ON "clinical"."ambient_ai_scribe_transcripts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."anaesthesia_records" (Type: uuid)
ALTER TABLE "clinical"."anaesthesia_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."anaesthesia_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_anaesthesia_records_tenant_isolation" ON "clinical"."anaesthesia_records";
CREATE POLICY "p_clinical_anaesthesia_records_tenant_isolation" ON "clinical"."anaesthesia_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."appointments_partitioned" (Type: uuid)
ALTER TABLE "clinical"."appointments_partitioned" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."appointments_partitioned" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_appointments_partitioned_tenant_isolation" ON "clinical"."appointments_partitioned";
CREATE POLICY "p_clinical_appointments_partitioned_tenant_isolation" ON "clinical"."appointments_partitioned"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_advances" (Type: uuid)
ALTER TABLE "clinical"."billing_advances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_advances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_advances_tenant_isolation" ON "clinical"."billing_advances";
CREATE POLICY "p_clinical_billing_advances_tenant_isolation" ON "clinical"."billing_advances"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."billing_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_audit_traces_tenant_isolation" ON "clinical"."billing_audit_traces";
CREATE POLICY "p_clinical_billing_audit_traces_tenant_isolation" ON "clinical"."billing_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_cashier_sessions" (Type: uuid)
ALTER TABLE "clinical"."billing_cashier_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_cashier_sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_cashier_sessions_tenant_isolation" ON "clinical"."billing_cashier_sessions";
CREATE POLICY "p_clinical_billing_cashier_sessions_tenant_isolation" ON "clinical"."billing_cashier_sessions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_charge_items" (Type: uuid)
ALTER TABLE "clinical"."billing_charge_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_charge_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_charge_items_tenant_isolation" ON "clinical"."billing_charge_items";
CREATE POLICY "p_clinical_billing_charge_items_tenant_isolation" ON "clinical"."billing_charge_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_charges" (Type: uuid)
ALTER TABLE "clinical"."billing_charges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_charges" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_charges_tenant_isolation" ON "clinical"."billing_charges";
CREATE POLICY "p_clinical_billing_charges_tenant_isolation" ON "clinical"."billing_charges"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_credit_notes" (Type: uuid)
ALTER TABLE "clinical"."billing_credit_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_credit_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_credit_notes_tenant_isolation" ON "clinical"."billing_credit_notes";
CREATE POLICY "p_clinical_billing_credit_notes_tenant_isolation" ON "clinical"."billing_credit_notes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_debit_adjustments" (Type: uuid)
ALTER TABLE "clinical"."billing_debit_adjustments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_debit_adjustments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_debit_adjustments_tenant_isolation" ON "clinical"."billing_debit_adjustments";
CREATE POLICY "p_clinical_billing_debit_adjustments_tenant_isolation" ON "clinical"."billing_debit_adjustments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_discounts" (Type: uuid)
ALTER TABLE "clinical"."billing_discounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_discounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_discounts_tenant_isolation" ON "clinical"."billing_discounts";
CREATE POLICY "p_clinical_billing_discounts_tenant_isolation" ON "clinical"."billing_discounts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_eod_closings" (Type: uuid)
ALTER TABLE "clinical"."billing_eod_closings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_eod_closings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_eod_closings_tenant_isolation" ON "clinical"."billing_eod_closings";
CREATE POLICY "p_clinical_billing_eod_closings_tenant_isolation" ON "clinical"."billing_eod_closings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_financial_transactions" (Type: uuid)
ALTER TABLE "clinical"."billing_financial_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_financial_transactions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_financial_transactions_tenant_isolation" ON "clinical"."billing_financial_transactions";
CREATE POLICY "p_clinical_billing_financial_transactions_tenant_isolation" ON "clinical"."billing_financial_transactions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_invoice_items" (Type: uuid)
ALTER TABLE "clinical"."billing_invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_invoice_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_invoice_items_tenant_isolation" ON "clinical"."billing_invoice_items";
CREATE POLICY "p_clinical_billing_invoice_items_tenant_isolation" ON "clinical"."billing_invoice_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_invoices" (Type: uuid)
ALTER TABLE "clinical"."billing_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_invoices_tenant_isolation" ON "clinical"."billing_invoices";
CREATE POLICY "p_clinical_billing_invoices_tenant_isolation" ON "clinical"."billing_invoices"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_invoices_partitioned" (Type: uuid)
ALTER TABLE "clinical"."billing_invoices_partitioned" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_invoices_partitioned" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_invoices_partitioned_tenant_isolation" ON "clinical"."billing_invoices_partitioned";
CREATE POLICY "p_clinical_billing_invoices_partitioned_tenant_isolation" ON "clinical"."billing_invoices_partitioned"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_package_items" (Type: uuid)
ALTER TABLE "clinical"."billing_package_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_package_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_package_items_tenant_isolation" ON "clinical"."billing_package_items";
CREATE POLICY "p_clinical_billing_package_items_tenant_isolation" ON "clinical"."billing_package_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_packages" (Type: uuid)
ALTER TABLE "clinical"."billing_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_packages_tenant_isolation" ON "clinical"."billing_packages";
CREATE POLICY "p_clinical_billing_packages_tenant_isolation" ON "clinical"."billing_packages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_payment_allocations" (Type: uuid)
ALTER TABLE "clinical"."billing_payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_payment_allocations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_payment_allocations_tenant_isolation" ON "clinical"."billing_payment_allocations";
CREATE POLICY "p_clinical_billing_payment_allocations_tenant_isolation" ON "clinical"."billing_payment_allocations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_payments" (Type: uuid)
ALTER TABLE "clinical"."billing_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_payments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_payments_tenant_isolation" ON "clinical"."billing_payments";
CREATE POLICY "p_clinical_billing_payments_tenant_isolation" ON "clinical"."billing_payments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_price_list_items" (Type: uuid)
ALTER TABLE "clinical"."billing_price_list_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_price_list_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_price_list_items_tenant_isolation" ON "clinical"."billing_price_list_items";
CREATE POLICY "p_clinical_billing_price_list_items_tenant_isolation" ON "clinical"."billing_price_list_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_price_lists" (Type: uuid)
ALTER TABLE "clinical"."billing_price_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_price_lists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_price_lists_tenant_isolation" ON "clinical"."billing_price_lists";
CREATE POLICY "p_clinical_billing_price_lists_tenant_isolation" ON "clinical"."billing_price_lists"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_receipts" (Type: uuid)
ALTER TABLE "clinical"."billing_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_receipts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_receipts_tenant_isolation" ON "clinical"."billing_receipts";
CREATE POLICY "p_clinical_billing_receipts_tenant_isolation" ON "clinical"."billing_receipts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_reconciliations" (Type: uuid)
ALTER TABLE "clinical"."billing_reconciliations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_reconciliations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_reconciliations_tenant_isolation" ON "clinical"."billing_reconciliations";
CREATE POLICY "p_clinical_billing_reconciliations_tenant_isolation" ON "clinical"."billing_reconciliations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_refunds" (Type: uuid)
ALTER TABLE "clinical"."billing_refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_refunds" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_refunds_tenant_isolation" ON "clinical"."billing_refunds";
CREATE POLICY "p_clinical_billing_refunds_tenant_isolation" ON "clinical"."billing_refunds"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."billing_service_catalog" (Type: uuid)
ALTER TABLE "clinical"."billing_service_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."billing_service_catalog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_billing_service_catalog_tenant_isolation" ON "clinical"."billing_service_catalog";
CREATE POLICY "p_clinical_billing_service_catalog_tenant_isolation" ON "clinical"."billing_service_catalog"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_asset_transfers" (Type: uuid)
ALTER TABLE "clinical"."biomedical_asset_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_asset_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_asset_transfers_tenant_isolation" ON "clinical"."biomedical_asset_transfers";
CREATE POLICY "p_clinical_biomedical_asset_transfers_tenant_isolation" ON "clinical"."biomedical_asset_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_assets" (Type: uuid)
ALTER TABLE "clinical"."biomedical_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_assets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_assets_tenant_isolation" ON "clinical"."biomedical_assets";
CREATE POLICY "p_clinical_biomedical_assets_tenant_isolation" ON "clinical"."biomedical_assets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."biomedical_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_audit_traces_tenant_isolation" ON "clinical"."biomedical_audit_traces";
CREATE POLICY "p_clinical_biomedical_audit_traces_tenant_isolation" ON "clinical"."biomedical_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_calibration_records" (Type: uuid)
ALTER TABLE "clinical"."biomedical_calibration_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_calibration_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_calibration_records_tenant_isolation" ON "clinical"."biomedical_calibration_records";
CREATE POLICY "p_clinical_biomedical_calibration_records_tenant_isolation" ON "clinical"."biomedical_calibration_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_condemnations" (Type: uuid)
ALTER TABLE "clinical"."biomedical_condemnations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_condemnations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_condemnations_tenant_isolation" ON "clinical"."biomedical_condemnations";
CREATE POLICY "p_clinical_biomedical_condemnations_tenant_isolation" ON "clinical"."biomedical_condemnations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_incidents" (Type: uuid)
ALTER TABLE "clinical"."biomedical_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_incidents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_incidents_tenant_isolation" ON "clinical"."biomedical_incidents";
CREATE POLICY "p_clinical_biomedical_incidents_tenant_isolation" ON "clinical"."biomedical_incidents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_ppm_schedules" (Type: uuid)
ALTER TABLE "clinical"."biomedical_ppm_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_ppm_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_ppm_schedules_tenant_isolation" ON "clinical"."biomedical_ppm_schedules";
CREATE POLICY "p_clinical_biomedical_ppm_schedules_tenant_isolation" ON "clinical"."biomedical_ppm_schedules"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_procurement_references" (Type: uuid)
ALTER TABLE "clinical"."biomedical_procurement_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_procurement_references" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_procurement_references_tenant_isolation" ON "clinical"."biomedical_procurement_references";
CREATE POLICY "p_clinical_biomedical_procurement_references_tenant_isolation" ON "clinical"."biomedical_procurement_references"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_safety_test_records" (Type: uuid)
ALTER TABLE "clinical"."biomedical_safety_test_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_safety_test_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_safety_test_records_tenant_isolation" ON "clinical"."biomedical_safety_test_records";
CREATE POLICY "p_clinical_biomedical_safety_test_records_tenant_isolation" ON "clinical"."biomedical_safety_test_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_spare_part_usages" (Type: uuid)
ALTER TABLE "clinical"."biomedical_spare_part_usages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_spare_part_usages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_spare_part_usages_tenant_isolation" ON "clinical"."biomedical_spare_part_usages";
CREATE POLICY "p_clinical_biomedical_spare_part_usages_tenant_isolation" ON "clinical"."biomedical_spare_part_usages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_spare_parts" (Type: uuid)
ALTER TABLE "clinical"."biomedical_spare_parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_spare_parts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_spare_parts_tenant_isolation" ON "clinical"."biomedical_spare_parts";
CREATE POLICY "p_clinical_biomedical_spare_parts_tenant_isolation" ON "clinical"."biomedical_spare_parts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_vendor_visits" (Type: uuid)
ALTER TABLE "clinical"."biomedical_vendor_visits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_vendor_visits" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_vendor_visits_tenant_isolation" ON "clinical"."biomedical_vendor_visits";
CREATE POLICY "p_clinical_biomedical_vendor_visits_tenant_isolation" ON "clinical"."biomedical_vendor_visits"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_waste_logs" (Type: uuid)
ALTER TABLE "clinical"."biomedical_waste_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_waste_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_waste_logs_tenant_isolation" ON "clinical"."biomedical_waste_logs";
CREATE POLICY "p_clinical_biomedical_waste_logs_tenant_isolation" ON "clinical"."biomedical_waste_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."biomedical_work_orders" (Type: uuid)
ALTER TABLE "clinical"."biomedical_work_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."biomedical_work_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_biomedical_work_orders_tenant_isolation" ON "clinical"."biomedical_work_orders";
CREATE POLICY "p_clinical_biomedical_work_orders_tenant_isolation" ON "clinical"."biomedical_work_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."birth_registry_records" (Type: uuid)
ALTER TABLE "clinical"."birth_registry_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."birth_registry_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_birth_registry_records_tenant_isolation" ON "clinical"."birth_registry_records";
CREATE POLICY "p_clinical_birth_registry_records_tenant_isolation" ON "clinical"."birth_registry_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_bank_audit_events" (Type: uuid)
ALTER TABLE "clinical"."blood_bank_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_bank_audit_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_bank_audit_events_tenant_isolation" ON "clinical"."blood_bank_audit_events";
CREATE POLICY "p_clinical_blood_bank_audit_events_tenant_isolation" ON "clinical"."blood_bank_audit_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_banks" (Type: uuid)
ALTER TABLE "clinical"."blood_banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_banks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_banks_tenant_isolation" ON "clinical"."blood_banks";
CREATE POLICY "p_clinical_blood_banks_tenant_isolation" ON "clinical"."blood_banks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_components" (Type: uuid)
ALTER TABLE "clinical"."blood_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_components" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_components_tenant_isolation" ON "clinical"."blood_components";
CREATE POLICY "p_clinical_blood_components_tenant_isolation" ON "clinical"."blood_components"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_crossmatches" (Type: uuid)
ALTER TABLE "clinical"."blood_crossmatches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_crossmatches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_crossmatches_tenant_isolation" ON "clinical"."blood_crossmatches";
CREATE POLICY "p_clinical_blood_crossmatches_tenant_isolation" ON "clinical"."blood_crossmatches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_discard_records" (Type: uuid)
ALTER TABLE "clinical"."blood_discard_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_discard_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_discard_records_tenant_isolation" ON "clinical"."blood_discard_records";
CREATE POLICY "p_clinical_blood_discard_records_tenant_isolation" ON "clinical"."blood_discard_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_donations" (Type: uuid)
ALTER TABLE "clinical"."blood_donations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_donations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_donations_tenant_isolation" ON "clinical"."blood_donations";
CREATE POLICY "p_clinical_blood_donations_tenant_isolation" ON "clinical"."blood_donations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_donor_screenings" (Type: uuid)
ALTER TABLE "clinical"."blood_donor_screenings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_donor_screenings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_donor_screenings_tenant_isolation" ON "clinical"."blood_donor_screenings";
CREATE POLICY "p_clinical_blood_donor_screenings_tenant_isolation" ON "clinical"."blood_donor_screenings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_donors" (Type: uuid)
ALTER TABLE "clinical"."blood_donors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_donors" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_donors_tenant_isolation" ON "clinical"."blood_donors";
CREATE POLICY "p_clinical_blood_donors_tenant_isolation" ON "clinical"."blood_donors"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_issues" (Type: uuid)
ALTER TABLE "clinical"."blood_issues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_issues" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_issues_tenant_isolation" ON "clinical"."blood_issues";
CREATE POLICY "p_clinical_blood_issues_tenant_isolation" ON "clinical"."blood_issues"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_quality_checks" (Type: uuid)
ALTER TABLE "clinical"."blood_quality_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_quality_checks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_quality_checks_tenant_isolation" ON "clinical"."blood_quality_checks";
CREATE POLICY "p_clinical_blood_quality_checks_tenant_isolation" ON "clinical"."blood_quality_checks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_requests" (Type: uuid)
ALTER TABLE "clinical"."blood_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_requests_tenant_isolation" ON "clinical"."blood_requests";
CREATE POLICY "p_clinical_blood_requests_tenant_isolation" ON "clinical"."blood_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_temperature_logs" (Type: uuid)
ALTER TABLE "clinical"."blood_temperature_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_temperature_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_temperature_logs_tenant_isolation" ON "clinical"."blood_temperature_logs";
CREATE POLICY "p_clinical_blood_temperature_logs_tenant_isolation" ON "clinical"."blood_temperature_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."blood_tests" (Type: uuid)
ALTER TABLE "clinical"."blood_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."blood_tests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_blood_tests_tenant_isolation" ON "clinical"."blood_tests";
CREATE POLICY "p_clinical_blood_tests_tenant_isolation" ON "clinical"."blood_tests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."cdss_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."cdss_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."cdss_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_cdss_audit_traces_tenant_isolation" ON "clinical"."cdss_audit_traces";
CREATE POLICY "p_clinical_cdss_audit_traces_tenant_isolation" ON "clinical"."cdss_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."clinical_documentation_queries" (Type: uuid)
ALTER TABLE "clinical"."clinical_documentation_queries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."clinical_documentation_queries" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_clinical_documentation_queries_tenant_isolation" ON "clinical"."clinical_documentation_queries";
CREATE POLICY "p_clinical_clinical_documentation_queries_tenant_isolation" ON "clinical"."clinical_documentation_queries"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."coding_reviews" (Type: uuid)
ALTER TABLE "clinical"."coding_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."coding_reviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_coding_reviews_tenant_isolation" ON "clinical"."coding_reviews";
CREATE POLICY "p_clinical_coding_reviews_tenant_isolation" ON "clinical"."coding_reviews"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."consultation_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_audit_traces_tenant_isolation" ON "clinical"."consultation_audit_traces";
CREATE POLICY "p_clinical_consultation_audit_traces_tenant_isolation" ON "clinical"."consultation_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_diagnoses" (Type: uuid)
ALTER TABLE "clinical"."consultation_diagnoses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_diagnoses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_diagnoses_tenant_isolation" ON "clinical"."consultation_diagnoses";
CREATE POLICY "p_clinical_consultation_diagnoses_tenant_isolation" ON "clinical"."consultation_diagnoses"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_examinations" (Type: uuid)
ALTER TABLE "clinical"."consultation_examinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_examinations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_examinations_tenant_isolation" ON "clinical"."consultation_examinations";
CREATE POLICY "p_clinical_consultation_examinations_tenant_isolation" ON "clinical"."consultation_examinations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_fee_matrices" (Type: uuid)
ALTER TABLE "clinical"."consultation_fee_matrices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_fee_matrices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_fee_matrices_tenant_isolation" ON "clinical"."consultation_fee_matrices";
CREATE POLICY "p_clinical_consultation_fee_matrices_tenant_isolation" ON "clinical"."consultation_fee_matrices"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_followups" (Type: uuid)
ALTER TABLE "clinical"."consultation_followups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_followups" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_followups_tenant_isolation" ON "clinical"."consultation_followups";
CREATE POLICY "p_clinical_consultation_followups_tenant_isolation" ON "clinical"."consultation_followups"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_instructions" (Type: uuid)
ALTER TABLE "clinical"."consultation_instructions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_instructions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_instructions_tenant_isolation" ON "clinical"."consultation_instructions";
CREATE POLICY "p_clinical_consultation_instructions_tenant_isolation" ON "clinical"."consultation_instructions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_medications" (Type: uuid)
ALTER TABLE "clinical"."consultation_medications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_medications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_medications_tenant_isolation" ON "clinical"."consultation_medications";
CREATE POLICY "p_clinical_consultation_medications_tenant_isolation" ON "clinical"."consultation_medications"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultation_vitals" (Type: uuid)
ALTER TABLE "clinical"."consultation_vitals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultation_vitals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultation_vitals_tenant_isolation" ON "clinical"."consultation_vitals";
CREATE POLICY "p_clinical_consultation_vitals_tenant_isolation" ON "clinical"."consultation_vitals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."consultations" (Type: uuid)
ALTER TABLE "clinical"."consultations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."consultations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_consultations_tenant_isolation" ON "clinical"."consultations";
CREATE POLICY "p_clinical_consultations_tenant_isolation" ON "clinical"."consultations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."corporate_tpa_clients" (Type: uuid)
ALTER TABLE "clinical"."corporate_tpa_clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."corporate_tpa_clients" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_corporate_tpa_clients_tenant_isolation" ON "clinical"."corporate_tpa_clients";
CREATE POLICY "p_clinical_corporate_tpa_clients_tenant_isolation" ON "clinical"."corporate_tpa_clients"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."critical_panic_value_alerts" (Type: uuid)
ALTER TABLE "clinical"."critical_panic_value_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."critical_panic_value_alerts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_critical_panic_value_alerts_tenant_isolation" ON "clinical"."critical_panic_value_alerts";
CREATE POLICY "p_clinical_critical_panic_value_alerts_tenant_isolation" ON "clinical"."critical_panic_value_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ddi_drug_interaction_checks" (Type: uuid)
ALTER TABLE "clinical"."ddi_drug_interaction_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ddi_drug_interaction_checks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ddi_drug_interaction_checks_tenant_isolation" ON "clinical"."ddi_drug_interaction_checks";
CREATE POLICY "p_clinical_ddi_drug_interaction_checks_tenant_isolation" ON "clinical"."ddi_drug_interaction_checks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."death_registry_records" (Type: uuid)
ALTER TABLE "clinical"."death_registry_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."death_registry_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_death_registry_records_tenant_isolation" ON "clinical"."death_registry_records";
CREATE POLICY "p_clinical_death_registry_records_tenant_isolation" ON "clinical"."death_registry_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."diagnostic_health_packages" (Type: uuid)
ALTER TABLE "clinical"."diagnostic_health_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."diagnostic_health_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_diagnostic_health_packages_tenant_isolation" ON "clinical"."diagnostic_health_packages";
CREATE POLICY "p_clinical_diagnostic_health_packages_tenant_isolation" ON "clinical"."diagnostic_health_packages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_assessments" (Type: uuid)
ALTER TABLE "clinical"."dietary_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_assessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_assessments_tenant_isolation" ON "clinical"."dietary_assessments";
CREATE POLICY "p_clinical_dietary_assessments_tenant_isolation" ON "clinical"."dietary_assessments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."dietary_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_audit_traces_tenant_isolation" ON "clinical"."dietary_audit_traces";
CREATE POLICY "p_clinical_dietary_audit_traces_tenant_isolation" ON "clinical"."dietary_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_billing_references" (Type: uuid)
ALTER TABLE "clinical"."dietary_billing_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_billing_references" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_billing_references_tenant_isolation" ON "clinical"."dietary_billing_references";
CREATE POLICY "p_clinical_dietary_billing_references_tenant_isolation" ON "clinical"."dietary_billing_references"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_cost_records" (Type: uuid)
ALTER TABLE "clinical"."dietary_cost_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_cost_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_cost_records_tenant_isolation" ON "clinical"."dietary_cost_records";
CREATE POLICY "p_clinical_dietary_cost_records_tenant_isolation" ON "clinical"."dietary_cost_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_departments" (Type: uuid)
ALTER TABLE "clinical"."dietary_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_departments_tenant_isolation" ON "clinical"."dietary_departments";
CREATE POLICY "p_clinical_dietary_departments_tenant_isolation" ON "clinical"."dietary_departments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_diet_plans" (Type: uuid)
ALTER TABLE "clinical"."dietary_diet_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_diet_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_diet_plans_tenant_isolation" ON "clinical"."dietary_diet_plans";
CREATE POLICY "p_clinical_dietary_diet_plans_tenant_isolation" ON "clinical"."dietary_diet_plans"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_diet_types" (Type: uuid)
ALTER TABLE "clinical"."dietary_diet_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_diet_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_diet_types_tenant_isolation" ON "clinical"."dietary_diet_types";
CREATE POLICY "p_clinical_dietary_diet_types_tenant_isolation" ON "clinical"."dietary_diet_types"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_food_items" (Type: uuid)
ALTER TABLE "clinical"."dietary_food_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_food_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_food_items_tenant_isolation" ON "clinical"."dietary_food_items";
CREATE POLICY "p_clinical_dietary_food_items_tenant_isolation" ON "clinical"."dietary_food_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_kitchens" (Type: uuid)
ALTER TABLE "clinical"."dietary_kitchens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_kitchens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_kitchens_tenant_isolation" ON "clinical"."dietary_kitchens";
CREATE POLICY "p_clinical_dietary_kitchens_tenant_isolation" ON "clinical"."dietary_kitchens"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_meal_dispatches" (Type: uuid)
ALTER TABLE "clinical"."dietary_meal_dispatches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_meal_dispatches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_meal_dispatches_tenant_isolation" ON "clinical"."dietary_meal_dispatches";
CREATE POLICY "p_clinical_dietary_meal_dispatches_tenant_isolation" ON "clinical"."dietary_meal_dispatches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_meal_schedules" (Type: uuid)
ALTER TABLE "clinical"."dietary_meal_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_meal_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_meal_schedules_tenant_isolation" ON "clinical"."dietary_meal_schedules";
CREATE POLICY "p_clinical_dietary_meal_schedules_tenant_isolation" ON "clinical"."dietary_meal_schedules"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_menu_templates" (Type: uuid)
ALTER TABLE "clinical"."dietary_menu_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_menu_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_menu_templates_tenant_isolation" ON "clinical"."dietary_menu_templates";
CREATE POLICY "p_clinical_dietary_menu_templates_tenant_isolation" ON "clinical"."dietary_menu_templates"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_orders" (Type: uuid)
ALTER TABLE "clinical"."dietary_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_orders_tenant_isolation" ON "clinical"."dietary_orders";
CREATE POLICY "p_clinical_dietary_orders_tenant_isolation" ON "clinical"."dietary_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_preparation_records" (Type: uuid)
ALTER TABLE "clinical"."dietary_preparation_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_preparation_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_preparation_records_tenant_isolation" ON "clinical"."dietary_preparation_records";
CREATE POLICY "p_clinical_dietary_preparation_records_tenant_isolation" ON "clinical"."dietary_preparation_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_procurement_references" (Type: uuid)
ALTER TABLE "clinical"."dietary_procurement_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_procurement_references" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_procurement_references_tenant_isolation" ON "clinical"."dietary_procurement_references";
CREATE POLICY "p_clinical_dietary_procurement_references_tenant_isolation" ON "clinical"."dietary_procurement_references"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_production_plans" (Type: uuid)
ALTER TABLE "clinical"."dietary_production_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_production_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_production_plans_tenant_isolation" ON "clinical"."dietary_production_plans";
CREATE POLICY "p_clinical_dietary_production_plans_tenant_isolation" ON "clinical"."dietary_production_plans"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_quality_checks" (Type: uuid)
ALTER TABLE "clinical"."dietary_quality_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_quality_checks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_quality_checks_tenant_isolation" ON "clinical"."dietary_quality_checks";
CREATE POLICY "p_clinical_dietary_quality_checks_tenant_isolation" ON "clinical"."dietary_quality_checks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_safety_alerts" (Type: uuid)
ALTER TABLE "clinical"."dietary_safety_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_safety_alerts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_safety_alerts_tenant_isolation" ON "clinical"."dietary_safety_alerts";
CREATE POLICY "p_clinical_dietary_safety_alerts_tenant_isolation" ON "clinical"."dietary_safety_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_tray_assemblies" (Type: uuid)
ALTER TABLE "clinical"."dietary_tray_assemblies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_tray_assemblies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_tray_assemblies_tenant_isolation" ON "clinical"."dietary_tray_assemblies";
CREATE POLICY "p_clinical_dietary_tray_assemblies_tenant_isolation" ON "clinical"."dietary_tray_assemblies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."dietary_waste_records" (Type: uuid)
ALTER TABLE "clinical"."dietary_waste_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."dietary_waste_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_dietary_waste_records_tenant_isolation" ON "clinical"."dietary_waste_records";
CREATE POLICY "p_clinical_dietary_waste_records_tenant_isolation" ON "clinical"."dietary_waste_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_leaves" (Type: uuid)
ALTER TABLE "clinical"."doctor_leaves" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_leaves" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_leaves_tenant_isolation" ON "clinical"."doctor_leaves";
CREATE POLICY "p_clinical_doctor_leaves_tenant_isolation" ON "clinical"."doctor_leaves"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_opd_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."doctor_opd_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_opd_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_opd_audit_traces_tenant_isolation" ON "clinical"."doctor_opd_audit_traces";
CREATE POLICY "p_clinical_doctor_opd_audit_traces_tenant_isolation" ON "clinical"."doctor_opd_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_payout_configurations" (Type: uuid)
ALTER TABLE "clinical"."doctor_payout_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_payout_configurations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_payout_configurations_tenant_isolation" ON "clinical"."doctor_payout_configurations";
CREATE POLICY "p_clinical_doctor_payout_configurations_tenant_isolation" ON "clinical"."doctor_payout_configurations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_profiles" (Type: uuid)
ALTER TABLE "clinical"."doctor_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_profiles_tenant_isolation" ON "clinical"."doctor_profiles";
CREATE POLICY "p_clinical_doctor_profiles_tenant_isolation" ON "clinical"."doctor_profiles"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_schedule_breaks" (Type: uuid)
ALTER TABLE "clinical"."doctor_schedule_breaks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_schedule_breaks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_schedule_breaks_tenant_isolation" ON "clinical"."doctor_schedule_breaks";
CREATE POLICY "p_clinical_doctor_schedule_breaks_tenant_isolation" ON "clinical"."doctor_schedule_breaks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_schedules" (Type: uuid)
ALTER TABLE "clinical"."doctor_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_schedules_tenant_isolation" ON "clinical"."doctor_schedules";
CREATE POLICY "p_clinical_doctor_schedules_tenant_isolation" ON "clinical"."doctor_schedules"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_settlement_vouchers" (Type: uuid)
ALTER TABLE "clinical"."doctor_settlement_vouchers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_settlement_vouchers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_settlement_vouchers_tenant_isolation" ON "clinical"."doctor_settlement_vouchers";
CREATE POLICY "p_clinical_doctor_settlement_vouchers_tenant_isolation" ON "clinical"."doctor_settlement_vouchers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_specializations" (Type: uuid)
ALTER TABLE "clinical"."doctor_specializations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_specializations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_specializations_tenant_isolation" ON "clinical"."doctor_specializations";
CREATE POLICY "p_clinical_doctor_specializations_tenant_isolation" ON "clinical"."doctor_specializations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."doctor_volume_payout_tiers" (Type: uuid)
ALTER TABLE "clinical"."doctor_volume_payout_tiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."doctor_volume_payout_tiers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_doctor_volume_payout_tiers_tenant_isolation" ON "clinical"."doctor_volume_payout_tiers";
CREATE POLICY "p_clinical_doctor_volume_payout_tiers_tenant_isolation" ON "clinical"."doctor_volume_payout_tiers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_ambulance_transfers" (Type: uuid)
ALTER TABLE "clinical"."emergency_ambulance_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_ambulance_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_ambulance_transfers_tenant_isolation" ON "clinical"."emergency_ambulance_transfers";
CREATE POLICY "p_clinical_emergency_ambulance_transfers_tenant_isolation" ON "clinical"."emergency_ambulance_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."emergency_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_audit_traces_tenant_isolation" ON "clinical"."emergency_audit_traces";
CREATE POLICY "p_clinical_emergency_audit_traces_tenant_isolation" ON "clinical"."emergency_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_crash_carts" (Type: uuid)
ALTER TABLE "clinical"."emergency_crash_carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_crash_carts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_crash_carts_tenant_isolation" ON "clinical"."emergency_crash_carts";
CREATE POLICY "p_clinical_emergency_crash_carts_tenant_isolation" ON "clinical"."emergency_crash_carts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_death_records" (Type: uuid)
ALTER TABLE "clinical"."emergency_death_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_death_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_death_records_tenant_isolation" ON "clinical"."emergency_death_records";
CREATE POLICY "p_clinical_emergency_death_records_tenant_isolation" ON "clinical"."emergency_death_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_departments" (Type: uuid)
ALTER TABLE "clinical"."emergency_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_departments_tenant_isolation" ON "clinical"."emergency_departments";
CREATE POLICY "p_clinical_emergency_departments_tenant_isolation" ON "clinical"."emergency_departments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_disaster_events" (Type: uuid)
ALTER TABLE "clinical"."emergency_disaster_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_disaster_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_disaster_events_tenant_isolation" ON "clinical"."emergency_disaster_events";
CREATE POLICY "p_clinical_emergency_disaster_events_tenant_isolation" ON "clinical"."emergency_disaster_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_disposition_records" (Type: uuid)
ALTER TABLE "clinical"."emergency_disposition_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_disposition_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_disposition_records_tenant_isolation" ON "clinical"."emergency_disposition_records";
CREATE POLICY "p_clinical_emergency_disposition_records_tenant_isolation" ON "clinical"."emergency_disposition_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_encounters" (Type: uuid)
ALTER TABLE "clinical"."emergency_encounters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_encounters" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_encounters_tenant_isolation" ON "clinical"."emergency_encounters";
CREATE POLICY "p_clinical_emergency_encounters_tenant_isolation" ON "clinical"."emergency_encounters"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_mlc_cases" (Type: uuid)
ALTER TABLE "clinical"."emergency_mlc_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_mlc_cases" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_mlc_cases_tenant_isolation" ON "clinical"."emergency_mlc_cases";
CREATE POLICY "p_clinical_emergency_mlc_cases_tenant_isolation" ON "clinical"."emergency_mlc_cases"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_observation_cases" (Type: uuid)
ALTER TABLE "clinical"."emergency_observation_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_observation_cases" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_observation_cases_tenant_isolation" ON "clinical"."emergency_observation_cases";
CREATE POLICY "p_clinical_emergency_observation_cases_tenant_isolation" ON "clinical"."emergency_observation_cases"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_resuscitation_events" (Type: uuid)
ALTER TABLE "clinical"."emergency_resuscitation_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_resuscitation_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_resuscitation_events_tenant_isolation" ON "clinical"."emergency_resuscitation_events";
CREATE POLICY "p_clinical_emergency_resuscitation_events_tenant_isolation" ON "clinical"."emergency_resuscitation_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_triage_assessments" (Type: uuid)
ALTER TABLE "clinical"."emergency_triage_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_triage_assessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_triage_assessments_tenant_isolation" ON "clinical"."emergency_triage_assessments";
CREATE POLICY "p_clinical_emergency_triage_assessments_tenant_isolation" ON "clinical"."emergency_triage_assessments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_triage_reassessments" (Type: uuid)
ALTER TABLE "clinical"."emergency_triage_reassessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_triage_reassessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_triage_reassessments_tenant_isolation" ON "clinical"."emergency_triage_reassessments";
CREATE POLICY "p_clinical_emergency_triage_reassessments_tenant_isolation" ON "clinical"."emergency_triage_reassessments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."emergency_zones" (Type: uuid)
ALTER TABLE "clinical"."emergency_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."emergency_zones" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_emergency_zones_tenant_isolation" ON "clinical"."emergency_zones";
CREATE POLICY "p_clinical_emergency_zones_tenant_isolation" ON "clinical"."emergency_zones"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."encounter_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."encounter_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."encounter_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_encounter_audit_traces_tenant_isolation" ON "clinical"."encounter_audit_traces";
CREATE POLICY "p_clinical_encounter_audit_traces_tenant_isolation" ON "clinical"."encounter_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."encounter_queues" (Type: uuid)
ALTER TABLE "clinical"."encounter_queues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."encounter_queues" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_encounter_queues_tenant_isolation" ON "clinical"."encounter_queues";
CREATE POLICY "p_clinical_encounter_queues_tenant_isolation" ON "clinical"."encounter_queues"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."encounter_referrals" (Type: uuid)
ALTER TABLE "clinical"."encounter_referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."encounter_referrals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_encounter_referrals_tenant_isolation" ON "clinical"."encounter_referrals";
CREATE POLICY "p_clinical_encounter_referrals_tenant_isolation" ON "clinical"."encounter_referrals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."encounters" (Type: uuid)
ALTER TABLE "clinical"."encounters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."encounters" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_encounters_tenant_isolation" ON "clinical"."encounters";
CREATE POLICY "p_clinical_encounters_tenant_isolation" ON "clinical"."encounters"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."environmental_micro_swabs" (Type: uuid)
ALTER TABLE "clinical"."environmental_micro_swabs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."environmental_micro_swabs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_environmental_micro_swabs_tenant_isolation" ON "clinical"."environmental_micro_swabs";
CREATE POLICY "p_clinical_environmental_micro_swabs_tenant_isolation" ON "clinical"."environmental_micro_swabs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."executive_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."executive_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."executive_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_executive_audit_traces_tenant_isolation" ON "clinical"."executive_audit_traces";
CREATE POLICY "p_clinical_executive_audit_traces_tenant_isolation" ON "clinical"."executive_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."executive_command_snapshots" (Type: uuid)
ALTER TABLE "clinical"."executive_command_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."executive_command_snapshots" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_executive_command_snapshots_tenant_isolation" ON "clinical"."executive_command_snapshots";
CREATE POLICY "p_clinical_executive_command_snapshots_tenant_isolation" ON "clinical"."executive_command_snapshots"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."facility_registry" (Type: uuid)
ALTER TABLE "clinical"."facility_registry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."facility_registry" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_facility_registry_tenant_isolation" ON "clinical"."facility_registry";
CREATE POLICY "p_clinical_facility_registry_tenant_isolation" ON "clinical"."facility_registry"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."fhir_bundles_repository" (Type: uuid)
ALTER TABLE "clinical"."fhir_bundles_repository" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."fhir_bundles_repository" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_fhir_bundles_repository_tenant_isolation" ON "clinical"."fhir_bundles_repository";
CREATE POLICY "p_clinical_fhir_bundles_repository_tenant_isolation" ON "clinical"."fhir_bundles_repository"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."financial_transactions_partitioned" (Type: uuid)
ALTER TABLE "clinical"."financial_transactions_partitioned" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."financial_transactions_partitioned" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_financial_transactions_partitioned_tenant_isolation" ON "clinical"."financial_transactions_partitioned";
CREATE POLICY "p_clinical_financial_transactions_partitioned_tenant_isolation" ON "clinical"."financial_transactions_partitioned"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."goods_receipt_items" (Type: uuid)
ALTER TABLE "clinical"."goods_receipt_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."goods_receipt_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_goods_receipt_items_tenant_isolation" ON "clinical"."goods_receipt_items";
CREATE POLICY "p_clinical_goods_receipt_items_tenant_isolation" ON "clinical"."goods_receipt_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."goods_receipts" (Type: uuid)
ALTER TABLE "clinical"."goods_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."goods_receipts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_goods_receipts_tenant_isolation" ON "clinical"."goods_receipts";
CREATE POLICY "p_clinical_goods_receipts_tenant_isolation" ON "clinical"."goods_receipts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."gst_tax_rates" (Type: uuid)
ALTER TABLE "clinical"."gst_tax_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."gst_tax_rates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_gst_tax_rates_tenant_isolation" ON "clinical"."gst_tax_rates";
CREATE POLICY "p_clinical_gst_tax_rates_tenant_isolation" ON "clinical"."gst_tax_rates"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."hai_device_day_logs" (Type: uuid)
ALTER TABLE "clinical"."hai_device_day_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."hai_device_day_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_hai_device_day_logs_tenant_isolation" ON "clinical"."hai_device_day_logs";
CREATE POLICY "p_clinical_hai_device_day_logs_tenant_isolation" ON "clinical"."hai_device_day_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."hai_surveillance_records" (Type: uuid)
ALTER TABLE "clinical"."hai_surveillance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."hai_surveillance_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_hai_surveillance_records_tenant_isolation" ON "clinical"."hai_surveillance_records";
CREATE POLICY "p_clinical_hai_surveillance_records_tenant_isolation" ON "clinical"."hai_surveillance_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."hand_hygiene_audits" (Type: uuid)
ALTER TABLE "clinical"."hand_hygiene_audits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."hand_hygiene_audits" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_hand_hygiene_audits_tenant_isolation" ON "clinical"."hand_hygiene_audits";
CREATE POLICY "p_clinical_hand_hygiene_audits_tenant_isolation" ON "clinical"."hand_hygiene_audits"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."home_collection_orders" (Type: uuid)
ALTER TABLE "clinical"."home_collection_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."home_collection_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_home_collection_orders_tenant_isolation" ON "clinical"."home_collection_orders";
CREATE POLICY "p_clinical_home_collection_orders_tenant_isolation" ON "clinical"."home_collection_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."hospital_incident_reports" (Type: uuid)
ALTER TABLE "clinical"."hospital_incident_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."hospital_incident_reports" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_hospital_incident_reports_tenant_isolation" ON "clinical"."hospital_incident_reports";
CREATE POLICY "p_clinical_hospital_incident_reports_tenant_isolation" ON "clinical"."hospital_incident_reports"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."hospital_surge_events" (Type: uuid)
ALTER TABLE "clinical"."hospital_surge_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."hospital_surge_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_hospital_surge_events_tenant_isolation" ON "clinical"."hospital_surge_events";
CREATE POLICY "p_clinical_hospital_surge_events_tenant_isolation" ON "clinical"."hospital_surge_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."imaging_instances" (Type: uuid)
ALTER TABLE "clinical"."imaging_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."imaging_instances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_imaging_instances_tenant_isolation" ON "clinical"."imaging_instances";
CREATE POLICY "p_clinical_imaging_instances_tenant_isolation" ON "clinical"."imaging_instances"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."imaging_series" (Type: uuid)
ALTER TABLE "clinical"."imaging_series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."imaging_series" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_imaging_series_tenant_isolation" ON "clinical"."imaging_series";
CREATE POLICY "p_clinical_imaging_series_tenant_isolation" ON "clinical"."imaging_series"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."incident_rca_investigations" (Type: uuid)
ALTER TABLE "clinical"."incident_rca_investigations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."incident_rca_investigations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_incident_rca_investigations_tenant_isolation" ON "clinical"."incident_rca_investigations";
CREATE POLICY "p_clinical_incident_rca_investigations_tenant_isolation" ON "clinical"."incident_rca_investigations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_admission_approvals" (Type: uuid)
ALTER TABLE "clinical"."inpatient_admission_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_admission_approvals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_admission_approvals_tenant_isolation" ON "clinical"."inpatient_admission_approvals";
CREATE POLICY "p_clinical_inpatient_admission_approvals_tenant_isolation" ON "clinical"."inpatient_admission_approvals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_admission_requests" (Type: uuid)
ALTER TABLE "clinical"."inpatient_admission_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_admission_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_admission_requests_tenant_isolation" ON "clinical"."inpatient_admission_requests";
CREATE POLICY "p_clinical_inpatient_admission_requests_tenant_isolation" ON "clinical"."inpatient_admission_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_admissions" (Type: uuid)
ALTER TABLE "clinical"."inpatient_admissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_admissions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_admissions_tenant_isolation" ON "clinical"."inpatient_admissions";
CREATE POLICY "p_clinical_inpatient_admissions_tenant_isolation" ON "clinical"."inpatient_admissions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."inpatient_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_audit_traces_tenant_isolation" ON "clinical"."inpatient_audit_traces";
CREATE POLICY "p_clinical_inpatient_audit_traces_tenant_isolation" ON "clinical"."inpatient_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_bed_allocations" (Type: uuid)
ALTER TABLE "clinical"."inpatient_bed_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_bed_allocations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_bed_allocations_tenant_isolation" ON "clinical"."inpatient_bed_allocations";
CREATE POLICY "p_clinical_inpatient_bed_allocations_tenant_isolation" ON "clinical"."inpatient_bed_allocations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_bed_blocks" (Type: uuid)
ALTER TABLE "clinical"."inpatient_bed_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_bed_blocks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_bed_blocks_tenant_isolation" ON "clinical"."inpatient_bed_blocks";
CREATE POLICY "p_clinical_inpatient_bed_blocks_tenant_isolation" ON "clinical"."inpatient_bed_blocks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_bed_reservations" (Type: uuid)
ALTER TABLE "clinical"."inpatient_bed_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_bed_reservations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_bed_reservations_tenant_isolation" ON "clinical"."inpatient_bed_reservations";
CREATE POLICY "p_clinical_inpatient_bed_reservations_tenant_isolation" ON "clinical"."inpatient_bed_reservations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_bed_status_history" (Type: uuid)
ALTER TABLE "clinical"."inpatient_bed_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_bed_status_history" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_bed_status_history_tenant_isolation" ON "clinical"."inpatient_bed_status_history";
CREATE POLICY "p_clinical_inpatient_bed_status_history_tenant_isolation" ON "clinical"."inpatient_bed_status_history"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_bed_turnaround" (Type: uuid)
ALTER TABLE "clinical"."inpatient_bed_turnaround" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_bed_turnaround" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_bed_turnaround_tenant_isolation" ON "clinical"."inpatient_bed_turnaround";
CREATE POLICY "p_clinical_inpatient_bed_turnaround_tenant_isolation" ON "clinical"."inpatient_bed_turnaround"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_beds" (Type: uuid)
ALTER TABLE "clinical"."inpatient_beds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_beds" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_beds_tenant_isolation" ON "clinical"."inpatient_beds";
CREATE POLICY "p_clinical_inpatient_beds_tenant_isolation" ON "clinical"."inpatient_beds"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_care_plans" (Type: uuid)
ALTER TABLE "clinical"."inpatient_care_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_care_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_care_plans_tenant_isolation" ON "clinical"."inpatient_care_plans";
CREATE POLICY "p_clinical_inpatient_care_plans_tenant_isolation" ON "clinical"."inpatient_care_plans"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_care_teams" (Type: uuid)
ALTER TABLE "clinical"."inpatient_care_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_care_teams" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_care_teams_tenant_isolation" ON "clinical"."inpatient_care_teams";
CREATE POLICY "p_clinical_inpatient_care_teams_tenant_isolation" ON "clinical"."inpatient_care_teams"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_discharge_plans" (Type: uuid)
ALTER TABLE "clinical"."inpatient_discharge_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_discharge_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_discharge_plans_tenant_isolation" ON "clinical"."inpatient_discharge_plans";
CREATE POLICY "p_clinical_inpatient_discharge_plans_tenant_isolation" ON "clinical"."inpatient_discharge_plans"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_discharge_requests" (Type: uuid)
ALTER TABLE "clinical"."inpatient_discharge_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_discharge_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_discharge_requests_tenant_isolation" ON "clinical"."inpatient_discharge_requests";
CREATE POLICY "p_clinical_inpatient_discharge_requests_tenant_isolation" ON "clinical"."inpatient_discharge_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_discharge_summaries" (Type: uuid)
ALTER TABLE "clinical"."inpatient_discharge_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_discharge_summaries" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_discharge_summaries_tenant_isolation" ON "clinical"."inpatient_discharge_summaries";
CREATE POLICY "p_clinical_inpatient_discharge_summaries_tenant_isolation" ON "clinical"."inpatient_discharge_summaries"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_doctor_rounds" (Type: uuid)
ALTER TABLE "clinical"."inpatient_doctor_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_doctor_rounds" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_doctor_rounds_tenant_isolation" ON "clinical"."inpatient_doctor_rounds";
CREATE POLICY "p_clinical_inpatient_doctor_rounds_tenant_isolation" ON "clinical"."inpatient_doctor_rounds"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_intake_output" (Type: uuid)
ALTER TABLE "clinical"."inpatient_intake_output" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_intake_output" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_intake_output_tenant_isolation" ON "clinical"."inpatient_intake_output";
CREATE POLICY "p_clinical_inpatient_intake_output_tenant_isolation" ON "clinical"."inpatient_intake_output"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_nursing_assessments" (Type: uuid)
ALTER TABLE "clinical"."inpatient_nursing_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_nursing_assessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_nursing_assessments_tenant_isolation" ON "clinical"."inpatient_nursing_assessments";
CREATE POLICY "p_clinical_inpatient_nursing_assessments_tenant_isolation" ON "clinical"."inpatient_nursing_assessments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_nursing_notes" (Type: uuid)
ALTER TABLE "clinical"."inpatient_nursing_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_nursing_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_nursing_notes_tenant_isolation" ON "clinical"."inpatient_nursing_notes";
CREATE POLICY "p_clinical_inpatient_nursing_notes_tenant_isolation" ON "clinical"."inpatient_nursing_notes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_patient_locations" (Type: uuid)
ALTER TABLE "clinical"."inpatient_patient_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_patient_locations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_patient_locations_tenant_isolation" ON "clinical"."inpatient_patient_locations";
CREATE POLICY "p_clinical_inpatient_patient_locations_tenant_isolation" ON "clinical"."inpatient_patient_locations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_rooms" (Type: uuid)
ALTER TABLE "clinical"."inpatient_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_rooms" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_rooms_tenant_isolation" ON "clinical"."inpatient_rooms";
CREATE POLICY "p_clinical_inpatient_rooms_tenant_isolation" ON "clinical"."inpatient_rooms"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_transfer_approvals" (Type: uuid)
ALTER TABLE "clinical"."inpatient_transfer_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_transfer_approvals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_transfer_approvals_tenant_isolation" ON "clinical"."inpatient_transfer_approvals";
CREATE POLICY "p_clinical_inpatient_transfer_approvals_tenant_isolation" ON "clinical"."inpatient_transfer_approvals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_transfers" (Type: uuid)
ALTER TABLE "clinical"."inpatient_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_transfers_tenant_isolation" ON "clinical"."inpatient_transfers";
CREATE POLICY "p_clinical_inpatient_transfers_tenant_isolation" ON "clinical"."inpatient_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_units" (Type: uuid)
ALTER TABLE "clinical"."inpatient_units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_units" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_units_tenant_isolation" ON "clinical"."inpatient_units";
CREATE POLICY "p_clinical_inpatient_units_tenant_isolation" ON "clinical"."inpatient_units"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_vital_observations" (Type: uuid)
ALTER TABLE "clinical"."inpatient_vital_observations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_vital_observations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_vital_observations_tenant_isolation" ON "clinical"."inpatient_vital_observations";
CREATE POLICY "p_clinical_inpatient_vital_observations_tenant_isolation" ON "clinical"."inpatient_vital_observations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."inpatient_wards" (Type: uuid)
ALTER TABLE "clinical"."inpatient_wards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."inpatient_wards" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_inpatient_wards_tenant_isolation" ON "clinical"."inpatient_wards";
CREATE POLICY "p_clinical_inpatient_wards_tenant_isolation" ON "clinical"."inpatient_wards"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."insurance_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_audit_traces_tenant_isolation" ON "clinical"."insurance_audit_traces";
CREATE POLICY "p_clinical_insurance_audit_traces_tenant_isolation" ON "clinical"."insurance_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_authorizations" (Type: uuid)
ALTER TABLE "clinical"."insurance_authorizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_authorizations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_authorizations_tenant_isolation" ON "clinical"."insurance_authorizations";
CREATE POLICY "p_clinical_insurance_authorizations_tenant_isolation" ON "clinical"."insurance_authorizations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claim_adjudications" (Type: uuid)
ALTER TABLE "clinical"."insurance_claim_adjudications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claim_adjudications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claim_adjudications_tenant_isolation" ON "clinical"."insurance_claim_adjudications";
CREATE POLICY "p_clinical_insurance_claim_adjudications_tenant_isolation" ON "clinical"."insurance_claim_adjudications"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claim_appeals" (Type: uuid)
ALTER TABLE "clinical"."insurance_claim_appeals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claim_appeals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claim_appeals_tenant_isolation" ON "clinical"."insurance_claim_appeals";
CREATE POLICY "p_clinical_insurance_claim_appeals_tenant_isolation" ON "clinical"."insurance_claim_appeals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claim_denials" (Type: uuid)
ALTER TABLE "clinical"."insurance_claim_denials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claim_denials" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claim_denials_tenant_isolation" ON "clinical"."insurance_claim_denials";
CREATE POLICY "p_clinical_insurance_claim_denials_tenant_isolation" ON "clinical"."insurance_claim_denials"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claim_items" (Type: uuid)
ALTER TABLE "clinical"."insurance_claim_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claim_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claim_items_tenant_isolation" ON "clinical"."insurance_claim_items";
CREATE POLICY "p_clinical_insurance_claim_items_tenant_isolation" ON "clinical"."insurance_claim_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claim_submissions" (Type: uuid)
ALTER TABLE "clinical"."insurance_claim_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claim_submissions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claim_submissions_tenant_isolation" ON "clinical"."insurance_claim_submissions";
CREATE POLICY "p_clinical_insurance_claim_submissions_tenant_isolation" ON "clinical"."insurance_claim_submissions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_claims" (Type: uuid)
ALTER TABLE "clinical"."insurance_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_claims" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_claims_tenant_isolation" ON "clinical"."insurance_claims";
CREATE POLICY "p_clinical_insurance_claims_tenant_isolation" ON "clinical"."insurance_claims"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_document_records" (Type: uuid)
ALTER TABLE "clinical"."insurance_document_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_document_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_document_records_tenant_isolation" ON "clinical"."insurance_document_records";
CREATE POLICY "p_clinical_insurance_document_records_tenant_isolation" ON "clinical"."insurance_document_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_eligibility_checks" (Type: uuid)
ALTER TABLE "clinical"."insurance_eligibility_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_eligibility_checks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_eligibility_checks_tenant_isolation" ON "clinical"."insurance_eligibility_checks";
CREATE POLICY "p_clinical_insurance_eligibility_checks_tenant_isolation" ON "clinical"."insurance_eligibility_checks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_patient_policies" (Type: uuid)
ALTER TABLE "clinical"."insurance_patient_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_patient_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_patient_policies_tenant_isolation" ON "clinical"."insurance_patient_policies";
CREATE POLICY "p_clinical_insurance_patient_policies_tenant_isolation" ON "clinical"."insurance_patient_policies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_payers" (Type: uuid)
ALTER TABLE "clinical"."insurance_payers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_payers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_payers_tenant_isolation" ON "clinical"."insurance_payers";
CREATE POLICY "p_clinical_insurance_payers_tenant_isolation" ON "clinical"."insurance_payers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_plans" (Type: uuid)
ALTER TABLE "clinical"."insurance_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_plans_tenant_isolation" ON "clinical"."insurance_plans";
CREATE POLICY "p_clinical_insurance_plans_tenant_isolation" ON "clinical"."insurance_plans"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_reconciliations" (Type: uuid)
ALTER TABLE "clinical"."insurance_reconciliations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_reconciliations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_reconciliations_tenant_isolation" ON "clinical"."insurance_reconciliations";
CREATE POLICY "p_clinical_insurance_reconciliations_tenant_isolation" ON "clinical"."insurance_reconciliations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."insurance_settlements" (Type: uuid)
ALTER TABLE "clinical"."insurance_settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."insurance_settlements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_insurance_settlements_tenant_isolation" ON "clinical"."insurance_settlements";
CREATE POLICY "p_clinical_insurance_settlements_tenant_isolation" ON "clinical"."insurance_settlements"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."intraoperative_records" (Type: uuid)
ALTER TABLE "clinical"."intraoperative_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."intraoperative_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_intraoperative_records_tenant_isolation" ON "clinical"."intraoperative_records";
CREATE POLICY "p_clinical_intraoperative_records_tenant_isolation" ON "clinical"."intraoperative_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."investigation_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_audit_traces_tenant_isolation" ON "clinical"."investigation_audit_traces";
CREATE POLICY "p_clinical_investigation_audit_traces_tenant_isolation" ON "clinical"."investigation_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_catalog" (Type: uuid)
ALTER TABLE "clinical"."investigation_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_catalog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_catalog_tenant_isolation" ON "clinical"."investigation_catalog";
CREATE POLICY "p_clinical_investigation_catalog_tenant_isolation" ON "clinical"."investigation_catalog"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_orders" (Type: uuid)
ALTER TABLE "clinical"."investigation_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_orders_tenant_isolation" ON "clinical"."investigation_orders";
CREATE POLICY "p_clinical_investigation_orders_tenant_isolation" ON "clinical"."investigation_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_panel_items" (Type: uuid)
ALTER TABLE "clinical"."investigation_panel_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_panel_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_panel_items_tenant_isolation" ON "clinical"."investigation_panel_items";
CREATE POLICY "p_clinical_investigation_panel_items_tenant_isolation" ON "clinical"."investigation_panel_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_panels" (Type: uuid)
ALTER TABLE "clinical"."investigation_panels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_panels" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_panels_tenant_isolation" ON "clinical"."investigation_panels";
CREATE POLICY "p_clinical_investigation_panels_tenant_isolation" ON "clinical"."investigation_panels"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_reports" (Type: uuid)
ALTER TABLE "clinical"."investigation_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_reports" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_reports_tenant_isolation" ON "clinical"."investigation_reports";
CREATE POLICY "p_clinical_investigation_reports_tenant_isolation" ON "clinical"."investigation_reports"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_result_amendments" (Type: uuid)
ALTER TABLE "clinical"."investigation_result_amendments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_result_amendments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_result_amendments_tenant_isolation" ON "clinical"."investigation_result_amendments";
CREATE POLICY "p_clinical_investigation_result_amendments_tenant_isolation" ON "clinical"."investigation_result_amendments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_results" (Type: uuid)
ALTER TABLE "clinical"."investigation_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_results" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_results_tenant_isolation" ON "clinical"."investigation_results";
CREATE POLICY "p_clinical_investigation_results_tenant_isolation" ON "clinical"."investigation_results"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."investigation_specimens" (Type: uuid)
ALTER TABLE "clinical"."investigation_specimens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."investigation_specimens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_investigation_specimens_tenant_isolation" ON "clinical"."investigation_specimens";
CREATE POLICY "p_clinical_investigation_specimens_tenant_isolation" ON "clinical"."investigation_specimens"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."iot_connected_devices" (Type: uuid)
ALTER TABLE "clinical"."iot_connected_devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."iot_connected_devices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_iot_connected_devices_tenant_isolation" ON "clinical"."iot_connected_devices";
CREATE POLICY "p_clinical_iot_connected_devices_tenant_isolation" ON "clinical"."iot_connected_devices"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."legal_record_requests" (Type: uuid)
ALTER TABLE "clinical"."legal_record_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."legal_record_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_legal_record_requests_tenant_isolation" ON "clinical"."legal_record_requests";
CREATE POLICY "p_clinical_legal_record_requests_tenant_isolation" ON "clinical"."legal_record_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."live_queue_tokens" (Type: uuid)
ALTER TABLE "clinical"."live_queue_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."live_queue_tokens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_live_queue_tokens_tenant_isolation" ON "clinical"."live_queue_tokens";
CREATE POLICY "p_clinical_live_queue_tokens_tenant_isolation" ON "clinical"."live_queue_tokens"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medical_diagnosis_codes" (Type: uuid)
ALTER TABLE "clinical"."medical_diagnosis_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medical_diagnosis_codes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medical_diagnosis_codes_tenant_isolation" ON "clinical"."medical_diagnosis_codes";
CREATE POLICY "p_clinical_medical_diagnosis_codes_tenant_isolation" ON "clinical"."medical_diagnosis_codes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medical_record_audit_events" (Type: uuid)
ALTER TABLE "clinical"."medical_record_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medical_record_audit_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medical_record_audit_events_tenant_isolation" ON "clinical"."medical_record_audit_events";
CREATE POLICY "p_clinical_medical_record_audit_events_tenant_isolation" ON "clinical"."medical_record_audit_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medical_record_completion_tasks" (Type: uuid)
ALTER TABLE "clinical"."medical_record_completion_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medical_record_completion_tasks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medical_record_completion_tasks_tenant_isolation" ON "clinical"."medical_record_completion_tasks";
CREATE POLICY "p_clinical_medical_record_completion_tasks_tenant_isolation" ON "clinical"."medical_record_completion_tasks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medical_record_indexes" (Type: uuid)
ALTER TABLE "clinical"."medical_record_indexes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medical_record_indexes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medical_record_indexes_tenant_isolation" ON "clinical"."medical_record_indexes";
CREATE POLICY "p_clinical_medical_record_indexes_tenant_isolation" ON "clinical"."medical_record_indexes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medical_record_legal_holds" (Type: uuid)
ALTER TABLE "clinical"."medical_record_legal_holds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medical_record_legal_holds" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medical_record_legal_holds_tenant_isolation" ON "clinical"."medical_record_legal_holds";
CREATE POLICY "p_clinical_medical_record_legal_holds_tenant_isolation" ON "clinical"."medical_record_legal_holds"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medication_catalog" (Type: uuid)
ALTER TABLE "clinical"."medication_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medication_catalog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medication_catalog_tenant_isolation" ON "clinical"."medication_catalog";
CREATE POLICY "p_clinical_medication_catalog_tenant_isolation" ON "clinical"."medication_catalog"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."medication_catalog_variants" (Type: uuid)
ALTER TABLE "clinical"."medication_catalog_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."medication_catalog_variants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_medication_catalog_variants_tenant_isolation" ON "clinical"."medication_catalog_variants";
CREATE POLICY "p_clinical_medication_catalog_variants_tenant_isolation" ON "clinical"."medication_catalog_variants"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."mr_departments" (Type: uuid)
ALTER TABLE "clinical"."mr_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."mr_departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_mr_departments_tenant_isolation" ON "clinical"."mr_departments";
CREATE POLICY "p_clinical_mr_departments_tenant_isolation" ON "clinical"."mr_departments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."needle_stick_occupational_logs" (Type: uuid)
ALTER TABLE "clinical"."needle_stick_occupational_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."needle_stick_occupational_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_needle_stick_occupational_logs_tenant_isolation" ON "clinical"."needle_stick_occupational_logs";
CREATE POLICY "p_clinical_needle_stick_occupational_logs_tenant_isolation" ON "clinical"."needle_stick_occupational_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."opd_slots" (Type: uuid)
ALTER TABLE "clinical"."opd_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."opd_slots" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_opd_slots_tenant_isolation" ON "clinical"."opd_slots";
CREATE POLICY "p_clinical_opd_slots_tenant_isolation" ON "clinical"."opd_slots"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operation_theatre_complexes" (Type: uuid)
ALTER TABLE "clinical"."operation_theatre_complexes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operation_theatre_complexes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operation_theatre_complexes_tenant_isolation" ON "clinical"."operation_theatre_complexes";
CREATE POLICY "p_clinical_operation_theatre_complexes_tenant_isolation" ON "clinical"."operation_theatre_complexes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operation_theatre_rooms" (Type: uuid)
ALTER TABLE "clinical"."operation_theatre_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operation_theatre_rooms" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operation_theatre_rooms_tenant_isolation" ON "clinical"."operation_theatre_rooms";
CREATE POLICY "p_clinical_operation_theatre_rooms_tenant_isolation" ON "clinical"."operation_theatre_rooms"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."operational_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_audit_traces_tenant_isolation" ON "clinical"."operational_audit_traces";
CREATE POLICY "p_clinical_operational_audit_traces_tenant_isolation" ON "clinical"."operational_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_departments" (Type: uuid)
ALTER TABLE "clinical"."operational_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_departments_tenant_isolation" ON "clinical"."operational_departments";
CREATE POLICY "p_clinical_operational_departments_tenant_isolation" ON "clinical"."operational_departments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_facilities" (Type: uuid)
ALTER TABLE "clinical"."operational_facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_facilities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_facilities_tenant_isolation" ON "clinical"."operational_facilities";
CREATE POLICY "p_clinical_operational_facilities_tenant_isolation" ON "clinical"."operational_facilities"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_organizations" (Type: uuid)
ALTER TABLE "clinical"."operational_organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_organizations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_organizations_tenant_isolation" ON "clinical"."operational_organizations";
CREATE POLICY "p_clinical_operational_organizations_tenant_isolation" ON "clinical"."operational_organizations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_partners" (Type: uuid)
ALTER TABLE "clinical"."operational_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_partners" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_partners_tenant_isolation" ON "clinical"."operational_partners";
CREATE POLICY "p_clinical_operational_partners_tenant_isolation" ON "clinical"."operational_partners"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_staff" (Type: uuid)
ALTER TABLE "clinical"."operational_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_staff" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_staff_tenant_isolation" ON "clinical"."operational_staff";
CREATE POLICY "p_clinical_operational_staff_tenant_isolation" ON "clinical"."operational_staff"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_staff_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."operational_staff_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_staff_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_staff_audit_traces_tenant_isolation" ON "clinical"."operational_staff_audit_traces";
CREATE POLICY "p_clinical_operational_staff_audit_traces_tenant_isolation" ON "clinical"."operational_staff_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operational_subscriptions" (Type: uuid)
ALTER TABLE "clinical"."operational_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operational_subscriptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operational_subscriptions_tenant_isolation" ON "clinical"."operational_subscriptions";
CREATE POLICY "p_clinical_operational_subscriptions_tenant_isolation" ON "clinical"."operational_subscriptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."operative_notes" (Type: uuid)
ALTER TABLE "clinical"."operative_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."operative_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_operative_notes_tenant_isolation" ON "clinical"."operative_notes";
CREATE POLICY "p_clinical_operative_notes_tenant_isolation" ON "clinical"."operative_notes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."ot_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_audit_traces_tenant_isolation" ON "clinical"."ot_audit_traces";
CREATE POLICY "p_clinical_ot_audit_traces_tenant_isolation" ON "clinical"."ot_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_nursing_notes" (Type: uuid)
ALTER TABLE "clinical"."ot_nursing_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_nursing_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_nursing_notes_tenant_isolation" ON "clinical"."ot_nursing_notes";
CREATE POLICY "p_clinical_ot_nursing_notes_tenant_isolation" ON "clinical"."ot_nursing_notes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_resource_allocations" (Type: uuid)
ALTER TABLE "clinical"."ot_resource_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_resource_allocations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_resource_allocations_tenant_isolation" ON "clinical"."ot_resource_allocations";
CREATE POLICY "p_clinical_ot_resource_allocations_tenant_isolation" ON "clinical"."ot_resource_allocations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_schedule_staff" (Type: uuid)
ALTER TABLE "clinical"."ot_schedule_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_schedule_staff" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_schedule_staff_tenant_isolation" ON "clinical"."ot_schedule_staff";
CREATE POLICY "p_clinical_ot_schedule_staff_tenant_isolation" ON "clinical"."ot_schedule_staff"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_schedules" (Type: uuid)
ALTER TABLE "clinical"."ot_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_schedules_tenant_isolation" ON "clinical"."ot_schedules";
CREATE POLICY "p_clinical_ot_schedules_tenant_isolation" ON "clinical"."ot_schedules"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."ot_transfers" (Type: uuid)
ALTER TABLE "clinical"."ot_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."ot_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_ot_transfers_tenant_isolation" ON "clinical"."ot_transfers";
CREATE POLICY "p_clinical_ot_transfers_tenant_isolation" ON "clinical"."ot_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pacu_recovery_records" (Type: uuid)
ALTER TABLE "clinical"."pacu_recovery_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pacu_recovery_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pacu_recovery_records_tenant_isolation" ON "clinical"."pacu_recovery_records";
CREATE POLICY "p_clinical_pacu_recovery_records_tenant_isolation" ON "clinical"."pacu_recovery_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_abha_accounts" (Type: uuid)
ALTER TABLE "clinical"."patient_abha_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_abha_accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_abha_accounts_tenant_isolation" ON "clinical"."patient_abha_accounts";
CREATE POLICY "p_clinical_patient_abha_accounts_tenant_isolation" ON "clinical"."patient_abha_accounts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_addresses" (Type: uuid)
ALTER TABLE "clinical"."patient_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_addresses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_addresses_tenant_isolation" ON "clinical"."patient_addresses";
CREATE POLICY "p_clinical_patient_addresses_tenant_isolation" ON "clinical"."patient_addresses"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_care_passes" (Type: uuid)
ALTER TABLE "clinical"."patient_care_passes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_care_passes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_care_passes_tenant_isolation" ON "clinical"."patient_care_passes";
CREATE POLICY "p_clinical_patient_care_passes_tenant_isolation" ON "clinical"."patient_care_passes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_consents" (Type: uuid)
ALTER TABLE "clinical"."patient_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_consents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_consents_tenant_isolation" ON "clinical"."patient_consents";
CREATE POLICY "p_clinical_patient_consents_tenant_isolation" ON "clinical"."patient_consents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_contacts" (Type: uuid)
ALTER TABLE "clinical"."patient_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_contacts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_contacts_tenant_isolation" ON "clinical"."patient_contacts";
CREATE POLICY "p_clinical_patient_contacts_tenant_isolation" ON "clinical"."patient_contacts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_credit_accounts" (Type: uuid)
ALTER TABLE "clinical"."patient_credit_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_credit_accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_credit_accounts_tenant_isolation" ON "clinical"."patient_credit_accounts";
CREATE POLICY "p_clinical_patient_credit_accounts_tenant_isolation" ON "clinical"."patient_credit_accounts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_duplicate_candidates" (Type: uuid)
ALTER TABLE "clinical"."patient_duplicate_candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_duplicate_candidates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_duplicate_candidates_tenant_isolation" ON "clinical"."patient_duplicate_candidates";
CREATE POLICY "p_clinical_patient_duplicate_candidates_tenant_isolation" ON "clinical"."patient_duplicate_candidates"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_emergency_contacts" (Type: uuid)
ALTER TABLE "clinical"."patient_emergency_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_emergency_contacts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_emergency_contacts_tenant_isolation" ON "clinical"."patient_emergency_contacts";
CREATE POLICY "p_clinical_patient_emergency_contacts_tenant_isolation" ON "clinical"."patient_emergency_contacts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_family_health_members" (Type: uuid)
ALTER TABLE "clinical"."patient_family_health_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_family_health_members" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_family_health_members_tenant_isolation" ON "clinical"."patient_family_health_members";
CREATE POLICY "p_clinical_patient_family_health_members_tenant_isolation" ON "clinical"."patient_family_health_members"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_health_wallets" (Type: uuid)
ALTER TABLE "clinical"."patient_health_wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_health_wallets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_health_wallets_tenant_isolation" ON "clinical"."patient_health_wallets";
CREATE POLICY "p_clinical_patient_health_wallets_tenant_isolation" ON "clinical"."patient_health_wallets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_identifiers" (Type: uuid)
ALTER TABLE "clinical"."patient_identifiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_identifiers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_identifiers_tenant_isolation" ON "clinical"."patient_identifiers";
CREATE POLICY "p_clinical_patient_identifiers_tenant_isolation" ON "clinical"."patient_identifiers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_insurance_policies" (Type: uuid)
ALTER TABLE "clinical"."patient_insurance_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_insurance_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_insurance_policies_tenant_isolation" ON "clinical"."patient_insurance_policies";
CREATE POLICY "p_clinical_patient_insurance_policies_tenant_isolation" ON "clinical"."patient_insurance_policies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_isolation_records" (Type: uuid)
ALTER TABLE "clinical"."patient_isolation_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_isolation_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_isolation_records_tenant_isolation" ON "clinical"."patient_isolation_records";
CREATE POLICY "p_clinical_patient_isolation_records_tenant_isolation" ON "clinical"."patient_isolation_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_merge_events" (Type: uuid)
ALTER TABLE "clinical"."patient_merge_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_merge_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_merge_events_tenant_isolation" ON "clinical"."patient_merge_events";
CREATE POLICY "p_clinical_patient_merge_events_tenant_isolation" ON "clinical"."patient_merge_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_package_consumptions" (Type: uuid)
ALTER TABLE "clinical"."patient_package_consumptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_package_consumptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_package_consumptions_tenant_isolation" ON "clinical"."patient_package_consumptions";
CREATE POLICY "p_clinical_patient_package_consumptions_tenant_isolation" ON "clinical"."patient_package_consumptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_packages" (Type: uuid)
ALTER TABLE "clinical"."patient_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_packages_tenant_isolation" ON "clinical"."patient_packages";
CREATE POLICY "p_clinical_patient_packages_tenant_isolation" ON "clinical"."patient_packages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patient_registration_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."patient_registration_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patient_registration_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patient_registration_audit_traces_tenant_isolation" ON "clinical"."patient_registration_audit_traces";
CREATE POLICY "p_clinical_patient_registration_audit_traces_tenant_isolation" ON "clinical"."patient_registration_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."patients" (Type: uuid)
ALTER TABLE "clinical"."patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."patients" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_patients_tenant_isolation" ON "clinical"."patients";
CREATE POLICY "p_clinical_patients_tenant_isolation" ON "clinical"."patients"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_audit_traces_tenant_isolation" ON "clinical"."pharmacy_audit_traces";
CREATE POLICY "p_clinical_pharmacy_audit_traces_tenant_isolation" ON "clinical"."pharmacy_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_b2b_purchase_orders" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_b2b_purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_b2b_purchase_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_b2b_purchase_orders_tenant_isolation" ON "clinical"."pharmacy_b2b_purchase_orders";
CREATE POLICY "p_clinical_pharmacy_b2b_purchase_orders_tenant_isolation" ON "clinical"."pharmacy_b2b_purchase_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_batches" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_batches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_batches_tenant_isolation" ON "clinical"."pharmacy_batches";
CREATE POLICY "p_clinical_pharmacy_batches_tenant_isolation" ON "clinical"."pharmacy_batches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_chronic_refill_radars" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_chronic_refill_radars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_chronic_refill_radars" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_chronic_refill_radars_tenant_isolation" ON "clinical"."pharmacy_chronic_refill_radars";
CREATE POLICY "p_clinical_pharmacy_chronic_refill_radars_tenant_isolation" ON "clinical"."pharmacy_chronic_refill_radars"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_customer_khata" (Type: varchar)
ALTER TABLE "clinical"."pharmacy_customer_khata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_customer_khata" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_customer_khata_tenant_isolation" ON "clinical"."pharmacy_customer_khata";
CREATE POLICY "p_clinical_pharmacy_customer_khata_tenant_isolation" ON "clinical"."pharmacy_customer_khata"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "clinical"."pharmacy_dispensing" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_dispensing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_dispensing" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_dispensing_tenant_isolation" ON "clinical"."pharmacy_dispensing";
CREATE POLICY "p_clinical_pharmacy_dispensing_tenant_isolation" ON "clinical"."pharmacy_dispensing"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_dispensing_items" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_dispensing_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_dispensing_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_dispensing_items_tenant_isolation" ON "clinical"."pharmacy_dispensing_items";
CREATE POLICY "p_clinical_pharmacy_dispensing_items_tenant_isolation" ON "clinical"."pharmacy_dispensing_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_generic_substitutions" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_generic_substitutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_generic_substitutions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_generic_substitutions_tenant_isolation" ON "clinical"."pharmacy_generic_substitutions";
CREATE POLICY "p_clinical_pharmacy_generic_substitutions_tenant_isolation" ON "clinical"."pharmacy_generic_substitutions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_inventory" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_inventory" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_inventory_tenant_isolation" ON "clinical"."pharmacy_inventory";
CREATE POLICY "p_clinical_pharmacy_inventory_tenant_isolation" ON "clinical"."pharmacy_inventory"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_khata_ledger" (Type: varchar)
ALTER TABLE "clinical"."pharmacy_khata_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_khata_ledger" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_khata_ledger_tenant_isolation" ON "clinical"."pharmacy_khata_ledger";
CREATE POLICY "p_clinical_pharmacy_khata_ledger_tenant_isolation" ON "clinical"."pharmacy_khata_ledger"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "clinical"."pharmacy_prescription_items" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_prescription_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_prescription_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_prescription_items_tenant_isolation" ON "clinical"."pharmacy_prescription_items";
CREATE POLICY "p_clinical_pharmacy_prescription_items_tenant_isolation" ON "clinical"."pharmacy_prescription_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_prescriptions" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_prescriptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_prescriptions_tenant_isolation" ON "clinical"."pharmacy_prescriptions";
CREATE POLICY "p_clinical_pharmacy_prescriptions_tenant_isolation" ON "clinical"."pharmacy_prescriptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_returns" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_returns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_returns" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_returns_tenant_isolation" ON "clinical"."pharmacy_returns";
CREATE POLICY "p_clinical_pharmacy_returns_tenant_isolation" ON "clinical"."pharmacy_returns"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_rtv_debit_notes" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_rtv_debit_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_rtv_debit_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_rtv_debit_notes_tenant_isolation" ON "clinical"."pharmacy_rtv_debit_notes";
CREATE POLICY "p_clinical_pharmacy_rtv_debit_notes_tenant_isolation" ON "clinical"."pharmacy_rtv_debit_notes"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_stock_adjustments" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_stock_adjustments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_stock_adjustments_tenant_isolation" ON "clinical"."pharmacy_stock_adjustments";
CREATE POLICY "p_clinical_pharmacy_stock_adjustments_tenant_isolation" ON "clinical"."pharmacy_stock_adjustments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_stock_movements" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_stock_movements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_stock_movements_tenant_isolation" ON "clinical"."pharmacy_stock_movements";
CREATE POLICY "p_clinical_pharmacy_stock_movements_tenant_isolation" ON "clinical"."pharmacy_stock_movements"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_stock_reservations" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_stock_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_stock_reservations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_stock_reservations_tenant_isolation" ON "clinical"."pharmacy_stock_reservations";
CREATE POLICY "p_clinical_pharmacy_stock_reservations_tenant_isolation" ON "clinical"."pharmacy_stock_reservations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pharmacy_substitution_requests" (Type: uuid)
ALTER TABLE "clinical"."pharmacy_substitution_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pharmacy_substitution_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pharmacy_substitution_requests_tenant_isolation" ON "clinical"."pharmacy_substitution_requests";
CREATE POLICY "p_clinical_pharmacy_substitution_requests_tenant_isolation" ON "clinical"."pharmacy_substitution_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."phlebotomist_fleets" (Type: uuid)
ALTER TABLE "clinical"."phlebotomist_fleets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."phlebotomist_fleets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_phlebotomist_fleets_tenant_isolation" ON "clinical"."phlebotomist_fleets";
CREATE POLICY "p_clinical_phlebotomist_fleets_tenant_isolation" ON "clinical"."phlebotomist_fleets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."postoperative_orders" (Type: uuid)
ALTER TABLE "clinical"."postoperative_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."postoperative_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_postoperative_orders_tenant_isolation" ON "clinical"."postoperative_orders";
CREATE POLICY "p_clinical_postoperative_orders_tenant_isolation" ON "clinical"."postoperative_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."postoperative_transfers" (Type: uuid)
ALTER TABLE "clinical"."postoperative_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."postoperative_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_postoperative_transfers_tenant_isolation" ON "clinical"."postoperative_transfers";
CREATE POLICY "p_clinical_postoperative_transfers_tenant_isolation" ON "clinical"."postoperative_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pre_op_checklists" (Type: uuid)
ALTER TABLE "clinical"."pre_op_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pre_op_checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pre_op_checklists_tenant_isolation" ON "clinical"."pre_op_checklists";
CREATE POLICY "p_clinical_pre_op_checklists_tenant_isolation" ON "clinical"."pre_op_checklists"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."pre_operative_assessments" (Type: uuid)
ALTER TABLE "clinical"."pre_operative_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."pre_operative_assessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_pre_operative_assessments_tenant_isolation" ON "clinical"."pre_operative_assessments";
CREATE POLICY "p_clinical_pre_operative_assessments_tenant_isolation" ON "clinical"."pre_operative_assessments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."predictive_bed_forecasts" (Type: uuid)
ALTER TABLE "clinical"."predictive_bed_forecasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."predictive_bed_forecasts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_predictive_bed_forecasts_tenant_isolation" ON "clinical"."predictive_bed_forecasts";
CREATE POLICY "p_clinical_predictive_bed_forecasts_tenant_isolation" ON "clinical"."predictive_bed_forecasts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."prescription_templates" (Type: uuid)
ALTER TABLE "clinical"."prescription_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."prescription_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_prescription_templates_tenant_isolation" ON "clinical"."prescription_templates";
CREATE POLICY "p_clinical_prescription_templates_tenant_isolation" ON "clinical"."prescription_templates"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_approvals" (Type: uuid)
ALTER TABLE "clinical"."procurement_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_approvals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_approvals_tenant_isolation" ON "clinical"."procurement_approvals";
CREATE POLICY "p_clinical_procurement_approvals_tenant_isolation" ON "clinical"."procurement_approvals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."procurement_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_audit_traces_tenant_isolation" ON "clinical"."procurement_audit_traces";
CREATE POLICY "p_clinical_procurement_audit_traces_tenant_isolation" ON "clinical"."procurement_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_exceptions" (Type: uuid)
ALTER TABLE "clinical"."procurement_exceptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_exceptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_exceptions_tenant_isolation" ON "clinical"."procurement_exceptions";
CREATE POLICY "p_clinical_procurement_exceptions_tenant_isolation" ON "clinical"."procurement_exceptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_inspection_items" (Type: uuid)
ALTER TABLE "clinical"."procurement_inspection_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_inspection_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_inspection_items_tenant_isolation" ON "clinical"."procurement_inspection_items";
CREATE POLICY "p_clinical_procurement_inspection_items_tenant_isolation" ON "clinical"."procurement_inspection_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_inspections" (Type: uuid)
ALTER TABLE "clinical"."procurement_inspections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_inspections" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_inspections_tenant_isolation" ON "clinical"."procurement_inspections";
CREATE POLICY "p_clinical_procurement_inspections_tenant_isolation" ON "clinical"."procurement_inspections"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_item_vendor_mappings" (Type: uuid)
ALTER TABLE "clinical"."procurement_item_vendor_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_item_vendor_mappings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_item_vendor_mappings_tenant_isolation" ON "clinical"."procurement_item_vendor_mappings";
CREATE POLICY "p_clinical_procurement_item_vendor_mappings_tenant_isolation" ON "clinical"."procurement_item_vendor_mappings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_items" (Type: uuid)
ALTER TABLE "clinical"."procurement_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_items_tenant_isolation" ON "clinical"."procurement_items";
CREATE POLICY "p_clinical_procurement_items_tenant_isolation" ON "clinical"."procurement_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_vendor_contacts" (Type: uuid)
ALTER TABLE "clinical"."procurement_vendor_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_vendor_contacts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_vendor_contacts_tenant_isolation" ON "clinical"."procurement_vendor_contacts";
CREATE POLICY "p_clinical_procurement_vendor_contacts_tenant_isolation" ON "clinical"."procurement_vendor_contacts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_vendor_contract_items" (Type: uuid)
ALTER TABLE "clinical"."procurement_vendor_contract_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_vendor_contract_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_vendor_contract_items_tenant_isolation" ON "clinical"."procurement_vendor_contract_items";
CREATE POLICY "p_clinical_procurement_vendor_contract_items_tenant_isolation" ON "clinical"."procurement_vendor_contract_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_vendor_contracts" (Type: uuid)
ALTER TABLE "clinical"."procurement_vendor_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_vendor_contracts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_vendor_contracts_tenant_isolation" ON "clinical"."procurement_vendor_contracts";
CREATE POLICY "p_clinical_procurement_vendor_contracts_tenant_isolation" ON "clinical"."procurement_vendor_contracts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_vendor_documents" (Type: uuid)
ALTER TABLE "clinical"."procurement_vendor_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_vendor_documents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_vendor_documents_tenant_isolation" ON "clinical"."procurement_vendor_documents";
CREATE POLICY "p_clinical_procurement_vendor_documents_tenant_isolation" ON "clinical"."procurement_vendor_documents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."procurement_vendors" (Type: uuid)
ALTER TABLE "clinical"."procurement_vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."procurement_vendors" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_procurement_vendors_tenant_isolation" ON "clinical"."procurement_vendors";
CREATE POLICY "p_clinical_procurement_vendors_tenant_isolation" ON "clinical"."procurement_vendors"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_invoice_matches" (Type: uuid)
ALTER TABLE "clinical"."purchase_invoice_matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_invoice_matches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_invoice_matches_tenant_isolation" ON "clinical"."purchase_invoice_matches";
CREATE POLICY "p_clinical_purchase_invoice_matches_tenant_isolation" ON "clinical"."purchase_invoice_matches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_invoice_payments" (Type: uuid)
ALTER TABLE "clinical"."purchase_invoice_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_invoice_payments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_invoice_payments_tenant_isolation" ON "clinical"."purchase_invoice_payments";
CREATE POLICY "p_clinical_purchase_invoice_payments_tenant_isolation" ON "clinical"."purchase_invoice_payments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_invoices" (Type: uuid)
ALTER TABLE "clinical"."purchase_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_invoices_tenant_isolation" ON "clinical"."purchase_invoices";
CREATE POLICY "p_clinical_purchase_invoices_tenant_isolation" ON "clinical"."purchase_invoices"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_order_items" (Type: uuid)
ALTER TABLE "clinical"."purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_order_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_order_items_tenant_isolation" ON "clinical"."purchase_order_items";
CREATE POLICY "p_clinical_purchase_order_items_tenant_isolation" ON "clinical"."purchase_order_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_orders" (Type: uuid)
ALTER TABLE "clinical"."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_orders_tenant_isolation" ON "clinical"."purchase_orders";
CREATE POLICY "p_clinical_purchase_orders_tenant_isolation" ON "clinical"."purchase_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_requisition_items" (Type: uuid)
ALTER TABLE "clinical"."purchase_requisition_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_requisition_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_requisition_items_tenant_isolation" ON "clinical"."purchase_requisition_items";
CREATE POLICY "p_clinical_purchase_requisition_items_tenant_isolation" ON "clinical"."purchase_requisition_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."purchase_requisitions" (Type: uuid)
ALTER TABLE "clinical"."purchase_requisitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."purchase_requisitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_purchase_requisitions_tenant_isolation" ON "clinical"."purchase_requisitions";
CREATE POLICY "p_clinical_purchase_requisitions_tenant_isolation" ON "clinical"."purchase_requisitions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."quality_accreditation_standards" (Type: uuid)
ALTER TABLE "clinical"."quality_accreditation_standards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."quality_accreditation_standards" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_quality_accreditation_standards_tenant_isolation" ON "clinical"."quality_accreditation_standards";
CREATE POLICY "p_clinical_quality_accreditation_standards_tenant_isolation" ON "clinical"."quality_accreditation_standards"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."quality_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."quality_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."quality_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_quality_audit_traces_tenant_isolation" ON "clinical"."quality_audit_traces";
CREATE POLICY "p_clinical_quality_audit_traces_tenant_isolation" ON "clinical"."quality_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."quality_capa_actions" (Type: uuid)
ALTER TABLE "clinical"."quality_capa_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."quality_capa_actions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_quality_capa_actions_tenant_isolation" ON "clinical"."quality_capa_actions";
CREATE POLICY "p_clinical_quality_capa_actions_tenant_isolation" ON "clinical"."quality_capa_actions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."quality_procurement_references" (Type: uuid)
ALTER TABLE "clinical"."quality_procurement_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."quality_procurement_references" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_quality_procurement_references_tenant_isolation" ON "clinical"."quality_procurement_references";
CREATE POLICY "p_clinical_quality_procurement_references_tenant_isolation" ON "clinical"."quality_procurement_references"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_appointments" (Type: uuid)
ALTER TABLE "clinical"."radiology_appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_appointments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_appointments_tenant_isolation" ON "clinical"."radiology_appointments";
CREATE POLICY "p_clinical_radiology_appointments_tenant_isolation" ON "clinical"."radiology_appointments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."radiology_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_audit_traces_tenant_isolation" ON "clinical"."radiology_audit_traces";
CREATE POLICY "p_clinical_radiology_audit_traces_tenant_isolation" ON "clinical"."radiology_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_critical_findings" (Type: uuid)
ALTER TABLE "clinical"."radiology_critical_findings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_critical_findings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_critical_findings_tenant_isolation" ON "clinical"."radiology_critical_findings";
CREATE POLICY "p_clinical_radiology_critical_findings_tenant_isolation" ON "clinical"."radiology_critical_findings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_departments" (Type: uuid)
ALTER TABLE "clinical"."radiology_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_departments_tenant_isolation" ON "clinical"."radiology_departments";
CREATE POLICY "p_clinical_radiology_departments_tenant_isolation" ON "clinical"."radiology_departments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_modalities" (Type: uuid)
ALTER TABLE "clinical"."radiology_modalities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_modalities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_modalities_tenant_isolation" ON "clinical"."radiology_modalities";
CREATE POLICY "p_clinical_radiology_modalities_tenant_isolation" ON "clinical"."radiology_modalities"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_orders" (Type: uuid)
ALTER TABLE "clinical"."radiology_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_orders_tenant_isolation" ON "clinical"."radiology_orders";
CREATE POLICY "p_clinical_radiology_orders_tenant_isolation" ON "clinical"."radiology_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_preparation_records" (Type: uuid)
ALTER TABLE "clinical"."radiology_preparation_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_preparation_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_preparation_records_tenant_isolation" ON "clinical"."radiology_preparation_records";
CREATE POLICY "p_clinical_radiology_preparation_records_tenant_isolation" ON "clinical"."radiology_preparation_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_procedure_catalog" (Type: uuid)
ALTER TABLE "clinical"."radiology_procedure_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_procedure_catalog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_procedure_catalog_tenant_isolation" ON "clinical"."radiology_procedure_catalog";
CREATE POLICY "p_clinical_radiology_procedure_catalog_tenant_isolation" ON "clinical"."radiology_procedure_catalog"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_quality_events" (Type: uuid)
ALTER TABLE "clinical"."radiology_quality_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_quality_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_quality_events_tenant_isolation" ON "clinical"."radiology_quality_events";
CREATE POLICY "p_clinical_radiology_quality_events_tenant_isolation" ON "clinical"."radiology_quality_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_report_amendments" (Type: uuid)
ALTER TABLE "clinical"."radiology_report_amendments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_report_amendments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_report_amendments_tenant_isolation" ON "clinical"."radiology_report_amendments";
CREATE POLICY "p_clinical_radiology_report_amendments_tenant_isolation" ON "clinical"."radiology_report_amendments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_reports" (Type: uuid)
ALTER TABLE "clinical"."radiology_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_reports" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_reports_tenant_isolation" ON "clinical"."radiology_reports";
CREATE POLICY "p_clinical_radiology_reports_tenant_isolation" ON "clinical"."radiology_reports"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."radiology_studies" (Type: uuid)
ALTER TABLE "clinical"."radiology_studies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."radiology_studies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_radiology_studies_tenant_isolation" ON "clinical"."radiology_studies";
CREATE POLICY "p_clinical_radiology_studies_tenant_isolation" ON "clinical"."radiology_studies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."rcm_claim_scrub_logs" (Type: uuid)
ALTER TABLE "clinical"."rcm_claim_scrub_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."rcm_claim_scrub_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_rcm_claim_scrub_logs_tenant_isolation" ON "clinical"."rcm_claim_scrub_logs";
CREATE POLICY "p_clinical_rcm_claim_scrub_logs_tenant_isolation" ON "clinical"."rcm_claim_scrub_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."release_of_information_requests" (Type: uuid)
ALTER TABLE "clinical"."release_of_information_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."release_of_information_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_release_of_information_requests_tenant_isolation" ON "clinical"."release_of_information_requests";
CREATE POLICY "p_clinical_release_of_information_requests_tenant_isolation" ON "clinical"."release_of_information_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."rpm_vital_breach_alerts" (Type: uuid)
ALTER TABLE "clinical"."rpm_vital_breach_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."rpm_vital_breach_alerts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_rpm_vital_breach_alerts_tenant_isolation" ON "clinical"."rpm_vital_breach_alerts";
CREATE POLICY "p_clinical_rpm_vital_breach_alerts_tenant_isolation" ON "clinical"."rpm_vital_breach_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."saas_communication_wallets" (Type: uuid)
ALTER TABLE "clinical"."saas_communication_wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."saas_communication_wallets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_saas_communication_wallets_tenant_isolation" ON "clinical"."saas_communication_wallets";
CREATE POLICY "p_clinical_saas_communication_wallets_tenant_isolation" ON "clinical"."saas_communication_wallets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."saas_marketplace_addons" (Type: uuid)
ALTER TABLE "clinical"."saas_marketplace_addons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."saas_marketplace_addons" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_saas_marketplace_addons_tenant_isolation" ON "clinical"."saas_marketplace_addons";
CREATE POLICY "p_clinical_saas_marketplace_addons_tenant_isolation" ON "clinical"."saas_marketplace_addons"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."sepsis_news2_alerts" (Type: uuid)
ALTER TABLE "clinical"."sepsis_news2_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."sepsis_news2_alerts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_sepsis_news2_alerts_tenant_isolation" ON "clinical"."sepsis_news2_alerts";
CREATE POLICY "p_clinical_sepsis_news2_alerts_tenant_isolation" ON "clinical"."sepsis_news2_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."staff_credentials" (Type: uuid)
ALTER TABLE "clinical"."staff_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."staff_credentials" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_staff_credentials_tenant_isolation" ON "clinical"."staff_credentials";
CREATE POLICY "p_clinical_staff_credentials_tenant_isolation" ON "clinical"."staff_credentials"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."staff_role_assignments" (Type: uuid)
ALTER TABLE "clinical"."staff_role_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."staff_role_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_staff_role_assignments_tenant_isolation" ON "clinical"."staff_role_assignments";
CREATE POLICY "p_clinical_staff_role_assignments_tenant_isolation" ON "clinical"."staff_role_assignments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."staff_transfers" (Type: uuid)
ALTER TABLE "clinical"."staff_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."staff_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_staff_transfers_tenant_isolation" ON "clinical"."staff_transfers";
CREATE POLICY "p_clinical_staff_transfers_tenant_isolation" ON "clinical"."staff_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_batches" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_batches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_batches_tenant_isolation" ON "clinical"."supply_chain_batches";
CREATE POLICY "p_clinical_supply_chain_batches_tenant_isolation" ON "clinical"."supply_chain_batches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_consumption_items" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_consumption_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_consumption_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_consumption_items_tenant_isolation" ON "clinical"."supply_chain_consumption_items";
CREATE POLICY "p_clinical_supply_chain_consumption_items_tenant_isolation" ON "clinical"."supply_chain_consumption_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_consumptions" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_consumptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_consumptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_consumptions_tenant_isolation" ON "clinical"."supply_chain_consumptions";
CREATE POLICY "p_clinical_supply_chain_consumptions_tenant_isolation" ON "clinical"."supply_chain_consumptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_inventory" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_inventory" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_inventory_tenant_isolation" ON "clinical"."supply_chain_inventory";
CREATE POLICY "p_clinical_supply_chain_inventory_tenant_isolation" ON "clinical"."supply_chain_inventory"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_locations" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_locations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_locations_tenant_isolation" ON "clinical"."supply_chain_locations";
CREATE POLICY "p_clinical_supply_chain_locations_tenant_isolation" ON "clinical"."supply_chain_locations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_recalls" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_recalls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_recalls" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_recalls_tenant_isolation" ON "clinical"."supply_chain_recalls";
CREATE POLICY "p_clinical_supply_chain_recalls_tenant_isolation" ON "clinical"."supply_chain_recalls"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_stock_count_items" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_stock_count_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_stock_count_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_stock_count_items_tenant_isolation" ON "clinical"."supply_chain_stock_count_items";
CREATE POLICY "p_clinical_supply_chain_stock_count_items_tenant_isolation" ON "clinical"."supply_chain_stock_count_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_stock_counts" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_stock_counts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_stock_counts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_stock_counts_tenant_isolation" ON "clinical"."supply_chain_stock_counts";
CREATE POLICY "p_clinical_supply_chain_stock_counts_tenant_isolation" ON "clinical"."supply_chain_stock_counts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_stock_ledger" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_stock_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_stock_ledger" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_stock_ledger_tenant_isolation" ON "clinical"."supply_chain_stock_ledger";
CREATE POLICY "p_clinical_supply_chain_stock_ledger_tenant_isolation" ON "clinical"."supply_chain_stock_ledger"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_transfer_items" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_transfer_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_transfer_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_transfer_items_tenant_isolation" ON "clinical"."supply_chain_transfer_items";
CREATE POLICY "p_clinical_supply_chain_transfer_items_tenant_isolation" ON "clinical"."supply_chain_transfer_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_transfers" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_transfers_tenant_isolation" ON "clinical"."supply_chain_transfers";
CREATE POLICY "p_clinical_supply_chain_transfers_tenant_isolation" ON "clinical"."supply_chain_transfers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."supply_chain_warehouses" (Type: uuid)
ALTER TABLE "clinical"."supply_chain_warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."supply_chain_warehouses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_supply_chain_warehouses_tenant_isolation" ON "clinical"."supply_chain_warehouses";
CREATE POLICY "p_clinical_supply_chain_warehouses_tenant_isolation" ON "clinical"."supply_chain_warehouses"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgery_cancellations" (Type: uuid)
ALTER TABLE "clinical"."surgery_cancellations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgery_cancellations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgery_cancellations_tenant_isolation" ON "clinical"."surgery_cancellations";
CREATE POLICY "p_clinical_surgery_cancellations_tenant_isolation" ON "clinical"."surgery_cancellations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgery_concierge_leads" (Type: uuid)
ALTER TABLE "clinical"."surgery_concierge_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgery_concierge_leads" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgery_concierge_leads_tenant_isolation" ON "clinical"."surgery_concierge_leads";
CREATE POLICY "p_clinical_surgery_concierge_leads_tenant_isolation" ON "clinical"."surgery_concierge_leads"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgery_emi_applications" (Type: uuid)
ALTER TABLE "clinical"."surgery_emi_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgery_emi_applications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgery_emi_applications_tenant_isolation" ON "clinical"."surgery_emi_applications";
CREATE POLICY "p_clinical_surgery_emi_applications_tenant_isolation" ON "clinical"."surgery_emi_applications"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgery_request_items" (Type: uuid)
ALTER TABLE "clinical"."surgery_request_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgery_request_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgery_request_items_tenant_isolation" ON "clinical"."surgery_request_items";
CREATE POLICY "p_clinical_surgery_request_items_tenant_isolation" ON "clinical"."surgery_request_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgery_requests" (Type: uuid)
ALTER TABLE "clinical"."surgery_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgery_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgery_requests_tenant_isolation" ON "clinical"."surgery_requests";
CREATE POLICY "p_clinical_surgery_requests_tenant_isolation" ON "clinical"."surgery_requests"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_consents" (Type: uuid)
ALTER TABLE "clinical"."surgical_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_consents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_consents_tenant_isolation" ON "clinical"."surgical_consents";
CREATE POLICY "p_clinical_surgical_consents_tenant_isolation" ON "clinical"."surgical_consents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_consumable_usage" (Type: uuid)
ALTER TABLE "clinical"."surgical_consumable_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_consumable_usage" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_consumable_usage_tenant_isolation" ON "clinical"."surgical_consumable_usage";
CREATE POLICY "p_clinical_surgical_consumable_usage_tenant_isolation" ON "clinical"."surgical_consumable_usage"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_implants" (Type: uuid)
ALTER TABLE "clinical"."surgical_implants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_implants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_implants_tenant_isolation" ON "clinical"."surgical_implants";
CREATE POLICY "p_clinical_surgical_implants_tenant_isolation" ON "clinical"."surgical_implants"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_procedure_requirements" (Type: uuid)
ALTER TABLE "clinical"."surgical_procedure_requirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_procedure_requirements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_procedure_requirements_tenant_isolation" ON "clinical"."surgical_procedure_requirements";
CREATE POLICY "p_clinical_surgical_procedure_requirements_tenant_isolation" ON "clinical"."surgical_procedure_requirements"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_procedures" (Type: uuid)
ALTER TABLE "clinical"."surgical_procedures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_procedures" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_procedures_tenant_isolation" ON "clinical"."surgical_procedures";
CREATE POLICY "p_clinical_surgical_procedures_tenant_isolation" ON "clinical"."surgical_procedures"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_safety_checklists" (Type: uuid)
ALTER TABLE "clinical"."surgical_safety_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_safety_checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_safety_checklists_tenant_isolation" ON "clinical"."surgical_safety_checklists";
CREATE POLICY "p_clinical_surgical_safety_checklists_tenant_isolation" ON "clinical"."surgical_safety_checklists"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."surgical_specimens" (Type: uuid)
ALTER TABLE "clinical"."surgical_specimens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."surgical_specimens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_surgical_specimens_tenant_isolation" ON "clinical"."surgical_specimens";
CREATE POLICY "p_clinical_surgical_specimens_tenant_isolation" ON "clinical"."surgical_specimens"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."teleconsultation_sessions" (Type: uuid)
ALTER TABLE "clinical"."teleconsultation_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."teleconsultation_sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_teleconsultation_sessions_tenant_isolation" ON "clinical"."teleconsultation_sessions";
CREATE POLICY "p_clinical_teleconsultation_sessions_tenant_isolation" ON "clinical"."teleconsultation_sessions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."telehealth_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."telehealth_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."telehealth_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_telehealth_audit_traces_tenant_isolation" ON "clinical"."telehealth_audit_traces";
CREATE POLICY "p_clinical_telehealth_audit_traces_tenant_isolation" ON "clinical"."telehealth_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."transfusion_reactions" (Type: uuid)
ALTER TABLE "clinical"."transfusion_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."transfusion_reactions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_transfusion_reactions_tenant_isolation" ON "clinical"."transfusion_reactions";
CREATE POLICY "p_clinical_transfusion_reactions_tenant_isolation" ON "clinical"."transfusion_reactions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."transfusion_records" (Type: uuid)
ALTER TABLE "clinical"."transfusion_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."transfusion_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_transfusion_records_tenant_isolation" ON "clinical"."transfusion_records";
CREATE POLICY "p_clinical_transfusion_records_tenant_isolation" ON "clinical"."transfusion_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."trauma_activations" (Type: uuid)
ALTER TABLE "clinical"."trauma_activations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."trauma_activations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_trauma_activations_tenant_isolation" ON "clinical"."trauma_activations";
CREATE POLICY "p_clinical_trauma_activations_tenant_isolation" ON "clinical"."trauma_activations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."vendor_return_items" (Type: uuid)
ALTER TABLE "clinical"."vendor_return_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."vendor_return_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_vendor_return_items_tenant_isolation" ON "clinical"."vendor_return_items";
CREATE POLICY "p_clinical_vendor_return_items_tenant_isolation" ON "clinical"."vendor_return_items"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."vendor_returns" (Type: uuid)
ALTER TABLE "clinical"."vendor_returns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."vendor_returns" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_vendor_returns_tenant_isolation" ON "clinical"."vendor_returns";
CREATE POLICY "p_clinical_vendor_returns_tenant_isolation" ON "clinical"."vendor_returns"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."what_if_simulation_runs" (Type: uuid)
ALTER TABLE "clinical"."what_if_simulation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."what_if_simulation_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_what_if_simulation_runs_tenant_isolation" ON "clinical"."what_if_simulation_runs";
CREATE POLICY "p_clinical_what_if_simulation_runs_tenant_isolation" ON "clinical"."what_if_simulation_runs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."whatsapp_conversations" (Type: uuid)
ALTER TABLE "clinical"."whatsapp_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."whatsapp_conversations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_whatsapp_conversations_tenant_isolation" ON "clinical"."whatsapp_conversations";
CREATE POLICY "p_clinical_whatsapp_conversations_tenant_isolation" ON "clinical"."whatsapp_conversations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."whatsapp_document_dispatches" (Type: uuid)
ALTER TABLE "clinical"."whatsapp_document_dispatches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."whatsapp_document_dispatches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_whatsapp_document_dispatches_tenant_isolation" ON "clinical"."whatsapp_document_dispatches";
CREATE POLICY "p_clinical_whatsapp_document_dispatches_tenant_isolation" ON "clinical"."whatsapp_document_dispatches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "clinical"."whatsapp_portal_audit_traces" (Type: uuid)
ALTER TABLE "clinical"."whatsapp_portal_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical"."whatsapp_portal_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_clinical_whatsapp_portal_audit_traces_tenant_isolation" ON "clinical"."whatsapp_portal_audit_traces";
CREATE POLICY "p_clinical_whatsapp_portal_audit_traces_tenant_isolation" ON "clinical"."whatsapp_portal_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."access_policies" (Type: uuid)
ALTER TABLE "company"."access_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."access_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_access_policies_tenant_isolation" ON "company"."access_policies";
CREATE POLICY "p_company_access_policies_tenant_isolation" ON "company"."access_policies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."break_glass_access" (Type: uuid)
ALTER TABLE "company"."break_glass_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."break_glass_access" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_break_glass_access_tenant_isolation" ON "company"."break_glass_access";
CREATE POLICY "p_company_break_glass_access_tenant_isolation" ON "company"."break_glass_access"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."facility_branding_vault" (Type: uuid)
ALTER TABLE "company"."facility_branding_vault" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."facility_branding_vault" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_facility_branding_vault_tenant_isolation" ON "company"."facility_branding_vault";
CREATE POLICY "p_company_facility_branding_vault_tenant_isolation" ON "company"."facility_branding_vault"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."licenses" (Type: uuid)
ALTER TABLE "company"."licenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."licenses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_licenses_tenant_isolation" ON "company"."licenses";
CREATE POLICY "p_company_licenses_tenant_isolation" ON "company"."licenses"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_agreements" (Type: uuid)
ALTER TABLE "company"."partner_agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_agreements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_agreements_tenant_isolation" ON "company"."partner_agreements";
CREATE POLICY "p_company_partner_agreements_tenant_isolation" ON "company"."partner_agreements"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_capabilities" (Type: uuid)
ALTER TABLE "company"."partner_capabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_capabilities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_capabilities_tenant_isolation" ON "company"."partner_capabilities";
CREATE POLICY "p_company_partner_capabilities_tenant_isolation" ON "company"."partner_capabilities"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_configuration_versions" (Type: uuid)
ALTER TABLE "company"."partner_configuration_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_configuration_versions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_configuration_versions_tenant_isolation" ON "company"."partner_configuration_versions";
CREATE POLICY "p_company_partner_configuration_versions_tenant_isolation" ON "company"."partner_configuration_versions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_governance_overrides" (Type: uuid)
ALTER TABLE "company"."partner_governance_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_governance_overrides" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_governance_overrides_tenant_isolation" ON "company"."partner_governance_overrides";
CREATE POLICY "p_company_partner_governance_overrides_tenant_isolation" ON "company"."partner_governance_overrides"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_operational_settings" (Type: uuid)
ALTER TABLE "company"."partner_operational_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_operational_settings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_operational_settings_tenant_isolation" ON "company"."partner_operational_settings";
CREATE POLICY "p_company_partner_operational_settings_tenant_isolation" ON "company"."partner_operational_settings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_profiles" (Type: uuid)
ALTER TABLE "company"."partner_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_profiles_tenant_isolation" ON "company"."partner_profiles";
CREATE POLICY "p_company_partner_profiles_tenant_isolation" ON "company"."partner_profiles"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_anomaly_detections" (Type: uuid)
ALTER TABLE "core"."ai_anomaly_detections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_anomaly_detections" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_anomaly_detections_tenant_isolation" ON "core"."ai_anomaly_detections";
CREATE POLICY "p_core_ai_anomaly_detections_tenant_isolation" ON "core"."ai_anomaly_detections"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_chat_conversations" (Type: uuid)
ALTER TABLE "core"."ai_chat_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_chat_conversations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_chat_conversations_tenant_isolation" ON "core"."ai_chat_conversations";
CREATE POLICY "p_core_ai_chat_conversations_tenant_isolation" ON "core"."ai_chat_conversations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_chat_messages" (Type: uuid)
ALTER TABLE "core"."ai_chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_chat_messages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_chat_messages_tenant_isolation" ON "core"."ai_chat_messages";
CREATE POLICY "p_core_ai_chat_messages_tenant_isolation" ON "core"."ai_chat_messages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_cost_budgets" (Type: uuid)
ALTER TABLE "core"."ai_cost_budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_cost_budgets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_cost_budgets_tenant_isolation" ON "core"."ai_cost_budgets";
CREATE POLICY "p_core_ai_cost_budgets_tenant_isolation" ON "core"."ai_cost_budgets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_demand_forecasts" (Type: uuid)
ALTER TABLE "core"."ai_demand_forecasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_demand_forecasts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_demand_forecasts_tenant_isolation" ON "core"."ai_demand_forecasts";
CREATE POLICY "p_core_ai_demand_forecasts_tenant_isolation" ON "core"."ai_demand_forecasts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_incidents" (Type: uuid)
ALTER TABLE "core"."ai_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_incidents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_incidents_tenant_isolation" ON "core"."ai_incidents";
CREATE POLICY "p_core_ai_incidents_tenant_isolation" ON "core"."ai_incidents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."ai_request_registry" (Type: uuid)
ALTER TABLE "core"."ai_request_registry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."ai_request_registry" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_ai_request_registry_tenant_isolation" ON "core"."ai_request_registry";
CREATE POLICY "p_core_ai_request_registry_tenant_isolation" ON "core"."ai_request_registry"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."audit_events" (Type: uuid)
ALTER TABLE "core"."audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."audit_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_audit_events_tenant_isolation" ON "core"."audit_events";
CREATE POLICY "p_core_audit_events_tenant_isolation" ON "core"."audit_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."audit_events_partitioned" (Type: uuid)
ALTER TABLE "core"."audit_events_partitioned" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."audit_events_partitioned" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_audit_events_partitioned_tenant_isolation" ON "core"."audit_events_partitioned";
CREATE POLICY "p_core_audit_events_partitioned_tenant_isolation" ON "core"."audit_events_partitioned"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."audit_ledger_verifications" (Type: uuid)
ALTER TABLE "core"."audit_ledger_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."audit_ledger_verifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_audit_ledger_verifications_tenant_isolation" ON "core"."audit_ledger_verifications";
CREATE POLICY "p_core_audit_ledger_verifications_tenant_isolation" ON "core"."audit_ledger_verifications"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."branches" (Type: uuid)
ALTER TABLE "core"."branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."branches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_branches_tenant_isolation" ON "core"."branches";
CREATE POLICY "p_core_branches_tenant_isolation" ON "core"."branches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."dead_letter_jobs" (Type: uuid)
ALTER TABLE "core"."dead_letter_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."dead_letter_jobs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_dead_letter_jobs_tenant_isolation" ON "core"."dead_letter_jobs";
CREATE POLICY "p_core_dead_letter_jobs_tenant_isolation" ON "core"."dead_letter_jobs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."device_registry" (Type: uuid)
ALTER TABLE "core"."device_registry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."device_registry" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_device_registry_tenant_isolation" ON "core"."device_registry";
CREATE POLICY "p_core_device_registry_tenant_isolation" ON "core"."device_registry"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."idempotency_records" (Type: uuid)
ALTER TABLE "core"."idempotency_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."idempotency_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_idempotency_records_tenant_isolation" ON "core"."idempotency_records";
CREATE POLICY "p_core_idempotency_records_tenant_isolation" ON "core"."idempotency_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."offline_sync_conflicts" (Type: uuid)
ALTER TABLE "core"."offline_sync_conflicts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."offline_sync_conflicts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_offline_sync_conflicts_tenant_isolation" ON "core"."offline_sync_conflicts";
CREATE POLICY "p_core_offline_sync_conflicts_tenant_isolation" ON "core"."offline_sync_conflicts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."offline_sync_queue" (Type: uuid)
ALTER TABLE "core"."offline_sync_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."offline_sync_queue" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_offline_sync_queue_tenant_isolation" ON "core"."offline_sync_queue";
CREATE POLICY "p_core_offline_sync_queue_tenant_isolation" ON "core"."offline_sync_queue"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."outbox_jobs" (Type: uuid)
ALTER TABLE "core"."outbox_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."outbox_jobs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_outbox_jobs_tenant_isolation" ON "core"."outbox_jobs";
CREATE POLICY "p_core_outbox_jobs_tenant_isolation" ON "core"."outbox_jobs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."reconciliation_discrepancies" (Type: uuid)
ALTER TABLE "core"."reconciliation_discrepancies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."reconciliation_discrepancies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_reconciliation_discrepancies_tenant_isolation" ON "core"."reconciliation_discrepancies";
CREATE POLICY "p_core_reconciliation_discrepancies_tenant_isolation" ON "core"."reconciliation_discrepancies"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."reconciliation_runs" (Type: uuid)
ALTER TABLE "core"."reconciliation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."reconciliation_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_reconciliation_runs_tenant_isolation" ON "core"."reconciliation_runs";
CREATE POLICY "p_core_reconciliation_runs_tenant_isolation" ON "core"."reconciliation_runs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."roles" (Type: uuid)
ALTER TABLE "core"."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_roles_tenant_isolation" ON "core"."roles";
CREATE POLICY "p_core_roles_tenant_isolation" ON "core"."roles"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."saga_steps" (Type: uuid)
ALTER TABLE "core"."saga_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."saga_steps" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_saga_steps_tenant_isolation" ON "core"."saga_steps";
CREATE POLICY "p_core_saga_steps_tenant_isolation" ON "core"."saga_steps"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."saga_workflows" (Type: uuid)
ALTER TABLE "core"."saga_workflows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."saga_workflows" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_saga_workflows_tenant_isolation" ON "core"."saga_workflows";
CREATE POLICY "p_core_saga_workflows_tenant_isolation" ON "core"."saga_workflows"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."sessions" (Type: uuid)
ALTER TABLE "core"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_sessions_tenant_isolation" ON "core"."sessions";
CREATE POLICY "p_core_sessions_tenant_isolation" ON "core"."sessions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."user_branches" (Type: uuid)
ALTER TABLE "core"."user_branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."user_branches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_user_branches_tenant_isolation" ON "core"."user_branches";
CREATE POLICY "p_core_user_branches_tenant_isolation" ON "core"."user_branches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."user_roles" (Type: uuid)
ALTER TABLE "core"."user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."user_roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_user_roles_tenant_isolation" ON "core"."user_roles";
CREATE POLICY "p_core_user_roles_tenant_isolation" ON "core"."user_roles"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."user_tenants" (Type: uuid)
ALTER TABLE "core"."user_tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."user_tenants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_user_tenants_tenant_isolation" ON "core"."user_tenants";
CREATE POLICY "p_core_user_tenants_tenant_isolation" ON "core"."user_tenants"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "core"."user_workspace_layouts" (Type: uuid)
ALTER TABLE "core"."user_workspace_layouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."user_workspace_layouts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_core_user_workspace_layouts_tenant_isolation" ON "core"."user_workspace_layouts";
CREATE POLICY "p_core_user_workspace_layouts_tenant_isolation" ON "core"."user_workspace_layouts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "pharmacy"."controlled_substance_records" (Type: uuid)
ALTER TABLE "pharmacy"."controlled_substance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pharmacy"."controlled_substance_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_pharmacy_controlled_substance_records_tenant_isolation" ON "pharmacy"."controlled_substance_records";
CREATE POLICY "p_pharmacy_controlled_substance_records_tenant_isolation" ON "pharmacy"."controlled_substance_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "public"."bed_turnaround_missions" (Type: varchar)
ALTER TABLE "public"."bed_turnaround_missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bed_turnaround_missions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_bed_turnaround_missions_tenant_isolation" ON "public"."bed_turnaround_missions";
CREATE POLICY "p_public_bed_turnaround_missions_tenant_isolation" ON "public"."bed_turnaround_missions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."bedside_call_bell_events" (Type: varchar)
ALTER TABLE "public"."bedside_call_bell_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bedside_call_bell_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_bedside_call_bell_events_tenant_isolation" ON "public"."bedside_call_bell_events";
CREATE POLICY "p_public_bedside_call_bell_events_tenant_isolation" ON "public"."bedside_call_bell_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."bedside_dietary_orders" (Type: varchar)
ALTER TABLE "public"."bedside_dietary_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bedside_dietary_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_bedside_dietary_orders_tenant_isolation" ON "public"."bedside_dietary_orders";
CREATE POLICY "p_public_bedside_dietary_orders_tenant_isolation" ON "public"."bedside_dietary_orders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."bedside_iv_telemetry_logs" (Type: varchar)
ALTER TABLE "public"."bedside_iv_telemetry_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bedside_iv_telemetry_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_bedside_iv_telemetry_logs_tenant_isolation" ON "public"."bedside_iv_telemetry_logs";
CREATE POLICY "p_public_bedside_iv_telemetry_logs_tenant_isolation" ON "public"."bedside_iv_telemetry_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."blood_bank_cold_chain_logs" (Type: varchar)
ALTER TABLE "public"."blood_bank_cold_chain_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blood_bank_cold_chain_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_blood_bank_cold_chain_logs_tenant_isolation" ON "public"."blood_bank_cold_chain_logs";
CREATE POLICY "p_public_blood_bank_cold_chain_logs_tenant_isolation" ON "public"."blood_bank_cold_chain_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."blood_bank_crossmatch_reservations" (Type: varchar)
ALTER TABLE "public"."blood_bank_crossmatch_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blood_bank_crossmatch_reservations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_blood_bank_crossmatch_reservations_tenant_isolation" ON "public"."blood_bank_crossmatch_reservations";
CREATE POLICY "p_public_blood_bank_crossmatch_reservations_tenant_isolation" ON "public"."blood_bank_crossmatch_reservations"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."blood_bank_unit_inventory" (Type: varchar)
ALTER TABLE "public"."blood_bank_unit_inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blood_bank_unit_inventory" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_blood_bank_unit_inventory_tenant_isolation" ON "public"."blood_bank_unit_inventory";
CREATE POLICY "p_public_blood_bank_unit_inventory_tenant_isolation" ON "public"."blood_bank_unit_inventory"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."cashier_blind_drops" (Type: varchar)
ALTER TABLE "public"."cashier_blind_drops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cashier_blind_drops" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_cashier_blind_drops_tenant_isolation" ON "public"."cashier_blind_drops";
CREATE POLICY "p_public_cashier_blind_drops_tenant_isolation" ON "public"."cashier_blind_drops"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."chamber_yield_standby_queue" (Type: varchar)
ALTER TABLE "public"."chamber_yield_standby_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chamber_yield_standby_queue" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_chamber_yield_standby_queue_tenant_isolation" ON "public"."chamber_yield_standby_queue";
CREATE POLICY "p_public_chamber_yield_standby_queue_tenant_isolation" ON "public"."chamber_yield_standby_queue"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_doctor_collusion_radar" (Type: varchar)
ALTER TABLE "public"."company_doctor_collusion_radar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_doctor_collusion_radar" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_doctor_collusion_radar_tenant_isolation" ON "public"."company_doctor_collusion_radar";
CREATE POLICY "p_public_company_doctor_collusion_radar_tenant_isolation" ON "public"."company_doctor_collusion_radar"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_financial_reconciler_ledgers" (Type: varchar)
ALTER TABLE "public"."company_financial_reconciler_ledgers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_financial_reconciler_ledgers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_financial_reconciler_ledgers_tenant_isolation" ON "public"."company_financial_reconciler_ledgers";
CREATE POLICY "p_public_company_financial_reconciler_ledgers_tenant_isolation" ON "public"."company_financial_reconciler_ledgers"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_forensic_theft_radar" (Type: varchar)
ALTER TABLE "public"."company_forensic_theft_radar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_forensic_theft_radar" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_forensic_theft_radar_tenant_isolation" ON "public"."company_forensic_theft_radar";
CREATE POLICY "p_public_company_forensic_theft_radar_tenant_isolation" ON "public"."company_forensic_theft_radar"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_honeytoken_traps" (Type: varchar)
ALTER TABLE "public"."company_honeytoken_traps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_honeytoken_traps" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_honeytoken_traps_tenant_isolation" ON "public"."company_honeytoken_traps";
CREATE POLICY "p_public_company_honeytoken_traps_tenant_isolation" ON "public"."company_honeytoken_traps"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_nabh_audit_binders" (Type: varchar)
ALTER TABLE "public"."company_nabh_audit_binders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_nabh_audit_binders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_nabh_audit_binders_tenant_isolation" ON "public"."company_nabh_audit_binders";
CREATE POLICY "p_public_company_nabh_audit_binders_tenant_isolation" ON "public"."company_nabh_audit_binders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_partner_dunning_pipeline" (Type: varchar)
ALTER TABLE "public"."company_partner_dunning_pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_partner_dunning_pipeline" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_partner_dunning_pipeline_tenant_isolation" ON "public"."company_partner_dunning_pipeline";
CREATE POLICY "p_public_company_partner_dunning_pipeline_tenant_isolation" ON "public"."company_partner_dunning_pipeline"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_phi_snoop_alerts" (Type: varchar)
ALTER TABLE "public"."company_phi_snoop_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_phi_snoop_alerts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_phi_snoop_alerts_tenant_isolation" ON "public"."company_phi_snoop_alerts";
CREATE POLICY "p_public_company_phi_snoop_alerts_tenant_isolation" ON "public"."company_phi_snoop_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_predictive_churn_scores" (Type: varchar)
ALTER TABLE "public"."company_predictive_churn_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_predictive_churn_scores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_predictive_churn_scores_tenant_isolation" ON "public"."company_predictive_churn_scores";
CREATE POLICY "p_public_company_predictive_churn_scores_tenant_isolation" ON "public"."company_predictive_churn_scores"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_steganography_forensics" (Type: varchar)
ALTER TABLE "public"."company_steganography_forensics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_steganography_forensics" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_steganography_forensics_tenant_isolation" ON "public"."company_steganography_forensics";
CREATE POLICY "p_public_company_steganography_forensics_tenant_isolation" ON "public"."company_steganography_forensics"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_tenant_quarantines" (Type: varchar)
ALTER TABLE "public"."company_tenant_quarantines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_tenant_quarantines" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_tenant_quarantines_tenant_isolation" ON "public"."company_tenant_quarantines";
CREATE POLICY "p_public_company_tenant_quarantines_tenant_isolation" ON "public"."company_tenant_quarantines"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_time_travel_events" (Type: varchar)
ALTER TABLE "public"."company_time_travel_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_time_travel_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_time_travel_events_tenant_isolation" ON "public"."company_time_travel_events";
CREATE POLICY "p_public_company_time_travel_events_tenant_isolation" ON "public"."company_time_travel_events"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_tpa_clawback_sentinel" (Type: varchar)
ALTER TABLE "public"."company_tpa_clawback_sentinel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_tpa_clawback_sentinel" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_tpa_clawback_sentinel_tenant_isolation" ON "public"."company_tpa_clawback_sentinel";
CREATE POLICY "p_public_company_tpa_clawback_sentinel_tenant_isolation" ON "public"."company_tpa_clawback_sentinel"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."company_tpa_statutory_rebuttals" (Type: varchar)
ALTER TABLE "public"."company_tpa_statutory_rebuttals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_tpa_statutory_rebuttals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_company_tpa_statutory_rebuttals_tenant_isolation" ON "public"."company_tpa_statutory_rebuttals";
CREATE POLICY "p_public_company_tpa_statutory_rebuttals_tenant_isolation" ON "public"."company_tpa_statutory_rebuttals"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."corporate_b2b_accounts" (Type: varchar)
ALTER TABLE "public"."corporate_b2b_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."corporate_b2b_accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_corporate_b2b_accounts_tenant_isolation" ON "public"."corporate_b2b_accounts";
CREATE POLICY "p_public_corporate_b2b_accounts_tenant_isolation" ON "public"."corporate_b2b_accounts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."cssd_sterile_batches" (Type: varchar)
ALTER TABLE "public"."cssd_sterile_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cssd_sterile_batches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_cssd_sterile_batches_tenant_isolation" ON "public"."cssd_sterile_batches";
CREATE POLICY "p_public_cssd_sterile_batches_tenant_isolation" ON "public"."cssd_sterile_batches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."doctor_payout_clawbacks" (Type: varchar)
ALTER TABLE "public"."doctor_payout_clawbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."doctor_payout_clawbacks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_doctor_payout_clawbacks_tenant_isolation" ON "public"."doctor_payout_clawbacks";
CREATE POLICY "p_public_doctor_payout_clawbacks_tenant_isolation" ON "public"."doctor_payout_clawbacks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."entity_documents" (Type: uuid)
ALTER TABLE "public"."entity_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."entity_documents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_entity_documents_tenant_isolation" ON "public"."entity_documents";
CREATE POLICY "p_public_entity_documents_tenant_isolation" ON "public"."entity_documents"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "public"."ewan_escalation_audits" (Type: varchar)
ALTER TABLE "public"."ewan_escalation_audits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ewan_escalation_audits" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ewan_escalation_audits_tenant_isolation" ON "public"."ewan_escalation_audits";
CREATE POLICY "p_public_ewan_escalation_audits_tenant_isolation" ON "public"."ewan_escalation_audits"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ewan_executive_briefings" (Type: varchar)
ALTER TABLE "public"."ewan_executive_briefings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ewan_executive_briefings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ewan_executive_briefings_tenant_isolation" ON "public"."ewan_executive_briefings";
CREATE POLICY "p_public_ewan_executive_briefings_tenant_isolation" ON "public"."ewan_executive_briefings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ewan_leakage_audit_logs" (Type: varchar)
ALTER TABLE "public"."ewan_leakage_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ewan_leakage_audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ewan_leakage_audit_logs_tenant_isolation" ON "public"."ewan_leakage_audit_logs";
CREATE POLICY "p_public_ewan_leakage_audit_logs_tenant_isolation" ON "public"."ewan_leakage_audit_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ewan_nabh_statutory_binders" (Type: varchar)
ALTER TABLE "public"."ewan_nabh_statutory_binders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ewan_nabh_statutory_binders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ewan_nabh_statutory_binders_tenant_isolation" ON "public"."ewan_nabh_statutory_binders";
CREATE POLICY "p_public_ewan_nabh_statutory_binders_tenant_isolation" ON "public"."ewan_nabh_statutory_binders"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."nhcx_claim_transactions" (Type: varchar)
ALTER TABLE "public"."nhcx_claim_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nhcx_claim_transactions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_nhcx_claim_transactions_tenant_isolation" ON "public"."nhcx_claim_transactions";
CREATE POLICY "p_public_nhcx_claim_transactions_tenant_isolation" ON "public"."nhcx_claim_transactions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ot_safety_checklists" (Type: varchar)
ALTER TABLE "public"."ot_safety_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ot_safety_checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ot_safety_checklists_tenant_isolation" ON "public"."ot_safety_checklists";
CREATE POLICY "p_public_ot_safety_checklists_tenant_isolation" ON "public"."ot_safety_checklists"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ot_sponge_needle_counts" (Type: varchar)
ALTER TABLE "public"."ot_sponge_needle_counts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ot_sponge_needle_counts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ot_sponge_needle_counts_tenant_isolation" ON "public"."ot_sponge_needle_counts";
CREATE POLICY "p_public_ot_sponge_needle_counts_tenant_isolation" ON "public"."ot_sponge_needle_counts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."ot_surgical_missions" (Type: varchar)
ALTER TABLE "public"."ot_surgical_missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ot_surgical_missions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_ot_surgical_missions_tenant_isolation" ON "public"."ot_surgical_missions";
CREATE POLICY "p_public_ot_surgical_missions_tenant_isolation" ON "public"."ot_surgical_missions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."pharmacy_pos_inventory_batches" (Type: varchar)
ALTER TABLE "public"."pharmacy_pos_inventory_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pharmacy_pos_inventory_batches" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_pharmacy_pos_inventory_batches_tenant_isolation" ON "public"."pharmacy_pos_inventory_batches";
CREATE POLICY "p_public_pharmacy_pos_inventory_batches_tenant_isolation" ON "public"."pharmacy_pos_inventory_batches"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."pharmacy_pos_transactions" (Type: varchar)
ALTER TABLE "public"."pharmacy_pos_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pharmacy_pos_transactions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_pharmacy_pos_transactions_tenant_isolation" ON "public"."pharmacy_pos_transactions";
CREATE POLICY "p_public_pharmacy_pos_transactions_tenant_isolation" ON "public"."pharmacy_pos_transactions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."pharmacy_schedule_h1_register" (Type: varchar)
ALTER TABLE "public"."pharmacy_schedule_h1_register" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pharmacy_schedule_h1_register" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_pharmacy_schedule_h1_register_tenant_isolation" ON "public"."pharmacy_schedule_h1_register";
CREATE POLICY "p_public_pharmacy_schedule_h1_register_tenant_isolation" ON "public"."pharmacy_schedule_h1_register"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."pmjay_beneficiary_cases" (Type: varchar)
ALTER TABLE "public"."pmjay_beneficiary_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pmjay_beneficiary_cases" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_pmjay_beneficiary_cases_tenant_isolation" ON "public"."pmjay_beneficiary_cases";
CREATE POLICY "p_public_pmjay_beneficiary_cases_tenant_isolation" ON "public"."pmjay_beneficiary_cases"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."pmjay_claims_ledger" (Type: varchar)
ALTER TABLE "public"."pmjay_claims_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pmjay_claims_ledger" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_pmjay_claims_ledger_tenant_isolation" ON "public"."pmjay_claims_ledger";
CREATE POLICY "p_public_pmjay_claims_ledger_tenant_isolation" ON "public"."pmjay_claims_ledger"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."radiology_ai_findings" (Type: varchar)
ALTER TABLE "public"."radiology_ai_findings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."radiology_ai_findings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_radiology_ai_findings_tenant_isolation" ON "public"."radiology_ai_findings";
CREATE POLICY "p_public_radiology_ai_findings_tenant_isolation" ON "public"."radiology_ai_findings"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."smart_ambulance_missions" (Type: varchar)
ALTER TABLE "public"."smart_ambulance_missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."smart_ambulance_missions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_smart_ambulance_missions_tenant_isolation" ON "public"."smart_ambulance_missions";
CREATE POLICY "p_public_smart_ambulance_missions_tenant_isolation" ON "public"."smart_ambulance_missions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."smart_icu_telemetry_logs" (Type: varchar)
ALTER TABLE "public"."smart_icu_telemetry_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."smart_icu_telemetry_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_smart_icu_telemetry_logs_tenant_isolation" ON "public"."smart_icu_telemetry_logs";
CREATE POLICY "p_public_smart_icu_telemetry_logs_tenant_isolation" ON "public"."smart_icu_telemetry_logs"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."transparent_surgery_packages" (Type: varchar)
ALTER TABLE "public"."transparent_surgery_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transparent_surgery_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_transparent_surgery_packages_tenant_isolation" ON "public"."transparent_surgery_packages";
CREATE POLICY "p_public_transparent_surgery_packages_tenant_isolation" ON "public"."transparent_surgery_packages"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()::text
  );

-- Table: "public"."user_workspace_layouts" (Type: uuid)
ALTER TABLE "public"."user_workspace_layouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_workspace_layouts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_user_workspace_layouts_tenant_isolation" ON "public"."user_workspace_layouts";
CREATE POLICY "p_public_user_workspace_layouts_tenant_isolation" ON "public"."user_workspace_layouts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "public"."workflow_instances" (Type: uuid)
ALTER TABLE "public"."workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."workflow_instances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_public_workflow_instances_tenant_isolation" ON "public"."workflow_instances";
CREATE POLICY "p_public_workflow_instances_tenant_isolation" ON "public"."workflow_instances"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR tenant_id = core.get_current_tenant_id()
  );

-- Table: "company"."ai_audit_traces" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."ai_audit_traces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."ai_audit_traces" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_ai_audit_traces_partner_isolation" ON "company"."ai_audit_traces";
CREATE POLICY "p_company_ai_audit_traces_partner_isolation" ON "company"."ai_audit_traces"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."ai_usage_records" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."ai_usage_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."ai_usage_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_ai_usage_records_partner_isolation" ON "company"."ai_usage_records";
CREATE POLICY "p_company_ai_usage_records_partner_isolation" ON "company"."ai_usage_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."baa_records" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."baa_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."baa_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_baa_records_partner_isolation" ON "company"."baa_records";
CREATE POLICY "p_company_baa_records_partner_isolation" ON "company"."baa_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."billing_accounts" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."billing_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."billing_accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_billing_accounts_partner_isolation" ON "company"."billing_accounts";
CREATE POLICY "p_company_billing_accounts_partner_isolation" ON "company"."billing_accounts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."commercial_order_snapshots" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."commercial_order_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."commercial_order_snapshots" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_commercial_order_snapshots_partner_isolation" ON "company"."commercial_order_snapshots";
CREATE POLICY "p_company_commercial_order_snapshots_partner_isolation" ON "company"."commercial_order_snapshots"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."commercial_overrides" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."commercial_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."commercial_overrides" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_commercial_overrides_partner_isolation" ON "company"."commercial_overrides";
CREATE POLICY "p_company_commercial_overrides_partner_isolation" ON "company"."commercial_overrides"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."integration_connections" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."integration_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."integration_connections" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_integration_connections_partner_isolation" ON "company"."integration_connections";
CREATE POLICY "p_company_integration_connections_partner_isolation" ON "company"."integration_connections"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."marketing_activities" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."marketing_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."marketing_activities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_marketing_activities_partner_isolation" ON "company"."marketing_activities";
CREATE POLICY "p_company_marketing_activities_partner_isolation" ON "company"."marketing_activities"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."notification_dispatch_records" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."notification_dispatch_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."notification_dispatch_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_notification_dispatch_records_partner_isolation" ON "company"."notification_dispatch_records";
CREATE POLICY "p_company_notification_dispatch_records_partner_isolation" ON "company"."notification_dispatch_records"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_health_profiles" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."partner_health_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_health_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_health_profiles_partner_isolation" ON "company"."partner_health_profiles";
CREATE POLICY "p_company_partner_health_profiles_partner_isolation" ON "company"."partner_health_profiles"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_lifecycle_transitions" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."partner_lifecycle_transitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_lifecycle_transitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_lifecycle_transitions_partner_isolation" ON "company"."partner_lifecycle_transitions";
CREATE POLICY "p_company_partner_lifecycle_transitions_partner_isolation" ON "company"."partner_lifecycle_transitions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."partner_plan_assignments" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."partner_plan_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."partner_plan_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_partner_plan_assignments_partner_isolation" ON "company"."partner_plan_assignments";
CREATE POLICY "p_company_partner_plan_assignments_partner_isolation" ON "company"."partner_plan_assignments"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."sales_opportunities" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."sales_opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."sales_opportunities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_sales_opportunities_partner_isolation" ON "company"."sales_opportunities";
CREATE POLICY "p_company_sales_opportunities_partner_isolation" ON "company"."sales_opportunities"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."sales_tasks" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."sales_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."sales_tasks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_sales_tasks_partner_isolation" ON "company"."sales_tasks";
CREATE POLICY "p_company_sales_tasks_partner_isolation" ON "company"."sales_tasks"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."subscriptions" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."subscriptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_subscriptions_partner_isolation" ON "company"."subscriptions";
CREATE POLICY "p_company_subscriptions_partner_isolation" ON "company"."subscriptions"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."success_checkins" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."success_checkins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."success_checkins" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_success_checkins_partner_isolation" ON "company"."success_checkins";
CREATE POLICY "p_company_success_checkins_partner_isolation" ON "company"."success_checkins"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

-- Table: "company"."support_tickets" (Partner-scoped, Type: uuid)
ALTER TABLE "company"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company"."support_tickets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_company_support_tickets_partner_isolation" ON "company"."support_tickets";
CREATE POLICY "p_company_support_tickets_partner_isolation" ON "company"."support_tickets"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR partner_id = core.get_current_tenant_id()
  );

COMMIT;
