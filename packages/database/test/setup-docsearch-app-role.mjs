import pg from 'pg';

const ADMIN_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const APP_PASSWORD = process.env.DOCSEARCH_APP_PASSWORD || process.env.TEST_APP_PASSWORD || 'docsearch_app_secure_pass';

// Guard: Must only run against isolated local loopback databases
if (!ADMIN_DB_URL.includes('127.0.0.1') && !ADMIN_DB_URL.includes('localhost')) {
  console.error(`FATAL (SEC-002 Guard): setup-docsearch-app-role.mjs can only execute on isolated local test databases (127.0.0.1 / localhost). Refusing execution on: ${ADMIN_DB_URL}`);
  process.exit(1);
}

async function main() {
  const rootClient = new pg.Client({ connectionString: ADMIN_DB_URL });
  try {
    await rootClient.connect();
    console.log('[SECURITY SETUP] Connected as administrator to configure least-privilege docsearch_app role');

    // 1. Create or alter docsearch_app with strict non-superuser, non-bypassrls attributes
    await rootClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'docsearch_app') THEN
          CREATE ROLE docsearch_app WITH LOGIN PASSWORD '${APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        ELSE
          ALTER ROLE docsearch_app WITH LOGIN PASSWORD '${APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS;
        END IF;
      END
      $$;
    `);

    // 2. Grant USAGE on application schemas
    const schemas = ['public', 'clinical', 'billing', 'inventory', 'company', 'core', 'audit', 'pharmacy', 'drizzle'];
    for (const schema of schemas) {
      await rootClient.query(`GRANT USAGE ON SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      // P0-03 Remediation: NEVER grant ALL PRIVILEGES. Grant explicit operational DML only.
      await rootClient.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      await rootClient.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      await rootClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO docsearch_app;`).catch(() => {});
      await rootClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT USAGE, SELECT ON SEQUENCES TO docsearch_app;`).catch(() => {});
    }

    // 3. SEC-001 & SEC-002: Strictly revoke access to cryptographic context secret vault
    await rootClient.query(`REVOKE ALL ON TABLE core.context_secrets FROM PUBLIC, docsearch_app;`).catch(() => {});
    await rootClient.query(`REVOKE ALL ON FUNCTION core.rotate_context_secret(text) FROM PUBLIC, docsearch_app;`).catch(() => {});

    // 4. SEC-003: Strictly revoke TRUNCATE, DELETE, UPDATE on audit immutability logs
    await rootClient.query(`REVOKE TRUNCATE, DELETE, UPDATE ON TABLE core.audit_events FROM PUBLIC, docsearch_app;`).catch(() => {});

    // 5. Post-privilege audit verification
    const roleCheck = await rootClient.query(`
      SELECT rolname, rolsuper, rolbypassrls, rolcanlogin 
      FROM pg_roles 
      WHERE rolname = 'docsearch_app'
    `);
    const role = roleCheck.rows[0];
    if (!role || role.rolsuper || role.rolbypassrls) {
      throw new Error(`CRITICAL: Role docsearch_app failed least-privilege verification! rolsuper=${role?.rolsuper}, rolbypassrls=${role?.rolbypassrls}`);
    }

    const secretPermCheck = await rootClient.query(`
      SELECT has_table_privilege('docsearch_app', 'core.context_secrets', 'select') as can_select,
             has_table_privilege('docsearch_app', 'core.audit_events', 'truncate') as can_truncate;
    `);
    const { can_select, can_truncate } = secretPermCheck.rows[0];
    if (can_select) {
      throw new Error('CRITICAL: docsearch_app must NOT have SELECT on core.context_secrets!');
    }
    if (can_truncate) {
      throw new Error('CRITICAL: docsearch_app must NOT have TRUNCATE on core.audit_events!');
    }

    console.log('[SECURITY VERIFIED] docsearch_app configured with least privilege:');
    console.log(` - rolsuper: ${role.rolsuper}`);
    console.log(` - rolbypassrls: ${role.rolbypassrls}`);
    console.log(` - core.context_secrets read access: ${can_select} (DENIED)`);
    console.log(` - core.audit_events truncate access: ${can_truncate} (DENIED)`);

    await rootClient.end();
  } catch (err) {
    console.error('Error in setup-docsearch-app-role:', err);
    process.exit(1);
  }
}

main();
