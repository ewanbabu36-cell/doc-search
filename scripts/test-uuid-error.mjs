import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function testUuidError() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  try {
    console.log('Testing query with empty string for UUID column:');
    await pool.query(
      "SELECT * FROM company.partner_profiles WHERE primary_contact_email = 'labtech@metropolis.com' OR id = '' LIMIT 1"
    );
  } catch (err) {
    console.log('\n================ EXACT MATCH ================');
    console.log('PostgreSQL Error Code:', err.code);
    console.log('PostgreSQL Error Message:', err.message);
    console.log('=============================================\n');
  }

  await pool.end();
}

testUuidError().catch(console.error);
