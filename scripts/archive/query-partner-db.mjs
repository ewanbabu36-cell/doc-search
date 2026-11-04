import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function queryDb() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  console.log('--- 1. Querying partner_profiles for metropolis ---');
  const partners = await pool.query(
    "SELECT id, tenant_id, trade_name, legal_name, partner_type, primary_contact_email, metadata FROM partner_profiles WHERE trade_name ILIKE '%metropolis%' OR primary_contact_email ILIKE '%metropolis%'"
  );
  console.log('Found in partner_profiles:', partners.rows.length);
  for (const r of partners.rows) {
    console.log(r);
  }

  console.log('\n--- 2. Querying users for metropolis ---');
  const users = await pool.query(
    "SELECT id, tenant_id, email, phone, name, role FROM users WHERE email ILIKE '%metropolis%'"
  );
  console.log('Found in users:', users.rows.length);
  for (const r of users.rows) {
    console.log(r);
  }

  console.log('\n--- 3. Querying user_credentials for metropolis user IDs ---');
  if (users.rows.length > 0) {
    const creds = await pool.query(
      `SELECT id, user_id, password_hash, status, created_at, updated_at FROM user_credentials WHERE user_id = $1`,
      [users.rows[0].id]
    );
    console.log('Found user_credentials:', creds.rows);
  } else {
    // Check all user_credentials sample
    const allCreds = await pool.query("SELECT COUNT(*) FROM user_credentials");
    console.log('Total user_credentials rows:', allCreds.rows[0].count);
  }

  await pool.end();
}

queryDb().catch(console.error);
