import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  const staffRes = await pool.query('SELECT * FROM clinical.operational_staff WHERE id = $1', ['dcce4591-eda7-475e-b927-e8303ff6b9d7']);
  console.log('=== NATIVE POSTGRESQL STAFF ROW (clinical.operational_staff) ===');
  console.log(staffRes.rows);

  const auditRes = await pool.query('SELECT * FROM core.audit_events ORDER BY timestamp DESC LIMIT 5');
  console.log('=== NATIVE POSTGRESQL RECENT AUDIT EVENTS (core.audit_events) ===');
  console.log(auditRes.rows);

  await pool.end();
}

main().catch(console.error);
