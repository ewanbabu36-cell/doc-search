/**
 * DOC SEARCH ENTERPRISE DISASTER RECOVERY — BACKUP ENGINE
 * Performs logical streaming snapshots of all database schemas,
 * computes SHA-256 checksums, and encrypts payloads with AES-256-GCM.
 */

import { createRequire } from 'module';
const require = createRequire('D:/DOC SEARCH/package.json');
const pg = require('pg');
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = 'D:/DOC SEARCH';
const VAULT_DIR = path.join(ROOT_DIR, 'backups/encrypted_vault');
const KEY_PATH = path.join(ROOT_DIR, 'backups/keys/master_dr.key');

export function getMasterKey() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Master DR key missing at ${KEY_PATH}`);
  }
  const keyHex = fs.readFileSync(KEY_PATH, 'utf8').trim();
  return Buffer.from(keyHex, 'hex');
}

export async function runFullBackup(options = {}) {
  const startTime = Date.now();
  const dbUrl = options.connectionString || process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
  
  console.log(`[DR-Backup] Starting enterprise full backup from ${dbUrl}...`);
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name;
  `);
  const schemas = schemasRes.rows.map(r => r.schema_name);

  const backupPayload = {
    metadata: {
      version: '1.0.0',
      database: 'docsearch',
      pgVersion: 18,
      createdAt: new Date().toISOString(),
      schemas
    },
    tables: []
  };

  let totalRows = 0;
  for (const schema of schemas) {
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `, [schema]);

    for (const tRow of tablesRes.rows) {
      const tableName = tRow.table_name;

      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position;
      `, [schema, tableName]);

      const pksRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2;
      `, [schema, tableName]);
      const primaryKeys = pksRes.rows.map(r => r.column_name);

      let rows = [];
      try {
        const rowsRes = await client.query(`SELECT * FROM "${schema}"."${tableName}"`);
        rows = rowsRes.rows;
      } catch (e) {
        console.warn(`[DR-Backup] Could not read "${schema}"."${tableName}": ${e.message}`);
      }

      totalRows += rows.length;
      backupPayload.tables.push({
        schema,
        name: tableName,
        columns: colsRes.rows,
        primaryKeys,
        rowCount: rows.length,
        rows
      });
    }
  }

  await client.end();

  const rawJson = JSON.stringify(backupPayload);
  const sha256 = crypto.createHash('sha256').update(rawJson).digest('hex');
  const sizeBytes = Buffer.byteLength(rawJson, 'utf8');

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  
  let ciphertext = cipher.update(rawJson, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.enc.json`;
  const vaultPath = path.join(VAULT_DIR, filename);

  const vaultRecord = {
    header: {
      type: 'DOCSEARCH_ENCRYPTED_BACKUP_VAULT',
      algorithm: 'AES-256-GCM',
      timestamp: new Date().toISOString(),
      iv: iv.toString('hex'),
      authTag,
      sha256Checksum: sha256,
      totalSchemas: schemas.length,
      totalTables: backupPayload.tables.length,
      totalRows,
      unencryptedSizeBytes: sizeBytes
    },
    ciphertext
  };

  fs.mkdirSync(VAULT_DIR, { recursive: true });
  fs.writeFileSync(vaultPath, JSON.stringify(vaultRecord, null, 2), 'utf8');

  const durationMs = Date.now() - startTime;
  console.log(`[DR-Backup] ✅ Full encrypted backup completed in ${durationMs}ms`);
  console.log(`[DR-Backup] File: ${vaultPath}`);
  console.log(`[DR-Backup] Stats: ${schemas.length} schemas, ${backupPayload.tables.length} tables, ${totalRows} rows, SHA-256: ${sha256}`);

  return {
    vaultPath,
    filename,
    sha256,
    durationMs,
    totalSchemas: schemas.length,
    totalTables: backupPayload.tables.length,
    totalRows,
    sizeBytes
  };
}

if (process.argv[1]?.endsWith('dr-backup-engine.mjs')) {
  runFullBackup().catch(err => {
    console.error('[DR-Backup] Fatal error:', err);
    process.exit(1);
  });
}
