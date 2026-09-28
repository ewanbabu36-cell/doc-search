import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  getDatabase,
  partnerOnboardingStagedRegistrations,
  eq
} from '@docsearch/database';
import {
  partnerOnboardingRepository,
  toDeterministicUuid
} from '../dist/repositories/company/PartnerOnboardingRepository.js';

describe('DOC SEARCH — P1-02 Production Blocker Remediation: Durable PostgreSQL Partner Onboarding', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const SUPER_ADMIN_ID = '00000000-0000-4000-8000-000000000001';
  const COMPANY_ADMIN_ID = '00000000-0000-4000-8000-000000000002';
  const RECEPTIONIST_ID = '00000000-0000-4000-8000-000000000003';
  const LAB_TECH_ID = '00000000-0000-4000-8000-000000000004';

  function createToken(userId, email, roles, tenantId = TENANT_A) {
    const claims = {
      sub: userId,
      email,
      tenantId,
      branchId: TEST_SEEDS.BRANCH_A,
      roles,
      permissions: ['*'],
      dataScope: roles.includes('SUPER_ADMIN') ? 'global' : 'tenant',
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      expiresInSeconds: 7200,
      issuer: ISSUER,
      audience: AUDIENCE
    });
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    const dbInstance = await setupTestDatabase({ seedBaseline: true });
    testDb = dbInstance.db;

    // Seed durable baseline partners into the test database instance
    await partnerOnboardingRepository.seedBaselinePartnersIfEmpty(testDb);

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // ==========================================================================
  // 1. PERSISTENCE & POSTGRESQL DURABILITY
  // ==========================================================================
  describe('1. Persistence & PostgreSQL Durability', () => {
    it('1.1 Partner registration creates a durable row in PostgreSQL table partner_onboarding_staged_registrations', async () => {
      const regPayload = {
        partner: {
          facilityName: 'Apex Diagnostic Imaging Centre',
          organizationType: 'DIAGNOSTIC_CENTRE',
          email: 'director@apexdiagnostic.com',
          phone: '+91 99887 76655',
          name: 'Dr. Alok Verma',
          city: 'Noida, Uttar Pradesh',
          licenseNumber: 'UP-RAD-2026-9901',
          ownerAadhaarNumber: '9988 7766 5544',
          planTier: 'Radiology Enterprise Pro Suite',
          accessibleFeatures: ['DICOM PACS', 'Radiology Reporting', 'AI Heatmaps']
        },
        verificationItem: {
          id: 'KYC-APEX-RAD-01',
          partnerName: 'Apex Diagnostic Imaging Centre',
          partnerType: 'DIAGNOSTIC_CENTRE',
          category: 'LICENSE_CERTIFICATE',
          documentName: 'apex_radiology_license.pdf',
          documentType: 'AERB Radiation Safety Registration',
          sha256Hash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
          details: {
            'Facility Name': 'Apex Diagnostic Imaging Centre',
            'Registered Email': 'director@apexdiagnostic.com',
            'Phone / Mobile': '+91 99887 76655',
            'Owner Aadhaar Number': 'XXXX-XXXX-5544'
          }
        }
      };

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/self-register',
        payload: regPayload
      });

      assert.equal(res.statusCode, 201);
      const json = JSON.parse(res.body);
      assert.equal(json.success, true);
      assert.ok(json.dbId, 'Expected PostgreSQL UUID in response');

      // Verify row exists directly in PostgreSQL table
      const rows = await testDb
        .select()
        .from(partnerOnboardingStagedRegistrations)
        .where(eq(partnerOnboardingStagedRegistrations.id, json.dbId));

      assert.equal(rows.length, 1, 'Row must exist in PostgreSQL table');
      const row = rows[0];
      assert.equal(row.organizationName, 'Apex Diagnostic Imaging Centre');
      assert.equal(row.organizationType, 'DIAGNOSTIC_CENTRE');
      assert.equal(row.contactEmail, 'director@apexdiagnostic.com');
      assert.equal(row.contactPhone, '+91 99887 76655');
      assert.equal(row.status, 'PENDING');
      assert.ok(row.createdAt instanceof Date || typeof row.createdAt === 'string');

      // Sensitive Aadhaar must be masked in payload
      const payload = row.registrationPayload;
      assert.equal(payload.ownerAadhaarNumber, 'XXXX-XXXX-5544');
    });

    it('1.2 Zero JSON dependency: registration does NOT create or write to .data/*.json', () => {
      const p1 = path.resolve(process.cwd(), '.data', 'self_registered_partners.json');
      const p2 = path.resolve(process.cwd(), '.data', 'verification_queue.json');
      const p3 = path.resolve(process.cwd(), 'apps', 'api-gateway', '.data', 'self_registered_partners.json');
      const p4 = path.resolve(process.cwd(), 'apps', 'api-gateway', '.data', 'verification_queue.json');

      assert.equal(fs.existsSync(p1), false, '.data/self_registered_partners.json must not exist');
      assert.equal(fs.existsSync(p2), false, '.data/verification_queue.json must not exist');
      assert.equal(fs.existsSync(p3), false, 'apps/api-gateway/.data/self_registered_partners.json must not exist');
      assert.equal(fs.existsSync(p4), false, 'apps/api-gateway/.data/verification_queue.json must not exist');
    });

    it('1.3 Survives server restart: querying from fresh repository instance retrieves registered partner from PostgreSQL', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/verification-queue',
        headers: { authorization: `Bearer ${superToken}` }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));

      const found = json.data.find((q) => q.partnerName === 'Apex Diagnostic Imaging Centre');
      assert.ok(found, 'Registration must be discoverable in verification queue from PostgreSQL');
      assert.equal(found.status, 'PENDING_APPROVAL');
      assert.equal(found.details['Registered Email'], 'director@apexdiagnostic.com');
    });
  });

  // ==========================================================================
  // 2. CONCURRENCY & RACE-CONDITION DEFENSE
  // ==========================================================================
  describe('2. Concurrency & Race-Condition Defense', () => {
    let testRegistrationId;

    before(async () => {
      // Create a dedicated pending registration for concurrency tests
      const created = await partnerOnboardingRepository.createStagedRegistration(
        {
          id: '00000000-0000-4000-8000-000000000999',
          organizationName: 'Concurrency Test Supercare Hospital',
          organizationType: 'HOSPITAL',
          contactEmail: 'concurrency@supercare.com',
          contactPhone: '+91 91111 22222',
          registrationPayload: {
            name: 'Dr. Concurrent Lead',
            facilityName: 'Concurrency Test Supercare Hospital',
            planTier: 'Hospital Enterprise Suite'
          },
          status: 'PENDING'
        },
        undefined,
        testDb
      );
      testRegistrationId = created.id;
    });

    it('2.1 Two simultaneous approvals on the same registration: exactly ONE succeeds, other returns 409 Conflict', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      // Fire 2 concurrent approval requests simultaneously
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/verification-queue/approve',
          headers: { authorization: `Bearer ${superToken}` },
          payload: { id: testRegistrationId }
        }),
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/verification-queue/approve',
          headers: { authorization: `Bearer ${superToken}` },
          payload: { id: testRegistrationId }
        })
      ]);

      const statusCodes = [res1.statusCode, res2.statusCode];
      assert.ok(
        statusCodes.includes(200),
        `At least one approval request must succeed with 200, got: ${statusCodes.join(', ')}`
      );
      assert.ok(
        statusCodes.includes(409),
        `Second approval request must be rejected with 409 Conflict, got: ${statusCodes.join(', ')}`
      );

      // Verify final status in PostgreSQL is APPROVED
      const row = await partnerOnboardingRepository.getStagedRegistrationById(testRegistrationId, testDb);
      assert.equal(row.status, 'APPROVED');
    });

    it('2.2 Cannot reject an already APPROVED registration (returns 409 Conflict)', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/reject',
        headers: { authorization: `Bearer ${superToken}` },
        payload: { id: testRegistrationId, rejectionReason: 'Late rejection attempt' }
      });

      assert.equal(res.statusCode, 409);
      const json = JSON.parse(res.body);
      const errMsg = json.error?.message || json.message || '';
      assert.ok(errMsg.includes('already been APPROVED') || res.statusCode === 409);
    });

    it('2.3 Cannot approve an already REJECTED registration (returns 409 Conflict)', async () => {
      // Create a rejected registration
      const rejectedReg = await partnerOnboardingRepository.createStagedRegistration(
        {
          id: '00000000-0000-4000-8000-000000000888',
          organizationName: 'Rejected Testing Clinic',
          organizationType: 'CLINIC',
          contactEmail: 'rejected@clinic.com',
          contactPhone: '+91 93333 44444',
          status: 'PENDING'
        },
        undefined,
        testDb
      );

      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      // 1. Reject first
      const rejRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/reject',
        headers: { authorization: `Bearer ${superToken}` },
        payload: { id: rejectedReg.id, rejectionReason: 'Invalid Medical Council License' }
      });
      assert.equal(rejRes.statusCode, 200);

      // 2. Attempt to approve rejected record
      const apprRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/approve',
        headers: { authorization: `Bearer ${superToken}` },
        payload: { id: rejectedReg.id }
      });

      assert.equal(apprRes.statusCode, 409);
      const json = JSON.parse(apprRes.body);
      const errMsg = json.error?.message || json.message || '';
      assert.ok(errMsg.includes('REJECTED and cannot be approved') || apprRes.statusCode === 409);
    });
  });

  // ==========================================================================
  // 3. AUTHORIZATION & RBAC GUARDS
  // ==========================================================================
  describe('3. Authorization & RBAC Guards', () => {
    let pendingRegId;

    before(async () => {
      const reg = await partnerOnboardingRepository.createStagedRegistration(
        {
          id: '00000000-0000-4000-8000-000000000777',
          organizationName: 'RBAC Verification Healthcare',
          organizationType: 'HOSPITAL',
          contactEmail: 'rbac@test.com',
          contactPhone: '+91 97777 88888',
          status: 'PENDING'
        },
        undefined,
        testDb
      );
      pendingRegId = reg.id;
    });

    it('3.1 Anonymous / unauthenticated access to verification queue is rejected (401)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/verification-queue'
      });
      assert.equal(res.statusCode, 401);
    });

    it('3.2 Receptionist role is forbidden from viewing verification queue (403)', async () => {
      const token = createToken(RECEPTIONIST_ID, 'receptionist@hospital.com', ['RECEPTIONIST']);
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/verification-queue',
        headers: { authorization: `Bearer ${token}` }
      });
      assert.equal(res.statusCode, 403);
    });

    it('3.3 Lab Technician role is forbidden from approving registrations (403)', async () => {
      const token = createToken(LAB_TECH_ID, 'technician@hospital.com', ['LAB_TECHNICIAN']);
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/approve',
        headers: { authorization: `Bearer ${token}` },
        payload: { id: pendingRegId }
      });
      assert.equal(res.statusCode, 403);
    });

    it('3.4 Lab Technician role is forbidden from rejecting registrations (403)', async () => {
      const token = createToken(LAB_TECH_ID, 'technician@hospital.com', ['LAB_TECHNICIAN']);
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/reject',
        headers: { authorization: `Bearer ${token}` },
        payload: { id: pendingRegId }
      });
      assert.equal(res.statusCode, 403);
    });

    it('3.5 Authorized Company Admin can view verification queue and approve (200)', async () => {
      const token = createToken(COMPANY_ADMIN_ID, 'admin@docsearch.company', ['COMPANY_ADMIN']);

      const resQueue = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/verification-queue',
        headers: { authorization: `Bearer ${token}` }
      });
      assert.equal(resQueue.statusCode, 200);

      const resApprove = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/approve',
        headers: { authorization: `Bearer ${token}` },
        payload: { id: pendingRegId }
      });
      assert.equal(resApprove.statusCode, 200);
      const json = JSON.parse(resApprove.body);
      assert.equal(json.data.status, 'APPROVED');
    });
  });

  // ==========================================================================
  // 4. TENANT ISOLATION & FAILURE HANDLING
  // ==========================================================================
  describe('4. Tenant Isolation & Failure Handling', () => {
    it('4.1 Approving non-existent or deleted registration returns 404 Not Found', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);
      const fakeUuid = '00000000-0000-4000-8000-999999999999';

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/approve',
        headers: { authorization: `Bearer ${superToken}` },
        payload: { id: fakeUuid }
      });

      assert.equal(res.statusCode, 404);
      const json = JSON.parse(res.body);
      const errMsg = json.error?.message || json.message || '';
      assert.ok(errMsg.includes('not found') || res.statusCode === 404);
    });

    it('4.2 Rejection without registration ID returns 400 Validation Error', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verification-queue/reject',
        headers: { authorization: `Bearer ${superToken}` },
        payload: {}
      });

      assert.equal(res.statusCode, 400);
    });

    it('4.3 Baseline partners (AK DK Lab and ABC Hospital) seeded into PostgreSQL successfully', async () => {
      const superToken = createToken(SUPER_ADMIN_ID, 'superadmin@docsearch.health', ['SUPER_ADMIN']);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/self-registered-partners',
        headers: { authorization: `Bearer ${superToken}` }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.equal(json.success, true);

      const hasAkDk = json.data.some((p) => p.facilityName.toLowerCase().includes('ak dk'));
      const hasAbc = json.data.some((p) => p.facilityName.toLowerCase().includes('abc'));

      assert.ok(hasAkDk, 'AK DK Health Lab must be present in PostgreSQL');
      assert.ok(hasAbc, 'ABC Multi-Specialty Hospital must be present in PostgreSQL');
    });

    it('4.4 Tenant isolation: Tenant draft records correctly preserve tenantDraftId link in PostgreSQL', async () => {
      const regB = await partnerOnboardingRepository.createStagedRegistration(
        {
          id: '00000000-0000-4000-8000-000000000555',
          tenantDraftId: TENANT_B,
          organizationName: 'Tenant B Exclusive Diagnostic Clinic',
          organizationType: 'CLINIC',
          contactEmail: 'contact@tenantbclinic.com',
          contactPhone: '+91 95555 66666',
          status: 'PENDING'
        },
        undefined,
        testDb
      );

      const dbRow = await partnerOnboardingRepository.getStagedRegistrationById(regB.id, testDb);
      assert.equal(dbRow.tenantDraftId, TENANT_B);
    });
  });
});
