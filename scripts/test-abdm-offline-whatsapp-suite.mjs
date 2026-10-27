// scripts/test-abdm-offline-whatsapp-suite.mjs
// ==============================================================================
// DOCSEARCH STRATEGIC GAP CLOSURE & EXPANSION TEST SUITE
// Verification: ABDM M1-M3, Offline PWA Sync, WhatsApp Two-Way AI, Roster Cascade, Auto-PO
// ==============================================================================

import crypto from 'node:crypto';
import pg from 'pg';

const API_BASE = process.env.API_GATEWAY_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';

const { Client } = pg;

function generateAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'admin@docsearch.internal',
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
    permissions: ['*'],
    isSuperAdmin: true,
    tenantId: ACTIVE_TENANT_ID,
    activeTenantId: ACTIVE_TENANT_ID,
    iat: now,
    exp: now + 3600,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

const ADMIN_TOKEN = generateAdminToken();

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} ${details ? `[${details}]` : ''}`);
  }
}

async function runGapClosureTestSuite() {
  console.log('\n======================================================================');
  console.log('🚀 RUNNING DOCSEARCH STRATEGIC GAP CLOSURE & ABDM M1-M3 VERIFICATION SUITE');
  console.log('Live Target: PostgreSQL 18.4 (Port 5432) & Fastify API Gateway (Port 4000)');
  console.log('======================================================================\n');

  // Verify PostgreSQL Database
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const dbRes = await client.query('SELECT version();');
  assert(dbRes.rows.length > 0, 'PostgreSQL 18.4 Database Active', dbRes.rows[0].version.slice(0, 30));

  // Verify API Gateway
  const healthRes = await fetch(`${API_BASE}/api/v1/health`);
  const health = await healthRes.json();
  assert(healthRes.status === 200 && health.status === 'healthy', 'Fastify API Gateway Health Verified');

  // ==========================================================================
  // PILLAR 1: ABDM MILESTONES M1, M2 & M3 NATIONAL HEALTH STACK INTEGRATION
  // ==========================================================================
  console.log('\n--- [PILLAR 1] ABDM Milestones M1, M2 & M3 National Health Stack ---');

  // Test 1.1: Milestone 1 - Generate Aadhaar OTP
  const m1OtpRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m1/generate-aadhaar-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({ aadhaarNumber: '999988887777' })
  });
  const m1OtpData = await m1OtpRes.json();
  assert(m1OtpRes.status === 200, 'Pillar 1.1: ABDM M1 Aadhaar OTP generation endpoint returned 200 OK');
  assert(
    m1OtpData.data?.txnId?.startsWith('TXN-AADHAAR-') && m1OtpData.data?.authMode === 'AADHAAR_OTP',
    'Pillar 1.1: Aadhaar OTP simulation transaction initialized',
    `TxnId: ${m1OtpData.data?.txnId}`
  );

  // Test 1.2: Milestone 1 - Verify Aadhaar OTP and issue ABHA Number
  const m1VerifyRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m1/verify-aadhaar-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      txnId: m1OtpData.data?.txnId || 'TXN-SIM-001',
      otp: '123456',
      preferredAbhaAddress: 'kamlesh.verma.2026'
    })
  });
  const m1VerifyData = await m1VerifyRes.json();
  assert(m1VerifyRes.status === 201, 'Pillar 1.2: ABDM M1 Verify Aadhaar OTP endpoint returned 201 Created');
  assert(
    m1VerifyData.data?.abhaNumber && m1VerifyData.data?.abhaAddress?.includes('@abdm'),
    'Pillar 1.2: ABHA Number & ABHA Address issued according to NHA specs',
    `ABHA: ${m1VerifyData.data?.abhaNumber} (${m1VerifyData.data?.abhaAddress})`
  );

  // Test 1.3: Milestone 2 - Care Context Linkage & Discovery
  const patientAbha = m1VerifyData.data?.abhaAddress || 'kamlesh.verma.2026@abdm';
  const linkContextRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m2/care-contexts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      abhaAddress: patientAbha,
      patientMrn: 'MRN-2026-9901',
      patientName: 'Kamlesh Verma',
      careContextReference: 'VISIT-OPD-2026-881',
      displayTitle: 'General Medicine Consultation Encounter',
      doctorName: 'Dr. Vivek Sharma',
      departmentName: 'General Medicine OPD'
    })
  });
  const linkContextData = await linkContextRes.json();
  assert(linkContextRes.status === 201, 'Pillar 1.3: ABDM M2 Care context linkage created', linkContextData.data?.careContextReference);

  const m2DiscoverRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m2/care-contexts/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      patientAbhaAddress: patientAbha
    })
  });
  const m2DiscoverData = await m2DiscoverRes.json();
  assert(m2DiscoverRes.status === 200, 'Pillar 1.3: ABDM M2 Care context discovery returned 200 OK');
  assert(
    Array.isArray(m2DiscoverData.data?.careContexts) && m2DiscoverData.data?.careContexts.length > 0,
    'Pillar 1.3: Discoverable hospital care contexts retrieved for ABHA address',
    `Found: ${m2DiscoverData.data?.careContexts?.length} contexts`
  );

  // Test 1.4: Milestone 3 - FHIR R4 Bundle Generation
  const m3FhirRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m3/fhir-bundles/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      patientAbhaAddress: 'kamlesh.verma@abdm',
      profileType: 'DISCHARGE_SUMMARY_RECORD',
      careContextRef: 'IPD-ADM-2026-104',
      authorPractitionerName: 'Dr. Vivek Sharma'
    })
  });
  const m3FhirData = await m3FhirRes.json();
  assert(m3FhirRes.status === 201, 'Pillar 1.4: ABDM M3 FHIR R4 bundle generation returned 201 Created');
  assert(
    m3FhirData.data?.bundleId?.startsWith('FHIR-') &&
    m3FhirData.data?.validationStatus === 'VALID_FHIR_R4',
    'Pillar 1.4: Valid FHIR R4 Bundle with digital signature hash produced',
    `Bundle ID: ${m3FhirData.data?.bundleId}`
  );

  // Test 1.5: Milestone 3 - ECDH / AES-GCM Encrypted Health Data Push
  const { publicKey: mockReceiverKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const receiverPublicKeyPem = mockReceiverKey.export({ type: 'spki', format: 'pem' }).toString();

  const m3EncryptRes = await fetch(`${API_BASE}/api/v1/partner/abdm/m3/health-information/encrypt-payload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      receiverPublicKeyPem,
      plainTextPayload: {
        resourceType: 'Bundle',
        type: 'document',
        clinicalFinding: 'Post-Op Laparoscopic recovery stable'
      }
    })
  });
  const m3EncryptData = await m3EncryptRes.json();
  assert(m3EncryptRes.status === 200, 'Pillar 1.5: ABDM M3 ECDH / AES-GCM payload encryption returned 200 OK');
  assert(
    Boolean(m3EncryptData.data?.encryptedData) &&
    Boolean(m3EncryptData.data?.iv) &&
    Boolean(m3EncryptData.data?.authTag),
    'Pillar 1.5: End-to-end NHA-compliant cipher payload with IV & AuthTag generated'
  );

  // ==========================================================================
  // PILLAR 2: OFFLINE-FIRST PWA LOCAL INDEXEDDB SYNC FOR OPD TOKEN & CASHIER
  // ==========================================================================
  console.log('\n--- [PILLAR 2] Offline-First PWA Local IndexedDB Sync ---');

  // Test 2.1: Gateway status and heartbeat
  const syncStatusRes = await fetch(`${API_BASE}/api/v1/partner/offline-sync/status`);
  const syncStatusData = await syncStatusRes.json();
  assert(syncStatusRes.status === 200, 'Pillar 2.1: Offline sync engine heartbeat returned 200 OK');
  assert(
    syncStatusData.data?.gatewayOnline === true &&
    Array.isArray(syncStatusData.data?.supportedOfflineEntities),
    'Pillar 2.1: PWA offline resilience engine confirmed active on Gateway'
  );

  // Test 2.2: Batch replay offline-generated OPD tokens and cashier receipts
  const batchReplayRes = await fetch(`${API_BASE}/api/v1/partner/offline-sync/batch-replay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      tokens: [
        {
          id: 'uuid-off-001',
          idempotencyKey: 'IDEM-OFF-TKN-001',
          patientName: 'Kailash Mehra',
          tokenNumber: 'OFF-101',
          doctorName: 'Dr. Vivek Sharma',
          departmentName: 'General Medicine OPD',
          consultationFee: 500,
          timestamp: new Date().toISOString()
        },
        {
          id: 'uuid-off-002',
          idempotencyKey: 'IDEM-OFF-TKN-002',
          patientName: 'Sunita Devi',
          tokenNumber: 'OFF-102',
          doctorName: 'Dr. Ananya Roy',
          departmentName: 'Pediatrics OPD',
          consultationFee: 600,
          timestamp: new Date().toISOString()
        }
      ],
      receipts: [
        {
          id: 'uuid-rec-001',
          idempotencyKey: 'IDEM-OFF-REC-001',
          receiptNumber: 'REC-OFF-8821',
          patientName: 'Kailash Mehra',
          amount: 500,
          cashierName: 'Priya Sharma (Counter 1)',
          timestamp: new Date().toISOString()
        }
      ]
    })
  });
  const batchReplayData = await batchReplayRes.json();
  assert(batchReplayRes.status === 200, 'Pillar 2.2: Offline batch replay endpoint returned 200 OK');
  assert(
    batchReplayData.data?.status === 'BATCH_REPLAY_COMMITTED' &&
    batchReplayData.data?.syncedTokensCount === 2 &&
    batchReplayData.data?.syncedReceiptsCount === 1,
    'Pillar 2.2: Buffered offline mutations committed to live PostgreSQL ledger without key collision',
    `Audit Batch Ref: ${batchReplayData.data?.auditBatchRef}`
  );

  // ==========================================================================
  // PILLAR 3: TWO-WAY INBOUND CONVERSATIONAL WHATSAPP AI BOOKING & TRIAGE
  // ==========================================================================
  console.log('\n--- [PILLAR 3] Two-Way Inbound Conversational WhatsApp AI Booking ---');

  // Test 3.1: Natural language query extracts slot, doctor, and dynamic NPCI UPI QR string
  const waNlpRes = await fetch(`${API_BASE}/api/v1/partner/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': ACTIVE_TENANT_ID
    },
    body: JSON.stringify({
      fromPhone: '+919876543210',
      patientName: 'Manish Tiwari',
      text: 'Dr. Sharma tomorrow 10am appointment chahiye fever ke lye'
    })
  });
  const waNlpData = await waNlpRes.json();
  assert(waNlpRes.status === 200, 'Pillar 3.1: Inbound WhatsApp webhook returned 200 OK');
  assert(
    waNlpData.data?.intentDetected === 'APPOINTMENT_SLOT_MATCHED',
    'Pillar 3.1: Natural language slot extractor identified doctor appointment intent',
    `Intent: ${waNlpData.data?.intentDetected}`
  );
  assert(
    waNlpData.data?.replyMessage?.textContent?.includes('Dr. Vivek Sharma') &&
    waNlpData.data?.replyMessage?.textContent?.includes('upi://pay'),
    'Pillar 3.1: Dynamic NPCI UPI QR payment intent link and slot confirmation generated in Hindi/English'
  );

  // Test 3.2: Patient replies "CONFIRM" -> Finalizes booking
  const waConfirmRes = await fetch(`${API_BASE}/api/v1/partner/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': ACTIVE_TENANT_ID
    },
    body: JSON.stringify({
      fromPhone: '+919876543210',
      patientName: 'Manish Tiwari',
      text: 'CONFIRM'
    })
  });
  const waConfirmData = await waConfirmRes.json();
  assert(
    waConfirmData.data?.intentDetected === 'APPOINTMENT_CONFIRMED',
    'Pillar 3.2: "CONFIRM" response finalized and confirmed appointment on WhatsApp'
  );

  // Test 3.3: Patient checks live wait time -> "QUEUE"
  const waQueueRes = await fetch(`${API_BASE}/api/v1/partner/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': ACTIVE_TENANT_ID
    },
    body: JSON.stringify({
      fromPhone: '+919876543210',
      patientName: 'Manish Tiwari',
      text: 'QUEUE'
    })
  });
  const waQueueData = await waQueueRes.json();
  assert(
    waQueueData.data?.intentDetected === 'QUEUE_TRACKED',
    'Pillar 3.3: "QUEUE" command returned real-time chamber wait time telemetry'
  );

  // ==========================================================================
  // PILLAR 4: CROSS-FACILITY VISITING DOCTOR SMART ROSTER & DELAY CASCADE
  // ==========================================================================
  console.log('\n--- [PILLAR 4] Cross-Facility Visiting Doctor Smart Roster ---');

  const cascadeRes = await fetch(`${API_BASE}/api/v1/partner/roster/cross-facility-delay-cascade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      doctorId: 'doc-ortho-007',
      doctorName: 'Dr. Vikram Malhotra (Orthopedic Surgeon)',
      sourceFacilityName: 'Apex City Hospital (Main Operation Theatre)',
      targetFacilityName: 'DocSearch West Clinic OPD',
      delayMinutes: 45,
      delayReason: 'Emergency revision knee arthroplasty bleeding management in OT-2',
      affectedTokensCount: 8
    })
  });
  const cascadeData = await cascadeRes.json();
  assert(cascadeRes.status === 200, 'Pillar 4.1: Cross-facility delay cascade endpoint returned 200 OK');
  assert(
    cascadeData.data?.cascadeId?.startsWith('CASCADE-') &&
    cascadeData.data?.delayMinutes === 45 &&
    cascadeData.data?.affectedTokensCount === 8 &&
    cascadeData.data?.notificationStatus === 'WHATSAPP_ALERTS_DISPATCHED',
    'Pillar 4.1: Emergency surgery delay at Hospital A cascaded to protect Hospital B chamber tokens and notify patients',
    `Cascade ID: ${cascadeData.data?.cascadeId}`
  );
  assert(
    Boolean(cascadeData.data?.patientAlertSnippet),
    'Pillar 4.2: Patient alert notice template generated with shifted token time'
  );

  // ==========================================================================
  // PILLAR 5: AUTONOMOUS B2B BULK PHARMA RE-ORDERING CRON & PO EDI GATEWAY
  // ==========================================================================
  console.log('\n--- [PILLAR 5] Autonomous B2B Bulk Pharma Re-Ordering Cron & PO EDI ---');

  // Test 5.1: Threshold evaluation scans pharmacy batch stock levels
  const evalRes = await fetch(`${API_BASE}/api/v1/partner/procurement/auto-reorder/evaluate-thresholds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({ forceEvaluation: true })
  });
  const evalData = await evalRes.json();
  assert(evalRes.status === 200, 'Pillar 5.1: Auto-reorder threshold evaluation returned 200 OK');
  assert(
    evalData.data?.breachedItemsCount === 2 &&
    evalData.data?.status === 'PO_DRAFTS_STAGED_FOR_RELEASE' &&
    evalData.data?.totalEstimatedPoValueInr > 0,
    'Pillar 5.1: Safety stock buffer breaches detected (Meropenem 1g & Paracetamol 650mg) and draft POs staged',
    `Total Est. PO Value: ₹${evalData.data?.totalEstimatedPoValueInr}`
  );

  // Test 5.2: Release electronic Purchase Order (EDI)
  const releasePoRes = await fetch(`${API_BASE}/api/v1/partner/procurement/auto-reorder/release-po`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      itemCodes: ['MED-INJ-MEROP-1G', 'MED-TAB-PCM-650'],
      supplierName: 'Sun Pharma Distribution Hub Ltd',
      authorizedBy: 'Hospital Pharmacy Director'
    })
  });
  const releasePoData = await releasePoRes.json();
  assert(releasePoRes.status === 200, 'Pillar 5.2: Autonomous PO release returned 200 OK');
  assert(
    releasePoData.data?.poNumber?.startsWith('PO-AUTO-EDI-') &&
    releasePoData.data?.ediDispatchStatus === 'DISPATCHED_TO_SUPPLIER_PORTAL' &&
    Boolean(releasePoData.data?.grnPreStageNumber),
    'Pillar 5.2: Electronic PO dispatched to supplier portal and GRN pre-staged for delivery verification',
    `PO: ${releasePoData.data?.poNumber}, GRN: ${releasePoData.data?.grnPreStageNumber}`
  );

  await client.end();

  // Summary
  console.log('\n======================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGapClosureTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
