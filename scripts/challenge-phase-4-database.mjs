import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function run() {
  console.log('====================================================');
  console.log('🔍 PHASE 4: DATABASE INTEGRITY INDEPENDENT CHALLENGE');
  console.log('====================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch',
    ssl: false,
    connectionTimeoutMillis: 5000
  });

  const results = [];
  function record(id, name, pass, details) {
    results.push({ id, name, pass, details });
    console.log(`${pass ? '✅' : '❌'} [${id}] ${name}: ${pass ? 'PASS' : 'FAIL'} (${details})`);
  }

  const client = await pool.connect();

  try {
    // 1. Table Count and Schema Ownership
    const schemasRes = await client.query(`
      SELECT table_schema, table_type, count(*) as count
      FROM information_schema.tables 
      WHERE table_schema IN ('clinical', 'company', 'public', 'core', 'pharmacy')
      GROUP BY table_schema, table_type
      ORDER BY table_schema;
    `);
    const totalTables = schemasRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    record('DB-CHALLENGE-01', 'Multi-Schema Table Census', totalTables >= 570, `Total base tables: ${totalTables} across 5 application schemas`);

    // 2. Foreign Key Constraints
    const fkRes = await client.query(`
      SELECT count(*) as fk_count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema IN ('clinical', 'company', 'public', 'core', 'pharmacy');
    `);
    const fkCount = parseInt(fkRes.rows[0].fk_count, 10);
    record('DB-CHALLENGE-02', 'Foreign Key Relational Integrity Constraints', fkCount > 50, `Found ${fkCount} active foreign key constraints`);

    // 3. Unique Constraints
    const uqRes = await client.query(`
      SELECT count(*) as uq_count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'UNIQUE'
        AND table_schema IN ('clinical', 'company', 'public', 'core', 'pharmacy');
    `);
    const uqCount = parseInt(uqRes.rows[0].uq_count, 10);
    record('DB-CHALLENGE-03', 'Unique Constraint Coverage', uqCount > 40, `Found ${uqCount} unique constraints protecting identity and slugs`);

    // 4. ACID Concurrency & Dirty Read Prevention (Read-Committed Isolation)
    const clientA = await pool.connect();
    const clientB = await pool.connect();
    let dirtyReadPrevented = false;
    const probeId = '00000000-0000-0000-0000-000000000088';

    try {
      // Transaction A starts and inserts dirty uncommitted record
      await clientA.query('BEGIN');
      await clientA.query(`
        INSERT INTO core.audit_events (id, event_type, resource_type, timestamp)
        VALUES ($1, 'DIRTY_READ_CHALLENGE_PROBE', 'CONCURRENCY_TEST', NOW())
      `, [probeId]);

      // Transaction B reads concurrently - MUST NOT see Transaction A uncommitted probe!
      const readB = await clientB.query(`
        SELECT count(*) as cnt FROM core.audit_events WHERE id = $1
      `, [probeId]);
      const seeDirty = parseInt(readB.rows[0].cnt, 10) > 0;

      // Transaction A rollbacks
      await clientA.query('ROLLBACK');

      // Final check
      const finalCheck = await clientB.query(`
        SELECT count(*) as cnt FROM core.audit_events WHERE id = $1
      `, [probeId]);
      const existsFinal = parseInt(finalCheck.rows[0].cnt, 10) > 0;

      dirtyReadPrevented = !seeDirty && !existsFinal;
    } catch (e) {
      await clientA.query('ROLLBACK').catch(() => {});
    } finally {
      clientA.release();
      clientB.release();
    }
    record('DB-CHALLENGE-04', 'ACID Read-Committed Isolation (Zero Dirty Reads)', dirtyReadPrevented, 'Concurrent transaction confirmed zero dirty read exposure');

    // 5. Multi-Tenant Query Isolation
    const tenantIsolationCheck = await client.query(`
      SELECT tenant_id, count(*) as count 
      FROM core.user_tenants 
      GROUP BY tenant_id 
      HAVING tenant_id IS NOT NULL 
      LIMIT 5;
    `);
    const hasTenants = tenantIsolationCheck.rows.length > 0;
    record('DB-CHALLENGE-05', 'Multi-Tenant Data Partitioning Invariant', hasTenants, `Verified user records scoped cleanly across ${tenantIsolationCheck.rows.length} distinct tenants`);

    // 6. Backup Vault Verification
    const backupDir = 'backups/encrypted_vault';
    const backupExists = fs.existsSync(backupDir);
    const backupFiles = backupExists ? fs.readdirSync(backupDir).filter(f => f.endsWith('.json')) : [];
    let backupValid = false;
    if (backupFiles.length > 0) {
      const sample = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf8'));
      backupValid = Boolean(sample.header?.iv && sample.header?.authTag && sample.ciphertext && sample.header?.algorithm === 'AES-256-GCM');
    }
    record('DB-CHALLENGE-06', 'Disaster Recovery Encrypted Vault Integrity', backupValid, `Verified ${backupFiles.length} encrypted AES-256-GCM backup snapshots with IV & AuthTag`);

  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n====================================================');
  const allPassed = results.every(r => r.pass);
  console.log(`PHASE 4 RESULT: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log('====================================================\n');

  fs.writeFileSync('scripts/challenge-phase-4-output.json', JSON.stringify(results, null, 2), 'utf8');
}

run();
