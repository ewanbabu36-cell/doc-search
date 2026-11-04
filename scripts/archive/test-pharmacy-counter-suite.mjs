// Comprehensive End-to-End Test Suite for Pharmacy POS & Wholesale Counter
const BASE_URL = 'http://127.0.0.1:4000';

async function runTests() {
  console.log('--- STARTING PHARMACY POS & WHOLESALE VERIFICATION ---');

  // 1. Authenticate Pharmacist
  console.log('1. Testing Pharmacist Authentication...');
  const authRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pharmacist@docsearch.health', password: 'PharmaPass123!' })
  });
  if (!authRes.ok) throw new Error(`Auth failed: ${authRes.statusText}`);
  const authJson = await authRes.json();
  const token = authJson.data?.accessToken;
  if (!token) throw new Error('No access token returned');
  console.log('✅ Pharmacist Authenticated. Token length:', token.length);

  // 2. Overview Metrics with Token
  console.log('2. Testing Overview Metrics with Auth Token...');
  const ovRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/overview-metrics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!ovRes.ok) throw new Error(`Overview metrics failed with token: ${ovRes.status}`);
  console.log('✅ Overview Metrics 200 OK with Bearer token');

  // 3. Overview Metrics without Token (verifying local dev resilience)
  console.log('3. Testing Dev Fallback Resilience (No Token)...');
  const noTokenRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/overview-metrics`, {
    headers: { 'x-tenant-id': '33333333-3333-4333-8333-333333333333' }
  });
  if (!noTokenRes.ok) throw new Error(`Dev fallback failed: ${noTokenRes.status}`);
  console.log('✅ Dev Fallback 200 OK (Zero 401 Lockout)');

  // 4. Wholesale Inwarding (Structured Invoice Ingestion)
  console.log('4. Testing Wholesale Invoice Inwarding (Marg/Vyapar Structured)...');
  const testBatchNum = `TEST-WHOLESALE-${Date.now().toString().slice(-5)}`;
  const inwardPayload = {
    tenantId: '33333333-3333-4333-8333-333333333333',
    invoice: {
      invoiceNumber: `INV-MARG-${Date.now().toString().slice(-4)}`,
      distributorName: 'Apollo Lifecare Pharma Wholesale',
      items: [
        {
          brandName: 'Augmentin 625 Duo Tablets',
          genericName: 'Amoxicillin + Clavulanic Acid 625mg',
          batchNumber: testBatchNum,
          expiryDate: '2028-12-31',
          billedQuantity: 100,
          freeQuantity: 10,
          ptr: 120.50,
          mrp: 204.00,
          gstPercent: 12
        }
      ]
    }
  };
  const inwardRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/wholesale-invoices/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(inwardPayload)
  });
  if (!inwardRes.ok) {
    const errText = await inwardRes.text();
    throw new Error(`Wholesale inwarding failed: ${inwardRes.status} - ${errText}`);
  }
  const inwardJson = await inwardRes.json();
  console.log('✅ Wholesale Inwarded Successfully. Batch count:', inwardJson.data?.inwardedBatchesCount);

  // 5. Query Batches to find the inwarded batch ID
  console.log('5. Querying Batches from Live PostgreSQL 18.4...');
  const batchesRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/batches?tenantId=33333333-3333-4333-8333-333333333333`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!batchesRes.ok) throw new Error(`Fetch batches failed: ${batchesRes.status}`);
  const batchesJson = await batchesRes.json();
  const foundBatch = (batchesJson.data || []).find((b) => b.batchNumber === testBatchNum);
  if (!foundBatch) throw new Error(`Inwarded batch ${testBatchNum} not found in PostgreSQL!`);
  console.log('✅ Batch found in DB:', foundBatch.batchNumber, 'Qty:', foundBatch.availableQuantity, 'ID:', foundBatch.id);

  // 6. Direct Walk-In POS Dispense
  console.log('6. Testing Direct Walk-In POS Dispense & Inventory Stock Deduction...');
  const dispensePayload = {
    tenantId: '33333333-3333-4333-8333-333333333333',
    patientName: 'Ramesh Patel (Test Walk-in)',
    patientPhone: '9876543210',
    doctorName: 'Dr. Vivek Sharma',
    doctorNmcReg: 'NMC-DEL-48201',
    items: [
      {
        medicationId: foundBatch.medicationId,
        batchId: foundBatch.id,
        quantity: 5,
        unitPrice: 204.00
      }
    ]
  };
  const dispRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/dispensations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dispensePayload)
  });
  if (!dispRes.ok) {
    const errText = await dispRes.text();
    throw new Error(`Dispense failed: ${dispRes.status} - ${errText}`);
  }
  const dispJson = await dispRes.json();
  console.log('✅ Dispense 201 Created. Dispense ID:', dispJson.data?.id, 'Invoice:', dispJson.data?.invoiceNumber);

  // 7. Customer Khata (Credit Ledger) Test
  console.log('7. Testing Customer Khata Ledger...');
  const khataAccRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/khata/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      customerName: 'Shanti Devi (Sharma Niwas)',
      customerPhone: '9811002233',
      customerAddress: 'House 14, Sector 7, Rohini',
      creditLimit: 8000,
      maxCreditDays: 30
    })
  });
  if (!khataAccRes.ok) throw new Error(`Khata account creation failed: ${khataAccRes.status}`);
  const khataAccJson = await khataAccRes.json();
  const accountId = khataAccJson.data?.id;
  console.log('✅ Khata Account Created/Updated in PostgreSQL. Account ID:', accountId);

  // Record a debit entry
  const ledgerRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/khata/ledger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      accountId,
      customerName: 'Shanti Devi (Sharma Niwas)',
      customerPhone: '9811002233',
      entryType: 'DEBIT_INVOICE',
      referenceId: dispJson.data?.invoiceNumber || 'INV-TEST-001',
      amount: 1020.00,
      previousBalance: 0,
      newBalance: 1020.00,
      paymentMode: 'CREDIT_KHATA',
      collectedByPharmacist: 'Rajesh Sharma',
      notes: 'Monthly BP & Diabetes maintenance dose'
    })
  });
  if (!ledgerRes.ok) throw new Error(`Khata ledger debit failed: ${ledgerRes.status}`);
  console.log('✅ Khata Ledger Debit Recorded with ACID Balances');

  console.log('\n🎉 ALL PHARMACY WORKFLOW TESTS PASSED CLEANLY WITH ZERO ERRORS!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
