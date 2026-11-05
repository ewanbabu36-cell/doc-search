import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('[Mig-0070] Reading migration 0070_comprehensive_tenant_rls_hardening.sql...');
  const sql = fs.readFileSync(path.resolve('packages/database/migrations/0070_comprehensive_tenant_rls_hardening.sql'), 'utf-8');

  console.log('[Mig-0070] Executing migration against docsearch database...');
  const startTime = Date.now();
  await client.query(sql);
  const elapsed = Date.now() - startTime;
  console.log(`[Mig-0070] ✅ Migration applied successfully in ${elapsed}ms.`);

  // Verify status in pg_tables
  const res = await client.query(`
    SELECT COUNT(*) as total_secured
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND rowsecurity = true;
  `);

  const polCount = await client.query(`
    SELECT COUNT(*) as total_policies
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
  `);

  console.log(`[Mig-0070] Verification:`);
  console.log(`  - Tables with rowsecurity = true: ${res.rows[0].total_secured}`);
  console.log(`  - Active RLS Policies: ${polCount.rows[0].total_policies}`);

  await client.end();
}

run().catch(err => {
  console.error('[Mig-0070] ❌ Error applying migration:', err);
  process.exit(1);
});
