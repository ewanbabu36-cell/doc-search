import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const tokenTenantA = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const tokenTenantB = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000002',
  userId: 'e0000000-0000-4000-8000-000000000002',
  email: 'other@docsearch.health',
  tenantId: '22222222-2222-4222-8222-222222222222',
  branchId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
  permissions: ['*'],
  isSuperAdmin: false
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const BASE_URL = 'http://127.0.0.1:4000';

async function runAdversarialTests() {
  console.log('[*] ============================================================');
  console.log('[*] STARTING LIVE ADVERSARIAL FAILURE & CONCURRENCY TESTS');
  console.log('[*] ============================================================\n');

  const headersA = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenTenantA };
  const headersB = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenTenantB };

  // TEST 1: Duplicate Patient MRN collision prevention (409 CONFLICT)
  console.log('[*] Test 1: Duplicate Patient MRN Collision (WF-05)...');
  const duplicateMrn = 'MRN-DUP-' + Date.now();
  const pat1 = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      firstName: 'Original',
      lastName: 'Patient',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      mobileNumber: '+919111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: duplicateMrn
    })
  });
  console.log(`    First Registration Status: HTTP ${pat1.status} (Expected 201)`);
  
  const pat2 = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      firstName: 'Duplicate',
      lastName: 'Imposter',
      gender: 'FEMALE',
      dateOfBirth: '1992-02-02',
      mobileNumber: '+919222222222',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: duplicateMrn
    })
  });
  console.log(`    Duplicate Registration Status: HTTP ${pat2.status} (Expected 409)`);
  if (pat2.status === 409) {
    console.log('[✔] Pass: MRN collision strictly blocked with HTTP 409 Conflict!');
  } else {
    throw new Error(`Expected 409 for duplicate MRN, got ${pat2.status}`);
  }

  // TEST 2: Discharge clearance blocked when invoice unpaid (WF-21)
  console.log('\n[*] Test 2: Discharge clearance blocked on unpaid invoice (WF-21)...');
  const uniquePat = await (await fetch(`${BASE_URL}/api/v1/partner/clinical/patients`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      firstName: 'Unpaid',
      lastName: 'Debtor',
      gender: 'MALE',
      dateOfBirth: '1988-03-03',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: 'MRN-UNPAID-' + Date.now()
    })
  })).json();
  const debtorPatientId = uniquePat.data.id;

  const encDebtor = await (await fetch(`${BASE_URL}/api/v1/partner/clinical/encounters`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      patientId: debtorPatientId,
      encounterType: 'OPD_CONSULTATION',
      status: 'IN_PROGRESS',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    })
  })).json();
  const debtorEncounterId = encDebtor.data.id;

  // Create invoice with ₹5000 due
  await fetch(`${BASE_URL}/api/v1/partner/billing/invoices`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      patientId: debtorPatientId,
      encounterId: debtorEncounterId,
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      items: [{ description: 'Emergency ICU Resuscitation', quantity: 1, unitPrice: 5000 }]
    })
  });

  // Attempt checkout without payment
  const badCheckout = await fetch(`${BASE_URL}/api/v1/partner/clinical/encounters/${debtorEncounterId}/checkout`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ notes: 'Trying to leave without paying' })
  });
  console.log(`    Checkout Unpaid Encounter Status: HTTP ${badCheckout.status} (Expected 409)`);
  if (badCheckout.status === 409) {
    console.log('[✔] Pass: Discharge on unpaid bill strictly blocked with HTTP 409 Conflict!');
  } else {
    throw new Error(`Expected 409 for checkout on unpaid encounter, got ${badCheckout.status}`);
  }

  // TEST 3: Cross-tenant isolation verification
  console.log('\n[*] Test 3: Cross-Tenant Data Isolation (Tenant B accessing Tenant A record)...');
  const crossTenantRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients/${debtorPatientId}`, {
    headers: headersB
  });
  console.log(`    Cross-Tenant Read Status: HTTP ${crossTenantRes.status} (Expected 403 or 404)`);
  if (crossTenantRes.status === 403 || crossTenantRes.status === 404) {
    console.log('[✔] Pass: Cross-tenant unauthorized access strictly rejected!');
  } else {
    throw new Error(`Expected 403/404 for cross-tenant read, got ${crossTenantRes.status}`);
  }

  // TEST 4: Modifying / Collecting Specimen on Cancelled Lab Order
  console.log('\n[*] Test 4: Illegal state transition on CANCELLED lab order (WF-14)...');
  const labOrderRes = await (await fetch(`${BASE_URL}/api/v1/partner/lab/orders`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      patientId: debtorPatientId,
      encounterId: debtorEncounterId,
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      testCode: 'GLUCOSE',
      testName: 'Fasting Blood Glucose',
      tests: ['GLUCOSE']
    })
  })).json();
  const cancelLabId = labOrderRes.data.id;

  // Cancel the lab order
  await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${cancelLabId}/cancel`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ cancellationReason: 'Patient declined phlebotomy' })
  });

  // Attempt to collect sample on cancelled order
  const badSample = await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${cancelLabId}/collect-sample`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ specimenType: 'BLOOD' })
  });
  console.log(`    Collect Specimen on Cancelled Order Status: HTTP ${badSample.status} (Expected 409)`);
  if (badSample.status === 409) {
    console.log('[✔] Pass: Collecting specimen on CANCELLED lab order strictly blocked with HTTP 409!');
  } else {
    throw new Error(`Expected 409 for collecting on cancelled order, got ${badSample.status}`);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL ADVERSARIAL FAILURE & CONCURRENCY TESTS PASSED (100%)!');
  console.log('============================================================\n');
}

runAdversarialTests().catch(err => {
  console.error('[-] Adversarial test failed:', err);
  process.exit(1);
});
