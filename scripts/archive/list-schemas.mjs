import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function listSchemas() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();
  
  const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata");
  console.log('All schemas in docsearch DB:', schemas.rows.map(r => r.schema_name));

  const allTables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY table_schema, table_name");
  console.log('Total non-system tables:', allTables.rows.length);

  // Group by schema
  const grouped = {};
  for (const r of allTables.rows) {
    grouped[r.table_schema] = (grouped[r.table_schema] || 0) + 1;
  }
  console.log('Tables grouped by schema:', grouped);

  // Search for partner in all schemas
  const partnerTables = allTables.rows.filter(r => r.table_name.toLowerCase().includes('partner'));
  console.log('Partner tables found:', partnerTables);

  await pool.end();
}
listSchemas().catch(console.error);
