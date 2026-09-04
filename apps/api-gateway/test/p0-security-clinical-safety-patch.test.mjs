import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('P0 SECURITY + CLINICAL SAFETY PATCH TEST SUITE', () => {
  let app;
  let poolRef;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branch1 = TEST_SEEDS.FACILITY_ID_A;
  const expiredTenant = '33333333-3333-4333-8333-333333333333';
  const suspendedTenant = '44444444-4444-4444-8444-444444444444';
  const unentitledTenant = '55555555-5555-4555-8555-555555555555';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-doctor-01',
      email: overrides.email || 'dr.smith@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branch1,
      roles: overrides.roles || ['DOCTOR', 'ATTENDING_PHYSICIAN'],
      permissions: overrides.permissions || [
        'clinical:consultations:read',
        'clinical:consultations:create',
        'clinical:consultations:manage',
        'clinical:prescriptions:read',
        'clinical:prescriptions:create',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:patients:create',
        'clinical:patients:read',
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve',
        'ai_copilot:sepsis:read',
        'ai_copilot:sepsis:evaluate',
        'ai_copilot:sepsis:ack',
        'ai_copilot:ddi:evaluate',
        'ai_copilot:ddi:override',
        'ai_copilot:panic:read',
        'ai_copilot:panic:ack',
        'ai_copilot:analytics:read',
        'ai_copilot:models:manage'
      ]
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 7200
    });
  }

  let doctorATokenUser1;
  let doctorATokenUser2;
  let doctorBToken;
  let receptionToken;
  let financeToken;
  let expiredToken;
  let suspendedToken;
  let unentitledToken;

  let testPatientIdA;
  let testConsultationIdA;
  let testEmptyConsultationIdA;
  let testPrescriptionIdA;
  let testSoapId;
  let testSepsisAlertId;
  let testDdiId;
  let testPanicAlertId;

  const FEAT_AI_ID = '55555555-5555-4555-8555-555555555001';
  const UNENTITLED_PLAN_ID = '88888888-8888-4888-8888-888888888899';

  before(async () => {
    const testDb = await setupTestDatabase();
    const pool = testDb.pool;
    poolRef = pool;

    await pool.query(`
      INSERT INTO "core"."branches" ("id", "tenant_id", "name", "code")
      VALUES ('${branch1}', '${tenantA}', 'Main Hospital Branch', 'BRA-MAIN-01')
      ON CONFLICT DO NOTHING;

      -- Seed MODULE_AI_COPILOT feature and plan entitlement for Plan Pro and Enterprise
      INSERT INTO "company"."features" ("id", "code", "name", "description", "category", "status")
      VALUES ('${FEAT_AI_ID}', 'MODULE_AI_COPILOT', 'Premium AI Clinical Copilot', 'Ambient Scribe, CDSS & Intelligence', 'MODULE_ACCESS', 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."plan_entitlements" ("id", "plan_id", "feature_id", "entitlement_type", "value", "status")
      VALUES 
        ('55555555-5555-4555-8555-555555555099', '${TEST_SEEDS.PLAN_PRO_ID}', '${FEAT_AI_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555098', '${TEST_SEEDS.PLAN_ENTERPRISE_ID}', '${FEAT_AI_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555097', '${TEST_SEEDS.PLAN_STARTER_ID}', '${FEAT_AI_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE')
      ON CONFLICT DO NOTHING;

      -- Seed expired tenant
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${expiredTenant}', 'Expired Facility Partner', 'expired-partner')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('33333333-3333-4333-8333-333333333399', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.PRODUCT_ID}', '${TEST_SEEDS.PLAN_PRO_ID}', '1.0.0', 'EXPIRED', 'MONTHLY', now() - interval '60 days', now() - interval '30 days', now() - interval '30 days')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES 
        ('44444444-4444-4444-8444-444444444499', 'LIC-EXPIRED-SEEDA-PRO1', '${TEST_SEEDS.PARTNER_ID_A}', '${expiredTenant}', '33333333-3333-4333-8333-333333333399', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL', 'EXPIRED', 'ACTIVATED', 50, 25, 3, now() - interval '60 days', now() - interval '60 days', now() - interval '30 days', now() - interval '16 days', 'seed_signature_expired')
      ON CONFLICT DO NOTHING;

      -- Seed suspended tenant
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${suspendedTenant}', 'Suspended Facility Partner', 'suspended-partner')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('44444444-4444-4444-8444-444444444401', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.PRODUCT_ID}', '${TEST_SEEDS.PLAN_PRO_ID}', '1.0.0', 'SUSPENDED', 'MONTHLY', now() - interval '30 days', now() + interval '30 days', now() + interval '30 days')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES 
        ('44444444-4444-4444-8444-444444444402', 'LIC-SUSPENDED-SEEDA-PRO1', '${TEST_SEEDS.PARTNER_ID_A}', '${suspendedTenant}', '44444444-4444-4444-8444-444444444401', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL', 'SUSPENDED', 'ACTIVATED', 50, 25, 3, now() - interval '30 days', now() - interval '30 days', now() + interval '30 days', now() + interval '37 days', 'seed_signature_suspended')
      ON CONFLICT DO NOTHING;

      -- Seed unentitled tenant (plan without MODULE_AI_COPILOT)
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${unentitledTenant}', 'Unentitled Facility Partner', 'unentitled-partner')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."plans" ("id", "product_id", "code", "name", "description", "status", "version", "metadata")
      VALUES ('${UNENTITLED_PLAN_ID}', '${TEST_SEEDS.PRODUCT_ID}', 'PLAN_BASIC_NO_AI', 'Basic Plan No AI', 'No AI copilot', 'ACTIVE', '1.0.0', '{}'::jsonb)
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('55555555-5555-4555-8555-555555555501', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.PRODUCT_ID}', '${UNENTITLED_PLAN_ID}', '1.0.0', 'ACTIVE', 'MONTHLY', now(), now() + interval '30 days', now() + interval '30 days')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES 
        ('55555555-5555-4555-8555-555555555502', 'LIC-UNENTITLED-SEEDA', '${TEST_SEEDS.PARTNER_ID_B}', '${unentitledTenant}', '55555555-5555-4555-8555-555555555501', '${UNENTITLED_PLAN_ID}', 'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 10, 5, 1, now(), now(), now() + interval '30 days', now() + interval '37 days', 'seed_signature_unentitled')
      ON CONFLICT DO NOTHING;
    `);

    app = await buildApp();
    await app.ready();

    doctorATokenUser1 = createTestToken({ userId: 'usr-doc-01', tenantId: tenantA });
    doctorATokenUser2 = createTestToken({ userId: 'usr-doc-02', tenantId: tenantA });
    doctorBToken = createTestToken({ userId: 'usr-doc-b-01', tenantId: tenantB });
    receptionToken = createTestToken({ userId: 'usr-rec-01', roles: ['RECEPTION'], permissions: ['reception:read'] });
    financeToken = createTestToken({ userId: 'usr-fin-01', roles: ['FINANCE'], permissions: ['finance:read'] });
    expiredToken = createTestToken({ userId: 'usr-exp-01', tenantId: expiredTenant });
    suspendedToken = createTestToken({ userId: 'usr-susp-01', tenantId: suspendedTenant });
    unentitledToken = createTestToken({ userId: 'usr-unent-01', tenantId: unentitledTenant });

    // 1. Create test patient in Tenant A
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        dateOfBirth: '1990-05-15',
        gender: 'FEMALE',
        mobileNumber: '9876543210',
        bloodGroup: 'B_POSITIVE'
      }
    });
    const patBody = JSON.parse(patRes.body);
    testPatientIdA = patBody.data.id;

    // 2. Check in encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters/check-in',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientId: testPatientIdA,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'WALK_IN',
        chiefComplaint: 'Hypertension routine check'
      }
    });
    const encBody = JSON.parse(encRes.body);
    const encounterId1 = encBody.data.id;

    // 3. Create consultation with medication and diagnosis
    const consRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        encounterId: encounterId1,
        patientId: testPatientIdA,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        chiefComplaint: 'Hypertension routine check',
        vitals: {
          systolicBp: 130,
          diastolicBp: 85,
          heartRateBpm: 76,
          oxygenSaturationPercent: 99,
          temperatureFahrenheit: 98.6,
          bmi: 24
        },
        diagnoses: [
          { code: 'I10', description: 'Essential Hypertension', isPrimary: true, type: 'PRIMARY' }
        ],
        medications: [
          {
            medicationName: 'Amlodipine',
            dosage: '1 Tab',
            frequency: 'OD',
            duration: 30,
            instructions: 'Morning after breakfast'
          }
        ]
      }
    });
    const consBody = JSON.parse(consRes.body);
    testConsultationIdA = consBody.data.id;

    // 4. Create prescription directly via API
    const rxRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/prescriptions',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientId: testPatientIdA,
        encounterId: encounterId1,
        consultationId: testConsultationIdA,
        prescribingDoctorId: TEST_SEEDS.DOCTOR_ID,
        items: [
          {
            medicationName: 'Amlodipine',
            dosage: '1 Tab',
            frequency: 'OD',
            duration: 30,
            instructions: 'Morning after breakfast'
          }
        ]
      }
    });
    const rxBody = JSON.parse(rxRes.body);
    testPrescriptionIdA = rxBody.data.id;

    // 5. Empty consultation (0 medications, 0 diagnoses)
    const enc2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters/check-in',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientId: testPatientIdA,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'WALK_IN',
        chiefComplaint: 'Wellness examination'
      }
    });
    const enc2Body = JSON.parse(enc2Res.body);
    const encounterId2 = enc2Body.data.id;

    const consEmptyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        encounterId: encounterId2,
        patientId: testPatientIdA,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        chiefComplaint: 'Wellness examination',
        vitals: {
          systolicBp: 120,
          diastolicBp: 80,
          heartRateBpm: 72,
          oxygenSaturationPercent: 98,
          temperatureFahrenheit: 98.4,
          bmi: 22.5
        },
        diagnoses: [],
        medications: []
      }
    });
    const consEmptyBody = JSON.parse(consEmptyRes.body);
    testEmptyConsultationIdA = consEmptyBody.data.id;

    // 6. Seed CDSS mutation targets in Tenant A
    const soapRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientMrn: 'MRN-P0-001',
        patientName: 'Ananya Deshmukh',
        doctorName: 'Dr. Smith',
        specialtyName: 'General Medicine',
        audioDurationSeconds: 120,
        clinicalDialogueTranscript: 'Doctor: Hello Ananya. Patient: Feeling better.'
      }
    });
    testSoapId = JSON.parse(soapRes.body).data.id;

    const sepsisRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/sepsis/evaluate',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientMrn: 'MRN-P0-001',
        patientName: 'Ananya Deshmukh',
        bedNumber: 'ICU-1',
        wardName: 'ICU',
        respiratoryRate: 26,
        spO2Pct: 88,
        requiresSupplementalO2: true,
        systolicBp: 80,
        pulseRate: 130,
        temperatureCelsius: 39.5,
        consciousnessLevel: 'VOICE',
        serumLactateMmolL: 4.0
      }
    });
    testSepsisAlertId = JSON.parse(sepsisRes.body).data.id;

    const ddiRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ddi/evaluate',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientMrn: 'MRN-P0-001',
        activeMedications: ['Warfarin 5mg'],
        newMedicationToPrescribe: 'Clarithromycin 500mg'
      }
    });
    testDdiId = JSON.parse(ddiRes.body).data.id;

    const panicRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/panic-values',
      headers: { authorization: `Bearer ${doctorATokenUser1}` },
      payload: {
        patientMrn: 'MRN-P0-001',
        patientName: 'Ananya Deshmukh',
        location: 'ICU',
        testName: 'Potassium',
        measuredValue: '6.8 mmol/L',
        referenceNormalRange: '3.5 - 5.0 mmol/L',
        panicThreshold: '> 6.0 mmol/L',
        category: 'ELECTROLYTE_CRITICAL',
        doctorName: 'Dr. Smith'
      }
    });
    testPanicAlertId = JSON.parse(panicRes.body).data.id;
  });

  after(async () => {
    if (app) await app.close();
  });

  // ===========================================================================
  // P0-001: IDEMPOTENCY ISOLATION
  // ===========================================================================
  describe('P0-001: Idempotency Isolation', () => {
    const sharedIdempotencyKey = 'idemp-p0-test-shared-key-12345';
    const ddiPayload = {
      patientMrn: 'MRN-P0-001',
      activeMedications: ['Warfarin 5mg'],
      newMedicationToPrescribe: 'Clarithromycin 500mg'
    };

    it('Test A: Unauthenticated request with an existing idempotency key returns 401, not cached response', async () => {
      // Seed cached response via authorized caller
      const firstRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': sharedIdempotencyKey
        },
        payload: ddiPayload
      });
      assert.equal(firstRes.statusCode, 200);

      // Unauthenticated attacker sends same idempotency key
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          'x-idempotency-key': sharedIdempotencyKey
        },
        payload: {
          patientMrn: 'ATTACKER',
          activeMedications: [],
          newMedicationToPrescribe: ''
        }
      });

      assert.equal(unauthRes.statusCode, 401, 'Unauthenticated request must be rejected with 401, not return cached response');
    });

    it('Test B: Tenant B subsequently using same idempotency key does not receive Tenant A cached response', async () => {
      const resTenantB = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorBToken}`,
          'x-idempotency-key': sharedIdempotencyKey
        },
        payload: ddiPayload
      });

      assert.equal(resTenantB.statusCode, 200);
      assert.notEqual(resTenantB.headers['x-cache'], 'IDEMPOTENT_HIT', 'Cross-tenant idempotency hit must be impossible');
    });

    it('Test C: Different users in the same tenant cannot receive one another cached response', async () => {
      const userKey = 'idemp-p0-user-isolation-key-999';

      const resUser1 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': userKey
        },
        payload: ddiPayload
      });
      assert.equal(resUser1.statusCode, 200);

      const resUser2 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser2}`,
          'x-idempotency-key': userKey
        },
        payload: ddiPayload
      });
      assert.equal(resUser2.statusCode, 200);
      assert.notEqual(resUser2.headers['x-cache'], 'IDEMPOTENT_HIT', 'Different user must not get cache hit on same key');
    });

    it('Test D: Different routes/methods using the same key cannot collide', async () => {
      const collisionKey = 'idemp-p0-collision-key-888';

      const resRoute1 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': collisionKey
        },
        payload: {
          patientMrn: 'MRN-P0-001',
          patientName: 'Ananya Deshmukh',
          doctorName: 'Dr. Smith',
          specialtyName: 'General Medicine',
          audioDurationSeconds: 120,
          clinicalDialogueTranscript: 'Doctor: Hello Ananya.'
        }
      });
      assert.equal(resRoute1.statusCode, 201);

      const resRoute2 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': collisionKey
        },
        payload: ddiPayload
      });
      assert.equal(resRoute2.statusCode, 200);
      assert.notEqual(resRoute2.headers['x-cache'], 'IDEMPOTENT_HIT', 'Different route must not collide on idempotency key');
    });

    it('Test E: Legitimate retry by same authenticated identity receives x-cache: IDEMPOTENT_HIT', async () => {
      const legitimateKey = 'idemp-p0-legit-retry-777';

      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': legitimateKey
        },
        payload: ddiPayload
      });
      assert.equal(res1.statusCode, 200);

      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/evaluate',
        headers: {
          authorization: `Bearer ${doctorATokenUser1}`,
          'x-idempotency-key': legitimateKey
        },
        payload: ddiPayload
      });
      assert.equal(res2.statusCode, res1.statusCode);
      assert.equal(res2.headers['x-cache'], 'IDEMPOTENT_HIT');
    });
  });

  // ===========================================================================
  // P0-002: CLINICAL PDF FAIL-CLOSED
  // ===========================================================================
  describe('P0-002: Clinical PDF Fail-Closed', () => {
    it('Test A: Missing consultation returns 404 (no fabricated fallback PDF)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/clinical/consultations/00000000-0000-4000-8000-000000009999/pdf',
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 404);
    });

    it('Test B: Cross-tenant consultation returns 404 (no Tenant A data leaked)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/consultations/${testConsultationIdA}/pdf`,
        headers: { authorization: `Bearer ${doctorBToken}` }
      });
      assert.equal(res.statusCode, 404);
    });

    it('Test C: Missing patient for existing consultation returns 404', async () => {
      // Create patient in Tenant B
      const pBRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${doctorBToken}` },
        payload: {
          firstName: 'Foreign',
          lastName: 'Patient',
          dateOfBirth: '1985-01-01',
          gender: 'MALE',
          mobileNumber: '9123456780'
        }
      });
      const patientBId = JSON.parse(pBRes.body).data.id;

      // Create encounter for patientB in Tenant B
      const encBRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/encounters/check-in',
        headers: { authorization: `Bearer ${doctorBToken}` },
        payload: {
          patientId: patientBId,
          doctorId: TEST_SEEDS.DOCTOR_ID,
          encounterType: 'WALK_IN',
          chiefComplaint: 'Orphan test'
        }
      });
      const encounterBId = JSON.parse(encBRes.body).data.id;

      // Create consultation in Tenant A referencing patientBId (patient is not in Tenant A's patient registry)
      const orphanConsRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/consultations',
        headers: { authorization: `Bearer ${doctorATokenUser1}` },
        payload: {
          encounterId: encounterBId,
          patientId: patientBId,
          doctorId: TEST_SEEDS.DOCTOR_ID,
          chiefComplaint: 'Orphan test',
          vitals: {},
          diagnoses: [],
          medications: []
        }
      });
      const orphanConsId = JSON.parse(orphanConsRes.body).data.id;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/consultations/${orphanConsId}/pdf`,
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 404);
    });

    it('Test D: Valid consultation with zero medications succeeds with accurate empty state and NO fabricated Metformin/Atorvastatin/Telmisartan', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/consultations/${testEmptyConsultationIdA}/pdf`,
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/pdf');

      const pdfText = res.rawPayload.toString('utf8');
      assert.ok(!pdfText.includes('Metformin'), 'Must NOT contain Metformin');
      assert.ok(!pdfText.includes('Atorvastatin'), 'Must NOT contain Atorvastatin');
      assert.ok(!pdfText.includes('Telmisartan'), 'Must NOT contain Telmisartan');
      assert.ok(!pdfText.includes('Rahul Kumar'), 'Must NOT contain Rahul Kumar');
    });

    it('Test E: Valid consultation with no diagnoses succeeds with accurate empty state and no fabricated diagnoses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/consultations/${testEmptyConsultationIdA}/pdf`,
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 200);
      const pdfText = res.rawPayload.toString('utf8');
      assert.ok(!pdfText.includes('Type 2 diabetes mellitus'), 'Must NOT contain fabricated diabetes diagnosis');
      assert.ok(!pdfText.includes('E11.9'), 'Must NOT contain fabricated ICD-10 E11.9');
    });

    it('Test F: /clinical/prescriptions/:id/pdf treats :id as prescription ID and resolves linked data', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/prescriptions/${testPrescriptionIdA}/pdf`,
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/pdf');

      const pdfText = res.rawPayload.toString('utf8');
      assert.ok(pdfText.includes('Ananya Deshmukh'), 'Must contain actual patient name');
      assert.ok(pdfText.includes('Amlodipine'), 'Must contain actual prescribed medication');
    });
  });

  // ===========================================================================
  // P0-003: COMMERCIAL ENTITLEMENT ENFORCEMENT
  // ===========================================================================
  describe('P0-003: Commercial Entitlement Enforcement', () => {
    it('Test A: Valid authenticated tenant with MODULE_AI_COPILOT succeeds', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai-copilot/overview',
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
    });

    it('Test B: Tenant without MODULE_AI_COPILOT returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai-copilot/overview',
        headers: { authorization: `Bearer ${unentitledToken}` }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test C: Expired commercial license returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai-copilot/overview',
        headers: { authorization: `Bearer ${expiredToken}` }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test D: Suspended commercial license returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai-copilot/overview',
        headers: { authorization: `Bearer ${suspendedToken}` }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test E: Unauthenticated request returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai-copilot/overview'
      });
      assert.equal(res.statusCode, 401);
    });
  });

  // ===========================================================================
  // P0-004: CLINICAL RBAC ON HIGH-RISK AI/CDSS MUTATIONS
  // ===========================================================================
  describe('P0-004: Clinical RBAC on High-Risk AI/CDSS Mutations', () => {
    it('Test A: Non-clinical user (RECEPTION) cannot approve SOAP note (403)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/partner/ai-copilot/ambient-scribe/soap/${testSoapId}/approve`,
        headers: { authorization: `Bearer ${receptionToken}` }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test B: Non-clinical user (FINANCE) cannot override DDI warning (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai-copilot/ddi/override',
        headers: { authorization: `Bearer ${financeToken}` },
        payload: {
          interactionId: testDdiId,
          clinicalJustification: 'Overridden for financial reasons'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test C: Non-clinical user (RECEPTION) cannot acknowledge Sepsis alert (403)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/partner/ai-copilot/sepsis/alerts/${testSepsisAlertId}/acknowledge`,
        headers: { authorization: `Bearer ${receptionToken}` },
        payload: { actionTaken: 'Initiate sepsis bundle' }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test D: Non-clinical user (FINANCE) cannot acknowledge Panic Value alert (403)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/partner/ai-copilot/panic-values/${testPanicAlertId}/acknowledge`,
        headers: { authorization: `Bearer ${financeToken}` },
        payload: { clinicalAction: 'Repeat potassium test STAT' }
      });
      assert.equal(res.statusCode, 403);
    });

    it('Test E: Authorized clinician with clinician role/permission succeeds', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/partner/ai-copilot/ambient-scribe/soap/${testSoapId}/approve`,
        headers: { authorization: `Bearer ${doctorATokenUser1}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
    });
  });
});
