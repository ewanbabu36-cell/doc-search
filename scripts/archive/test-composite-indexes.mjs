import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  const tablesRes = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('clinical', 'company', 'core') 
      AND (table_name LIKE '%lab%' OR table_name LIKE '%order%' OR table_name LIKE '%patient%' OR table_name LIKE '%encounter%')
    ORDER BY table_schema, table_name;
  `);
  console.log('Discovered tables:');
  tablesRes.rows.forEach(r => console.log(` - ${r.table_schema}.${r.table_name}`));

  console.log('\nAdding composite indexes on verified tables...');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_patients_tenant_created_at ON clinical.patients (tenant_id, created_at DESC);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_encounters_tenant_created_at ON clinical.encounters (tenant_id, created_at DESC);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_radiology_orders_tenant_created_at ON clinical.radiology_orders (tenant_id, created_at DESC);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_timestamp ON core.audit_events (tenant_id, timestamp DESC);');
  console.log('Indexes created successfully.');

  console.log('\n--- Patients Query Plan AFTER Index ---');
  const pRes = await pool.query(`
    EXPLAIN ANALYZE 
    SELECT id, first_name, last_name, uhid 
    FROM clinical.patients 
    WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
    ORDER BY created_at DESC 
    LIMIT 50;
  `);
  console.log(pRes.rows.map(r => r['QUERY PLAN']).join('\n'));

  console.log('\n--- Encounters Query Plan AFTER Index ---');
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
