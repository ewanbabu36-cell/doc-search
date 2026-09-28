import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../dist/app.js';

test('Partner Registration CORS and Payload Size Verification', async (t) => {
  const app = await buildApp();

  await t.test('1. CORS Preflight (OPTIONS) succeeds from 127.0.0.1:5173', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/auth/self-register',
      headers: {
        'origin': 'http://127.0.0.1:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type'
      }
    });

    assert.equal(res.statusCode, 204, `Expected status 204 for preflight, got ${res.statusCode}`);
    assert.equal(res.headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  await t.test('2. CORS Preflight (OPTIONS) succeeds from localhost:5173', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/auth/self-register',
      headers: {
        'origin': 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type'
      }
    });

    assert.equal(res.statusCode, 204, `Expected status 204, got ${res.statusCode}`);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  });

  await t.test('3. Large payload (>1.5MB base64 KYC document) succeeds without 413 Payload Too Large', async () => {
    // Generate a 1.5MB base64 dummy document
    const largeDummyData = 'data:image/png;base64,' + 'A'.repeat(1.5 * 1024 * 1024);

    const testId = `test-reg-${Date.now()}`;
    const payload = {
      partner: {
        id: testId,
        category: 'HEALTHCARE',
        name: 'Dr. Ramesh Kumar',
        email: `ramesh.${Date.now()}@cityhospital.test`,
        phone: '+91 9876543210',
        role: 'HOSPITAL_ADMIN',
        roleTitle: 'Chief Medical Director',
        department: 'Operations',
        tenantName: 'City Multi-Specialty Hospital',
        organizationType: 'HOSPITAL',
        allowedWorkspaces: ['HOSPITAL'],
        defaultModule: 'clinical-matrix',
        planTier: 'Enterprise Hospital Pro',
        accessibleFeatures: ['Inpatient Bed Matrix', 'Operation Theatre Rostering']
      },
      verificationItem: {
        id: `KYC-${testId}`,
        partnerName: 'City Multi-Specialty Hospital',
        partnerType: 'HOSPITAL',
        submittedBy: 'Dr. Ramesh Kumar',
        category: 'LICENSE_CERTIFICATE',
        documents: [
          {
            documentId: `doc-lic-${testId}`,
            documentName: 'clinical_establishment_license.png',
            documentType: 'State Health Registration Certificate',
            dataUrl: largeDummyData,
            fileSizeKb: 1536
          }
        ]
      }
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/self-register',
      headers: {
        'content-type': 'application/json',
        'origin': 'http://127.0.0.1:5173'
      },
      payload
    });

    assert.equal(res.statusCode, 201, `Expected status 201, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.dbId, 'Expected dbId in response');
    assert.equal(res.headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
  });

  await app.close();
});
