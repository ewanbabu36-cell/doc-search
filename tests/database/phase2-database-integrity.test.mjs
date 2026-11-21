/**
 * DOC SEARCH — PHASE 2 DATABASE & DATA INTEGRITY REGRESSION HARNESS
 *
 * Verifies PostgreSQL 18.4 database invariants, schema catalog integrity,
 * tenant isolation, foreign key consistency, and financial mathematical invariants.
 */

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client } = pg;

// Use docsearch_app (least privilege) for read-only invariant tests
// and postgres for catalog verification tests where needed.
const APP_URL = process.env.DATABASE_URL || 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch';
const ADMIN_URL = process.env.MIGRATION_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

console.log('================================================================================');
console.log('STARTING PHASE 2 DATABASE & DATA INTEGRITY REGRESSION TEST HARNESS');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  const adminClient = new Client({ connectionString: ADMIN_URL });
  const appClient = new Client({ connectionString: APP_URL });

  await adminClient.connect();
  await appClient.connect();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: PostgreSQL Engine Version & Runtime Identity Isolation
    // -------------------------------------------------------------------------
    const verRes = await appClient.query("SELECT version(), current_user, session_user;");
    const isAppUser = verRes.rows[0].current_user === 'docsearch_app';
    const isPg18 = verRes.rows[0].version.includes('PostgreSQL 18');
    assert(isAppUser, `Runtime connection identity is docsearch_app (actual: ${verRes.rows[0].current_user})`);
    assert(isPg18, `Database engine is PostgreSQL 18.4 (actual: ${verRes.rows[0].version.split(',')[0]})`);

    // -------------------------------------------------------------------------
    // TEST 2: Schema Count & Multi-Tenant Schema Separation
    // -------------------------------------------------------------------------
    const schemaRes = await adminClient.query(`
      SELECT nspname FROM pg_namespace 
      WHERE nspname IN ('clinical', 'company', 'core', 'billing', 'auth', 'pharmacy', 'workflow', 'public')
      ORDER BY nspname;
    `);
    assert(schemaRes.rows.length >= 7, `Expected at least 7 domain schemas present (found ${schemaRes.rows.length})`);

    // -------------------------------------------------------------------------
    // TEST 3: RLS Enforcement on Core Clinical & Tenant Tables
    // -------------------------------------------------------------------------
    const rlsCheckRes = await adminClient.query(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'clinical' AND c.relname IN ('patients', 'encounters', 'billing_invoices', 'pharmacy_prescriptions');
    `);
    const allRlsForced = rlsCheckRes.rows.every(r => r.relrowsecurity && r.relforcerowsecurity);
    assert(allRlsForced, `Core clinical tables enforce FORCE ROW LEVEL SECURITY (verified ${rlsCheckRes.rows.length} tables)`);

    // -------------------------------------------------------------------------
    // TEST 4: Detection of Defect P1-DB-01 (public.company_doctor_cartel_radar lacks RLS)
    // -------------------------------------------------------------------------
    const cartelRlsRes = await adminClient.query(`
      SELECT c.relrowsecurity 
      FROM pg_class c 
      JOIN pg_namespace n ON n.oid = c.relnamespace 
      WHERE n.nspname = 'public' AND c.relname = 'company_doctor_cartel_radar';
    `);
    const cartelLacksRls = cartelRlsRes.rows.length > 0 && !cartelRlsRes.rows[0].relrowsecurity;
    assert(cartelLacksRls, `Forensic Audit accurately identifies P1-DB-01: company_doctor_cartel_radar lacks RLS`);

    // -------------------------------------------------------------------------
    // TEST 5: Detection of Defect P1-DB-03 (Missing clinical.pharmacy_controlled_substances)
    // -------------------------------------------------------------------------
    const pcsRes = await adminClient.query("SELECT to_regclass('clinical.pharmacy_controlled_substances') as exists;");
    const pcsMissing = !pcsRes.rows[0].exists;
    assert(pcsMissing, `Forensic Audit accurately identifies P1-DB-03: clinical.pharmacy_controlled_substances missing from DB`);

    // -------------------------------------------------------------------------
    // TEST 6: Migration Numbering Gap & Drift Detection (P1-MIG-01, P1-MIG-02)
    // -------------------------------------------------------------------------
    const migDir = path.resolve('packages/database/migrations');
    const migFiles = fs.readdirSync(migDir).filter(f => f.endsWith('.sql'));
    const has0071 = migFiles.some(f => f.startsWith('0071'));
    const has0072 = migFiles.some(f => f.startsWith('0072'));
    const has0073 = migFiles.some(f => f.startsWith('0073'));
    assert(!has0071 && has0072 && has0073, `Forensic Audit accurately detects P1-MIG-01: migration 0071 gap between 0070 and 0072/0073`);

    const drizzleRowsRes = await adminClient.query("SELECT count(*) as cnt FROM drizzle.__drizzle_migrations;");
    const drizzleEmpty = parseInt(drizzleRowsRes.rows[0].cnt, 10) === 0;
    assert(drizzleEmpty, `Forensic Audit accurately detects P1-MIG-02: drizzle.__drizzle_migrations has 0 records (untracked dump)`);

    // -------------------------------------------------------------------------
    // TEST 7: Destructive SQL & Patch Detection in Migrations (P1-MIG-03, P2-MIG-04)
    // -------------------------------------------------------------------------
    const mig0072Content = fs.readFileSync(path.join(migDir, '0072_fix_missing_patient_fks.sql'), 'utf-8');
    const mig0073Content = fs.readFileSync(path.join(migDir, '0073_performance_indexes_and_encounter_fix.sql'), 'utf-8');
    const hasDestructiveDelete = /DELETE FROM clinical\./i.test(mig0072Content);
    const hasDataPatchingInDdl = /UPDATE clinical\.encounters/i.test(mig0073Content);
    assert(hasDestructiveDelete, `Forensic Audit accurately flags P1-MIG-03: 0072 contains destructive DELETE statements`);
    assert(hasDataPatchingInDdl, `Forensic Audit accurately flags P2-MIG-04: 0073 contains hardcoded DML patches`);

    // -------------------------------------------------------------------------
    // TEST 8: Clinical Data Integrity: Zero Orphaned Encounters & Invoices
    // -------------------------------------------------------------------------
    const orphanEncRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM clinical.encounters e
      LEFT JOIN clinical.patients p ON e.patient_id = p.id
      WHERE e.patient_id IS NOT NULL AND p.id IS NULL;
    `);
    assert(parseInt(orphanEncRes.rows[0].cnt, 10) === 0, `Zero orphaned encounters found in clinical.encounters`);

    const orphanInvRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM clinical.billing_invoices i
      LEFT JOIN clinical.patients p ON i.patient_id = p.id
      WHERE i.patient_id IS NOT NULL AND p.id IS NULL;
    `);
    assert(parseInt(orphanInvRes.rows[0].cnt, 10) === 0, `Zero orphaned invoices found in clinical.billing_invoices`);

    // -------------------------------------------------------------------------
    // TEST 9: Financial Calculation Invariant (Total Amount Equation)
    // -------------------------------------------------------------------------
    const invMathRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM clinical.billing_invoices
      WHERE abs(total_amount - (coalesce(subtotal, 0) - coalesce(discount_total, 0) + coalesce(tax_total, 0) + coalesce(rounding_adjustment, 0))) > 0.01;
    `);
    assert(parseInt(invMathRes.rows[0].cnt, 10) === 0, `100% of billing invoices satisfy total_amount calculation invariant`);

    // -------------------------------------------------------------------------
    // TEST 10: Financial Due Amount Invariant (Due Equation)
    // -------------------------------------------------------------------------
    const dueMathRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM clinical.billing_invoices
      WHERE abs(due_amount - (coalesce(total_amount, 0) - coalesce(paid_amount, 0))) > 0.01;
    `);
    assert(parseInt(dueMathRes.rows[0].cnt, 10) === 0, `100% of billing invoices satisfy due_amount calculation invariant`);

    // -------------------------------------------------------------------------
    // TEST 11: Double-Entry Payment Ledger Reconciliation
    // -------------------------------------------------------------------------
    const payReconcileRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM (
        SELECT bi.id, bi.paid_amount, coalesce(sum(bp.amount), 0) AS calculated_payments_sum
        FROM clinical.billing_invoices bi
        LEFT JOIN clinical.billing_payments bp ON bp.invoice_id = bi.id AND bp.status = 'SUCCESS'
        GROUP BY bi.id, bi.paid_amount
        HAVING abs(bi.paid_amount - coalesce(sum(bp.amount), 0)) > 0.01
      ) sub;
    `);
    assert(parseInt(payReconcileRes.rows[0].cnt, 10) === 0, `100% of invoice paid_amounts reconcile with billing_payments ledger`);

    // -------------------------------------------------------------------------
    // TEST 12: Pharmacy Inventory Non-Negativity Invariant
    // -------------------------------------------------------------------------
    const batchRes = await adminClient.query(`
      SELECT 
        count(*) FILTER (WHERE available_quantity < 0) as neg_avail,
        count(*) FILTER (WHERE reserved_quantity < 0) as neg_reserved
      FROM clinical.pharmacy_batches;
    `);
    assert(parseInt(batchRes.rows[0].neg_avail, 10) === 0, `Zero batches with negative available stock in pharmacy_batches`);
    assert(parseInt(batchRes.rows[0].neg_reserved, 10) === 0, `Zero batches with negative reserved stock in pharmacy_batches`);

    // -------------------------------------------------------------------------
    // TEST 13: Detection of Hardcoded UUID Infiltration (P0-ID-01, P0-ID-02)
    // -------------------------------------------------------------------------
    const uuidRes = await adminClient.query(`
      SELECT count(*) as cnt 
      FROM clinical.billing_invoices 
      WHERE partner_id = '00000000-0000-4000-8000-000000000001';
    `);
    const hasHardcodedInvoices = parseInt(uuidRes.rows[0].cnt, 10) > 0;
    assert(hasHardcodedInvoices, `Forensic Audit accurately identifies hardcoded UUID infiltration in clinical.billing_invoices (found ${uuidRes.rows[0].cnt} rows)`);

    // -------------------------------------------------------------------------
    // TEST 14: Unindexed Foreign Key Identification (P1-PERF-01)
    // -------------------------------------------------------------------------
    const unindexedFksRes = await adminClient.query(`
      SELECT count(*) as cnt
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
      WHERE con.contype = 'f'
        AND n.nspname NOT LIKE 'pg_%' AND n.nspname != 'information_schema'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = con.conrelid
            AND (i.indkey[0] = a.attnum)
        );
    `);
    const unindexedCount = parseInt(unindexedFksRes.rows[0].cnt, 10);
    assert(unindexedCount > 400, `Forensic Audit accurately identifies >400 unindexed foreign keys (actual: ${unindexedCount})`);

  } finally {
    await adminClient.end();
    await appClient.end();
  }

  console.log('\n================================================================================');
  console.log(`PHASE 2 DATABASE INTEGRITY REGRESSION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`STATUS: ${failCount === 0 ? 'ALL VERIFICATIONS PASSED (100%)' : 'FAILURES DETECTED'}`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
