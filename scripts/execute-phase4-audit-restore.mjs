import { runRestore } from './dr-restore-engine.mjs';
import pg from 'pg';

const AUDIT_DB = 'docsearch_phase4_audit_restore';
const VAULT_FILE = 'backups/encrypted_vault/backup_2026-11-05T10-54-23-671Z.enc.json';

async function main() {
  console.log(`Starting Phase 4 Independent DR Audit Restore into "${AUDIT_DB}"...`);
  const startTime = Date.now();
  const restoreMeta = await runRestore(AUDIT_DB, VAULT_FILE);
  const elapsed = (Date.now() - startTime) / 1000;
  
  console.log('\n✅ Restore Engine Result:');
  console.log(restoreMeta);
  console.log(`Measured RTO: ${elapsed.toFixed(2)} seconds`);

  // Direct PostgreSQL relational and table verification
  const client = new pg.Client({
    connectionString: `postgresql://postgres:password@127.0.0.1:5432/${AUDIT_DB}`
  });
  await client.connect();

  const schemasRes = await client.query(`
    SELECT table_schema, count(*) as tables
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    GROUP BY table_schema
    ORDER BY table_schema
  `);
  console.log('\n--- Restored Schemas & Table Counts ---');
  console.table(schemasRes.rows);

  const checks = [
    { table: 'core.tenants', expected: 97 },
    { table: 'clinical.pharmacy_batches', expected: 22 },
    { table: 'pharmacy.controlled_substance_records', expected: 6 },
    { table: 'company.partner_profiles', expected: 46 }
  ];

  console.log('\n--- Critical Entity Count Assertions ---');
  for (const c of checks) {
    const res = await client.query(`SELECT count(*)::int as cnt FROM ${c.table}`);
    const actual = res.rows[0].cnt;
    const pass = actual === c.expected;
    console.log(`${c.table}: Actual=${actual}, Expected=${c.expected} => ${pass ? 'PASS' : 'FAIL'}`);
  }

  // Count total rows across all user tables
  const userTables = await client.query(`
    SELECT table_schema || '.' || table_name as fqtn
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
  `);

  let totalActualRows = 0;
  for (const t of userTables.rows) {
    try {
      const cnt = await client.query(`SELECT count(*)::int as c FROM ${t.fqtn}`);
      totalActualRows += cnt.rows[0].c;
    } catch (e) {
      // ignore view / permission
    }
  }
  console.log(`\nTotal Actual Live Rows Restored: ${totalActualRows}`);

  await client.end();
}

main().catch(console.error);
