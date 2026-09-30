import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  partnerProfiles,
  operationalPartners,
  encounters,
  patients,
  billingInvoices,
  eq
} from '@docsearch/database';

describe('P1 Workflow Remediation Verification: Profile Gate, Encounter Validation, Exit Hub & Checkout', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const PARTNER_A = TEST_SEEDS.PARTNER_A;
  const DOCTOR_ID = TEST_SEEDS.DOCTOR_ID;

  function createPartnerToken(tenantId = TENANT_A, partnerId = PARTNER_A, roles = ['HOSPITAL_ADMIN', 'DOCTOR']) {
    const claims = {
      sub: crypto.randomUUID(),
      email: `admin.${tenantId}@docsearch.health`,
      tenantId,
      partnerId,
      branchId: TEST_SEEDS.BRANCH_A,
      roles,
      permissions: [
        'clinical:patients:read',
        'clinical:patients:create',
        'clinical:patients:update',
        'clinical:encounters:read',
        'clinical:encounters:create',
        'clinical:encounters:update',
        'clinical:consultations:read',
        'clinical:consultations:create',
        'billing:invoices:read',
        'billing:invoices:create',
        'billing:invoices:update',
        'billing:payments:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let createdPatientId;
  let createdEncounterId;

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // IMPL-P1-001: PARTNER PROFILE COMPLETION API & PERSISTENCE
  // =========================================================================

  it('IMPL-P1-001: PUT /api/v1/partner/profile persists statutory profile and marks completed', async () => {
    const token = createPartnerToken();

    const payload = {
      legalName: 'Apex Multi-Speciality Hospital & Research Institute',
      phone: '+919876543210',
      address: {
        line1: 'Plot 42, Healthcare City, Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001'
      },
      statutory: {
        ceaLicenseNumber: 'CEA-KA-2026-90412',
        clinicRegistrationNumber: 'REG-HOSP-7712',
        authorizedSignatoryName: 'Dr. Ramesh Narayan, Medical Director'
      }
    };

    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/partner/profile',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isProfileCompleted, true);
    assert.ok(body.data.profileCompletedAt);

    // Verify GET /api/v1/partner/account/plan-and-features reflects profile completed
    const planRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(planRes.statusCode, 200);
    const planBody = planRes.json();
    assert.strictEqual(planBody.data.organizationProfile.isProfileCompleted, true);
    assert.ok(planBody.data.organizationProfile.profileCompletedAt);
  });

  // =========================================================================
  // IMPL-P1-002: BILLING INVOICE ENCOUNTER FOREIGN KEY ENFORCEMENT
  // =========================================================================

  it('IMPL-P1-002: POST /api/v1/partner/billing/invoices REJECTS missing encounterId with 400 Bad Request', async () => {
    const token = createPartnerToken();

    // Payload intentionally omitting encounterId
    const invalidPayload = {
      patientId: '55555555-5555-4555-8555-555555555501',
      billingType: 'SELF_PAY',
      items: [
        {
          serviceName: 'General Consultation',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 500
        }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: invalidPayload
    });

    // Must be rejected because encounterId is mandatory
    assert.strictEqual(res.statusCode, 400);
    const body = res.json();
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    assert.match(body.error.message, /Required/i);
  });

  it('IMPL-P1-002: POST /api/v1/partner/billing/invoices ACCEPTS invoice with valid encounterId', async () => {
    const token = createPartnerToken();

    // 1. Create Patient
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Rohit',
        lastName: 'Sharma',
        gender: 'MALE',
        mobileNumber: '9876543210',
        dateOfBirth: '1988-04-30'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    createdPatientId = patRes.json().data.id;

    // 2. Create Encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: createdPatientId,
        encounterType: 'OPD',
        status: 'IN_PROGRESS',
        chiefComplaint: 'Chest tightness and chronic cough'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    createdEncounterId = encRes.json().data.id;

    // 3. Create Invoice with valid encounterId
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: createdPatientId,
        encounterId: createdEncounterId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Pulmonology Consultation',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 750,
            totalPrice: 750
          }
        ]
      }
    });

    assert.strictEqual(invRes.statusCode, 201);
    const invBody = invRes.json();
    assert.strictEqual(invBody.success, true);
    assert.strictEqual(invBody.data.encounterId, createdEncounterId);
  });

  it('IMPL-P1-002: POST /api/v1/partner/billing/invoices REJECTS non-existent encounterId with 404 Not Found', async () => {
    const token = createPartnerToken();
    const fakeEncounterId = crypto.randomUUID();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: createdPatientId,
        encounterId: fakeEncounterId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Consultation Fee',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500
          }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 404);
    const body = res.json();
    assert.strictEqual(body.error.code, 'NOT_FOUND');
    assert.match(body.error.message, /Encounter.*not found/i);
  });

  // =========================================================================
  // IMPL-P1-004: CENTRAL HELP DESK EXIT HUB REAL QUERY
  // =========================================================================

  it('IMPL-P1-004: GET /api/v1/partner/clinical/exit-hub/patients returns active patients with clearance status', async () => {
    const token = createPartnerToken();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/exit-hub/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));

    // The patient created in previous step should appear
    const found = body.data.find((p) => p.encounterId === createdEncounterId);
    assert.ok(found, 'Created encounter must be listed in exit hub patients');
    assert.strictEqual(found.patientName, 'Rohit Sharma');
    assert.strictEqual(found.billingStatus, 'DUE'); // Invoice was created but not paid
    assert.strictEqual(found.amountDue, 750);
  });

  // =========================================================================
  // IMPL-P1-003: PATIENT EXIT / CHECKOUT API & MULTI-DEPT CLEARANCE
  // =========================================================================

  it('IMPL-P1-003: POST /api/v1/partner/clinical/encounters/:id/checkout REJECTS checkout when invoices are unpaid', async () => {
    const token = createPartnerToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${createdEncounterId}/checkout`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { forceDischarge: false }
    });

    // Unpaid invoice exists, must return 409 Conflict
    assert.strictEqual(res.statusCode, 409);
    const body = res.json();
    assert.strictEqual(body.error.code, 'CONFLICT');
    assert.match(body.error.message, /Unsettled invoices/i);
  });

  it('IMPL-P1-003: POST /api/v1/partner/clinical/encounters/:id/checkout REJECTS forceDischarge without required admin role (403)', async () => {
    // Clinician token without admin/supervisor privileges
    const doctorOnlyToken = createPartnerToken(TENANT_A, PARTNER_A, ['DOCTOR', 'NURSE']);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${createdEncounterId}/checkout`,
      headers: { Authorization: `Bearer ${doctorOnlyToken}` },
      payload: {
        forceDischarge: true,
        overrideReason: 'Attempting non-admin override'
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = res.json();
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /Administrative override.*requires/i);
  });

  it('IMPL-P1-003: POST /api/v1/partner/clinical/encounters/:id/checkout REJECTS forceDischarge if overrideReason is missing or too short (400)', async () => {
    const adminToken = createPartnerToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${createdEncounterId}/checkout`,
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        forceDischarge: true,
        overrideReason: 'No' // Less than 5 characters
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = res.json();
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('IMPL-P1-003: POST /api/v1/partner/clinical/encounters/:id/checkout CLEARS patient when forceDischarge=true with admin role and reason', async () => {
    const token = createPartnerToken();

    // Administrative override checkout
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${createdEncounterId}/checkout`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        forceDischarge: true,
        overrideReason: 'Corporate sponsor billing guarantee',
        notes: 'Cleared by Hospital Admin for OPD exit'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'DISCHARGED');
    assert.ok(body.data.dischargedAt);
  });
});
