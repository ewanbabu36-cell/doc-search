import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function queryTenant() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();
  
  const res = await pool.query(
    "SELECT id, name, slug, type, status, metadata FROM core.tenants WHERE name ILIKE '%metropolis%'"
  );
  console.log('Metropolis in core.tenants:', res.rows.length);
  for (const r of res.rows) {
    console.log(r);
  }

  // Also query users for this tenant
  if (res.rows.length > 0) {
    const tenantId = res.rows[0].id;
    const users = await pool.query(
      "SELECT id, tenant_id, email, phone, name FROM core.users WHERE tenant_id = $1",
      [tenantId]
    );
    console.log('Users for Metropolis tenant:', users.rows);
  }

  await pool.end();
}
queryTenant().catch(console.error);
