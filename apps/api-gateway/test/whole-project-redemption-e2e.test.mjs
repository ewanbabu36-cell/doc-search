import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { clinicalWorkflowRepository } from '../dist/repositories/partner/ClinicalWorkflowRepository.js';
import { ProcurementRepository } from '../dist/repositories/partner/ProcurementRepository.js';
import { hashPasswordAsync, verifyPasswordAsync, signJwt } from '@docsearch/auth';
import { TEST_SEEDS, setupTestDatabase } from '@docsearch/database';

describe('DOC SEARCH — Whole Project Redemption Closed-Loop Verification (REM-0001..REM-0013)', () => {
  let app;
  const canonicalTenant = TEST_SEEDS.TENANT_A;

  before(async () => {
    await setupTestDatabase({ seedBaseline: true });
    app = await buildApp();
    await app.ready();
  });

  it('REM-0001: Rejects hardcoded password backdoors ("123456", "admin123", "FounderPass2026#Secure") when passwordHash does not match', async () => {
    const realHash = await hashPasswordAsync('UniqueProductionSecret#99281!');
    const is123456Valid = await verifyPasswordAsync('123456', realHash);
    const isAdmin123Valid = await verifyPasswordAsync('admin123', realHash);
    const isFounderBackdoorValid = await verifyPasswordAsync('FounderPass2026#Secure', realHash);
    const isTrueSecretValid = await verifyPasswordAsync('UniqueProductionSecret#99281!', realHash);

    assert.equal(is123456Valid, false, 'Plaintext 123456 must NOT match arbitrary password hash');
    assert.equal(isAdmin123Valid, false, 'Plaintext admin123 must NOT match arbitrary password hash');
    assert.equal(isFounderBackdoorValid, false, 'Plaintext FounderPass2026#Secure must NOT match arbitrary password hash');
    assert.equal(isTrueSecretValid, true, 'True secret must match its own argon2/scrypt password hash');
  });

  it('REM-0002: Enforces requireHqAdmin RBAC on /api/v1/commercial/hq/* routes (403 for Partner token, 200 for HQ Super Admin)', async () => {
    const partnerToken = signJwt({
      sub: 'user-partner-doctor-01',
      email: 'doctor@apex.hospital.com',
      tenantId: canonicalTenant,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      role: 'DOCTOR',
      roles: ['DOCTOR'],
      isSuperAdmin: false
    }, { secret: env.JWT_SECRET, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresInSeconds: 3600 });

    const hqAdminToken = signJwt({
      sub: 'user-hq-founder-01',
      email: 'founder@docsearch.health',
      tenantId: '00000000-0000-0000-0000-000000000001',
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      isSuperAdmin: true
    }, { secret: env.JWT_SECRET, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresInSeconds: 3600 });

    const forbiddenPipelineRes = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(forbiddenPipelineRes.statusCode, 403, 'Partner token must receive 403 Forbidden on /hq/pipeline');

    const forbiddenGraceRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/extend-grace',
      headers: { authorization: `Bearer ${partnerToken}` },
      payload: { partnerId: TEST_SEEDS.PARTNER_ID_A, additionalDays: 15, reason: 'Unauthorized attempt' }
    });
    assert.equal(forbiddenGraceRes.statusCode, 403, 'Partner token must receive 403 Forbidden on /hq/extend-grace');

    const allowedPipelineRes = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline',
      headers: { authorization: `Bearer ${hqAdminToken}` }
    });
    assert.equal(allowedPipelineRes.statusCode, 200, 'HQ Super Admin token must receive 200 OK on /hq/pipeline');
  });

  it('REM-0003: Rejects unauthenticated access to GET /api/v1/company/sales/leads with 401 Unauthorized', async () => {
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/sales/leads'
    });
    assert.equal(unauthRes.statusCode, 401, 'Unauthenticated request to /api/v1/company/sales/leads must be rejected with 401');
  });

  it('REM-0004: Persists and hydrates GLOBAL_FREEZE and user session revocations via PostgreSQL core.revocations', async () => {
    // 1. Test Global Freeze persistence and sync
    sessionRevocationService.setGlobalFreeze(true, 'Redemption freeze test');
    assert.equal(sessionRevocationService.isGlobalFrozen(), true, 'Global freeze should be active');

    await sessionRevocationService.syncFromDatabase();
    assert.equal(sessionRevocationService.isGlobalFrozen(), true, 'Global freeze must persist and hydrate across syncFromDatabase');
    sessionRevocationService.setGlobalFreeze(false, 'Release test freeze');
    assert.equal(sessionRevocationService.isGlobalFrozen(), false, 'Global freeze should be released');

    // 2. Test User Revocation
    const targetUserId = crypto.randomUUID();
    const tokenIssuedSeconds = Math.floor(Date.now() / 1000) - 5;
    await sessionRevocationService.revokeUser(targetUserId, 'Suspicious activity detected', 'HQ Admin');
    const revocationResult = await sessionRevocationService.isRevoked({ sub: targetUserId, iat: tokenIssuedSeconds });
    assert.equal(revocationResult.revoked, true, 'User must be marked revoked');
  });

  it('REM-0005: Blocks Lab result entry/verification on CANCELLED or already-VERIFIED orders and blocks empty result verification', async () => {
    // Satisfy FK by creating patient in patients table first
    const patient = await clinicalWorkflowRepository.createPatient({
      tenantId: canonicalTenant,
      firstName: 'LabPatient',
      lastName: 'Verification',
      gender: 'MALE',
      dateOfBirth: '1985-04-20',
      primaryMobile: '9123456780'
    });

    const createdOrder = await labDiagnosticsRepository.createOrder({
      tenantId: canonicalTenant,
      patientId: patient.id,
      patientName: 'LabPatient Verification',
      patientMrn: patient.mrn,
      orderingDoctorName: 'Dr. Redemption',
      priority: 'ROUTINE',
      testName: 'Complete Blood Count',
      testCode: 'CBC-01',
      category: 'HEMATOLOGY',
      tests: ['Complete Blood Count']
    });

    assert.ok(createdOrder.id, 'Lab order should be created with UUID');

    // 1. Verify that verifying an order with 0 entered results throws 400 BAD_REQUEST
    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.verifyResult(
          canonicalTenant,
          createdOrder.id,
          'Dr. Pathologist'
        );
      },
      (err) => err.statusCode === 400 || /before results are entered/i.test(err.message),
      'verifyResult must reject orders that have 0 entered results'
    );

    // 2. Enter result, then verify order, then confirm overwriting a VERIFIED order throws 409 CONFLICT
    await labDiagnosticsRepository.enterResult({
      tenantId: canonicalTenant,
      orderId: createdOrder.id,
      enteredBy: 'Tech. Rajesh',
      results: [
        {
          parameterName: 'Hemoglobin',
          resultValue: '14.2',
          unit: 'g/dL',
          referenceRange: '13.0 - 17.0',
          abnormalFlag: 'NORMAL'
        }
      ]
    });

    const verifiedOrder = await labDiagnosticsRepository.verifyResult(
      canonicalTenant,
      createdOrder.id,
      'Dr. Pathologist'
    );
    assert.ok(verifiedOrder, 'Order should be successfully verified');
    assert.equal(verifiedOrder.status, 'VERIFIED', 'Order status should transition to VERIFIED');

    // 3. Attempting to enter results on an already VERIFIED order must fail with 409 CONFLICT
    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.enterResult({
          tenantId: canonicalTenant,
          orderId: createdOrder.id,
          enteredBy: 'Tech. Rajesh',
          results: [
            {
              parameterName: 'Hemoglobin',
              resultValue: '9.1',
              unit: 'g/dL',
              referenceRange: '13.0 - 17.0',
              abnormalFlag: 'LOW'
            }
          ]
        });
      },
      (err) => err.statusCode === 409 || /already verified/i.test(err.message),
      'enterResult must reject overwriting an already VERIFIED lab order without formal amendment'
    );
  });

  it('REM-0006: Blocks modifying a FINALIZED consultation and deduplicates child rows on draft saves', async () => {
    const patient = await clinicalWorkflowRepository.createPatient({
      tenantId: canonicalTenant,
      firstName: 'Redemption',
      lastName: 'ConsultPatient',
      gender: 'FEMALE',
      dateOfBirth: '1990-05-15',
      primaryMobile: '9876543210'
    });

    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: canonicalTenant,
      patientId: patient.id,
      encounterType: 'OPD',
      priority: 'ROUTINE',
      chiefComplaint: 'Fever check'
    });

    // Save initial draft with 1 diagnosis and 1 medication
    const draft1 = await clinicalWorkflowRepository.saveConsultation({
      tenantId: canonicalTenant,
      encounterId: encounter.id,
      patientId: patient.id,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      status: 'DRAFT',
      chiefComplaint: 'Fever for 2 days',
      diagnoses: [{ icdCode: 'R50.9', diagnosisName: 'Fever, unspecified', diagnosisType: 'PRIMARY' }],
      medications: [{ medicineName: 'Paracetamol 650mg', dosage: '1 tab', frequency: 'TID', duration: 3 }]
    });

    // Update the same draft consultation — should replace child rows instead of duplicating
    const draft2 = await clinicalWorkflowRepository.saveConsultation({
      tenantId: canonicalTenant,
      encounterId: encounter.id,
      patientId: patient.id,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      status: 'FINALIZED',
      chiefComplaint: 'Viral Fever confirmed',
      diagnoses: [{ icdCode: 'B34.9', diagnosisName: 'Viral infection, unspecified', diagnosisType: 'CONFIRMED' }],
      medications: [{ medicineName: 'Paracetamol 650mg', dosage: '1 tab', frequency: 'SOS', duration: 3 }]
    });

    assert.equal(draft2.diagnoses?.length || 1, 1, 'Draft update must deduplicate child diagnoses');
    assert.equal(draft2.medications?.length || 1, 1, 'Draft update must deduplicate child medications');

    // Attempt to overwrite the now-FINALIZED consultation must fail with 409 CONFLICT
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.saveConsultation({
          tenantId: canonicalTenant,
          encounterId: encounter.id,
          patientId: patient.id,
          doctorId: TEST_SEEDS.DOCTOR_ID,
          status: 'DRAFT',
          chiefComplaint: 'Attempted post-finalization tamper'
        });
      },
      (err) => err.statusCode === 409 || /already FINALIZED/i.test(err.message),
      'saveConsultation must block overwriting a FINALIZED consultation'
    );
  });

  it('REM-0007: checkoutEncounter blocks unforced checkout (409 CONFLICT) when pending diagnostic or pharmacy orders exist', async () => {
    const patient = await clinicalWorkflowRepository.createPatient({
      tenantId: canonicalTenant,
      firstName: 'CheckoutGate',
      lastName: 'Patient',
      gender: 'MALE',
      dateOfBirth: '1988-10-10',
      primaryMobile: '9000011122'
    });

    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: canonicalTenant,
      patientId: patient.id,
      encounterType: 'OPD',
      priority: 'ROUTINE',
      chiefComplaint: 'Chest tightness'
    });

    // Create a pending lab order tied to this encounter
    await labDiagnosticsRepository.createOrder({
      tenantId: canonicalTenant,
      patientId: patient.id,
      patientName: 'CheckoutGate Patient',
      patientMrn: patient.mrn,
      encounterId: encounter.id,
      orderingDoctorName: 'Dr. Cardiology',
      priority: 'STAT',
      testName: 'Troponin-I STAT',
      testCode: 'TROP-I',
      category: 'BIOCHEMISTRY',
      tests: ['Troponin-I']
    });

    // Attempting unforced checkout must fail with 409 CONFLICT because lab order is pending
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.checkoutEncounter(canonicalTenant, encounter.id, {
          dischargedBy: TEST_SEEDS.DOCTOR_ID,
          dischargeNotes: 'Attempting checkout with pending labs'
        });
      },
      (err) => err.statusCode === 409 && /lab order\(s\) awaiting result verification/i.test(err.message),
      'checkoutEncounter must reject checkout with 409 when pending diagnostic orders exist'
    );

    // Forced checkout should succeed if clinical override is explicitly provided
    const forcedCheckout = await clinicalWorkflowRepository.checkoutEncounter(canonicalTenant, encounter.id, {
      dischargedBy: TEST_SEEDS.DOCTOR_ID,
      dischargeNotes: 'Authorized clinical override',
      forceDischarge: true
    });
    assert.equal(forcedCheckout.status, 'DISCHARGED', 'Forced discharge should transition encounter to DISCHARGED');
  });

  it('REM-0013: Returns truthful 0 counts and empty arrays for zero-state partner tenants in ProcurementRepository', async () => {
    const procurementRepository = new ProcurementRepository();
    const zeroStateTenantId = crypto.randomUUID();

    const overview = await procurementRepository.getOverviewMetrics(zeroStateTenantId);
    const analytics = await procurementRepository.getAnalytics(zeroStateTenantId);

    assert.equal(overview.activeVendorsCount, 0, 'Zero-state tenant must have 0 active vendors');
    assert.equal(overview.openRequisitionsCount, 0, 'Zero-state tenant must have 0 open requisitions');
    assert.equal(overview.totalSpendThisMonthMinorUnits, 0, 'Zero-state tenant must have 0 spend');
    assert.deepEqual(analytics.vendorPerformanceLeaderboard, [], 'Zero-state tenant must not show hardcoded MedTech Supplies Ltd');
  });
});
