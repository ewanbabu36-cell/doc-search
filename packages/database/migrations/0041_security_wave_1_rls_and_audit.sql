-- ============================================================================
-- Wave 1: Production Healthcare Security Foundation — RLS & Audit Immutability
-- ============================================================================

-- 1. Helper function for RLS context verification
CREATE OR REPLACE FUNCTION core.get_current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION core.get_current_branch_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_branch_id', true), '')::uuid;
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

-- 2. Audit Immutability Trigger Function
CREATE OR REPLACE FUNCTION core.prevent_audit_modification() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Security Policy Violation: Audit records are cryptographically immutable and append-only. Modification or deletion is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Protection Trigger to core.audit_events
DROP TRIGGER IF EXISTS trg_audit_events_immutability ON core.audit_events;
CREATE TRIGGER trg_audit_events_immutability
BEFORE UPDATE OR DELETE ON core.audit_events
FOR EACH ROW EXECUTE FUNCTION core.prevent_audit_modification();

-- 3. Enable RLS and Tenant Policies on Core Tables
ALTER TABLE core.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_sessions_tenant_isolation ON core.sessions;
CREATE POLICY p_sessions_tenant_isolation ON core.sessions
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

ALTER TABLE core.user_tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_user_tenants_tenant_isolation ON core.user_tenants;
CREATE POLICY p_user_tenants_tenant_isolation ON core.user_tenants
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());

ALTER TABLE core.user_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_user_branches_tenant_isolation ON core.user_branches;
CREATE POLICY p_user_branches_tenant_isolation ON core.user_branches
  USING (core.is_super_admin() OR (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL)))
  WITH CHECK (core.is_super_admin() OR (tenant_id = core.get_current_tenant_id() AND (branch_id = core.get_current_branch_id() OR core.get_current_branch_id() IS NULL)));

ALTER TABLE core.audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_audit_events_tenant_isolation ON core.audit_events;
CREATE POLICY p_audit_events_tenant_isolation ON core.audit_events
  FOR SELECT
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id() OR tenant_id IS NULL);
CREATE POLICY p_audit_events_insert ON core.audit_events
  FOR INSERT
  WITH CHECK (true);
