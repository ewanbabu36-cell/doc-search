import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 3.1 — Hospital Executive Command Center & MIS Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-cmo-01',
      email: overrides.email || 'cmo@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['EXECUTIVE_DIRECTOR', 'CHIEF_MEDICAL_OFFICER', 'CFO'],
      permissions: overrides.permissions || [
        'executive:dashboard:read',
        'executive:command:read',
        'executive:command:surge',
        'executive:billing:read',
        'executive:billing:resolve',
        'executive:payout:approve',
        'executive:simulation:run'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({ tenantId: tenantB, userId: 'usr-exec-tenantB' });
  });

  after(async () => {
    await app.close();
  });

  // TEST 01: Executive Cockpit Dashboard
  it('TEST 01: GET /api/v1/partner/executive-mis/dashboard returns full cockpit KPI metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/dashboard',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.executiveSnapshot);
    assert.ok(body.data.summaryKpis);
    assert.ok(typeof body.data.summaryKpis.totalGrossBilledInr === 'number');
    assert.ok(typeof body.data.summaryKpis.totalNetBilledInr === 'number');
  });

  // TEST 02: Department-Wise Billing Breakdown
  it('TEST 02: GET /api/v1/partner/executive-mis/billing/department-wise returns department billing ledger', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/billing/department-wise',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some((d) => d.department === 'OPD'));
    assert.ok(body.data.some((d) => d.department === 'IPD'));
  });

  // TEST 03: Outstanding Unbilled Encounters
  it('TEST 03: GET /api/v1/partner/executive-mis/billing/unbilled-encounters returns unbilled risk items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/billing/unbilled-encounters',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  // TEST 04: Resolve Unbilled Encounter (Charge Capture Correction)
  it('TEST 04: POST /api/v1/partner/executive-mis/billing/unbilled-encounters/:id/resolve posts charges', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/billing/unbilled-encounters/enc-unb-001/resolve',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        resolutionNotes: 'Troponin-T and bedside echo billed and reconciled with lab.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'RESOLVED');
  });

  // TEST 05: Insurance Claim Aging Buckets
  it('TEST 05: GET /api/v1/partner/executive-mis/insurance/claim-aging returns AR aging breakdown', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/insurance/claim-aging',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some((b) => b.bucket === '0_30_DAYS'));
  });

  // TEST 06: Inventory Shrinkage & Reconciliation
  it('TEST 06: GET & POST /api/v1/partner/executive-mis/inventory/shrinkage records physical audit discrepancy', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/inventory/shrinkage-audit',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        itemSku: 'MED-ALBUMIN-20',
        itemName: 'Human Albumin 20% 100ml Infusion',
        department: 'ICU_PHARMACY',
        physicalCount: 18,
        systemRecordedCount: 20,
        discrepancyUnits: 2,
        shrinkageRatePct: 10.0,
        unitCostInr: 3200,
        totalShrinkageLossInr: 6400,
        reason: 'SPILLAGE_INSPECTION_DEFECT',
        investigationStatus: 'UNDER_AUDIT'
      }
    });

    assert.equal(postRes.statusCode, 201);
    const postBody = JSON.parse(postRes.payload);
    assert.equal(postBody.success, true);
    assert.equal(postBody.data.itemSku, 'MED-ALBUMIN-20');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/inventory/shrinkage',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(getRes.statusCode, 200);
    const getBody = JSON.parse(getRes.payload);
    assert.ok(getBody.data.some((s) => s.itemSku === 'MED-ALBUMIN-20'));
  });

  // TEST 07: Doctor Payout Calculations & CFO Approval
  it('TEST 07: GET & POST /api/v1/partner/executive-mis/doctors/payouts approves doctor settlement', async () => {
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/doctors/payouts',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(getRes.statusCode, 200);
    const getBody = JSON.parse(getRes.payload);
    assert.ok(Array.isArray(getBody.data));

    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/doctors/payouts/doc-001/approve',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(postRes.statusCode, 200);
    const postBody = JSON.parse(postRes.payload);
    assert.equal(postBody.success, true);
    assert.equal(postBody.data.settlementStatus, 'APPROVED_BY_CFO');
  });

  // TEST 08: Executive Situational Snapshot
  it('TEST 08: GET /api/v1/partner/executive-mis/command/snapshot returns live operational snapshot', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/command/snapshot',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.totalBeds > 0);
    assert.ok(body.data.bedOccupancyPct > 0);
    assert.ok(body.data.surgeLevel);
  });

  // TEST 09: Declare Hospital Surge Event (Code Black Mass Casualty)
  it('TEST 09: POST /api/v1/partner/executive-mis/command/surge escalates hospital status', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/command/surge',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        surgeLevel: 'DISASTER_BLACK',
        codeType: 'CODE_BLACK_MASS_CASUALTY',
        location: 'Emergency Resuscitation & Trauma Triage',
        declaredBy: 'Dr. Vivek Mehra (Chief Medical Officer)',
        justification: 'Highway bus collision involving 35 incoming blunt trauma patients'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.surgeLevel, 'DISASTER_BLACK');
    assert.ok(body.data.activeEmergencyCodes.some((c) => c.codeType === 'CODE_BLACK_MASS_CASUALTY'));
  });

  // TEST 10: Resolve Hospital Surge Event
  it('TEST 10: POST /api/v1/partner/executive-mis/command/surge/resolve de-escalates to Normal Green', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/command/surge/resolve',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        resolvedBy: 'Dr. Vivek Mehra (Chief Medical Officer)',
        outcomeNotes: 'All trauma casualties triaged, operated, and admitted to HDU/ICU. Surge stand-down.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.surgeLevel, 'NORMAL_GREEN');
  });

  // TEST 11: AI Predictive Bed Forecasts
  it('TEST 11: GET /api/v1/partner/executive-mis/command/bed-forecasts returns ML occupancy demand projections', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/command/bed-forecasts',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    assert.ok(body.data[0].recommendedAction);
  });

  // TEST 12: Run AI What-If Scenario Simulation
  it('TEST 12: POST /api/v1/partner/executive-mis/command/what-if executes predictive capacity model', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/executive-mis/command/what-if',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        scenarioName: 'Simulation: Dengue Monsoon Outbreak Surge',
        surgeType: 'EPIDEMIC_SURGE_100_PTS',
        divertElectiveSurgeries: true,
        fastTrackDischargeBonus: true
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.scenarioId);
    assert.ok(body.data.simulatedOccupancyPeakPct > 0);
    assert.ok(Array.isArray(body.data.aiRecommendations));
  });

  // TEST 13: Tenant Isolation: Tenant B cannot read Tenant A dashboard
  it('TEST 13: Tenant Isolation: Tenant B cannot access Tenant A Executive MIS state', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/dashboard',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.tenantId, tenantB);
  });

  // TEST 14: Unauthenticated request fails closed with 401
  it('TEST 14: Unauthenticated request to /api/v1/partner/executive-mis/dashboard fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/dashboard'
    });

    assert.equal(res.statusCode, 401);
  });

  // TEST 15: Executive Cryptographic Audit Trail
  it('TEST 15: GET /api/v1/partner/executive-mis/audit-traces returns SHA-256 integrity hash chained ledger', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/executive-mis/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    assert.ok(body.data[0].integrityHash);
  });
});
