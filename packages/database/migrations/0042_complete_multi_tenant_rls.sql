-- ============================================================================
-- Wave 1: Production Multi-Tenant & Branch Row-Level Security (RLS) Policies
-- ============================================================================

-- A. Radiology Tables
ALTER TABLE IF EXISTS clinical.radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.radiology_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_radiology_orders_isolation ON clinical.radiology_orders;
CREATE POLICY p_radiology_orders_isolation ON clinical.radiology_orders
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.radiology_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.radiology_studies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_radiology_studies_isolation ON clinical.radiology_studies;
CREATE POLICY p_radiology_studies_isolation ON clinical.radiology_studies
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.radiology_reports FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_radiology_reports_isolation ON clinical.radiology_reports;
CREATE POLICY p_radiology_reports_isolation ON clinical.radiology_reports
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.radiology_critical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.radiology_critical_findings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_radiology_critical_findings_isolation ON clinical.radiology_critical_findings;
CREATE POLICY p_radiology_critical_findings_isolation ON clinical.radiology_critical_findings
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

-- B. Dietary Tables
ALTER TABLE IF EXISTS clinical.dietary_kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.dietary_kitchens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_dietary_kitchens_isolation ON clinical.dietary_kitchens;
CREATE POLICY p_dietary_kitchens_isolation ON clinical.dietary_kitchens
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.dietary_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.dietary_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_dietary_orders_isolation ON clinical.dietary_orders;
CREATE POLICY p_dietary_orders_isolation ON clinical.dietary_orders
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.dietary_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.dietary_assessments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_dietary_assessments_isolation ON clinical.dietary_assessments;
CREATE POLICY p_dietary_assessments_isolation ON clinical.dietary_assessments
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

ALTER TABLE IF EXISTS clinical.dietary_meal_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.dietary_meal_dispatches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_dietary_meal_dispatches_isolation ON clinical.dietary_meal_dispatches;
CREATE POLICY p_dietary_meal_dispatches_isolation ON clinical.dietary_meal_dispatches
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );
