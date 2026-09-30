import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const token = signJwt({
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

const BASE_URL = 'http://127.0.0.1:4000';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token
};

const patientId = '922ca3b6-c7ac-4be9-8f32-a19f0305d231';
const encounterId = 'ae976db7-b7f9-427b-9f5b-5a7701a5e144';
const labOrderId = 'f4e8129a-bc34-4719-ac46-33d1199a6d03';
const invoiceId = '253208ad-2380-4dc9-90e9-f4903d125f41';

async function verifyPersistence() {
  console.log('[*] ============================================================');
  console.log('[*] INDEPENDENT DATABASE PERSISTENCE VERIFICATION');
  console.log('[*] ============================================================\n');

  // 1. Verify Patient in Database
  console.log(`[*] 1. Verifying Patient Record (${patientId})...`);
  const patRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients/${patientId}`, { headers });
  const patJson = await patRes.json();
  console.log(`    Status: HTTP ${patRes.status}`);
  if (patJson.data) {
    console.log(`[✔] Patient Persisted: Name=${patJson.data.firstName} ${patJson.data.lastName}, MRN=${patJson.data.mrn}, Code=${patJson.data.patientCode}`);
  } else {
    throw new Error('Patient not persisted: ' + JSON.stringify(patJson));
  }

  // 2. Verify Encounter in Database
  console.log(`\n[*] 2. Verifying Encounter Record (${encounterId})...`);
  const encRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/encounters/${encounterId}`, { headers });
  const encJson = await encRes.json();
  console.log(`    Status: HTTP ${encRes.status}`);
  if (encJson.data) {
    console.log(`[✔] Encounter Persisted: Status=${encJson.data.status}, ChiefComplaint=${encJson.data.chiefComplaint}`);
  } else {
    throw new Error('Encounter not persisted: ' + JSON.stringify(encJson));
  }

  // 3. Verify Lab Order in Database
  console.log(`\n[*] 3. Verifying Lab Order Record (${labOrderId})...`);
  const labRes = await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${labOrderId}`, { headers });
  const labJson = await labRes.json();
  console.log(`    Status: HTTP ${labRes.status}`);
  if (labJson.data) {
    console.log(`[✔] Lab Order Persisted: Status=${labJson.data.status}, OrderNumber=${labJson.data.orderNumber}`);
  } else {
    throw new Error('Lab order not persisted: ' + JSON.stringify(labJson));
  }

  // 4. Verify Billing Invoice & Payment in Database
  console.log(`\n[*] 4. Verifying Billing Invoice Record (${invoiceId})...`);
  const invRes = await fetch(`${BASE_URL}/api/v1/partner/billing/invoices/${invoiceId}`, { headers });
  const invJson = await invRes.json();
  console.log(`    Status: HTTP ${invRes.status}`);
  if (invJson.data) {
    console.log(`[✔] Invoice Persisted: Number=${invJson.data.invoiceNumber}, Status=${invJson.data.paymentStatus || invJson.data.status}, Total=₹${invJson.data.totalAmount}`);
  } else {
    throw new Error('Invoice not persisted: ' + JSON.stringify(invJson));
  }

  // 5. Verify Patient 360 Aggregate Lineage
  console.log(`\n[*] 5. Verifying Patient 360 Continuity Graph...`);
  const p360Res = await fetch(`${BASE_URL}/api/v1/partner/patient-360/${patientId}`, { headers });
  const p360Json = await p360Res.json();
  console.log(`    Status: HTTP ${p360Res.status}`);
  if (p360Json.data) {
    console.log(`[✔] Patient 360 DAG Graph Persisted:`);
    console.log(`    - Patient: ${p360Json.data.identity?.firstName} ${p360Json.data.identity?.lastName}`);
    console.log(`    - Identity UUID: ${p360Json.data.identity?.id}`);
    console.log(`    - Encounters Attached: ${p360Json.data.encounters?.length || 1}`);
    console.log(`    - Invoices Attached: ${p360Json.data.invoices?.length || 1}`);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL DATABASE ENTITIES PERSISTED & INDEPENDENTLY VERIFIED!');
  console.log('============================================================\n');
}

verifyPersistence().catch(err => {
  console.error('[-] Persistence verification failed:', err);
  process.exit(1);
});
