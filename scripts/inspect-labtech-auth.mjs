import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function inspect() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  const users = await pool.query("SELECT * FROM core.users WHERE email = 'labtech@metropolis.com'");
  console.log('=== core.users ===');
  console.log(users.rows);

  const creds = await pool.query(
    "SELECT * FROM core.user_credentials WHERE user_id = $1",
    [users.rows[0]?.id || '00000000-0000-0000-0000-000000000000']
  );
  console.log('=== core.user_credentials ===');
  console.log(creds.rows);

  const partnerProfiles = await pool.query(
    "SELECT id, legal_name, trade_name, primary_contact_email, metadata FROM company.partner_profiles WHERE primary_contact_email = 'labtech@metropolis.com' OR legal_name ILIKE '%metropolis%'"
  );
  console.log('=== company.partner_profiles ===');
  console.log(partnerProfiles.rows);

  const staff = await pool.query(
    "SELECT * FROM company.operational_staff WHERE work_email = 'labtech@metropolis.com'"
  );
  console.log('=== company.operational_staff ===');
  console.log(staff.rows);

  const tenants = await pool.query(
    "SELECT * FROM core.tenants WHERE email = 'labtech@metropolis.com' OR name ILIKE '%metropolis%'"
  );
  console.log('=== core.tenants ===');
  console.log(tenants.rows);

  await pool.end();
}

inspect().catch(console.error);
