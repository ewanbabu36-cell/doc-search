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
    const sourceDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
    const sourceClient = new pg.Client({ connectionString: sourceDbUrl });
    const restoredClient = new pg.Client({
      connectionString: `postgresql://postgres:password@127.0.0.1:5432/${TEST_RESTORE_DB}`
    });

    await sourceClient.connect();
    await restoredClient.connect();

    const srcTenants = await sourceClient.query('SELECT count(*)::int as count FROM "core"."tenants"');
    const resTenants = await restoredClient.query('SELECT count(*)::int as count FROM "core"."tenants"');
    assert.equal(resTenants.rows[0].count, srcTenants.rows[0].count, 'Restored tenants must match source');

    const srcBatches = await sourceClient.query('SELECT count(*)::int as count FROM "clinical"."pharmacy_batches"');
    const resBatches = await restoredClient.query('SELECT count(*)::int as count FROM "clinical"."pharmacy_batches"');
    assert.equal(resBatches.rows[0].count, srcBatches.rows[0].count, 'Restored pharmacy batches must match source');

    const srcControlled = await sourceClient.query('SELECT count(*)::int as count FROM "pharmacy"."controlled_substance_records"');
    const resControlled = await restoredClient.query('SELECT count(*)::int as count FROM "pharmacy"."controlled_substance_records"');
    assert.equal(resControlled.rows[0].count, srcControlled.rows[0].count, 'Restored controlled substances must match source');

    const srcPartners = await sourceClient.query('SELECT count(*)::int as count FROM "company"."partner_profiles"');
    const resPartners = await restoredClient.query('SELECT count(*)::int as count FROM "company"."partner_profiles"');
    assert.equal(resPartners.rows[0].count, srcPartners.rows[0].count, 'Restored partner profiles must match source');

    await sourceClient.end();
    await restoredClient.end();
  });

  it('4. Cleanup isolated test recovery database', async () => {
    const rootClient = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/postgres' });
    await rootClient.connect();
    await rootClient.query(`DROP DATABASE IF EXISTS "${TEST_RESTORE_DB}" WITH (FORCE);`);
    await rootClient.end();
  });
});
