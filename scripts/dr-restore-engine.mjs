/**
 * DOC SEARCH ENTERPRISE DISASTER RECOVERY — RESTORE ENGINE
 * Decrypts AES-256-GCM backup payloads, verifies SHA-256 checksums,
 * and restores schemas, tables, and rows into an isolated target database.
 */

import { createRequire } from 'module';
const require = createRequire('D:/DOC SEARCH/package.json');
const pg = require('pg');
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getMasterKey } from './dr-backup-engine.mjs';

const ROOT_DIR = 'D:/DOC SEARCH';
const VAULT_DIR = path.join(ROOT_DIR, 'backups/encrypted_vault');

export function getLatestBackupFile() {
  if (!fs.existsSync(VAULT_DIR)) return null;
  const files = fs.readdirSync(VAULT_DIR)
    .filter(f => f.endsWith('.enc.json'))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(VAULT_DIR, files[0]) : null;
}

export async function runRestore(targetDbName, backupFilePath = null) {
  const startTime = Date.now();
  const fileToRestore = backupFilePath || getLatestBackupFile();
  if (!fileToRestore || !fs.existsSync(fileToRestore)) {
    throw new Error(`No encrypted backup file found to restore from.`);
  }

  console.log(`[DR-Restore] Starting disaster recovery restore from ${fileToRestore}...`);
  console.log(`[DR-Restore] Target isolated database: "${targetDbName}"`);

  // 1. Read vault record
  const rawRecord = JSON.parse(fs.readFileSync(fileToRestore, 'utf8'));
  const { header, ciphertext } = rawRecord;

  // 2. Decrypt with AES-256-GCM
  const masterKey = getMasterKey();
  const iv = Buffer.from(header.iv, 'hex');
  const authTag = Buffer.from(header.authTag, 'hex');

  const decipher = crypto.createCipheriv ? crypto.createDecipheriv('aes-256-gcm', masterKey, iv) : null;
  decipher.setAuthTag(authTag);

  let rawJson = decipher.update(ciphertext, 'hex', 'utf8');
  rawJson += decipher.final('utf8');

  // 3. Verify SHA-256 integrity checksum
  const calculatedSha256 = crypto.createHash('sha256').update(rawJson).digest('hex');
  if (calculatedSha256 !== header.sha256Checksum) {
    throw new Error(`[CRITICAL] SHA-256 checksum mismatch! Expected: ${header.sha256Checksum}, Actual: ${calculatedSha256}`);
  }
  console.log(`[DR-Restore] ✔ SHA-256 checksum verified: ${calculatedSha256}`);

  // 4. Connect to postgres root to ensure target database exists cleanly
  const rootClient = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/postgres' });
  await rootClient.connect();

  await rootClient.query(`
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = '${targetDbName}' AND pid <> pg_backend_pid();
  `);
  await rootClient.query(`DROP DATABASE IF EXISTS "${targetDbName}" WITH (FORCE);`);
  await rootClient.query(`CREATE DATABASE "${targetDbName}";`);
  console.log(`[DR-Restore] Isolated database "${targetDbName}" created.`);
  await rootClient.end();

  // 5. Connect to target database
  const targetClient = new pg.Client({ connectionString: `postgresql://postgres:password@127.0.0.1:5432/${targetDbName}` });
  await targetClient.connect();

  const payload = JSON.parse(rawJson);

  // 6. Create schemas
  for (const s of payload.metadata.schemas) {
    await targetClient.query(`CREATE SCHEMA IF NOT EXISTS "${s}";`);
  }
  console.log(`[DR-Restore] Created ${payload.metadata.schemas.length} schemas.`);

  // 7. Create tables and insert rows
  let restoredTables = 0;
  let restoredRows = 0;

  for (const table of payload.tables) {
    if (table.columns.length === 0) continue;

    const colDefs = table.columns.map(c => {
      let def = `"${c.column_name}" ${c.data_type}`;
      if (c.data_type === 'character varying') def = `"${c.column_name}" VARCHAR`;
      else if (c.data_type === 'USER-DEFINED') def = `"${c.column_name}" TEXT`;
      else if (c.data_type === 'ARRAY') {
        const baseType = (c.udt_name || '').replace(/^_/, '') || 'text';
        def = `"${c.column_name}" ${baseType}[]`;
      } else if (c.data_type === 'json' || c.data_type === 'jsonb') {
        def = `"${c.column_name}" jsonb`;
      }
      return def;
    });

    const createTableSql = `CREATE TABLE IF NOT EXISTS "${table.schema}"."${table.name}" (\n  ${colDefs.join(',\n  ')}\n);`;
    await targetClient.query(createTableSql);

    if (table.rows.length > 0) {
      const colNames = table.columns.map(c => `"${c.column_name}"`).join(', ');
      for (const row of table.rows) {
        const values = table.columns.map(c => {
          let val = row[c.column_name];
          if ((c.data_type === 'json' || c.data_type === 'jsonb') && typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          return val;
        });
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const insertSql = `INSERT INTO "${table.schema}"."${table.name}" (${colNames}) VALUES (${placeholders});`;
        try {
          await targetClient.query(insertSql, values);
          restoredRows++;
        } catch (insertErr) {
          console.warn(`[DR-Restore] Warn: Insert error in "${table.schema}"."${table.name}": ${insertErr.message}`);
        }
      }
    }
    restoredTables++;
  }

  await targetClient.end();

  const durationMs = Date.now() - startTime;
  const durationSec = (durationMs / 1000).toFixed(2);
  console.log(`[DR-Restore] ✅ Full disaster recovery restore completed in ${durationMs}ms (${durationSec}s)`);
  console.log(`[DR-Restore] Restored: ${restoredTables} tables, ${restoredRows} rows into "${targetDbName}"`);
  console.log(`[DR-Restore] Measured RTO: ${durationSec} seconds (Target: <= 1800s / 30 mins)`);

  return {
    targetDbName,
    durationMs,
    durationSec,
    restoredTables,
    restoredRows,
    verifiedSha256: calculatedSha256
  };
}

if (process.argv[1]?.endsWith('dr-restore-engine.mjs')) {
  runRestore('docsearch_dr_isolated_restore').catch(err => {
    console.error('[DR-Restore] Fatal error:', err);
    process.exit(1);
  });
}
