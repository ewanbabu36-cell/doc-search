-- ============================================================================
-- 0044_clinical_ai_rls.sql
-- Production Multi-Tenant & Branch Row-Level Security (RLS) Policies
-- for Phase 3.3 Clinical AI Tables and Audit Immutability Protection
-- ============================================================================

-- 1. Ambient AI Scribe Transcripts
ALTER TABLE IF EXISTS clinical.ambient_ai_scribe_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.ambient_ai_scribe_transcripts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_ambient_ai_scribe_transcripts_isolation ON clinical.ambient_ai_scribe_transcripts;
CREATE POLICY p_ambient_ai_scribe_transcripts_isolation ON clinical.ambient_ai_scribe_transcripts
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
-- 2. Sepsis NEWS2 Alerts
ALTER TABLE IF EXISTS clinical.sepsis_news2_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.sepsis_news2_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_sepsis_news2_alerts_isolation ON clinical.sepsis_news2_alerts;
CREATE POLICY p_sepsis_news2_alerts_isolation ON clinical.sepsis_news2_alerts
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
-- 3. DDI Drug Interaction Checks
ALTER TABLE IF EXISTS clinical.ddi_drug_interaction_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.ddi_drug_interaction_checks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_ddi_drug_interaction_checks_isolation ON clinical.ddi_drug_interaction_checks;
CREATE POLICY p_ddi_drug_interaction_checks_isolation ON clinical.ddi_drug_interaction_checks
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
-- 4. Critical Panic Value Alerts
ALTER TABLE IF EXISTS clinical.critical_panic_value_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.critical_panic_value_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_critical_panic_value_alerts_isolation ON clinical.critical_panic_value_alerts;
CREATE POLICY p_critical_panic_value_alerts_isolation ON clinical.critical_panic_value_alerts
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  )
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
-- 5. CDSS Audit Traces (Append-Only & Immutability Trigger)
ALTER TABLE IF EXISTS clinical.cdss_audit_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical.cdss_audit_traces FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_cdss_audit_traces_isolation ON clinical.cdss_audit_traces;
CREATE POLICY p_cdss_audit_traces_isolation ON clinical.cdss_audit_traces
  FOR SELECT
  USING (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
DROP POLICY IF EXISTS p_cdss_audit_traces_insert ON clinical.cdss_audit_traces;
CREATE POLICY p_cdss_audit_traces_insert ON clinical.cdss_audit_traces
  FOR INSERT
  WITH CHECK (
    core.is_super_admin() OR 
    (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL))
  );

--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_cdss_audit_traces_immutability ON clinical.cdss_audit_traces;
CREATE TRIGGER trg_cdss_audit_traces_immutability
BEFORE UPDATE OR DELETE ON clinical.cdss_audit_traces
FOR EACH ROW EXECUTE FUNCTION core.prevent_audit_modification();
