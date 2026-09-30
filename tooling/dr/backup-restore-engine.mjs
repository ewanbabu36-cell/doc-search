import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const ROOT_DIR = 'D:/DOC SEARCH';
const BACKUP_DIR = path.join(ROOT_DIR, 'data', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

export async function createDatabaseBackup(tables = ['clinical.patients', 'core.tenants', 'clinical.encounters']) {
  const pool = new pg.Pool({ connectionString: PG_CONN });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `backup-${timestamp}`;
  const backupFile = path.join(BACKUP_DIR, `${backupId}.json`);

  const backupData = {
    backupId,
    timestamp: new Date().toISOString(),
    postgresVersion: '',
    tables: {}
  };

  try {
    const versionRes = await pool.query('SELECT version()');
    backupData.postgresVersion = versionRes.rows[0]?.version;

    for (const table of tables) {
      const res = await pool.query(`SELECT * FROM ${table}`);
      backupData.tables[table] = {
        rowCount: res.rows.length,
        rows: res.rows
      };
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    backupData.sha256 = hash;

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    return {
      success: true,
      backupId,
      backupFile,
      sha256: hash,
      tablesIncluded: Object.keys(backupData.tables),
      totalRows: Object.values(backupData.tables).reduce((sum, t) => sum + t.rowCount, 0)
    };
  } finally {
    await pool.end();
  }
}

export async function verifyAndRestoreBackup(backupFile, testTable = 'clinical.patients_restore_test') {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file does not exist: ${backupFile}`);
  }

  const raw = fs.readFileSync(backupFile, 'utf8');
  const backupData = JSON.parse(raw);
  const originalHash = backupData.sha256;

  // Verify hash
  delete backupData.sha256;
  const computedHash = crypto.createHash('sha256').update(JSON.stringify(backupData, null, 2)).digest('hex');
  if (originalHash !== computedHash) {
    throw new Error(`Backup checksum mismatch! Expected ${originalHash}, computed ${computedHash}`);
  }

  const pool = new pg.Pool({ connectionString: PG_CONN });
  try {
    // Create an isolated restore verification table matching clinical.patients schema
    await pool.query(`DROP TABLE IF EXISTS ${testTable}`);
    await pool.query(`CREATE TABLE ${testTable} (LIKE clinical.patients INCLUDING ALL)`);

    const patientsData = backupData.tables['clinical.patients']?.rows || [];
    let restoredCount = 0;

    for (const row of patientsData) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const cols = keys.map(k => `"${k}"`).join(', ');

      await pool.query(`INSERT INTO ${testTable} (${cols}) VALUES (${placeholders})`, values);
      restoredCount++;
    }

    const checkRes = await pool.query(`SELECT count(*)::int as count FROM ${testTable}`);
    const actualRestored = checkRes.rows[0]?.count;

    // Clean up temporary restore verification table
    await pool.query(`DROP TABLE IF EXISTS ${testTable}`);

    return {
      success: true,
      verifiedHash: true,
      expectedRows: patientsData.length,
      actualRestoredRows: actualRestored,
      restoreVerified: actualRestored === patientsData.length
    };
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('backup-restore-engine.mjs')) {
  console.log('[DR Engine] Running test backup and restore verification...');
  createDatabaseBackup()
    .then(async (bRes) => {
      console.log('✅ Backup created:', bRes);
      const rRes = await verifyAndRestoreBackup(bRes.backupFile);
      console.log('✅ Restore verified:', rRes);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ DR Engine failed:', err);
      process.exit(1);
    });
}
