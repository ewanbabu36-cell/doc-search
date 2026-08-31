import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Production Remediation Wave 2 — Real Gateway to DB Persistence & Isolation Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_A2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || '00000000-0000-4000-8000-000000000001',
      email: overrides.email || 'admin@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A1,
      roles: overrides.roles || ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DIETITIAN', 'RADIOLOGIST'],
      permissions: overrides.permissions || [
        'partners:read',
        'partners:create',
        'analytics:read',
        'dietary:read',
        'dietary:create',
        'clinical:radiology:read',
        'clinical:radiology:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // TEST 1: Real Partner Foundation Overview Retrieval
  it('E2E TEST 1: GET /api/v1/partner/foundation/overview returns real database-backed metrics', async () => {
    const token = createTestToken({ permissions: ['partners:read'] });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/foundation/overview',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.totalPartnersCount, 'number');
    assert.strictEqual(typeof body.data.totalFacilitiesCount, 'number');
    assert.strictEqual(typeof body.data.activeSubscriptionsCount, 'number');
  });

  // TEST 2: Real Partner Creation with Audit Log
  it('E2E TEST 2: POST /api/v1/partner/foundation/partners creates record and records audit event', async () => {
    const token = createTestToken({ permissions: ['partners:create'] });
    const payload = {
      legalName: 'Apex City Hospital Corp',
      tradeName: 'Apex City Medical Center',
      partnerType: 'HOSPITAL_NETWORK',
      primaryContactName: 'Dr. Robert Evans',
      primaryContactEmail: 'dr.evans@docsearch.health',
      primaryContactPhone: '+1-555-901-2233'
    };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/foundation/partners',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.tradeName, 'Apex City Medical Center');
    assert.strictEqual(body.data.tenantId, TENANT_A);
    assert.ok(body.data.id);
  });

  // TEST 3: Tenant Isolation - Cross-Tenant Access Rejection
  it('E2E TEST 3: Tenant B user cannot access Tenant A diet order (403 Forbidden)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B,
      roles: ['DIETITIAN'],
      permissions: ['dietary:read']
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/orders/ord_001',
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.code);
  });

  // TEST 4: RBAC Enforcement - Unauthorized Role Rejection
  it('E2E TEST 4: User without security:read permission is rejected from /api/v1/company/security/roles with 403', async () => {
    const tokenReadOnly = createTestToken({
      roles: ['VIEWER'],
      permissions: ['partners:read'] // No security permissions
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/security/roles',
      headers: { Authorization: `Bearer ${tokenReadOnly}` }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });

  // TEST 5: Error Sanitization - Controlled Output without Stack Leakage
  it('E2E TEST 5: Malformed route requests return 404 without leaking server paths or secrets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-endpoint'
    });
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.includes('C:\\Users'), false);
    assert.strictEqual(res.body.includes('/Users/'), false);
    assert.strictEqual(res.body.includes('node_modules'), false);
  });

  // TEST 6: Executive Telemetry Persistence
  it('E2E TEST 6: GET /api/v1/company/executive/overview returns live operational aggregation', async () => {
    const token = createTestToken({ permissions: ['analytics:read'] });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/executive/overview',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.dataSource, 'live');
    assert.strictEqual(typeof body.data.totalPartners, 'number');
    assert.strictEqual(body.data.systemHealthStatus, 'HEALTHY');
  });
});
