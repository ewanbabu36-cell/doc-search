import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function applyMig0072() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const sqlPath = path.resolve('packages/database/migrations/0072_fix_missing_patient_fks.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  console.log('[Mig-0072] 🚀 Applying migration 0072_fix_missing_patient_fks.sql...');
  await client.query(sql);
  console.log('[Mig-0072] ✅ Successfully cleaned orphaned records and applied FK constraints on radiology_orders, emergency_encounters, and inpatient_admissions.');

  await client.end();
}

applyMig0072().catch(err => {
  console.error('[Mig-0072] ❌ Migration failed:', err);
  process.exit(1);
});
