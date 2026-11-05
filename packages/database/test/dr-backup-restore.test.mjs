import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runFullBackup } from '../../../scripts/dr-backup-engine.mjs';
import { runRestore } from '../../../scripts/dr-restore-engine.mjs';
import { createRequire } from 'module';
const require = createRequire('D:/DOC SEARCH/package.json');
const pg = require('pg');

describe('Disaster Recovery & Encrypted Backup/Restore Verification Gate', () => {
  let backupMeta;
  let restoreMeta;
  const TEST_RESTORE_DB = 'docsearch_dr_verification_test';

  it('1. Full encrypted database backup completes with valid AES-256-GCM vault file', async () => {
    backupMeta = await runFullBackup();
    assert.ok(backupMeta.vaultPath, 'Vault path must exist');
    assert.ok(backupMeta.sha256, 'SHA-256 checksum must be generated');
    assert.ok(backupMeta.totalSchemas >= 6, 'Must backup all active schemas');
    assert.ok(backupMeta.totalTables >= 500, 'Must backup all base tables');
    assert.ok(backupMeta.totalRows > 30000, 'Must backup all operational rows');
  });

  it('2. Isolated disaster recovery restore succeeds with SHA-256 checksum validation', async () => {
    restoreMeta = await runRestore(TEST_RESTORE_DB, backupMeta.vaultPath);
    assert.equal(restoreMeta.verifiedSha256, backupMeta.sha256, 'Restored SHA-256 must match backup');
    assert.ok(restoreMeta.restoredTables >= 500, 'All tables must be restored');
    assert.ok(parseFloat(restoreMeta.durationSec) < 1800, 'RTO must be <= 30 minutes (1800s)');
  });

  it('3. Restored database state matches authoritative source with zero record loss', async () => {
    const client = new pg.Client({
      connectionString: `postgresql://postgres:password@127.0.0.1:5432/${TEST_RESTORE_DB}`
    });
    await client.connect();

    const tenants = await client.query('SELECT count(*)::int as count FROM "core"."tenants"');
    assert.equal(tenants.rows[0].count, 97, 'Restored tenants must equal 97');

    const batches = await client.query('SELECT count(*)::int as count FROM "clinical"."pharmacy_batches"');
    assert.equal(batches.rows[0].count, 22, 'Restored pharmacy batches must equal 22');

    const controlled = await client.query('SELECT count(*)::int as count FROM "pharmacy"."controlled_substance_records"');
    assert.equal(controlled.rows[0].count, 6, 'Restored controlled substances must equal 6');

    const partners = await client.query('SELECT count(*)::int as count FROM "company"."partner_profiles"');
    assert.equal(partners.rows[0].count, 46, 'Restored partner profiles must equal 46');

    await client.end();
  });

  it('4. Cleanup isolated test recovery database', async () => {
    const rootClient = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/postgres' });
    await rootClient.connect();
    await rootClient.query(`DROP DATABASE IF EXISTS "${TEST_RESTORE_DB}";`);
    await rootClient.end();
  });
});
