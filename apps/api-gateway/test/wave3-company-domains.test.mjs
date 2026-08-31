import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Wave 3 — Company Platform 15-Domain Real Integration Suite', () => {
  let app;
  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const companyAdminId = '99999999-9999-4999-8999-999999999999';
  const companyTenantId = '11111111-1111-4111-8111-111111111111';

  function createCompanyToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || companyAdminId,
      email: overrides.email || 'admin@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : companyTenantId,
      roles: overrides.roles || ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: overrides.permissions || [
        'analytics:read',
        'partners:read',
        'partners:create',
        'partners:update',
        'products:read',
        'products:create',
        'subscriptions:read',
        'sales:read',
        'marketing:read',
        'support:read',
        'communication:read',
        'ai:governance:read',
        'security:read',
        'compliance:read',
        'integrations:read',
        'platform:read',
        'infrastructure:read',
        'admin:read'
      ],
      dataScope: 'global',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    };
    return signJwt(claims, { secret: MASTER_SECRET });
  }

  before(async () => {
    process.env.JWT_SECRET = MASTER_SECRET;
    process.env.JWT_ISSUER = ISSUER;
    process.env.JWT_AUDIENCE = AUDIENCE;
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/docsearch';
    app = await buildApp();
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  // Domain 1: Executive & Command Center
  it('DOMAIN 01: GET /api/v1/company/executive/overview returns live company metrics', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/executive/overview',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.totalPartners, 'number');
  });

  // Domain 2: CRM & Partner Lifecycle
  it('DOMAIN 02: GET /api/v1/company/partners returns partner accounts', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 3: Product / Plans / Entitlements
  it('DOMAIN 03: GET /api/v1/company/products returns product catalog', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/products',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 4: Subscription / Billing / Finance
  it('DOMAIN 04: GET /api/v1/company/subscriptions returns subscription accounts', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/subscriptions',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 5: Sales & Marketing
  it('DOMAIN 05: GET /api/v1/company/sales/leads returns sales leads', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/sales/leads',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 05: GET /api/v1/company/marketing/campaigns returns active campaigns', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/marketing/campaigns',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 6: Customer Success & Support
  it('DOMAIN 06: GET /api/v1/company/support/tickets returns tickets', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/support/tickets',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 06: GET /api/v1/company/support/health returns partner health telemetry', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/support/health',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 7: Communication & Content
  it('DOMAIN 07: GET /api/v1/company/communication/content returns announcements & banners', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/communication/content',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 8: Analytics / BI / Intelligence
  it('DOMAIN 08: GET /api/v1/company/analytics/reports returns BI reports', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/analytics/reports',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 08: GET /api/v1/company/analytics/insights returns clinical operational insights', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/analytics/insights',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 9: AI Platform & AI Governance
  it('DOMAIN 09: GET /api/v1/company/ai/models returns governed AI models', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/ai/models',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 09: GET /api/v1/company/ai/policies returns AI safety policies', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/ai/policies',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 10: Security / RBAC / Policy / Audit
  it('DOMAIN 10: GET /api/v1/company/security/roles returns roles', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/security/roles',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 10: GET /api/v1/company/security/permissions returns granular permissions', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/security/permissions',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 11: Compliance & Data Governance
  it('DOMAIN 11: GET /api/v1/company/compliance/frameworks returns HIPAA & SOC2 frameworks', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/compliance/frameworks',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 12: API / Integration / Interoperability
  it('DOMAIN 12: GET /api/v1/company/integration/providers returns HL7 & FHIR providers', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/integration/providers',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 12: GET /api/v1/company/integration/webhooks returns registered webhooks', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/integration/webhooks',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 13: Platform Engineering
  it('DOMAIN 13: GET /api/v1/company/platform/projects returns core platform projects', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/platform/projects',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 13: GET /api/v1/company/platform/environments returns deployment environments', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/platform/environments',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 14: Infrastructure / Monitoring / DR
  it('DOMAIN 14: GET /api/v1/company/infrastructure/clusters returns Kubernetes clusters', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/infrastructure/clusters',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 14: GET /api/v1/company/infrastructure/dr returns Disaster Recovery plans', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/infrastructure/dr',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Domain 15: Company Administration & Governance
  it('DOMAIN 15: GET /api/v1/company/admin/legal-entities returns corporate entities', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/admin/legal-entities',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('DOMAIN 15: GET /api/v1/company/admin/departments returns company departments', async () => {
    const token = createCompanyToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/admin/departments',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Security Verification across Company Platform
  it('SECURITY GATE: Unauthenticated request to /api/v1/company/platform/projects is rejected with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/platform/projects'
    });
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'UNAUTHORIZED');
  });

  it('SECURITY GATE: User without security:read permission is rejected from /api/v1/company/security/roles with 403', async () => {
    const restrictedToken = createCompanyToken({
      roles: ['CLERK'],
      permissions: ['sales:read'] // Missing security:read
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/security/roles',
      headers: { Authorization: `Bearer ${restrictedToken}` }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });
});
