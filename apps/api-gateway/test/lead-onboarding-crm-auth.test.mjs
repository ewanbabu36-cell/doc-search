import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function createAdminToken() {
  const claims = {
    sub: crypto.randomUUID(),
    email: 'admin@docsearch.company',
    tenantId: '00000000-0000-4000-8000-000000000001',
    roles: ['SUPER_ADMIN'],
    permissions: ['partners:create', 'partners:read', 'partners:update'],
    iss: ISSUER,
    aud: AUDIENCE
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

test('Lead Creation, CRM Ingestion, and Pharmacy Authentication Suite', async (t) => {
  const app = await buildApp();
  await app.ready();
  const adminToken = createAdminToken();

  t.after(async () => {
    await app.close();
  });

  await t.test('1. Authenticates sunil.pharmacy@docsearch.health successfully with PharmaPass123!', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'sunil.pharmacy@docsearch.health',
        password: 'PharmaPass123!'
      }
    });

    assert.equal(res.statusCode, 200, 'Login should succeed with HTTP 200');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken, 'Access token must be returned');
    assert.equal(body.data.user.email, 'sunil.pharmacy@docsearch.health');
    assert.equal(body.data.user.organizationType, 'PHARMACY');
    assert.ok(body.data.user.roles.includes('PHARMACIST'));
  });

  await t.test('2. Successfully creates a Sales Lead in HQ CRM via POST /api/v1/company/sales/leads', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/sales/leads',
      headers: { 'content-type': 'application/json' },
      payload: {
        organizationName: 'City Care Polyclinic & Diagnostics',
        contactName: 'Dr. Alok Verma',
        contactEmail: 'dr.alok@citycare.in',
        contactPhone: '+91 98765 12345',
        source: 'INBOUND_WEB',
        status: 'NEW',
        assignedOwnerEmail: 'sales.lead@docsearch.internal',
        notes: 'Interested in OPD and Pharmacy POS combo'
      }
    });

    assert.equal(res.statusCode, 201, 'Should create lead with HTTP 201');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.organizationName, 'City Care Polyclinic & Diagnostics');
    assert.equal(body.data.contactEmail, 'dr.alok@citycare.in');
  });

  await t.test('3. Retrieves all CRM leads via GET /api/v1/company/sales/leads including the newly created lead', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/sales/leads'
    });

    assert.equal(res.statusCode, 200, 'Should fetch leads with HTTP 200');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data), 'Leads must be an array');
    const found = body.data.some((l) => l.contactEmail === 'dr.alok@citycare.in');
    assert.ok(found, 'Created lead must exist in CRM leads database list');
  });

  await t.test('4. Full Onboarding Activation creates partner and credentials smoothly', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/complete-onboarding-activation',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'content-type': 'application/json'
      },
      payload: {
        partnerName: 'MedPlus Express Pharmacy',
        classification: 'PHARMACY',
        contactPerson: 'Ramesh Gupta',
        phone: '+91 98111 22334',
        email: 'ramesh.medplus@docsearch.health',
        password: 'PharmaPass2026!',
        city: 'New Delhi',
        state: 'Delhi',
        planTier: 'Retail Pharmacy Pro POS',
        monthlyFee: 3499,
        features: ['High-Speed Barcode Billing', 'Automated Batch & Expiry Radar']
      }
    });

    assert.equal(res.statusCode, 201, 'Should return HTTP 201 Created');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.partnerName, 'MedPlus Express Pharmacy');
    assert.equal(body.data.credentials.userId, 'ramesh.medplus@docsearch.health');

    // Test that the newly activated partner can log in immediately
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'ramesh.medplus@docsearch.health',
        password: 'PharmaPass2026!'
      }
    });
    assert.equal(loginRes.statusCode, 200, 'New partner must be able to log in immediately');
  });
});
