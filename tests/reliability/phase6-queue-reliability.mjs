/**
 * PHASE 6 — Background Jobs, Queue Reliability & Idempotent Retries Audit Harness
 * Strictly measures FIFO token progression, subscription reconciliation, and idempotent retry guarantees.
 * ZERO assumed or fabricated numbers.
 */

import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { setupTestDatabase, TEST_SEEDS, getDatabase, pharmacyPrescriptions, pharmacyDispensing, eq } from '../../packages/database/dist/index.js';
import { signJwt } from '../../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function createStaffToken(roles, permissions = []) {
  return signJwt({
    sub: crypto.randomUUID(),
    email: 'staff.' + crypto.randomUUID().slice(0, 6) + '@docsearch.health',
    tenantId: TEST_SEEDS.TENANT_A,
    organizationId: TEST_SEEDS.TENANT_A,
    branchId: TEST_SEEDS.BRANCH_A,
    roles,
    permissions,
    iss: ISSUER,
    aud: AUDIENCE
  }, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

export async function runQueueReliabilityAudit() {
  console.log('============================================================');
  console.log('⚙️ PHASE 6 — QUEUE RELIABILITY, BACKGROUND JOBS & RETRIES');
  console.log('============================================================');

  await setupTestDatabase({ seedBaseline: true });
  const app = await buildApp();
  await app.ready();

  const doctorToken = createStaffToken(
    ['DOCTOR', 'HOSPITAL_ADMIN'],
    [
      'clinical:patients:create',
      'clinical:patients:read',
      'clinical:patients:update',
      'clinical:encounters:create',
      'clinical:encounters:read',
      'clinical:encounters:update',
      'clinical:consultations:create',
      'clinical:consultations:read',
      'clinical:consultations:update',
      'clinical:orders:create',
      'clinical:orders:read'
    ]
  );
  const doctorHeaders = { authorization: 'Bearer ' + doctorToken };

  const adminToken = createStaffToken(
    ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    ['subscriptions:read', 'subscriptions:update', 'subscriptions:create']
  );
  const adminHeaders = { authorization: 'Bearer ' + adminToken };

  const auditResults = {
    fifoQueueProgression: {},
    backgroundJobsReconciliation: {},
    idempotentRetryRecovery: {}
  };

  // -------------------------------------------------------------
  // 1. FIFO Queue Token Lifecycle & Ordering Integrity
  // -------------------------------------------------------------
  console.log('\n[+] Test 1: Testing FIFO Queue Lifecycle & State Transitions...');
  
  // Register 3 distinct patients and 3 distinct encounters
  const tokens = [];
  const tokenIssueTimes = [];
  for (let i = 1; i <= 3; i++) {
    const pRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: doctorHeaders,
      payload: {
        firstName: 'QueuePatient' + i,
        lastName: 'Subject',
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        dateOfBirth: '1990-01-0' + i,
        mobileNumber: '+91987654320' + i,
        address: 'Ward ' + i
      }
    });
    const patientId = JSON.parse(pRes.payload).data.id;

    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters',
      headers: doctorHeaders,
      payload: {
        patientId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'OPD',
        priority: 'ROUTINE',
        department: 'GENERAL_MEDICINE'
      }
    });
    const encounterId = JSON.parse(encRes.payload).data.id;

    const t0Token = performance.now();
    const tokenRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/queues/tokens',
      headers: doctorHeaders,
      payload: {
        encounterId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        branchId: TEST_SEEDS.BRANCH_A,
        estimatedWaitMinutes: 10 * i
      }
    });
    tokenIssueTimes.push(performance.now() - t0Token);
    tokens.push(JSON.parse(tokenRes.payload).data);
  }

  // Verify FIFO sequence numbering: TKN-001, TKN-002, TKN-003
  const tokenNumbers = tokens.map((t) => t.tokenNumber);
  const isStrictFifo = tokenNumbers.length === 3 &&
    tokenNumbers[0] === 'TKN-001' &&
    tokenNumbers[1] === 'TKN-002' &&
    tokenNumbers[2] === 'TKN-003';

  // Test state progression on Token 1: WAITING -> CALLED -> IN_PROGRESS -> COMPLETED
  const targetTokenId = tokens[0].id;
  const t0Call = performance.now();
  const callRes = await app.inject({
    method: 'PATCH',
    url: '/api/v1/partner/clinical/queues/' + targetTokenId + '/call',
    headers: doctorHeaders
  });
  const callDurationMs = performance.now() - t0Call;
  const callData = JSON.parse(callRes.payload).data;

  const t0Start = performance.now();
  const startRes = await app.inject({
    method: 'PATCH',
    url: '/api/v1/partner/clinical/queues/' + targetTokenId + '/start',
    headers: doctorHeaders
  });
  const startDurationMs = performance.now() - t0Start;
  const startData = JSON.parse(startRes.payload).data;

  const t0Complete = performance.now();
  const completeRes = await app.inject({
    method: 'PATCH',
    url: '/api/v1/partner/clinical/queues/' + targetTokenId + '/complete',
    headers: doctorHeaders
  });
  const completeDurationMs = performance.now() - t0Complete;
  const completeData = JSON.parse(completeRes.payload).data;

  auditResults.fifoQueueProgression = {
    tokensIssued: tokens.length,
    tokenNumbers,
    fifoOrderingVerified: isStrictFifo,
    lifecycleStates: {
      initial: tokens[0].queueStatus || tokens[0].status,
      afterCall: callData.queueStatus || callData.status,
      afterStart: startData.queueStatus || startData.status,
      afterComplete: completeData.queueStatus || completeData.status
    },
    transitionDurationsMs: {
      issueTokensAvg: Number((tokenIssueTimes.reduce((a, b) => a + b, 0) / tokenIssueTimes.length).toFixed(2)),
      callToken: Number(callDurationMs.toFixed(2)),
      startToken: Number(startDurationMs.toFixed(2)),
      completeToken: Number(completeDurationMs.toFixed(2))
    },
    verdict: isStrictFifo &&
      (callData.queueStatus === 'CALLED' || callData.status === 'CALLED') &&
      (startData.queueStatus === 'IN_PROGRESS' || startData.status === 'IN_PROGRESS') &&
      (completeData.queueStatus === 'COMPLETED' || completeData.status === 'COMPLETED')
      ? 'PASS — FIFO ORDERING & STATE MACHINE STRICTLY PRESERVED'
      : 'FAIL'
  };
  console.log('    ➔ Token Numbers: ' + tokenNumbers.join(', '));
  console.log('    ➔ Token States: ' + (tokens[0].queueStatus || tokens[0].status) + ' -> ' + (callData.queueStatus || callData.status) + ' -> ' + (startData.queueStatus || startData.status) + ' -> ' + (completeData.queueStatus || completeData.status));
  console.log('    ➔ FIFO Verdict: ' + auditResults.fifoQueueProgression.verdict);

  // -------------------------------------------------------------
  // 2. Subscription Expiry Reconciliation Background Job
  // -------------------------------------------------------------
  console.log('\n[+] Test 2: Testing Subscription Expiry Reconciliation Job...');
  const t0Job = performance.now();
  const reconRes = await app.inject({
    method: 'POST',
    url: '/api/v1/company/subscriptions/reconcile-expiries',
    headers: adminHeaders
  });
  const jobDurationMs = performance.now() - t0Job;
  const reconBody = JSON.parse(reconRes.payload);

  auditResults.backgroundJobsReconciliation = {
    statusCode: reconRes.statusCode,
    jobDurationMs: Number(jobDurationMs.toFixed(2)),
    activeSubscriptionsScanned: reconBody?.data?.active ?? 0,
    expiringSoonCount: reconBody?.data?.expiringSoon ?? 0,
    gracePeriodCount: reconBody?.data?.inGracePeriod ?? 0,
    expiredCount: reconBody?.data?.expired ?? 0,
    verdict: reconRes.statusCode === 200 ? 'PASS — BACKGROUND RECONCILIATION EXECUTED CLEANLY' : 'FAIL'
  };
  console.log('    ➔ Background Job Duration: ' + jobDurationMs.toFixed(2) + ' ms, Status: ' + reconRes.statusCode);
  console.log('    ➔ Active Scanned: ' + auditResults.backgroundJobsReconciliation.activeSubscriptionsScanned);

  // -------------------------------------------------------------
  // 3. Idempotent Order Retries & Double-Charge Prevention
  // -------------------------------------------------------------
  console.log('\n[+] Test 3: Testing Idempotent Order Retries & Double-Charge Prevention...');
  
  // Register Patient for Consultation
  const pRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/patients',
    headers: doctorHeaders,
    payload: {
      firstName: 'RetrySubject',
      lastName: 'Cardio',
      gender: 'MALE',
      dateOfBirth: '1984-07-22',
      mobileNumber: '+919876543111',
      address: 'Cardiac Wing'
    }
  });
  const patient4Id = JSON.parse(pRes.payload).data.id;

  const encRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/encounters',
    headers: doctorHeaders,
    payload: {
      patientId: patient4Id,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      encounterType: 'OPD',
      priority: 'ROUTINE',
      department: 'CARDIOLOGY'
    }
  });
  const encounter4Id = JSON.parse(encRes.payload).data.id;

  // Create Consultation with Medications
  const consultationRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/consultations',
    headers: doctorHeaders,
    payload: {
      patientId: patient4Id,
      encounterId: encounter4Id,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      chiefComplaint: 'Acute chest tightness, intermittent palpitations',
      status: 'IN_PROGRESS',
      diagnoses: [
        { code: 'I20.9', description: 'Angina pectoris, unspecified', isPrimary: true, type: 'PRIMARY' }
      ],
      medications: [
        {
          medicationName: 'Aspirin 75mg Gastro-resistant',
          genericName: 'Aspirin',
          strength: '75mg',
          dosage: '1 Tab',
          frequency: 'OD',
          duration: 30,
          durationUnit: 'DAYS',
          quantity: 30,
          instructions: 'Take once daily morning after food'
        }
      ],
      labInvestigations: ['Troponin I Quantitative', '12-Lead Electrocardiogram (ECG)'],
      followUpAdvice: 'Review in Cardiology OPD in 7 days'
    }
  });
  const consultation = JSON.parse(consultationRes.payload).data;

  // Finalize consultation via /complete to orchestrate prescription & pharmacy order
  const completeConsultRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/consultations/' + consultation.id + '/complete',
    headers: doctorHeaders,
    payload: { doctorId: TEST_SEEDS.DOCTOR_ID }
  });
  const completeBody = JSON.parse(completeConsultRes.payload);
  const prescriptionId = completeBody?.data?.prescription?.id;
  const pharmacyOrderId = completeBody?.data?.pharmacyOrder?.id;

  // Check initial count of prescriptions and dispensing in database
  const db = getDatabase();
  const initialRx = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.consultationId, consultation.id));
  const initialDisp = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.prescriptionId, prescriptionId));

  // Trigger retry-orders endpoint 3 consecutive times
  const retryResults = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const retryRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations/' + consultation.id + '/retry-orders',
      headers: doctorHeaders
    });
    retryResults.push({
      attempt,
      statusCode: retryRes.statusCode,
      returnedPrescriptionId: JSON.parse(retryRes.payload)?.data?.prescription?.id
    });
  }

  // Check database count after 3 retries
  const finalRx = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.consultationId, consultation.id));
  const finalDisp = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.prescriptionId, prescriptionId));

  auditResults.idempotentRetryRecovery = {
    initialPrescriptions: initialRx.length,
    initialDispensingRecords: initialDisp.length,
    retryAttempts: retryResults.length,
    retryStatuses: retryResults.map(r => r.statusCode),
    finalPrescriptions: finalRx.length,
    finalDispensingRecords: finalDisp.length,
    duplicateRecordsCreated: finalRx.length - initialRx.length,
    duplicateDispensingCreated: finalDisp.length - initialDisp.length,
    returnedPrescriptionMatch: retryResults.every(r => r.returnedPrescriptionId === prescriptionId),
    verdict: initialRx.length === 1 && finalRx.length === 1 && finalDisp.length === 1 &&
      retryResults.every(r => r.statusCode === 200 && r.returnedPrescriptionId === prescriptionId)
      ? 'PASS — ZERO DUPLICATE ORDERS / 100% IDEMPOTENT RECOVERY'
      : 'FAIL'
  };
  console.log('    ➔ Final Prescriptions: ' + finalRx.length + ' (Duplicates: ' + (finalRx.length - initialRx.length) + ')');
  console.log('    ➔ Final Dispensing: ' + finalDisp.length + ' (Duplicates: ' + (finalDisp.length - initialDisp.length) + ')');
  console.log('    ➔ Verdict: ' + auditResults.idempotentRetryRecovery.verdict);

  await app.close();

  fs.writeFileSync('./tests/reliability/phase6-queue-reliability-results.json', JSON.stringify(auditResults, null, 2));
  console.log('\n[+] Results saved to ./tests/reliability/phase6-queue-reliability-results.json');
  console.table(auditResults);
  return auditResults;
}

runQueueReliabilityAudit().catch((err) => {
  console.error('Fatal Queue Reliability audit error:', err);
  process.exit(1);
});
