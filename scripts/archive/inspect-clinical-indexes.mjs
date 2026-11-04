import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  console.log('--- Patients Query Plan ---');
  const pRes = await pool.query(`
    EXPLAIN ANALYZE 
    SELECT id, first_name, last_name, uhid 
    FROM clinical.patients 
    WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
    ORDER BY created_at DESC 
    LIMIT 50;
  `);
  console.log(pRes.rows.map(r => r['QUERY PLAN']).join('\n'));

  console.log('\n--- Encounters Query Plan ---');
  const eRes = await pool.query(`
    EXPLAIN ANALYZE 
    SELECT id, patient_id, status 
    FROM clinical.encounters 
    WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
    ORDER BY created_at DESC 
    LIMIT 50;
  `);
  console.log(eRes.rows.map(r => r['QUERY PLAN']).join('\n'));

  await pool.end();
}

run().catch(console.error);
