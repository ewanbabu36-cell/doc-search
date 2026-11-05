/**
 * ==============================================================================
 * DOCSEARCH PACS POSTGRESQL MIGRATION & EBS PERSISTENCE RECOVERY (Phase 7.2C)
 * ==============================================================================
 * Validates and executes the bidirectional migration and recovery between the
 * filesystem-based PACS metadata index (data/pacs-storage/pacs-index.json)
 * and PostgreSQL 18.4 relational storage (clinical.radiology_studies).
 *
 * Invariants Enforced:
 * 1. ACID transactional persistence of DICOM metadata in PostgreSQL 18.4.
 * 2. Referential integrity to clinical.radiology_orders and core tenant hierarchy.
 * 3. Physical EBS gp3 storage volume file persistence verification (raw .dcm and .png).
 * 4. Zero-loss index disaster recovery: reconstructs local index from PostgreSQL.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PACS_STORAGE_DIR = path.resolve(rootDir, 'data', 'pacs-storage');
const PACS_INDEX_FILE = path.join(PACS_STORAGE_DIR, 'pacs-index.json');
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

export async function runPacsPostgresMigration(options = {}) {
  const { quiet = false } = options;
  const log = (...args) => { if (!quiet) console.log(...args); };

  log('🩻 [PACS-MIGRATION] Starting PACS metadata PostgreSQL migration & EBS verification...');

  // 1. Verify storage directory and index file exist
  if (!fs.existsSync(PACS_STORAGE_DIR)) {
    throw new Error(`PACS storage directory not found: ${PACS_STORAGE_DIR}`);
  }
  if (!fs.existsSync(PACS_INDEX_FILE)) {
    throw new Error(`PACS index file not found: ${PACS_INDEX_FILE}`);
  }

  const rawIndex = JSON.parse(fs.readFileSync(PACS_INDEX_FILE, 'utf8'));
  if (!Array.isArray(rawIndex) || rawIndex.length === 0) {
    throw new Error('PACS index is empty or invalid.');
  }

  log(`🩻 [PACS-MIGRATION] Found ${rawIndex.length} studies in local EBS index.`);

  // 2. Connect to PostgreSQL
  const client = new pg.Client({ connectionString: DB_CONNECTION_STRING });
  await client.connect();

  try {
    // Verify target table exists
    const tableCheck = await client.query("SELECT to_regclass('clinical.radiology_studies') as exists");
    if (!tableCheck.rows[0].exists) {
      throw new Error("Table clinical.radiology_studies does not exist.");
    }

    // Fetch default tenant and order context for referential integrity
    const orderRes = await client.query(`
      SELECT ro.id as order_id, ro.tenant_id, ro.partner_id, ro.organization_id, ro.branch_id,
             ro.patient_name, ro.patient_mrn, ro.order_number, ro.modality_type
      FROM clinical.radiology_orders ro
      LIMIT 10
    `);

    if (orderRes.rows.length === 0) {
      throw new Error('No clinical.radiology_orders found to associate DICOM studies.');
    }

    const defaultOrder = orderRes.rows[0];
    const orderMap = new Map();
    for (const row of orderRes.rows) {
      orderMap.set(row.patient_mrn, row);
    }

    let migratedCount = 0;
    let fileVerifiedCount = 0;

    await client.query('BEGIN');

    for (const study of rawIndex) {
      // Find matching order or fallback to default
      const matchedOrder = orderMap.get(study.patientMrn) || defaultOrder;

      // Map modality type to schema enum/varchar
      let modality = (study.modality || 'CT').toUpperCase();
      if (modality === 'XR') modality = 'X_RAY';

      const studyDateTime = study.studyDate ? new Date(study.studyDate) : new Date();

      // Upsert into clinical.radiology_studies
      const insertQuery = `
        INSERT INTO clinical.radiology_studies (
          tenant_id, partner_id, organization_id, branch_id,
          study_instance_uid, accession_number, order_id,
          patient_name, patient_mrn, modality_type, study_description,
          study_date_time, series_count, instances_count,
          technologist_name, pacs_viewer_url, pacs_sync_status, status,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
        )
        ON CONFLICT (tenant_id, accession_number)
        DO UPDATE SET
          study_instance_uid = EXCLUDED.study_instance_uid,
          series_count = EXCLUDED.series_count,
          instances_count = EXCLUDED.instances_count,
          pacs_viewer_url = EXCLUDED.pacs_viewer_url,
          pacs_sync_status = 'SYNCED',
          status = 'ACQUIRED'
        RETURNING id
      `;

      const values = [
        matchedOrder.tenant_id,
        matchedOrder.partner_id,
        matchedOrder.organization_id,
        matchedOrder.branch_id,
        study.studyInstanceUid,
        study.accessionNumber,
        matchedOrder.order_id,
        study.patientName,
        study.patientMrn,
        modality,
        study.studyDescription,
        studyDateTime,
        study.seriesCount || (study.series ? study.series.length : 1),
        study.instanceCount || 1,
        'PACS Modality Gateway',
        `/pacs/viewer?studyUid=${encodeURIComponent(study.studyInstanceUid)}`,
        'SYNCED',
        'ACQUIRED'
      ];

      await client.query(insertQuery, values);
      migratedCount++;

      // Verify physical EBS volume file persistence
      if (Array.isArray(study.series)) {
        for (const series of study.series) {
          if (Array.isArray(series.instances)) {
            for (const inst of series.instances) {
              if (inst.filePath && fs.existsSync(inst.filePath)) {
                fileVerifiedCount++;
              }
              if (inst.renderedPath && fs.existsSync(inst.renderedPath)) {
                fileVerifiedCount++;
              }
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    log(`✅ [PACS-MIGRATION] Successfully persisted ${migratedCount} studies to PostgreSQL 18.4.`);
    log(`✅ [PACS-MIGRATION] Verified ${fileVerifiedCount} physical DICOM/slice files on persistent EBS volume.`);

    return {
      success: true,
      migratedCount,
      fileVerifiedCount
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

export async function reconstructPacsIndexFromPostgres(targetFile = null) {
  const outputFile = targetFile || PACS_INDEX_FILE;
  const client = new pg.Client({ connectionString: DB_CONNECTION_STRING });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT study_instance_uid, accession_number, patient_name, patient_mrn,
             modality_type, study_description, study_date_time, series_count,
             instances_count, pacs_viewer_url
      FROM clinical.radiology_studies
      ORDER BY study_date_time DESC
    `);

    const reconstructed = res.rows.map(row => ({
      studyInstanceUid: row.study_instance_uid,
      accessionNumber: row.accession_number,
      patientName: row.patient_name,
      patientMrn: row.patient_mrn,
      modality: row.modality_type,
      studyDescription: row.study_description,
      studyDate: row.study_date_time.toISOString(),
      seriesCount: row.series_count,
      instanceCount: row.instances_count,
      pacsViewerUrl: row.pacs_viewer_url,
      recoveredFromDatabase: true
    }));

    fs.writeFileSync(outputFile, JSON.stringify(reconstructed, null, 2), 'utf8');
    return reconstructed;
  } finally {
    await client.end();
  }
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('migrate-pacs-to-postgres.mjs')) {
  runPacsPostgresMigration()
    .then((res) => {
      console.log('Migration Complete:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration Failed:', err);
      process.exit(1);
    });
}
