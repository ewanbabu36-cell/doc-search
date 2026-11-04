import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_patients_tenant_created_at ON clinical.patients (tenant_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_encounters_tenant_created_at ON clinical.encounters (tenant_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_investigation_orders_tenant_created_at ON clinical.investigation_orders (tenant_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_radiology_orders_tenant_ordered_at ON clinical.radiology_orders (tenant_id, ordered_at DESC);'
  ];

  for (const sql of indexes) {
    console.log('Executing:', sql);
    await client.query(sql);
  }
  console.log('Indexes created successfully.');

  // Re-run ANALYZE on these tables so query planner updates statistics
  console.log('Analyzing tables...');
  await client.query('ANALYZE clinical.patients;');
  await client.query('ANALYZE clinical.encounters;');
  await client.query('ANALYZE clinical.investigation_orders;');
  await client.query('ANALYZE clinical.radiology_orders;');
  console.log('ANALYZE complete.');

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
