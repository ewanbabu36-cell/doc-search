-- ============================================================================
-- Wave 2: Engine-Level Row-Level Security (RLS) & Zero-Trust Tenant Isolation
-- ============================================================================

-- Helper macro function to ensure app.current_tenant_id is safely read
CREATE OR REPLACE FUNCTION core.get_current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION core.is_super_admin() RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Clinical Patients
ALTER TABLE IF EXISTS clinical.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.patients FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_patients_tenant_isolation ON clinical.patients;
CREATE POLICY p_patients_tenant_isolation ON clinical.patients
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 2. Clinical Encounters
ALTER TABLE IF EXISTS clinical.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.encounters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_encounters_tenant_isolation ON clinical.encounters;
CREATE POLICY p_encounters_tenant_isolation ON clinical.encounters
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 3. Clinical Prescriptions
ALTER TABLE IF EXISTS clinical.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.prescriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_prescriptions_tenant_isolation ON clinical.prescriptions;
CREATE POLICY p_prescriptions_tenant_isolation ON clinical.prescriptions
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 4. Clinical Investigation Orders
ALTER TABLE IF EXISTS clinical.investigation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.investigation_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_investigation_orders_tenant_isolation ON clinical.investigation_orders;
CREATE POLICY p_investigation_orders_tenant_isolation ON clinical.investigation_orders
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 5. Pharmacy Dispensations
ALTER TABLE IF EXISTS clinical.pharmacy_dispensations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.pharmacy_dispensations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_pharmacy_dispensations_tenant_isolation ON clinical.pharmacy_dispensations;
CREATE POLICY p_pharmacy_dispensations_tenant_isolation ON clinical.pharmacy_dispensations
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 6. Inpatient Admissions
ALTER TABLE IF EXISTS clinical.inpatient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.inpatient_admissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_inpatient_admissions_tenant_isolation ON clinical.inpatient_admissions;
CREATE POLICY p_inpatient_admissions_tenant_isolation ON clinical.inpatient_admissions
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 7. Billing Invoices
ALTER TABLE IF EXISTS clinical.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.billing_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_billing_invoices_tenant_isolation ON clinical.billing_invoices;
CREATE POLICY p_billing_invoices_tenant_isolation ON clinical.billing_invoices
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 8. Emergency Encounters
ALTER TABLE IF EXISTS clinical.emergency_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.emergency_encounters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_emergency_encounters_tenant_isolation ON clinical.emergency_encounters;
CREATE POLICY p_emergency_encounters_tenant_isolation ON clinical.emergency_encounters
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

-- 9. Insurance & TPA Claims
ALTER TABLE IF EXISTS clinical.tpa_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.tpa_claims FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_tpa_claims_tenant_isolation ON clinical.tpa_claims;
CREATE POLICY p_tpa_claims_tenant_isolation ON clinical.tpa_claims
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());
