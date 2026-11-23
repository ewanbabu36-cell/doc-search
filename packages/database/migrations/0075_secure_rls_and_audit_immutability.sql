-- ==============================================================================
-- Migration: 0075_secure_rls_and_audit_immutability.sql
-- Description: Remediates SEC-001 (RLS Context Spoofing), SEC-002 (Least Privilege
--              App Role Grants), and SEC-003 (Audit TRUNCATE Bypass Protection).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. SEC-001: Cryptographic Context Vault & Unforgeable RLS Assertions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS core.context_secrets (
  id integer PRIMARY KEY DEFAULT 1,
  secret text NOT NULL,
  updated_at timestamptz DEFAULT NOW()
);

-- Seed internal signing secret (isolated from runtime app role)
INSERT INTO core.context_secrets (id, secret, updated_at)
VALUES (1, 'docsearch_master_hmac_rls_signing_key_2026_unforgeable', NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Secure context setting function (SECURITY DEFINER - runs with postgres privileges)
CREATE OR REPLACE FUNCTION core.verify_and_set_context(
  p_tenant_id text,
  p_branch_id text,
  p_is_super_admin boolean,
  p_signature text
) RETURNS boolean AS $$
DECLARE
  v_secret text;
  v_expected_sig text;
  v_payload text;
BEGIN
  SELECT secret INTO v_secret FROM core.context_secrets WHERE id = 1;
  IF v_secret IS NULL THEN
    RETURN false;
  END IF;

  v_payload := COALESCE(p_tenant_id, '') || ':' || COALESCE(p_branch_id, '') || ':' || (CASE WHEN p_is_super_admin THEN 'true' ELSE 'false' END);
  v_expected_sig := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');

  IF p_signature = v_expected_sig THEN
    PERFORM set_config('app.current_tenant_id', COALESCE(p_tenant_id, ''), true);
    PERFORM set_config('app.current_branch_id', COALESCE(p_branch_id, ''), true);
    PERFORM set_config('app.is_super_admin', CASE WHEN p_is_super_admin THEN 'true' ELSE 'false' END, true);
    PERFORM set_config('app.context_signature', p_signature, true);
    PERFORM set_config('app.context_verified', 'true', true);
    RETURN true;
  ELSE
    PERFORM set_config('app.current_tenant_id', '', true);
    PERFORM set_config('app.current_branch_id', '', true);
    PERFORM set_config('app.is_super_admin', 'false', true);
    PERFORM set_config('app.context_signature', '', true);
    PERFORM set_config('app.context_verified', 'false', true);
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION core.verify_and_set_context(text, text, boolean, text) TO docsearch_app;

-- Hardened super-admin check: Rejects caller-settable GUCs without verified cryptographic HMAC
CREATE OR REPLACE FUNCTION core.is_super_admin() RETURNS boolean AS $$
DECLARE
  v_secret text;
  v_expected_sig text;
  v_payload text;
  v_sig text;
BEGIN
  -- Genuine superuser connection (session_user, not current_user of SECURITY DEFINER)
  IF session_user IN ('postgres', 'cloudsqlsuperuser', 'rds_superuser') THEN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', true);
  END IF;

  IF COALESCE(current_setting('app.context_verified', true), 'false') <> 'true' THEN
    RETURN false;
  END IF;

  IF COALESCE(current_setting('app.is_super_admin', true), 'false') <> 'true' THEN
    RETURN false;
  END IF;

  -- Re-verify cryptographic signature against secure vault
  SELECT secret INTO v_secret FROM core.context_secrets WHERE id = 1;
  IF v_secret IS NULL THEN
    RETURN false;
  END IF;

  v_payload := COALESCE(current_setting('app.current_tenant_id', true), '') || ':' ||
               COALESCE(current_setting('app.current_branch_id', true), '') || ':true';
  v_sig := current_setting('app.context_signature', true);
  v_expected_sig := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');

  RETURN (v_sig = v_expected_sig);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Hardened tenant context retrieval: Rejects spoofed tenant GUCs without verified HMAC
CREATE OR REPLACE FUNCTION core.get_current_tenant_id() RETURNS uuid AS $$
DECLARE
  v_secret text;
  v_expected_sig text;
  v_payload text;
  v_sig text;
  v_tenant_str text;
  v_is_super boolean;
BEGIN
  -- Genuine superuser connection (session_user)
  IF session_user IN ('postgres', 'cloudsqlsuperuser', 'rds_superuser') THEN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
  END IF;

  IF COALESCE(current_setting('app.context_verified', true), 'false') <> 'true' THEN
    RETURN NULL;
  END IF;

  v_tenant_str := current_setting('app.current_tenant_id', true);
  IF v_tenant_str IS NULL OR v_tenant_str = '' THEN
    RETURN NULL;
  END IF;

  SELECT secret INTO v_secret FROM core.context_secrets WHERE id = 1;
  IF v_secret IS NULL THEN
    RETURN NULL;
  END IF;

  v_is_super := (current_setting('app.is_super_admin', true) = 'true');
  v_payload := v_tenant_str || ':' ||
               COALESCE(current_setting('app.current_branch_id', true), '') || ':' ||
               (CASE WHEN v_is_super THEN 'true' ELSE 'false' END);
  v_sig := current_setting('app.context_signature', true);
  v_expected_sig := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');

  IF v_sig = v_expected_sig THEN
    RETURN v_tenant_str::uuid;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. SEC-002: Explicit Least-Privilege Role Grants (No TRUNCATE, No Admin)
-- ==============================================================================

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public, core, clinical, company, pharmacy FROM docsearch_app;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public, core, clinical, company, pharmacy FROM docsearch_app;
REVOKE CREATE ON SCHEMA public, core, clinical, company, pharmacy FROM docsearch_app;

GRANT USAGE ON SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public, core, clinical, company, pharmacy REVOKE ALL ON TABLES FROM docsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public, core, clinical, company, pharmacy GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO docsearch_app;

-- Explicitly revoke access to secret vault from docsearch_app AFTER broad table grants
REVOKE ALL ON core.context_secrets FROM PUBLIC;
REVOKE ALL ON core.context_secrets FROM docsearch_app;

-- ==============================================================================
-- 3. SEC-003: Immutable Audit Protection Against TRUNCATE
-- ==============================================================================

-- Explicitly revoke TRUNCATE, UPDATE, DELETE from runtime application role on audit log
REVOKE TRUNCATE, UPDATE, DELETE ON core.audit_events FROM docsearch_app;

-- Statement-level TRUNCATE protection trigger function
CREATE OR REPLACE FUNCTION core.prevent_audit_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Security Policy Violation: TRUNCATE is strictly prohibited on immutable audit tables (P0001).'
    USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_events_truncate ON core.audit_events;
CREATE TRIGGER trg_audit_events_truncate
BEFORE TRUNCATE ON core.audit_events
FOR EACH STATEMENT EXECUTE FUNCTION core.prevent_audit_truncate();
