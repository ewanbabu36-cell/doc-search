import pg from 'pg';
import fs from 'fs';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
    ORDER BY table_schema, table_name;
  `);

  console.log(`Total database tables: ${res.rows.length}`);
  const zeroRowTables = [];
  const populatedTables = [];
  const canonicalTenant = '11111111-1111-4111-8111-111111111111';

  for (const r of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${r.table_schema}"."${r.table_name}"`);
      const cnt = Number(countRes.rows[0].count);
      
      let canonicalCount = null;
      // Check if table has tenant_id
      const colRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2 AND column_name = 'tenant_id'
      `, [r.table_schema, r.table_name]);

      if (colRes.rows.length > 0) {
        const canRes = await client.query(`SELECT count(*) FROM "${r.table_schema}"."${r.table_name}" WHERE tenant_id = $1`, [canonicalTenant]);
        canonicalCount = Number(canRes.rows[0].count);
      }

      if (cnt === 0) {
        zeroRowTables.push(`${r.table_schema}.${r.table_name}`);
      } else {
        populatedTables.push({
          table: `${r.table_schema}.${r.table_name}`,
          total: cnt,
          canonical: canonicalCount
        });
      }
    } catch (e) {
      console.log(`Error querying ${r.table_schema}.${r.table_name}: ${e.message}`);
    }
  }

  console.log(`\n=== 0-ROW TABLES (${zeroRowTables.length}) ===`);
  console.log(JSON.stringify(zeroRowTables, null, 2));

  console.log(`\n=== POPULATED TABLES (${populatedTables.length}) ===`);
  const tablesWithZeroCanonical = populatedTables.filter(t => t.canonical === 0);
  console.log(`Tables with data but 0 canonical rows (${tablesWithZeroCanonical.length}):`);
  console.log(JSON.stringify(tablesWithZeroCanonical, null, 2));

  await client.end();
}

main().catch(console.error);
