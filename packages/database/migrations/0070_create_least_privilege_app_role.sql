-- ==============================================================================
-- Migration: 0071_create_least_privilege_app_role.sql
-- Description: Creates the non-superuser, least-privilege application database role
--              `docsearch_app` with NOBYPASSRLS to enforce Row-Level Security (RLS)
--              in production application contexts.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'docsearch_app') THEN
    CREATE ROLE docsearch_app WITH LOGIN PASSWORD 'docsearch_app_secure_pass' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE docsearch_app WITH NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

-- Grant USAGE on all application schemas
GRANT USAGE ON SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;

-- Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, core, clinical, company, pharmacy TO docsearch_app;

-- Ensure future tables inherit privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO docsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT ALL ON TABLES TO docsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA clinical GRANT ALL ON TABLES TO docsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA company GRANT ALL ON TABLES TO docsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA pharmacy GRANT ALL ON TABLES TO docsearch_app;
