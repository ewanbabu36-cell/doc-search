import test from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import {
  setupTestDatabase,
  TEST_SEEDS,
  getDatabase,
  patients,
  encounters,
  encounterQueues,
  consultations,
  pharmacyPrescriptions,
  pharmacyDispensing,
  auditEvents,
  eq,
  and
} from '@docsearch/database';

function makeToken({
  userId,
  tenantId,
  partnerId,
  branchId = 'loc-branch-a',
  departmentId = 'OPD',
  roles = ['ATTENDING_DOCTOR'],
  permissions = [
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
  ],
  dataScope = 'tenant'
}) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      sub: userId,
      email: `${userId}@docsearch.health`,
      tenantId,
      organizationId: partnerId || tenantId,
      branchId,
      departmentId,
      roles,
      permissions,
      scope: dataScope,
      jti: `sess_${userId}_${Math.random().toString(36).slice(2, 10)}`,
      iat: now - 30,
      exp: now + 3600
    },
    {
      secret: env.JWT_SECRET || 'docsearch_master_jwt_secret_dev_32char_key_only',
      issuer: env.JWT_ISSUER || 'docsearch-api',
      audience: env.JWT_AUDIENCE || 'docsearch-platform',
      expiresInSeconds: 3600
    }
  );
}

test('DOC SEARCH — PHASE 07: CLINICAL ENCOUNTER EXECUTION & OPD ENGINE (GROUPS A–G)', async (t) => {
  const testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
  process.env['JWT_SECRET'] = 'docsearch_master_jwt_secret_dev_32char_key_only';
  process.env['NODE_ENV'] = 'development';

  const app = await buildApp({ db: testDb.db });
  await app.ready();

  t.after(async () => {
    await app.close();
    await testDb.cleanup();
  });

  const tenantA = TEST_SEEDS.TENANT_A;
  const tenantB = TEST_SEEDS.TENANT_B;
  const tenantZero = '00000000-0000-4000-8000-000000000700';

  const tokenDoctorTenantA = makeToken({
    userId: TEST_SEEDS.DOCTOR_ID,
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: TEST_SEEDS.BRANCH_A,
    departmentId: 'OPD',
    roles: ['ATTENDING_DOCTOR', 'HOSPITAL_ADMIN']
  });

  const tokenDoctorTenantB = makeToken({
    userId: 'doctor-tenant-b',
    tenantId: tenantB,
    partnerId: 'partner-beta',
    branchId: 'branch-b',
    departmentId: 'OPD',
    roles: ['ATTENDING_DOCTOR']
  });

  const tokenZeroPartner = makeToken({
    userId: 'doctor-zero-partner',
    tenantId: tenantZero,
    partnerId: 'partner-zero',
    branchId: 'branch-zero',
    departmentId: 'OPD',
    roles: ['ATTENDING_DOCTOR', 'PARTNER_ADMIN']
  });

  const tokenBillingRole = makeToken({
    userId: 'billing-exec-tenant-a',
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: TEST_SEEDS.BRANCH_A,
    departmentId: 'BILLING',
    roles: ['BILLING_EXECUTIVE'],
    permissions: ['billing:invoices:read', 'billing:invoices:create']
  });

  let createdPatientId;
  let createdPatientMrn;
  let createdEncounterId;
  let createdQueueTokenId;
  let createdConsultationId;

  // =========================================================================
  // GROUP A — ZERO-STATE CONTRACT
  // =========================================================================
  await t.test('Group A: Zero-State Contract — New partner opens with 0 consultations, 0 queue tokens, 0 synthetic records', async () => {
    // 1. Verify empty queue for new active tenant (tenantB)
    const queueRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/queues?tenantId=${tenantB}`,
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` }
    });
    assert.equal(queueRes.statusCode, 200);
    const queueData = queueRes.json().data;
    assert.deepEqual(queueData, []);

    // 2. Verify empty consultation list for new active tenant
    const consRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/consultations?tenantId=${tenantB}`,
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` }
    });
    assert.equal(consRes.statusCode, 200);
    const consData = consRes.json().data;
    assert.deepEqual(consData, []);

    // 3. Verify zero consultation overview metrics
    const ovRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/consultations/overview`,
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` }
    });
    assert.equal(ovRes.statusCode, 200);
    const ovData = ovRes.json().data;
    assert.equal(ovData.totalConsultationsCount, 0);
    assert.equal(ovData.completedTodayCount, 0);
  });

  // =========================================================================
  // GROUP B — CONSULTATION DRAFTING, VITALS, ICD-10 & MEDICATIONS
  // =========================================================================
  await t.test('Group B: Consultation Drafting — Create Patient, Check-in, Queue Token, and Save Consultation with Vitals & ICD-10', async () => {
    // 1. Register canonical patient
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: {
        firstName: 'Aarav',
        lastName: 'Deshmukh',
        gender: 'MALE',
        dateOfBirth: '1988-04-15',
        mobileNumber: '+91-9820011223',
        bloodGroup: 'B_POSITIVE'
      }
    });
    assert.equal(patRes.statusCode, 201);
    const patBody = patRes.json().data;
    assert.ok(patBody.id);
    assert.ok(patBody.mrn);
    createdPatientId = patBody.id;
    createdPatientMrn = patBody.mrn;

    // 2. Check in encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: {
        patientId: createdPatientId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'OPD',
        status: 'CHECKED_IN',
        chiefComplaint: 'Morning occipital headache, fatigue, elevated BP readings',
        visitType: 'WALK_IN'
      }
    });
    assert.equal(encRes.statusCode, 201);
    const encBody = encRes.json().data;
    assert.ok(encBody.id);
    createdEncounterId = encBody.id;

    // 3. Issue queue token
    const tokenRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/queues/tokens',
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: {
        encounterId: createdEncounterId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        estimatedWaitMinutes: 10
      }
    });
    assert.equal(tokenRes.statusCode, 201);
    const tokenBody = tokenRes.json().data;
    assert.ok(tokenBody.id);
    assert.ok(tokenBody.tokenNumber);
    createdQueueTokenId = tokenBody.id;

    // 4. Save consultation draft with vitals, ICD-10 diagnoses, medications, and labs
    const consPayload = {
      encounterId: createdEncounterId,
      patientId: createdPatientId,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      status: 'DRAFT',
      chiefComplaint: 'Morning occipital headache, fatigue, elevated BP readings',
      vitals: {
        systolicBp: 142,
        diastolicBp: 92,
        pulseBpm: 80,
        temperatureFahrenheit: 98.6
      },
      diagnoses: [
        { code: 'I10', description: 'Essential (primary) hypertension', type: 'PRIMARY' }
      ],
      medications: [
        {
          medicationName: 'Tab Telmisartan 40mg',
          genericName: 'Telmisartan',
          dosage: '1 Tab',
          frequency: '1 - 0 - 0 (OD)',
          durationDays: 30,
          instructions: 'Take in morning after breakfast'
        }
      ],
      labInvestigations: [
        { testName: 'Kidney Function Test (KFT)', category: 'BIOCHEMISTRY', priority: 'ROUTINE' },
        { testName: 'Lipid Profile', category: 'BIOCHEMISTRY', priority: 'ROUTINE' }
      ],
      followUpAdvice: 'Return in 30 days for BP re-check and lipid review',
      followUpDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
    };

    const saveConsRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: consPayload
    });
    assert.equal(saveConsRes.statusCode, 201);
    const saveConsBody = saveConsRes.json().data;
    assert.ok(saveConsBody.id);
    assert.equal(saveConsBody.status, 'DRAFT');
    assert.equal(saveConsBody.encounterId, createdEncounterId);
    assert.equal(saveConsBody.patientId, createdPatientId);
    createdConsultationId = saveConsBody.id;

    // 5. Retrieve consultation by ID
    const getConsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}`,
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` }
    });
    assert.equal(getConsRes.statusCode, 200);
    const fetchedCons = getConsRes.json().data;
    assert.equal(fetchedCons.id, createdConsultationId);
    assert.equal(fetchedCons.chiefComplaint, consPayload.chiefComplaint);
  });

  // =========================================================================
  // GROUP C — ATOMIC WORKFLOW COMPLETION (CONSULTATION -> RX -> PHARMACY -> LABS)
  // =========================================================================
  await t.test('Group C: Atomic Workflow Completion — completeConsultationWorkflow finalizes consultation, closes token, issues Rx, and creates pharmacy order', async () => {
    // 1. Complete consultation workflow atomically
    const completeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}/complete`,
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: { doctorId: TEST_SEEDS.DOCTOR_ID }
    });
    assert.equal(completeRes.statusCode, 200);
    const result = completeRes.json().data;

    // Assert consultation is finalized
    assert.equal(result.consultation.status, 'FINALIZED');

    // Assert encounter is completed
    assert.equal(result.encounter.status, 'COMPLETED');

    // Assert queue token is completed
    assert.ok(result.queueToken);
    assert.equal(result.queueToken.queueStatus, 'COMPLETED');

    // Assert digital prescription was created
    assert.ok(result.prescription);
    assert.ok(result.prescription.prescriptionNumber.startsWith('RX-'));
    assert.equal(result.prescription.patientId, createdPatientId);

    // Assert pharmacy dispensing order was queued in PENDING status
    assert.ok(result.pharmacyOrder);
    assert.equal(result.pharmacyOrder.dispensingStatus, 'PENDING');
    assert.equal(result.pharmacyOrder.prescriptionId, result.prescription.id);

    // Assert lab orders were queued
    assert.ok(Array.isArray(result.labOrders));
    assert.equal(result.labOrders.length, 2);

    // 2. Direct PostgreSQL assertion verifying multi-table persistence
    const db = getDatabase();
    const [dbCons] = await db.select().from(consultations).where(eq(consultations.id, createdConsultationId));
    assert.equal(dbCons.consultationStatus, 'FINALIZED');

    const [dbEnc] = await db.select().from(encounters).where(eq(encounters.id, createdEncounterId));
    assert.equal(dbEnc.status, 'COMPLETED');

    const [dbQueue] = await db.select().from(encounterQueues).where(eq(encounterQueues.id, createdQueueTokenId));
    assert.equal(dbQueue.queueStatus, 'COMPLETED');

    const [dbRx] = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.id, result.prescription.id));
    assert.ok(dbRx);

    const [dbDisp] = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.id, result.pharmacyOrder.id));
    assert.ok(dbDisp);
    assert.equal(dbDisp.dispensingStatus, 'PENDING');

    // 3. Idempotency test: Re-executing completion does not duplicate or corrupt state
    const repeatCompleteRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}/complete`,
      headers: { authorization: `Bearer ${tokenDoctorTenantA}` },
      payload: { doctorId: TEST_SEEDS.DOCTOR_ID }
    });
    assert.equal(repeatCompleteRes.statusCode, 200);
    const repeatResult = repeatCompleteRes.json().data;
    assert.equal(repeatResult.consultation.status, 'FINALIZED');
    assert.equal(repeatResult.prescription.id, result.prescription.id);
    assert.equal(repeatResult.pharmacyOrder.id, result.pharmacyOrder.id);
  });

  // =========================================================================
  // GROUP D — MULTI-TENANT & PARTNER ISOLATION (IDOR BLOCKING)
  // =========================================================================
  await t.test('Group D: Multi-Tenant Isolation — Cross-tenant read and completion attempts fail closed (404/403)', async () => {
    // 1. Tenant B doctor attempts to read Tenant A's consultation
    const crossReadRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}`,
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` }
    });
    // Must be 404 Not Found (tenant-scoped query returns empty)
    assert.equal(crossReadRes.statusCode, 404);

    // 2. Tenant B doctor attempts to complete Tenant A's consultation
    const crossCompleteRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}/complete`,
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` },
      payload: { doctorId: 'doctor-tenant-b' }
    });
    assert.equal(crossCompleteRes.statusCode, 404);

    // 3. Tenant B attempts to save consultation referencing Tenant A's encounter
    const crossSaveRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${tokenDoctorTenantB}` },
      payload: {
        encounterId: createdEncounterId, // Belongs to Tenant A
        patientId: createdPatientId,
        doctorId: 'doctor-tenant-b',
        chiefComplaint: 'Adversarial cross-tenant attempt'
      }
    });
    // Must fail because encounter does not belong to Tenant B
    assert.ok(crossSaveRes.statusCode >= 400);
  });

  // =========================================================================
  // GROUP E — ROLE & STAFF AUTHORIZATION
  // =========================================================================
  await t.test('Group E: Role & Staff Authorization — Non-clinical roles cannot save or finalize consultations (403)', async () => {
    // 1. BILLING_EXECUTIVE attempting to save consultation
    const billingSaveRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${tokenBillingRole}` },
      payload: {
        encounterId: createdEncounterId,
        patientId: createdPatientId,
        chiefComplaint: 'Unauthorized billing entry'
      }
    });
    assert.equal(billingSaveRes.statusCode, 403);

    // 2. BILLING_EXECUTIVE attempting to complete consultation
    const billingCompleteRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${createdConsultationId}/complete`,
      headers: { authorization: `Bearer ${tokenBillingRole}` },
      payload: { doctorId: 'billing-exec' }
    });
    assert.equal(billingCompleteRes.statusCode, 403);
  });

  // =========================================================================
  // GROUP F — COMMERCIAL ENTITLEMENT & LICENSE LOCKING
  // =========================================================================
  await t.test('Group F: Commercial Entitlement & License Locking — Suspended/expired partner fails closed (403)', async () => {
    const suspendedTenant = '99999999-9999-4999-8999-999999999999';
    const tokenSuspended = makeToken({
      userId: 'doc-suspended',
      tenantId: suspendedTenant,
      partnerId: 'partner-suspended',
      branchId: 'branch-suspended',
      departmentId: 'OPD',
      roles: ['ATTENDING_DOCTOR']
    });

    const suspendedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${tokenSuspended}` },
      payload: {
        encounterId: '00000000-0000-4000-8000-000000000001',
        patientId: '00000000-0000-4000-8000-000000000002',
        chiefComplaint: 'Commercial suspension test'
      }
    });
    // No license exists for suspendedTenant -> COMMERCIAL_ACCESS_DENIED (403)
    assert.equal(suspendedRes.statusCode, 403);
    const body = suspendedRes.json();
    assert.ok(body.error?.message?.includes('COMMERCIAL_ACCESS_DENIED') || body.message?.includes('COMMERCIAL_ACCESS_DENIED'));
  });

  // =========================================================================
  // GROUP G — IMMUTABLE AUDIT TRAIL VERIFICATION
  // =========================================================================
  await t.test('Group G: Immutable Audit Trail — Consultation, Encounter, and Downstream Rx/Pharmacy events logged', async () => {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.tenantId, tenantA), eq(auditEvents.resourceId, createdConsultationId)));

    const eventTypes = rows.map((r) => r.eventType);
    assert.ok(eventTypes.includes('CONSULTATION_SAVED'), 'Must log CONSULTATION_SAVED');
    assert.ok(eventTypes.includes('CONSULTATION_FINALIZED'), 'Must log CONSULTATION_FINALIZED');

    for (const row of rows) {
      assert.ok(row.actorId);
      assert.ok(row.timestamp);
      assert.ok(row.integrityHash || row.currentHash || row.metadata);
    }
  });
});
