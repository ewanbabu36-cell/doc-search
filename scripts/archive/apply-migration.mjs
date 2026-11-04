import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const migPath = process.argv[2];

if (!migPath) {
  console.error('Usage: node scripts/apply-migration.mjs <MIGRATION_SQL_FILE>');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL });
try {
  await client.connect();
  const sql = fs.readFileSync(migPath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Applying migration ${path.basename(migPath)} (${statements.length} statements)...`);
  await client.query('BEGIN');
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    await client.query(stmt);
  }
  await client.query('COMMIT');
  console.log(`[✔] Successfully applied ${path.basename(migPath)}`);
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[-] Failed to apply migration:', err);
  process.exit(1);
} finally {
  await client.end();
}
