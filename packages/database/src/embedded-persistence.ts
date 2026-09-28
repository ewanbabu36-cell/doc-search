import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('database-persistence');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '.data');
const STORE_FILE = path.join(DATA_DIR, 'persistent_embedded_store.json');

const TRACKED_TABLES = [
  'core.tenants',
  'core.branches',
  'core.users',
  'core.user_credentials',
  'clinical.operational_partners',
  'clinical.operational_organizations',
  'clinical.operational_departments',
  'clinical.operational_staff',
  'clinical.doctor_profiles',
  'company.partners',
  'company.partner_profiles',
  'company.operational_facilities',
  'company.invoices',
  'company.leads',
  'company.subscriptions',
  'company.licenses',
  'clinical.patients',
  'clinical.encounters',
  'clinical.appointments',
  'clinical.vitals',
  'clinical.consultations',
  'clinical.investigation_orders',
  'clinical.investigation_specimens',
  'clinical.investigation_results',
  'clinical.radiology_orders',
  'clinical.prescriptions',
  'clinical.prescription_items',
  'clinical.pharmacy_dispensing',
  'clinical.pharmacy_dispensing_items',
  'clinical.billing_invoices',
  'clinical.billing_invoice_items',
  'clinical.billing_payments',
  'clinical.inpatient_admissions',
  'clinical.inpatient_admission_requests'
];

let isPersistenceHooked = false;
let isFlushing = false;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    logger.warn('Could not create database data directory: ' + String(err));
  }
}

export async function flushEmbeddedStore(pool: any): Promise<void> {
  if (isFlushing || !pool) return;
  isFlushing = true;
  try {
    ensureDataDir();
    const store: Record<string, any[]> = {};
    for (const table of TRACKED_TABLES) {
      try {
        const res = await pool.query(`SELECT * FROM ${table}`);
        if (res.rows && res.rows.length > 0) {
          store[table] = res.rows;
        }
      } catch {
        // Table may not have been created yet
      }
    }
    const tempFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    logger.warn('Failed to flush persistent database store to disk: ' + String(err));
  } finally {
    isFlushing = false;
  }
}

export async function restoreEmbeddedStore(pool: any): Promise<number> {
  if (!pool || !fs.existsSync(STORE_FILE)) return 0;
  let restoredCount = 0;
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const store: Record<string, any[]> = JSON.parse(raw);
    for (const [table, rows] of Object.entries(store)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const row of rows) {
        try {
          const cols = Object.keys(row).map((k) => `"${k}"`).join(', ');
          const placeholders = Object.keys(row).map((_, idx) => `$${idx + 1}`).join(', ');
          const values = Object.values(row).map((v) => {
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'object' && v !== null) return JSON.stringify(v);
            return v;
          });
          await pool.query(
            `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          restoredCount++;
        } catch (insertErr) {
          // Ignore row conflict or type mismatch during restore
        }
      }
    }
    logger.info(`[PERSISTENCE] Restored ${restoredCount} persistent records across ${Object.keys(store).length} tables from disk.`);
  } catch (err) {
    logger.warn('Failed to restore persistent database store: ' + String(err));
  }
  return restoredCount;
}

export function registerPersistenceHooks(pool: any): void {
  if (isPersistenceHooked || !pool) return;
  isPersistenceHooked = true;

  // Flush periodically every 2 seconds
  const interval = setInterval(() => {
    void flushEmbeddedStore(pool);
  }, 2000);
  interval.unref();

  // Flush synchronously / on exit
  const onExit = () => {
    try {
      void flushEmbeddedStore(pool);
    } catch {}
  };

  process.once('beforeExit', onExit);
  process.once('SIGINT', onExit);
  process.once('SIGTERM', onExit);
}
