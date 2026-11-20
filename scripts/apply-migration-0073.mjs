import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function applyMig0073() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const sqlPath = path.resolve('packages/database/migrations/0073_performance_indexes_and_encounter_fix.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  console.log('[Mig-0073] 🚀 Applying migration 0073_performance_indexes_and_encounter_fix.sql...');
  await client.query(sql);
  console.log('[Mig-0073] ✅ Successfully normalized encounter statuses, resolved missing doctors, and added critical performance indexes on foreign keys.');

  await client.end();
}

applyMig0073().catch(err => {
  console.error('[Mig-0073] ❌ Migration failed:', err);
  process.exit(1);
});
