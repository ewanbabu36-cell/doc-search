import pg from 'pg';
import { signJwt } from '../packages/auth/dist/index.js';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const API_BASE = 'http://127.0.0.1:4000';
const TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';
const TEST_BATCH = 'B-CONCURRENCY-FINAL-UNIT';
const TEST_ITEM = 'MED-CONCURRENCY-TEST';

const authToken = signJwt({
  sub: 'usr-cashier-001',
  userId: 'usr-cashier-001',
  tenantId: TENANT_ID,
  roles: ['PHARMACIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
  permissions: ['*'],
  email: 'pharmacist@docsearch.health'
}, {
  secret: process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade',
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresInSeconds: 3600
});

const client = new pg.Client({ connectionString: DB_URL });

async function main() {
  await client.connect();
  console.log('--- PB-06 PHARMACY CONCURRENCY & STOCK DEDUCTION INTEGRITY TEST ---');

  // 1. Setup Test Batch with exactly 1 unit of stock
  await client.query(`
    DELETE FROM pharmacy_pos_inventory_batches WHERE batch_number = $1;
  `, [TEST_BATCH]);

  await client.query(`
    INSERT INTO pharmacy_pos_inventory_batches (
      tenant_id, item_code, item_name, gtin_barcode, batch_number,
      expiry_date, mrp, purchase_rate, stock_qty, is_schedule_h1, is_narcotic
    ) VALUES (
      $1, $2, 'Concurrent Race Test Amox 500mg', '08909999999999', $3,
      '2028-12-31', 100.00, 70.00, 1, false, false
    );
  `, [TENANT_ID, TEST_ITEM, TEST_BATCH]);

  // Read initial stock
  const initialRow = await client.query(`
    SELECT batch_number, stock_qty, expiry_date FROM pharmacy_pos_inventory_batches WHERE batch_number = $1
  `, [TEST_BATCH]);
  console.log('Initial Database Batch State:', initialRow.rows[0]);
  if (initialRow.rows[0].stock_qty !== 1) {
    throw new Error('Test batch setup failed: initial stock_qty is not 1');
  }

  // 2. Fire two simultaneous cashier checkout requests for the final 1 unit
  console.log('\n[RACE CONDITION INITIATION] Cashier 1 & Cashier 2 simultaneously checkout 1 unit each...');
  
  const cashier1Payload = {
    patientUhId: 'UHID-RACE-001',
    patientName: 'Rameshwar Dayal (Cashier 1)',
    paymentMode: 'UPI_DYNAMIC_QR',
    cashierName: 'Cashier Counter 1 - Suman Rao',
    items: [{ itemCode: TEST_ITEM, batchNumber: TEST_BATCH, quantity: 1, unitPrice: 100.00 }]
  };

  const cashier2Payload = {
    patientUhId: 'UHID-RACE-002',
    patientName: 'Sunita Sharma (Cashier 2)',
    paymentMode: 'CASH_COUNTER',
    cashierName: 'Cashier Counter 2 - Deepak Patel',
    items: [{ itemCode: TEST_ITEM, batchNumber: TEST_BATCH, quantity: 1, unitPrice: 100.00 }]
  };

  const req1 = fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/bill/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(cashier1Payload)
  }).then(async r => ({ status: r.status, data: await r.json(), cashier: 'Cashier 1' }));

  const req2 = fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/bill/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(cashier2Payload)
  }).then(async r => ({ status: r.status, data: await r.json(), cashier: 'Cashier 2' }));

  const [res1, res2] = await Promise.all([req1, req2]);

  console.log(`\nCashier 1 Result: Status HTTP ${res1.status}`, res1.data);
  console.log(`Cashier 2 Result: Status HTTP ${res2.status}`, res2.data);

  // 3. Verify exactly one checkout succeeded (HTTP 201) and one failed (HTTP 409 Conflict)
  const statuses = [res1.status, res2.status].sort();
  const hasOneSuccess = statuses[0] === 201 || statuses[1] === 201;
  const hasOneConflict = statuses[0] === 409 || statuses[1] === 409;

  console.log('\n--- VERIFICATION OF CONCURRENCY CONTRACT ---');
  console.log(`1. Exactly one HTTP 201 Created: ${hasOneSuccess ? 'PASS (Confirmed)' : 'FAIL'}`);
  console.log(`2. Exactly one HTTP 409 Conflict: ${hasOneConflict ? 'PASS (Confirmed)' : 'FAIL'}`);

  // 4. Query Database State
  const postRow = await client.query(`
    SELECT batch_number, stock_qty, expiry_date FROM pharmacy_pos_inventory_batches WHERE batch_number = $1
  `, [TEST_BATCH]);
  console.log('Post-Checkout Batch State in Database:', postRow.rows[0]);
  const zeroStock = postRow.rows[0].stock_qty === 0;
  console.log(`3. Batch Stock Exactly 0 (No Negative Stock): ${zeroStock ? 'PASS (Confirmed)' : 'FAIL'}`);

  // Check transactions count for this batch
  const txRows = await client.query(`
    SELECT invoice_number, patient_name, gross_amount, net_amount, payment_mode, cashier_name, created_at
    FROM pharmacy_pos_transactions
    WHERE items_json::text LIKE '%' || $1 || '%'
    ORDER BY created_at DESC
  `, [TEST_BATCH]);
  console.log(`4. Transactions Recorded in Database: ${txRows.rowCount} (Expected exactly 1)`);
  console.table(txRows.rows);

  // Cleanup test batch
  await client.query(`DELETE FROM pharmacy_pos_inventory_batches WHERE batch_number = $1;`, [TEST_BATCH]);
  await client.query(`DELETE FROM pharmacy_pos_transactions WHERE items_json::text LIKE '%' || $1 || '%';`, [TEST_BATCH]);
  await client.end();

  if (hasOneSuccess && hasOneConflict && zeroStock && txRows.rowCount === 1) {
    console.log('\n🏆 PB-06 PHARMACY CONCURRENCY & ZERO NEGATIVE STOCK AUDIT PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ PB-06 PHARMACY CONCURRENCY AUDIT FAILED!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running concurrency test:', err);
  process.exit(1);
});
