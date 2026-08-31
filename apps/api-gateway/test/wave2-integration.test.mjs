import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Wave 2 — API Gateway, Repositories, & Real Database Persistence', () => {
  let app;
  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  // Synthetic Test Identifiers
  const tenantA_Id = '11111111-1111-4111-8111-111111111111';
  const tenantB_Id = '22222222-2222-4222-8222-222222222222';
  const branchA1_Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const branchA2_Id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userAdminId = '99999999-9999-4999-8999-999999999999';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || userAdminId,
      email: overrides.email || 'admin@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA_Id,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchA1_Id,
      roles: overrides.roles || ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RADIOLOGIST'],
      permissions: overrides.permissions || [
        'analytics:read',
        'partners:read',
        'partners:create',
        'partners:update',
        'products:read',
        'products:create',
        'subscriptions:read',
        'clinical:radiology:read',
        'clinical:radiology:create',
        'clinical:radiology:update'
      ],
      dataScope: overrides.dataScope || 'global',
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

  // TEST 1: Health & readiness endpoints
  it('TEST 1: GET /health returns 200 with service health status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'healthy');
  });

  it('TEST 2: GET /ready returns 200 readiness probe', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready'
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'ready');
  });

  // TEST 3: Unauthenticated request fails closed with 401
  it('TEST 3: Unauthenticated request to /api/v1/company/partners fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners'
    });
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'UNAUTHORIZED');
  });

  // TEST 4: Unauthorized request (missing permissions) fails with 403
  it('TEST 4: Authenticated user without required permission is rejected with 403', async () => {
    const restrictedToken = createTestToken({
      roles: ['NURSE'],
      permissions: ['analytics:read'] // Missing partners:read
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: {
        Authorization: `Bearer ${restrictedToken}`
      }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });

  // TEST 5: Executive Overview endpoint
  it('TEST 5: GET /api/v1/company/executive/overview executes real service and returns 200', async () => {
    const adminToken = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/executive/overview',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.totalPartners, 'number');
    assert.strictEqual(typeof body.data.activeSessions, 'number');
    assert.strictEqual(typeof body.data.totalAuditEvents, 'number');
    assert.strictEqual(body.data.systemHealthStatus, 'HEALTHY');
  });

  // TEST 6: Product CRUD through API
  it('TEST 6: POST /api/v1/company/products creates product in real repository', async () => {
    const adminToken = createTestToken();
    const productPayload = {
      code: `PROD_${Date.now()}`,
      name: 'Cardiology Diagnostic Suite',
      description: 'Enterprise ECG & Echocardiogram Analysis Platform',
      category: 'CLINICAL_DIAGNOSTICS',
      status: 'ACTIVE',
      version: '2.1.0'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/products',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: productPayload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.code, productPayload.code);
    assert.strictEqual(body.data.name, productPayload.name);
  });

  it('TEST 7: GET /api/v1/company/products lists products from real repository', async () => {
    const adminToken = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/products',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // TEST 8: Partner Lifecycle & State Transitions
  let createdPartnerId = '';
  it('TEST 8: POST /api/v1/company/partners persists partner and returns 201', async () => {
    const adminToken = createTestToken();
    const partnerPayload = {
      tenantId: tenantA_Id,
      legalName: 'Apex Health Systems Network',
      tradeName: 'Apex Health',
      partnerType: 'HOSPITAL_NETWORK',
      lifecycleStatus: 'LEAD',
      verificationStatus: 'PENDING',
      onboardingStep: 'ORGANIZATION_PROFILE',
      onboardingProgressPercent: 10,
      primaryContactName: 'Dr. Sarah Connor',
      primaryContactEmail: 'sarah.connor@apexhealth.org',
      primaryContactPhone: '+1-555-0199',
      primaryContactRole: 'Chief Medical Officer'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: partnerPayload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.legalName, partnerPayload.legalName);
    assert.strictEqual(body.data.lifecycleStatus, 'LEAD');
    createdPartnerId = body.data.id;
  });

  it('TEST 9: GET /api/v1/company/partners/:id retrieves persisted partner', async () => {
    const adminToken = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${createdPartnerId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdPartnerId);
    assert.strictEqual(body.data.legalName, 'Apex Health Systems Network');
  });

  it('TEST 10: PATCH /api/v1/company/partners/:id/status updates state with valid transition', async () => {
    const adminToken = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${createdPartnerId}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        fromStatus: 'LEAD',
        toStatus: 'ONBOARDING',
        reason: 'Initial qualification and onboarding review completed'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.lifecycleStatus, 'ONBOARDING');
  });

  it('TEST 11: Invalid partner lifecycle transition is rejected with 400 Bad Request', async () => {
    const adminToken = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${createdPartnerId}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        fromStatus: 'ONBOARDING',
        toStatus: 'OFFBOARDED', // Invalid direct jump
        reason: 'Attempt invalid jump'
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // TEST 12: Clinical Radiology Orders & Tenant Isolation
  let createdOrderId = '';
  it('TEST 12: POST /api/v1/partner/radiology/orders creates order with tenant & branch scope', async () => {
    const tokenTenantA = createTestToken({
      tenantId: tenantA_Id,
      branchId: branchA1_Id
    });

    const orderPayload = {
      partnerId: crypto.randomUUID(),
      organizationId: crypto.randomUUID(),
      branchId: branchA1_Id,
      orderNumber: `RAD-ORD-${Date.now()}`,
      patientId: crypto.randomUUID(),
      patientName: 'Johnathan Doe',
      patientMrn: 'MRN-882910',
      encounterId: crypto.randomUUID(),
      orderingDoctorName: 'Dr. Gregory House',
      orderingDepartment: 'Emergency Medicine',
      procedureId: 'PROC-CT-CHEST',
      procedureName: 'High-Resolution Chest CT with Contrast',
      modalityType: 'COMPUTED_TOMOGRAPHY_CT',
      priority: 'STAT_EMERGENCY_IMMEDIATE',
      clinicalIndication: 'Suspected pulmonary embolism with acute chest pain',
      requiresContrast: true,
      status: 'ORDERED'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/orders',
      headers: {
        Authorization: `Bearer ${tokenTenantA}`,
        'Content-Type': 'application/json'
      },
      payload: orderPayload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.orderNumber, orderPayload.orderNumber);
    assert.strictEqual(body.data.tenantId, tenantA_Id);
    assert.strictEqual(body.data.branchId, branchA1_Id);
    createdOrderId = body.data.id;
  });

  it('TEST 13: GET /api/v1/partner/radiology/orders/:id retrieves order within same tenant scope', async () => {
    const tokenTenantA = createTestToken({
      tenantId: tenantA_Id,
      branchId: branchA1_Id
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}`,
      headers: {
        Authorization: `Bearer ${tokenTenantA}`
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdOrderId);
    assert.strictEqual(body.data.patientName, 'Johnathan Doe');
  });

  it('TEST 14: Cross-tenant access is strictly denied (Tenant B cannot access Tenant A order)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: tenantB_Id,
      branchId: crypto.randomUUID(),
      dataScope: 'tenant'
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}`,
      headers: {
        Authorization: `Bearer ${tokenTenantB}`
      }
    });

    // Fails with 404 or 403 (Resource not found in Tenant B scope)
    assert.ok(res.statusCode === 404 || res.statusCode === 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error !== undefined);
  });

  it('TEST 15: Cross-branch access is strictly denied (Branch A2 user cannot access Branch A1 order)', async () => {
    const tokenBranchA2 = createTestToken({
      tenantId: tenantA_Id,
      branchId: branchA2_Id,
      dataScope: 'branch'
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}`,
      headers: {
        Authorization: `Bearer ${tokenBranchA2}`
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BRANCH_ACCESS_DENIED');
  });

  it('TEST 16: PATCH /api/v1/partner/radiology/orders/:id/status updates status to SCHEDULED', async () => {
    const tokenTenantA = createTestToken({
      tenantId: tenantA_Id,
      branchId: branchA1_Id
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}/status`,
      headers: {
        Authorization: `Bearer ${tokenTenantA}`,
        'Content-Type': 'application/json'
      },
      payload: {
        fromStatus: 'ORDERED',
        toStatus: 'SCHEDULED'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'SCHEDULED');
  });

  it('TEST 17: Invalid radiology state transition (SCHEDULED -> DRAFT) rejected with 400', async () => {
    const tokenTenantA = createTestToken({
      tenantId: tenantA_Id,
      branchId: branchA1_Id
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}/status`,
      headers: {
        Authorization: `Bearer ${tokenTenantA}`,
        'Content-Type': 'application/json'
      },
      payload: {
        fromStatus: 'SCHEDULED',
        toStatus: 'DRAFT'
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  it('TEST 18: POST /api/v1/auth/login issues valid access and refresh tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'clinician@hospital.com',
        password: 'securePassword123!',
        tenantId: tenantA_Id,
        branchId: branchA1_Id
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken, 'Must return accessToken');
    assert.ok(body.data.refreshToken, 'Must return refreshToken');
    assert.equal(body.data.user.email, 'clinician@hospital.com');
  });

  it('TEST 19: POST /api/v1/auth/refresh rotates tokens securely', async () => {
    // 1. Login to obtain refresh token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'nurse@hospital.com',
        password: 'securePassword123!',
        tenantId: tenantA_Id,
        branchId: branchA1_Id
      }
    });
    const loginBody = JSON.parse(loginRes.body);
    const initialRefreshToken = loginBody.data.refreshToken;

    // 2. Refresh
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: initialRefreshToken
      }
    });

    assert.equal(refreshRes.statusCode, 200);
    const refreshBody = JSON.parse(refreshRes.body);
    assert.equal(refreshBody.success, true);
    assert.ok(refreshBody.data.accessToken, 'Must return new accessToken');
    assert.ok(refreshBody.data.refreshToken, 'Must return new refreshToken');
    assert.notEqual(refreshBody.data.refreshToken, initialRefreshToken, 'Refresh token must rotate');
  });

  it('TEST 20: POST /api/v1/auth/logout revokes session', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'doc@hospital.com',
        password: 'securePassword123!',
        tenantId: tenantA_Id,
        branchId: branchA1_Id
      }
    });
    const loginBody = JSON.parse(loginRes.body);
    const refreshToken = loginBody.data.refreshToken;

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken }
    });

    assert.equal(logoutRes.statusCode, 200);
    const logoutBody = JSON.parse(logoutRes.body);
    assert.equal(logoutBody.success, true);
  });
});
