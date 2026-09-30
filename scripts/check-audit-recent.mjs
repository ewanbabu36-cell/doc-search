import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function checkAudit() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  const events = await pool.query(
    "SELECT id, event_type, created_at, metadata FROM core.audit_events ORDER BY created_at DESC LIMIT 10"
  );
  console.log('=== Recent audit events ===');
  console.log(JSON.stringify(events.rows, null, 2));

  const partners = await pool.query(
    "SELECT id, legal_name, primary_contact_email, metadata FROM company.partner_profiles"
  );
  console.log('=== partner_profiles ===');
  console.log(JSON.stringify(partners.rows, null, 2));

  await pool.end();
}

checkAudit().catch(console.error);
