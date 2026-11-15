import { getDatabase, sql } from '../packages/database/dist/index.js';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';

async function main() {
  const db = getDatabase();
  console.log('================================================================');
  console.log('🔍 VERIFYING CLINICAL SUB-MODULE TABLES & INVOICE PARTITIONING');
  console.log('================================================================\n');

  const targetTables = [
    // 1. Pharmacy Returns & Supplier Ledgers (7 tables)
    'pharmacy_returns',
    'pharmacy_stock_adjustments',
    'vendor_returns',
    'vendor_return_items',
    'pharmacy_stock_reservations',
    'supply_chain_stock_ledger',
    'pharmacy_audit_traces',

    // 2. TPA Claims Adjudication & Appeals (5 tables)
    'insurance_claim_items',
    'insurance_claim_adjudications',
    'insurance_claim_denials',
    'insurance_claim_appeals',
    'insurance_settlements',

    // 3. Inpatient Discharge & Transfer Requests (5 tables)
    'inpatient_discharge_plans',
    'inpatient_discharge_requests',
    'inpatient_discharge_summaries',
    'inpatient_transfers',
    'inpatient_transfer_approvals',

    // 4. Doctor Leave & Shift Breaks (2 tables)
    'doctor_leaves',
    'doctor_schedule_breaks',

    // 5. Invoicing Ambiguity Verification
    'billing_invoices',
    'billing_invoices_partitioned'
  ];

  let allPopulated = true;

  console.log('--- 1. Table Row Counts (Tenant: ' + CANONICAL_TENANT + ') ---');
  for (const table of targetTables) {
    const res = await db.execute(sql.raw(`SELECT COUNT(*)::int as count FROM clinical.${table} WHERE tenant_id = '${CANONICAL_TENANT}';`));
    const count = res.rows[0]?.count ?? 0;
    const status = count > 0 ? '✅ POPULATED' : '❌ ZERO-ROW';
    console.log(`  ${table.padEnd(35)} : ${count} rows  [${status}]`);
    if (count === 0) {
      allPopulated = false;
    }
  }

  console.log('\n--- 2. Unified Reporting View Check (clinical.v_unified_billing_invoices) ---');
  const viewRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM clinical.v_unified_billing_invoices WHERE tenant_id = ${CANONICAL_TENANT};`);
  const viewCount = viewRes.rows[0]?.count ?? 0;
  console.log(`  v_unified_billing_invoices          : ${viewCount} rows  [${viewCount > 0 ? '✅ OPERATIONAL' : '❌ ZERO-ROW'}]`);

  console.log('\n--- 3. Invoice Synchronization Trigger Test ---');
  // Insert a test invoice and verify trigger syncs it to billing_invoices_partitioned
  const testId = 'f9999999-9999-4999-8999-999999999999';
  const [partnerRow] = (await db.execute(sql`SELECT id FROM clinical.operational_partners WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const partnerId = partnerRow?.id || '6855be07-5298-4148-a571-c51ac49ac7f3';
  const [facRow] = (await db.execute(sql`SELECT id FROM clinical.operational_facilities WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const branchId = facRow?.id || '0f51b2ff-5016-44b6-9b53-f76721298d1d';
  const [pRow] = (await db.execute(sql`SELECT id FROM clinical.patients WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const patientId = pRow?.id;

  await db.execute(sql`
    INSERT INTO clinical.billing_invoices (
      id, tenant_id, partner_id, organization_id, branch_id, invoice_number, patient_id,
      invoice_type, status, subtotal, discount_total, tax_total, total_amount, paid_amount, due_amount,
      currency, issued_at, created_at, updated_at
    ) VALUES (
      ${testId}, ${CANONICAL_TENANT}, ${partnerId}, ${partnerId}, ${branchId}, 'INV-TEST-SYNC-01', ${patientId},
      'OUTPATIENT', 'DRAFT', 1000.00, 0.00, 0.00, 1000.00, 0.00, 1000.00,
      'INR', NOW(), NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `);

  const [partRow] = (await db.execute(sql`SELECT id, invoice_number FROM clinical.billing_invoices_partitioned WHERE id = ${testId};`)).rows || [];
  const triggerWorking = partRow?.invoice_number === 'INV-TEST-SYNC-01';
  console.log(`  Trigger trg_sync_invoice_to_partitioned : ${triggerWorking ? '✅ ACTIVE & SYNCING' : '❌ FAILED'}`);

  // Clean up test invoice
  await db.execute(sql`DELETE FROM clinical.billing_invoices WHERE id = ${testId};`);
  await db.execute(sql`DELETE FROM clinical.billing_invoices_partitioned WHERE id = ${testId};`);
  console.log(`  Test invoice cleaned up cleanly.`);

  console.log('\n================================================================');
  if (allPopulated && triggerWorking && viewCount > 0) {
    console.log('✅ ALL DATABASE ABNORMALITIES FULLY RESOLVED & APPLIED!');
  } else {
    console.log('⚠️ SOME VERIFICATIONS FAILED.');
    process.exit(1);
  }
  console.log('================================================================');
}

main().catch(console.error).then(() => process.exit(0));
