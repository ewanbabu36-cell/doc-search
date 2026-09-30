import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function queryMetropolis() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();
  
  const res = await pool.query(
    "SELECT id, tenant_id, trade_name, legal_name, partner_type, primary_contact_email, metadata FROM company.partner_profiles WHERE trade_name ILIKE '%metropolis%' OR primary_contact_email ILIKE '%metropolis%'"
  );
  console.log('Metropolis in company.partner_profiles:', res.rows.length);
  for (const r of res.rows) {
    console.log(r);
  }

  // Also query users in core schema or auth schema
  const users = await pool.query(
    "SELECT id, email, role FROM core.users WHERE email ILIKE '%metropolis%'"
  );
  console.log('Metropolis in core.users:', users.rows);

  await pool.end();
}
queryMetropolis().catch(console.error);
