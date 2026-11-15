import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const res = await client.query(`
  SELECT table_schema, table_name, column_name 
  FROM information_schema.columns 
  WHERE column_name IN ('tenant_id', 'tenantId') 
    AND table_schema NOT IN ('information_schema', 'pg_catalog')
  ORDER BY table_schema, table_name;
`);

const allTenants = {};

for (const r of res.rows) {
  try {
    const tRes = await client.query(`
      SELECT "${r.column_name}" as tid, count(*) as c 
      FROM "${r.table_schema}"."${r.table_name}" 
      GROUP BY "${r.column_name}"
    `);
    for (const row of tRes.rows) {
      if (!row.tid) continue;
      allTenants[row.tid] = (allTenants[row.tid] || 0) + parseInt(row.c, 10);
    }
  } catch {}
}

console.log('=== DISTINCT TENANT IDS ACROSS ENTIRE DATABASE ===');
for (const [tid, totalRows] of Object.entries(allTenants)) {
  console.log(`Tenant: ${tid} -> ${totalRows} total rows`);
}
await client.end();
