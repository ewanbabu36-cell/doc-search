import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'packages/database/migrations');
const journalPath = path.join(migrationsDir, 'meta/_journal.json');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function main() {
  console.log('[Native-Migrator] Connecting to native PostgreSQL at', connectionString);
  const pool = new pg.Pool({ connectionString });

  // 1. Create required schemas
  console.log('[Native-Migrator] Ensuring namespaces/schemas exist...');
  const schemas = ['core', 'company', 'clinical', 'workflow', 'billing', 'auth', 'public'];
  for (const s of schemas) {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${s}"`);
  }
  console.log('[Native-Migrator] Schemas verified.');

  // 2. Read journal and apply migrations
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  console.log(`[Native-Migrator] Found ${journal.entries.length} migration journal entries.`);

  let statementCount = 0;
  let successCount = 0;
  let skipCount = 0;

  for (const entry of journal.entries) {
    const file = path.join(migrationsDir, `${entry.tag}.sql`);
    if (!fs.existsSync(file)) {
      console.warn(`[Native-Migrator] Missing file: ${entry.tag}.sql`);
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    const statements = content.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      statementCount++;
      try {
        await pool.query(stmt);
        successCount++;
      } catch (err) {
        // If table or constraint already exists, that's fine (idempotent replay)
        if (err.code === '42P07' || err.code === '42710' || err.code === '42701') {
          skipCount++;
        } else {
          // Log other errors as warning but continue
          console.warn(`[Native-Migrator] Warning on [${entry.tag}] ${err.code}: ${err.message.slice(0, 100)}`);
          skipCount++;
        }
      }
    }
  }

  console.log(`[Native-Migrator] Applied ${successCount} statements (${skipCount} skipped/idempotent, total ${statementCount}).`);

  // 3. Count total tables across all schemas
  const tableCountRes = await pool.query(`
    SELECT count(*)::int as total_tables
    FROM information_schema.tables
    WHERE table_schema IN ('core', 'company', 'clinical', 'workflow', 'billing', 'auth', 'public')
      AND table_type = 'BASE TABLE'
  `);

  console.log('\n============================================================');
  console.log('🏛️ NATIVE POSTGRESQL TABLE STATS');
  console.log('============================================================');
  console.log('TOTAL TABLES IN NATIVE POSTGRESQL:', tableCountRes.rows[0].total_tables);
  console.log('============================================================\n');

  await pool.end();
}

main().catch((err) => {
  console.error('[Native-Migrator] Fatal error:', err);
  process.exit(1);
});
