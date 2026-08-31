import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Wave 5 — Phase 2.18 Dietary & Nutrition Full Real E2E Suite', () => {
  let app;
  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchA1 = '33333333-3333-4333-8333-333333333331';

  function createDietaryToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || '99999999-9999-4999-8999-999999999999',
      email: overrides.email || 'dietitian@hospital.org',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchA1,
      roles: overrides.roles || ['DIETITIAN', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
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
      dataScope: 'branch',
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

  // Module 1: Dietary Telemetry & Overview
  it('TEST 01: GET /api/v1/partner/dietary/overview returns live dietary dashboard metrics', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/overview',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.activeDietOrdersCount, 'number');
    assert.strictEqual(typeof body.data.qualityCheckPassRatePercent, 'number');
  });

  // Module 2: Kitchen Management
  it('TEST 02: POST /api/v1/partner/dietary/kitchens creates production kitchen', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/kitchens',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        kitchenCode: 'KTC-SURGICAL-01',
        name: 'Surgical Recovery Ward Kitchen',
        kitchenType: 'SATELLITE',
        maxMealCapacityPerSlot: 150
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.kitchenCode, 'KTC-SURGICAL-01');
  });

  // Module 3: Diet Types
  it('TEST 03: GET /api/v1/partner/dietary/diet-types lists therapeutic diet types', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/diet-types',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // Module 4: Patient Assessment Lifecycle
  it('TEST 04: POST & PATCH /api/v1/partner/dietary/assessments creates and finalizes clinical assessment', async () => {
    const token = createDietaryToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/assessments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: 'pat_001',
        assessmentNumber: 'ASM-2026-001',
        heightCm: 175,
        weightKg: 70,
        bmi: 22.86,
        nutritionalRiskScore: 1
      }
    });
    assert.strictEqual(createRes.statusCode, 201);
    const created = JSON.parse(createRes.body).data;

    const finalizeRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/assessments/${created.id}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(finalizeRes.statusCode, 200);
    const finalized = JSON.parse(finalizeRes.body).data;
    assert.strictEqual(finalized.status, 'FINALIZED');
  });

  // Module 5: Diet Order Lifecycle & Approvals
  it('TEST 05: POST & PATCH /api/v1/partner/dietary/orders creates and approves diet order', async () => {
    const token = createDietaryToken();
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: 'pat_001',
        orderNumber: 'DO-2026-001',
        dietTypeId: 'dt_001',
        mealSlot: 'LUNCH',
        priority: 'ROUTINE'
      }
    });
    assert.strictEqual(orderRes.statusCode, 201);
    const order = JSON.parse(orderRes.body).data;

    const approveRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/orders/${order.id}/approve`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(approveRes.statusCode, 200);
    const approved = JSON.parse(approveRes.body).data;
    assert.strictEqual(approved.status, 'APPROVED');
  });

  // Module 6: Clinical Allergen Safety Gate
  it('TEST 06: Allergen Safety Gate rejects order when meal contains allergens patient is allergic to', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: 'pat_allergic_01',
        orderNumber: 'DO-ALERT-01',
        dietTypeId: 'dt_001',
        patientAllergies: ['GLUTEN'],
        containsGluten: true
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // Module 7: Production Planning & Release
  it('TEST 07: POST & PATCH /api/v1/partner/dietary/production-plans creates and releases production plan', async () => {
    const token = createDietaryToken();
    const planRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/production-plans',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        planNumber: 'PP-2026-DINNER',
        kitchenId: 'ktc_001',
        mealSlot: 'DINNER',
        plannedQuantity: 80
      }
    });
    assert.strictEqual(planRes.statusCode, 201);
    const plan = JSON.parse(planRes.body).data;

    const releaseRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/production-plans/${plan.id}/release`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(releaseRes.statusCode, 200);
    const released = JSON.parse(releaseRes.body).data;
    assert.strictEqual(released.status, 'RELEASED');
  });

  // Module 8: Quality Inspection & Quality Blocking Gate
  it('TEST 08: Quality Check Safety Gate blocks tray assembly if quality inspection failed', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/tray-assemblies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        trayBarcode: 'TRAY-FAIL-01',
        patientId: 'pat_001',
        qualityCheckStatus: 'FAIL'
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // Module 9: NPO Safety Gate
  it('TEST 09: NPO Safety Gate strictly blocks meal dispatch for patient marked NPO', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/dispatches',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        dispatchCode: 'DSP-NPO-01',
        trayAssemblyId: 'tray_001',
        isNpoPatient: true
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'BAD_REQUEST');
  });

  // Module 10: Tray Assembly & Dispatch & Delivery
  it('TEST 10: Valid Tray Assembly, Dispatch, and Delivery Confirmation completes successfully', async () => {
    const token = createDietaryToken();
    const trayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/tray-assemblies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        trayBarcode: 'TRAY-PASS-01',
        patientId: 'pat_001',
        qualityCheckStatus: 'PASS'
      }
    });
    assert.strictEqual(trayRes.statusCode, 201);
    const tray = JSON.parse(trayRes.body).data;

    const dispatchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/dispatches',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        dispatchCode: 'DSP-PASS-01',
        trayAssemblyId: tray.id,
        isNpoPatient: false
      }
    });
    assert.strictEqual(dispatchRes.statusCode, 201);
    const dispatch = JSON.parse(dispatchRes.body).data;

    const deliverRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/dietary/dispatches/${dispatch.id}/deliver`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(deliverRes.statusCode, 200);
    const delivered = JSON.parse(deliverRes.body).data;
    assert.strictEqual(delivered.status, 'DELIVERED');
  });

  // Module 11: Patient Refusal
  it('TEST 11: PATCH /api/v1/partner/dietary/dispatches/:id/refuse records patient meal refusal', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/dietary/dispatches/dsp_001/refuse',
      headers: { Authorization: `Bearer ${token}` },
      payload: { reason: 'PATIENT_NAUSEOUS' }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.status, 'REFUSED');
  });

  // Module 12: Billing & Procurement References
  it('TEST 12: POST /api/v1/partner/dietary/billing-references creates billing reference', async () => {
    const token = createDietaryToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/billing-references',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: 'ord_001',
        totalChargeMinorUnits: 2500,
        billingCode: 'DIET-THERAPEUTIC-01'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
  });

  // Module 13: Cross-Tenant Isolation Security Gate
  it('TEST 13: Cross-tenant access to dietary order is strictly denied (403 Forbidden)', async () => {
    const tenantBToken = createDietaryToken({ tenantId: tenantB });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/orders/ord_001',
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // Module 14: Authentication Security Gate
  it('TEST 14: Unauthenticated request to /api/v1/partner/dietary/overview fails closed (401 Unauthorized)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/dietary/overview'
    });
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'UNAUTHORIZED');
  });

  // Module 15: RBAC Insufficient Permissions Security Gate
  it('TEST 15: User without dietary permissions is rejected with 403 Forbidden', async () => {
    const clerkToken = createDietaryToken({
      roles: ['CLERK'],
      permissions: ['sales:read'] // Missing dietary permissions
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/dietary/kitchens',
      headers: { Authorization: `Bearer ${clerkToken}` },
      payload: { kitchenCode: 'KTC-UNAUTH', name: 'Unauthorized' }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });
});
