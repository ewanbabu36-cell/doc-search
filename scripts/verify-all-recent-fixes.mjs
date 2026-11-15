const BASE_URL = 'http://127.0.0.1:4000';

async function probe() {
  console.log('=== VERIFYING RECENT FIXES & ENHANCEMENTS ===\n');

  // 1. Director Login
  console.log('1. Authenticating as Medical Director...');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'director@docsearch.health', password: 'Hospital@2026!' })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data?.accessToken;
  if (!token) {
    throw new Error(`Director login failed: ${JSON.stringify(loginJson)}`);
  }
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  console.log('   ✓ Director logged in successfully.\n');

  // 2. Pharmacy Batches Search
  console.log('2. Probing Pharmacy Batches Search...');
  const batchRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/pos/batches/search`, { headers });
  const batchData = await batchRes.json();
  console.log(`   HTTP Status: ${batchRes.status}`);
  const batchCount = Array.isArray(batchData.data) ? batchData.data.length : 0;
  console.log(`   Total Batches Found: ${batchCount}`);
  if (batchCount > 0) {
    console.log(`   Sample Batch: ${batchData.data[0].batchNumber} - ${batchData.data[0].medicationName || batchData.data[0].medicineName || 'Medication'}`);
  }
  console.log('');

  // 3. Pharmacy Customer Khata
  console.log('3. Probing Pharmacy Customer Khata...');
  const khataRes = await fetch(`${BASE_URL}/api/v1/partner/pharmacy/khata/customers`, { headers });
  const khataData = await khataRes.json();
  console.log(`   HTTP Status: ${khataRes.status}`);
  const khataCount = Array.isArray(khataData.data) ? khataData.data.length : 0;
  console.log(`   Total Khata Customers Found: ${khataCount}`);
  if (khataCount > 0) {
    console.log(`   Sample Customer: ${khataData.data[0].customerName || khataData.data[0].name} (Balance: ₹${khataData.data[0].currentBalanceMinorUnits / 100 || 0})`);
  }
  console.log('');

  // 4. Billing Unbilled Charges
  console.log('4. Probing Billing Unbilled Charges...');
  const unbilledRes = await fetch(`${BASE_URL}/api/v1/partner/billing/unbilled-charges`, { headers });
  const unbilledData = await unbilledRes.json();
  console.log(`   HTTP Status: ${unbilledRes.status}`);
  console.log(`   Response Success: ${unbilledData.success}`);
  const unbilledItems = unbilledData.data?.unbilledCharges || [];
  console.log(`   Total Unbilled Charges Found: ${unbilledItems.length}`);
  if (unbilledItems.length > 0) {
    console.log(`   Sample Charge: ${unbilledItems[0].serviceName} (₹${unbilledItems[0].unitPrice})`);
  }

  const patUnbilledRes = await fetch(`${BASE_URL}/api/v1/partner/billing/unbilled-charges?patientId=d2a877d0-66c6-46fe-b7f4-e17d6520e563`, { headers });
  const patUnbilledData = await patUnbilledRes.json();
  console.log(`   Patient-specific Unbilled Charges HTTP Status: ${patUnbilledRes.status}`);
  console.log(`   Patient Name: ${patUnbilledData.data?.patientName}, MRN: ${patUnbilledData.data?.patientMrn}, Items: ${patUnbilledData.data?.unbilledCharges?.length}`);
  console.log('');

  // 5. Dietary Overview & Diet Types
  console.log('5. Probing Dietary Module...');
  const dietOverviewRes = await fetch(`${BASE_URL}/api/v1/partner/dietary/overview`, { headers });
  const dietOverview = await dietOverviewRes.json();
  console.log(`   Dietary Overview Status: ${dietOverviewRes.status}`);
  console.log(`   Overview Metrics:`, dietOverview.data);

  const dietTypesRes = await fetch(`${BASE_URL}/api/v1/partner/dietary/diet-types`, { headers });
  const dietTypesData = await dietTypesRes.json();
  console.log(`   Diet Types Status: ${dietTypesRes.status}`);
  const dtCount = Array.isArray(dietTypesData.data) ? dietTypesData.data.length : 0;
  console.log(`   Total Diet Types: ${dtCount}`);
  if (dtCount > 0) {
    console.log(`   Sample Diet: ${dietTypesData.data[0].dietName} (${dietTypesData.data[0].category})`);
  }

  const dietOrdersRes = await fetch(`${BASE_URL}/api/v1/partner/dietary/orders`, { headers });
  const dietOrdersData = await dietOrdersRes.json();
  console.log(`   Diet Orders Status: ${dietOrdersRes.status}`);
  const doCount = Array.isArray(dietOrdersData.data) ? dietOrdersData.data.length : 0;
  console.log(`   Total Diet Orders: ${doCount}`);
  console.log('');

  console.log('=== ALL PROBES FINISHED ===');
}

probe().catch(console.error);
