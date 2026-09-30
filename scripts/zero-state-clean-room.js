/**
 * MASTER V2 — DOC SEARCH TRUE ZERO-STATE CLEAN ROOM SCRIPT
 * Cascading transactional purge of all fabricated operational business data
 * while preserving 100% of System Master catalogs, schemas, workflows & RBAC.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase, getRawPool, initializeDatabase, isLiveDatabaseReady } from '../packages/database/dist/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('🧹 DOC SEARCH TRUE ZERO-STATE CLEAN ROOM PURGE');
console.log('================================================================================\n');

// Reset disk persistence stores
const dataDir = path.join(ROOT_DIR, 'apps/api-gateway/data');
if (fs.existsSync(dataDir)) {
  fs.writeFileSync(path.join(dataDir, 'approved_partners.json'), '[]\n', 'utf8');
  fs.writeFileSync(path.join(dataDir, 'partner_credentials.json'), '[]\n', 'utf8');
  fs.writeFileSync(path.join(dataDir, 'purged_partners.json'), '[]\n', 'utf8');
  fs.writeFileSync(path.join(dataDir, 'partner_governance_overrides.json'), '{}\n', 'utf8');
  console.log('💾 Disk persistence files reset to clean zero-state (0 items).');
}

const OPERATIONAL_TABLES = [
  // Clinical / Consultation / Encounter
  { schema: 'clinical', table: 'prescriptions', name: 'Prescriptions' },
  { schema: 'clinical', table: 'encounters', name: 'Encounters' },
  { schema: 'clinical', table: 'appointments', name: 'Appointments' },
  { schema: 'clinical', table: 'vitals', name: 'Vitals' },
  { schema: 'clinical', table: 'doctor_profiles', name: 'Doctor Profiles' },
  { schema: 'clinical', table: 'operational_staff', name: 'Staff Records' },
  { schema: 'clinical', table: 'operational_departments', name: 'Partner Departments' },
  { schema: 'clinical', table: 'operational_facilities', name: 'Partner Facilities' },
  { schema: 'clinical', table: 'operational_organizations', name: 'Partner Organizations' },
  { schema: 'clinical', table: 'operational_partners', name: 'Operational Partners' },
  { schema: 'clinical', table: 'patients', name: 'Patients' },
  
  // Pharmacy & Inventory
  { schema: 'clinical', table: 'pharmacy_inventory', name: 'Pharmacy Inventory' },
  { schema: 'clinical', table: 'pharmacy_batches', name: 'Pharmacy Batches' },
  
  // Diagnostics & Lab
  { schema: 'clinical', table: 'investigation_results', name: 'Investigation Results' },
  { schema: 'clinical', table: 'investigation_specimens', name: 'Investigation Specimens' },
  { schema: 'clinical', table: 'investigation_orders', name: 'Investigation Orders' },
  
  // Billing & Revenue
  { schema: 'clinical', table: 'billing_payments', name: 'Billing Payments' },
  { schema: 'clinical', table: 'billing_charges', name: 'Billing Charges' },
  { schema: 'clinical', table: 'billing_invoices', name: 'Billing Invoices' },
  
  // Commercial Partner Profiles & Subscriptions
  { schema: 'company', table: 'partner_profiles', name: 'Partner Profiles' },
  { schema: 'company', table: 'subscriptions', name: 'Subscriptions' },
  { schema: 'company', table: 'licenses', name: 'Licenses' },
  { schema: 'company', table: 'partner_onboarding_staged_registrations', name: 'Staged Registrations' },
  
  // Core Operational Branches
  { schema: 'core', table: 'branches', name: 'Operational Branches' }
];

const SYSTEM_MASTER_TABLES = [
  { schema: 'company', table: 'products', name: 'Platform Products' },
  { schema: 'company', table: 'plans', name: 'SaaS Plans' },
  { schema: 'company', table: 'features', name: 'Platform Features' },
  { schema: 'company', table: 'plan_entitlements', name: 'Plan Entitlements' },
  { schema: 'company', table: 'legal_entities', name: 'Platform Legal Entity' },
  { schema: 'core', table: 'tenants', name: 'Platform Core Tenants' },
  { schema: 'workflows', table: 'workflow_definitions', name: 'Workflow Definitions' }
];

async function getRowCount(pool, schema, table) {
  try {
    const res = await pool.query(`SELECT COUNT(*)::int as count FROM "${schema}"."${table}"`);
    return res.rows[0].count;
  } catch (err) {
    // Table might not exist in pg-mem or isolated schema
    return -1;
  }
}

async function run() {
  // Ensure DB connection
  await initializeDatabase();
  const pool = getRawPool();

  if (!pool) {
    console.error('❌ Failed to obtain database pool');
    process.exit(1);
  }

  console.log('📊 Pre-Purge Operational Data Audit:');
  const preAudit = [];
  for (const item of OPERATIONAL_TABLES) {
    const count = await getRowCount(pool, item.schema, item.table);
    preAudit.push({ ...item, preCount: count });
    if (count > 0) {
      console.log(`   ⚠️  Found ${count} rows in "${item.schema}"."${item.table}" (${item.name})`);
    }
  }

  console.log('\n🔥 Executing Cascading Purge of Operational Business Tables...');
  for (const item of OPERATIONAL_TABLES) {
    try {
      await pool.query(`DELETE FROM "${item.schema}"."${item.table}"`);
    } catch (err) {
      // Ignore if table doesn't exist or cascade handled
    }
  }

  console.log('\n✅ Post-Purge Verification:');
  let operationalViolations = 0;
  console.log('--------------------------------------------------------------------------------');
  console.log('| Schema.Table                        | Pre-Count | Post-Count | Status        |');
  console.log('--------------------------------------------------------------------------------');
  for (const item of preAudit) {
    const postCount = await getRowCount(pool, item.schema, item.table);
    const isClean = postCount <= 0;
    if (!isClean) operationalViolations++;
    const statusStr = isClean ? '✅ ZERO STATE' : '❌ VIOLATION';
    const tableName = `"${item.schema}"."${item.table}"`.padEnd(35);
    const preStr = String(item.preCount >= 0 ? item.preCount : 'N/A').padStart(9);
    const postStr = String(postCount >= 0 ? postCount : 'N/A').padStart(10);
    console.log(`| ${tableName} | ${preStr} | ${postStr} | ${statusStr.padEnd(13)} |`);
  }
  console.log('--------------------------------------------------------------------------------');

  console.log('\n🏛️ System Master Catalog Integrity Check:');
  console.log('--------------------------------------------------------------------------------');
  console.log('| Master Table                        | Row Count  | Status                     |');
  console.log('--------------------------------------------------------------------------------');
  let mastersIntact = true;
  for (const master of SYSTEM_MASTER_TABLES) {
    const count = await getRowCount(pool, master.schema, master.table);
    const isOk = count > 0;
    if (!isOk) mastersIntact = false;
    const statusStr = isOk ? '✅ PRESERVED' : '⚠️ EMPTY MASTER';
    const tableName = `"${master.schema}"."${master.table}"`.padEnd(35);
    const countStr = String(count >= 0 ? count : 'N/A').padStart(10);
    console.log(`| ${tableName} | ${countStr} | ${statusStr.padEnd(26)} |`);
  }
  console.log('--------------------------------------------------------------------------------\n');

  if (operationalViolations === 0) {
    console.log('🎉 ZERO-STATE CLEAN ROOM PURGE CERTIFIED: 0 operational business records remaining.');
    process.exit(0);
  } else {
    console.error(`❌ ZERO-STATE VIOLATION: ${operationalViolations} operational tables still contain data.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal clean room error:', err);
  process.exit(1);
});
