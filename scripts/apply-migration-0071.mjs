import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function applyMig0071() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const sql = fs.readFileSync(path.resolve('packages/database/migrations/0071_create_least_privilege_app_role.sql'), 'utf-8');
  await client.query(sql);
  console.log('[Mig-0071] ✅ Least-privilege role docsearch_app configured successfully.');

  await client.end();
}

applyMig0071().catch(err => {
  console.error('[Mig-0071] ❌ Error:', err);
  process.exit(1);
});
