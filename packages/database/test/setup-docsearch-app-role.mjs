import pg from 'pg';

async function main() {
  const rootClient = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  try {
    await rootClient.connect();
    console.log('Connected to PostgreSQL as postgres superuser');
    const res = await rootClient.query(`
      SELECT rolname, rolsuper, rolbypassrls, rolcanlogin 
      FROM pg_roles 
      WHERE rolname IN ('postgres', 'docsearch_app')
    `);
    console.log('Roles:', res.rows);

    await rootClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'docsearch_app') THEN
          CREATE ROLE docsearch_app WITH LOGIN PASSWORD 'docsearch_app_secure_pass' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        ELSE
          ALTER ROLE docsearch_app WITH LOGIN PASSWORD 'docsearch_app_secure_pass' NOSUPERUSER NOBYPASSRLS;
        END IF;
      END
      $$;
    `);
    console.log('Role docsearch_app configured with NOSUPERUSER, NOBYPASSRLS.');

    const schemas = ['public', 'clinical', 'billing', 'inventory', 'company', 'core', 'audit', 'pharmacy', 'drizzle'];
    for (const schema of schemas) {
      await rootClient.query(`GRANT USAGE ON SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      await rootClient.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      await rootClient.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO docsearch_app;`).catch(() => {});
      await rootClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL PRIVILEGES ON TABLES TO docsearch_app;`).catch(() => {});
      await rootClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL PRIVILEGES ON SEQUENCES TO docsearch_app;`).catch(() => {});
    }
    console.log('Privileges granted to docsearch_app across all schemas.');
    await rootClient.end();

    const appClient = new pg.Client({ connectionString: 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch' });
    await appClient.connect();
    const whoami = await appClient.query('SELECT current_user, session_user, current_setting(\'is_superuser\') as is_super');
    console.log('Verified connection as docsearch_app:', whoami.rows[0]);
    await appClient.end();
  } catch (err) {
    console.error('Error in setup-docsearch-app-role:', err);
    process.exit(1);
  }
}

main();
