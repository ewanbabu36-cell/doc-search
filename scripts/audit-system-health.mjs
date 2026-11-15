import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function audit() {
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `);
  
  const zeroRows = [];
  const populated = [];

  for (const row of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${row.table_schema}"."${row.table_name}"`);
      const count = parseInt(countRes.rows[0].count, 10);
      if (count === 0) {
        zeroRows.push(`${row.table_schema}.${row.table_name}`);
      } else {
        populated.push({ table: `${row.table_schema}.${row.table_name}`, count });
      }
    } catch (e) {
      // table might be a view or restricted
    }
  }

  console.log('=== POPULATED TABLES (' + populated.length + ') ===');
  for (const p of populated) {
    console.log(`  ${p.table.padEnd(45)}: ${p.count} rows`);
  }

  console.log('\n=== ZERO ROW TABLES (' + zeroRows.length + ') ===');
  for (let i = 0; i < zeroRows.length; i += 3) {
    console.log('  ' + zeroRows.slice(i, i + 3).join(', '));
  }

  await client.end();
}

audit().catch(console.error);
