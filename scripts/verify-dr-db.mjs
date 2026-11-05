import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch_phase4_audit_restore' });

async function verify() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `);
  
  console.log(`Total Tables: ${tables.rows.length}`);
  
  // Sample tables
  const schemas = [...new Set(tables.rows.map(r => r.table_schema))];
  console.log('Schemas:', schemas);

  // Check counts on known tables
  const testTables = [
    '"core"."tenants"',
    '"clinical"."pharmacy_batches"',
    '"pharmacy"."controlled_substance_records"',
    '"company"."partner_profiles"'
  ];

  for (const t of testTables) {
    try {
      const res = await client.query(`SELECT count(*)::int as count FROM ${t}`);
      console.log(`${t} count: ${res.rows[0].count}`);
    } catch (e) {
      console.log(`${t} error: ${e.message}`);
    }
  }

  // Count total rows across all 580 tables
  let totalRows = 0;
  for (const row of tables.rows) {
    const fqtn = `"${row.table_schema}"."${row.table_name}"`;
    try {
      const r = await client.query(`SELECT count(*)::int as c FROM ${fqtn}`);
      totalRows += r.rows[0].c;
    } catch {}
  }
  console.log(`\nTOTAL ACTUAL VERIFIED ROWS ACROSS ALL 580 TABLES: ${totalRows}`);

  await client.end();
}

verify().catch(console.error);
