-- ==============================================================================
-- Migration: 0076_rotate_and_harden_rls_context.sql
-- Description: Remediates P0-01 (Rotate RLS HMAC Context Secret outside source)
--              and P1-06 (Credential Hardcoding Clean-up).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create secure administrative rotation function
CREATE OR REPLACE FUNCTION core.rotate_context_secret(p_new_secret text)
RETURNS void AS $$
BEGIN
  IF p_new_secret IS NULL OR length(trim(p_new_secret)) < 32 THEN
    RAISE EXCEPTION 'CRITICAL: Context secret must be a high-entropy string of at least 32 characters.';
  END IF;

  UPDATE core.context_secrets
  SET secret = trim(p_new_secret), updated_at = NOW()
  WHERE id = 1;

  IF NOT FOUND THEN
    INSERT INTO core.context_secrets (id, secret, updated_at)
    VALUES (1, trim(p_new_secret), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Strictly restrict execution to database administrator / postgres superuser
REVOKE ALL ON FUNCTION core.rotate_context_secret(text) FROM PUBLIC, docsearch_app;
GRANT EXECUTE ON FUNCTION core.rotate_context_secret(text) TO postgres;

-- 2. Execute immediate rotation away from any previously committed or public key
DO $$
DECLARE
  v_secret text;
BEGIN
  v_secret := NULLIF(current_setting('app.database_context_secret', true), '');
  IF v_secret IS NOT NULL AND length(v_secret) >= 32 THEN
    PERFORM core.rotate_context_secret(v_secret);
  ELSE
    -- Generate cryptographically unguessable 256-bit random hex secret
    PERFORM core.rotate_context_secret(encode(gen_random_bytes(32), 'hex'));
  END IF;
END $$;

-- 3. Ensure core.context_secrets is strictly inaccessible to docsearch_app
REVOKE ALL ON TABLE core.context_secrets FROM PUBLIC, docsearch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.context_secrets TO postgres;

-- 4. Rotate docsearch_app role credentials if dynamic password provided
DO $$
DECLARE
  v_app_pass text;
BEGIN
  v_app_pass := NULLIF(current_setting('app.docsearch_app_password', true), '');
  IF v_app_pass IS NOT NULL AND length(v_app_pass) >= 16 THEN
    EXECUTE format('ALTER ROLE docsearch_app WITH PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE', v_app_pass);
  END IF;
END $$;
