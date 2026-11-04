import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function check() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  const partners = await pool.query(
    "SELECT id, legal_name, trade_name, primary_contact_email, metadata FROM company.partner_profiles"
  );
  console.log('=== partner_profiles count ===', partners.rows.length);
  for (const p of partners.rows) {
    console.log(p.id, p.legal_name, p.primary_contact_email, p.metadata?.credentials);
  }

  const users = await pool.query(
    "SELECT id, email, first_name, last_name, status, updated_at FROM core.users WHERE email = 'labtech@metropolis.com'"
  );
  console.log('=== users ===', users.rows);

  const creds = await pool.query(
    "SELECT id, user_id, updated_at FROM core.user_credentials WHERE user_id = $1",
    [users.rows[0]?.id]
  );
  console.log('=== creds ===', creds.rows);

  await pool.end();
}

check().catch(console.error);
