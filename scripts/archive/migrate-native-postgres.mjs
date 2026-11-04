import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const migrationsFolder = path.join(rootDir, 'packages/database/migrations');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function runMigration() {
  console.log('[Migrator] Connecting to native PostgreSQL at', connectionString);
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool);

  console.log('[Migrator] Applying migrations from', migrationsFolder);
  try {
    await migrate(db, { migrationsFolder });
    console.log('[Migrator] Migrations applied successfully via Drizzle migrator.');
  } catch (err) {
    console.warn('[Migrator] Drizzle migrator warning/error:', err.message);
  }

  // Count tables created in public schema
  const res = await pool.query(`
    SELECT count(*)::int as table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);

  console.log('[Migrator] Total tables in public schema:', res.rows[0].table_count);

  await pool.end();
}

runMigration().catch((err) => {
  console.error('[Migrator] Fatal:', err);
  process.exit(1);
});
