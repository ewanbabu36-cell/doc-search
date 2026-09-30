import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL.');
  const testConfig = await client.query(`
    SELECT
      set_config('app.current_tenant_id', $1, true) as t,
      set_config('app.current_branch_id', $2, true) as b,
      set_config('app.current_user_id', $3, true) as u,
      set_config('app.is_super_admin', $4, true) as a
  `, ['tenant-123', 'branch-456', 'user-789', 'false']);
  console.log('Single-statement set_config works:', testConfig.rows);

  const tenantId = tenantRes.rows[0]?.tenant_id || '11111111-1111-4111-8111-111111111111';
  console.log('Target Tenant:', tenantId);

  // 1. Patients query
  console.log('\n--- EXPLAIN ANALYZE: Patients (tenant_id + created_at DESC) ---');
  const p1 = await client.query(
    'EXPLAIN ANALYZE SELECT id, tenant_id, created_at FROM clinical.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
    [tenantId]
  );
  console.log(p1.rows.map(r => r['QUERY PLAN']).join('\n'));

  // 2. Encounters query
  console.log('\n--- EXPLAIN ANALYZE: Encounters (tenant_id + created_at DESC) ---');
  const p2 = await client.query(
    'EXPLAIN ANALYZE SELECT id, tenant_id, created_at FROM clinical.encounters WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
    [tenantId]
  );
  console.log(p2.rows.map(r => r['QUERY PLAN']).join('\n'));

  // 3. Lab Orders query
  console.log('\n--- EXPLAIN ANALYZE: Lab Orders (tenant_id + created_at DESC) ---');
  const p3 = await client.query(
    'EXPLAIN ANALYZE SELECT id, tenant_id, created_at FROM clinical.investigation_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
    [tenantId]
  );
  console.log(p3.rows.map(r => r['QUERY PLAN']).join('\n'));

  // 4. Radiology Orders query
  console.log('\n--- EXPLAIN ANALYZE: Radiology Orders (tenant_id + ordered_at DESC) ---');
  const p4 = await client.query(
    'EXPLAIN ANALYZE SELECT id, tenant_id, ordered_at FROM clinical.radiology_orders WHERE tenant_id = $1 ORDER BY ordered_at DESC LIMIT 50',
    [tenantId]
  );
  console.log(p4.rows.map(r => r['QUERY PLAN']).join('\n'));

  // 5. Audit Events query
  console.log('\n--- EXPLAIN ANALYZE: Audit Events (tenant_id + timestamp DESC) ---');
  const p5 = await client.query(
    'EXPLAIN ANALYZE SELECT id, tenant_id, timestamp FROM core.audit_events WHERE tenant_id = $1 ORDER BY timestamp DESC LIMIT 50',
    [tenantId]
  );
  console.log(p5.rows.map(r => r['QUERY PLAN']).join('\n'));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
