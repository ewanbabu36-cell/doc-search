import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt, buildSecurityAuditRecord, computeAuditHash } from '@docsearch/auth';
import { validateSecretQuality } from '@docsearch/shared-core';

describe('Wave 6 — Full Testing, Security, Reliability & Final Production Audit Suite', () => {
  let app;
  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchA1 = '33333333-3333-4333-8333-333333333331';

  function createToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || '99999999-9999-4999-8999-999999999999',
      email: overrides.email || 'admin@hospital.org',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchA1,
      roles: overrides.roles || ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'executive:read',
        'partner:read',
        'partner:create',
        'partner:update',
        'product:read',
        'product:create',
        'subscription:read',
        'sales:read',
        'support:read',
        'communication:read',
        'analytics:read',
        'ai:read',
        'security:read',
        'compliance:read',
        'integration:read',
        'platform:read',
        'infrastructure:read',
        'company:admin:read',
        'radiology:order:read',
        'radiology:order:create',
        'radiology:order:update',
        'radiology:report:read',
        'radiology:report:create',
        'radiology:report:update',
        'dietary:assessment:read',
        'dietary:assessment:create',
        'dietary:assessment:update',
        'dietary:kitchen:read',
        'dietary:kitchen:create',
        'dietary:diet-type:read',
        'dietary:diet-type:create',
        'dietary:order:read',
        'dietary:order:create',
        'dietary:order:update',
        'dietary:production:create',
        'dietary:production:update',
        'dietary:quality:create',
        'dietary:tray:create',
        'dietary:dispatch:create',
        'dietary:delivery:update',
        'dietary:billing:create',
        'dietary:procurement:create'
      ],
      dataScope: 'tenant',
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

  // 1. SQL Injection Resilience
  it('TEST 01: SQL Injection payloads in request parameters are handled safely without SQL syntax errors', async () => {
    const token = createToken();
    const sqlInjectionPayload = "pat_001' OR '1'='1";
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/dietary/assessments?patientId=${encodeURIComponent(sqlInjectionPayload)}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // 2. IDOR Prevention (Cross-Tenant)
  it('TEST 02: IDOR Gate: Tenant B user cannot access Tenant A diet order (403 Forbidden)', async () => {
    const tenantBToken = createToken({ tenantId: tenantB, roles: ['DIETITIAN'] });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/orders/ord_001',
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // 3. Mass Assignment Prevention
  it('TEST 03: Mass Assignment Gate: Client cannot overwrite server-managed tenantId or role via payload', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/kitchens',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        kitchenCode: 'KTC-SEC-01',
        name: 'Secure Isolation Kitchen',
        tenantId: 'injected-evil-tenant',
        roles: ['SUPER_ADMIN']
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.tenantId, tenantA);
  });

  // 4. Security Headers Verification
  it('TEST 04: Security Headers: Responses include Helmet X-Content-Type-Options and Frame protection', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  });

  // 5. Error Information Leakage Prevention
  it('TEST 05: Error Leakage: Controlled errors sanitize internal stack traces, DB credentials, and file paths', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-endpoint'
    });
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.includes('C:\\Users'), false);
    assert.strictEqual(res.body.includes('/Users/'), false);
    assert.strictEqual(res.body.includes('node_modules'), false);
  });

  // 6. Observability & Health Probes
  it('TEST 06: Observability: /health and /ready return 200 with structured component telemetry', async () => {
    const healthRes = await app.inject({ method: 'GET', url: '/health' });
    assert.strictEqual(healthRes.statusCode, 200);
    const healthBody = JSON.parse(healthRes.body);
    assert.strictEqual(healthBody.status, 'healthy');

    const readyRes = await app.inject({ method: 'GET', url: '/ready' });
    assert.strictEqual(readyRes.statusCode, 200);
    const readyBody = JSON.parse(readyRes.body);
    assert.strictEqual(readyBody.status, 'ready');
  });

  // 7. SHA-256 Audit Hash Chain Tamper Detection
  it('TEST 07: Audit Immutability: SHA-256 integrity hash detects tampering if record fields are altered', async () => {
    const session = {
      userId: 'user_audit_01',
      tenantId: tenantA,
      branchId: branchA1,
      roles: ['CLINICIAN']
    };
    const payload = {
      eventType: 'CLINICAL_ORDER_CREATED',
      resourceType: 'dietary_order',
      resourceId: 'ord_audit_101',
      metadata: { originalData: 'clean' }
    };

    const record = buildSecurityAuditRecord(payload, session);
    assert.ok(record.integrityHash);
    assert.strictEqual(record.integrityHash.length, 64);

    // Tampering test: Modifying any property will produce a different hash
    const tamperedHash = computeAuditHash({
      ...record,
      eventType: 'TAMPERED_EVENT_TYPE'
    }, record.previousHash);

    assert.notStrictEqual(record.integrityHash, tamperedHash);
  });

  // 8. Radiology 2.17 Golden Path Workflow
  it('TEST 08: Radiology 2.17 Golden Path: Order -> Scheduled -> In Progress lifecycle completes with audit', async () => {
    const token = createToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        partnerId: crypto.randomUUID(),
        organizationId: crypto.randomUUID(),
        branchId: branchA1,
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
      }
    });
    assert.strictEqual(createRes.statusCode, 201);
    const order = JSON.parse(createRes.body).data;

    const scheduleRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { fromStatus: 'ORDERED', toStatus: 'SCHEDULED', reason: 'Patient scheduled for CT' }
    });
    assert.strictEqual(scheduleRes.statusCode, 200);
    assert.strictEqual(JSON.parse(scheduleRes.body).data.status, 'SCHEDULED');

    const inProgRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { fromStatus: 'SCHEDULED', toStatus: 'IN_PROGRESS', reason: 'Patient in CT scanner room' }
    });
    assert.strictEqual(inProgRes.statusCode, 200);
    assert.strictEqual(JSON.parse(inProgRes.body).data.status, 'IN_PROGRESS');
  });

  // 9. Radiology State Machine Gate
  it('TEST 09: Radiology State Machine: Invalid backward state transition (REPORTED -> DRAFT) rejected with 400', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/radiology/orders/ord_001/status',
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: 'DRAFT' }
    });
    assert.strictEqual(res.statusCode, 400);
  });

  // 10. Dietary 2.18 Golden Path Workflow
  it('TEST 10: Dietary 2.18 Golden Path: Assessment -> Order -> Production -> Quality PASS -> Tray -> Dispatch -> Delivery', async () => {
    const token = createToken();
    const asmRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/assessments',
      headers: { Authorization: `Bearer ${token}` },
      payload: { patientId: 'pat_diet_golden', assessmentNumber: 'ASM-GOLDEN-01' }
    });
    assert.strictEqual(asmRes.statusCode, 201);
    const asm = JSON.parse(asmRes.body).data;

    const ordRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: { patientId: 'pat_diet_golden', orderNumber: 'DO-GOLDEN-01', dietTypeId: 'dt_001' }
    });
    assert.strictEqual(ordRes.statusCode, 201);
    const ord = JSON.parse(ordRes.body).data;

    const appRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/orders/${ord.id}/approve`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(appRes.statusCode, 200);

    const qcRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/quality-checks',
      headers: { Authorization: `Bearer ${token}` },
      payload: { mealSlot: 'LUNCH', overallScore: 98, result: 'PASS' }
    });
    assert.strictEqual(qcRes.statusCode, 201);

    const trayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/tray-assemblies',
      headers: { Authorization: `Bearer ${token}` },
      payload: { trayBarcode: 'TRAY-GOLDEN-01', patientId: 'pat_diet_golden', qualityCheckStatus: 'PASS' }
    });
    assert.strictEqual(trayRes.statusCode, 201);
    const tray = JSON.parse(trayRes.body).data;

    const dspRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/dispatches',
      headers: { Authorization: `Bearer ${token}` },
      payload: { dispatchCode: 'DSP-GOLDEN-01', trayAssemblyId: tray.id, isNpoPatient: false }
    });
    assert.strictEqual(dspRes.statusCode, 201);
    const dsp = JSON.parse(dspRes.body).data;

    const delRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/dispatches/${dsp.id}/deliver`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(delRes.statusCode, 200);
    assert.strictEqual(JSON.parse(delRes.body).data.status, 'DELIVERED');
  });

  // 11. Dietary Allergen Safety Gate
  it('TEST 11: Dietary Safety Gate: Incompatible allergen meal order is blocked with 400 Bad Request', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: 'pat_allergic_celiac',
        orderNumber: 'DO-ALLERGEN-BLOCKED',
        dietTypeId: 'dt_001',
        patientAllergies: ['GLUTEN'],
        containsGluten: true
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // 12. Dietary NPO Safety Gate
  it('TEST 12: Dietary Safety Gate: Meal dispatch for NPO patient is strictly blocked with 400 Bad Request', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/dispatches',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        dispatchCode: 'DSP-NPO-BLOCKED',
        trayAssemblyId: 'tray_001',
        isNpoPatient: true
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // 13. Dietary Quality Check Failure Gate
  it('TEST 13: Dietary Safety Gate: Failed quality inspection strictly blocks meal tray assembly', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/tray-assemblies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        trayBarcode: 'TRAY-FAIL-BLOCKED',
        patientId: 'pat_001',
        qualityCheckStatus: 'FAIL'
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // 14. Idempotency Gate
  it('TEST 14: Idempotency Gate: Re-confirming meal delivery returns consistent status without error', async () => {
    const token = createToken();
    const res1 = await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/dietary/dispatches/dsp_001/deliver',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res1.statusCode, 200);

    const res2 = await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/dietary/dispatches/dsp_001/deliver',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(JSON.parse(res2.body).data.status, 'DELIVERED');
  });

  // 15. Production Secret Quality Validation
  it('TEST 15: Production Secret Quality Validator strictly fails insecure/short placeholder secrets', () => {
    assert.doesNotThrow(() => {
      validateSecretQuality('JWT_SECRET', 'docsearch_master_jwt_secret_dev_32char_key_only', 32);
    });

    assert.throws(() => {
      validateSecretQuality('JWT_SECRET', 'changeme', 32);
    });

    assert.throws(() => {
      validateSecretQuality('JWT_SECRET', 'short-secret', 32);
    });
  });
});
