import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function listTables() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%partner%'");
  console.log('Tables matching partner:', res.rows.map(r => r.table_name));

  const profileTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%profile%'");
  console.log('Tables matching profile:', profileTables.rows.map(r => r.table_name));

  const allTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Total public tables:', allTables.rows.length);
  console.log('First 50 tables:', allTables.rows.slice(0, 50).map(r => r.table_name));

  await pool.end();
}
listTables().catch(console.error);
