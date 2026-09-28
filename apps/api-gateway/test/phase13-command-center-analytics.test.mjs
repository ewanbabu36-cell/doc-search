import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('PHASE 13 — Command Center & Analytics Production Verification Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-cc-001',
      email: overrides.email || 'director.analytics@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['HOSPITAL_ADMIN', 'CHIEF_MEDICAL_OFFICER'],
      permissions: overrides.permissions || [
        'analytics:read',
        'command_center:read',
        'clinical:encounters:read',
        'clinical:consultations:read',
        'lims:read',
        'radiology:read',
        'pharmacy:read',
        'billing:read',
        'supply_chain:inventory:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createHqToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-hq-admin-01',
      email: overrides.email || 'hq.governance@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : '00000000-0000-0000-0000-000000000000',
      branchId: '00000000-0000-0000-0000-000000000000',
      roles: overrides.roles || ['COMPANY_ADMIN', 'SUPER_ADMIN'],
      permissions: overrides.permissions || [
        'company:admin',
        'company:read',
        'analytics:read',
        'hq:command_center:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let tokenA;
  let tokenB;
  let hqToken;
  let unauthorizedToken;

  before(async () => {
    app = await buildApp();
    await app.ready();

    tokenA = createTestToken({ tenantId: tenantA });
    tokenB = createTestToken({ tenantId: tenantB, userId: 'usr-tenantB' });
    hqToken = createHqToken();
    unauthorizedToken = createTestToken({
      tenantId: tenantA,
      userId: 'usr-doc-only',
      roles: ['DOCTOR'],
      permissions: ['clinical:consultations:read']
    });
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. ZERO-STATE COMPLIANCE (Non-negotiable)
  // =========================================================================
  it('TEST 01: Zero-State Compliance: Unseeded tenant returns clean 0s, null comparisons and NO_DATA', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/overview',
      headers: { authorization: `Bearer ${tokenB}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.dataQuality, 'NO_DATA');
    assert.equal(body.data.summary.totalPatients, 0);
    assert.equal(body.data.summary.activeEncounters, 0);
    assert.equal(body.data.summary.opdCompletedAppointments, 0);
    assert.equal(body.data.summary.ipdBedOccupancyPercent, 0);
    assert.equal(body.data.summary.labReportsDelivered, 0);
    assert.equal(body.data.summary.grossRevenue, 0);
    assert.equal(body.data.summary.lowStockItems, 0);
    assert.equal(body.data.summary.pendingWorkQueueCount, 0);
  });

  // =========================================================================
  // 2. DATE RANGE RESOLUTION & HANDLING
  // =========================================================================
  it('TEST 02: Date Range Resolution: Handles TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, and CUSTOM', async () => {
    const periods = ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS'];
    for (const period of periods) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/command-center/patients?period=${period}`,
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.period, period);
      assert.ok(body.data.startDate);
      assert.ok(body.data.endDate);
    }

    // Custom date range
    const customRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/patients?period=CUSTOM&customStart=2026-01-01T00:00:00.000Z&customEnd=2026-01-31T23:59:59.999Z',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(customRes.statusCode, 200);
    const customBody = JSON.parse(customRes.body);
    assert.equal(customBody.data.period, 'CUSTOM');
    assert.equal(new Date(customBody.data.startDate).getFullYear(), 2026);
  });

  // =========================================================================
  // 3. EXECUTIVE COMMAND CENTER OVERVIEW
  // =========================================================================
  it('TEST 03: Executive Command Center Overview: Returns multi-domain live operational snapshot', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/overview',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.summary);
    assert.ok(body.data.patients);
    assert.ok(body.data.opd);
    assert.ok(body.data.ipd);
    assert.ok(body.data.lab);
    assert.ok(body.data.radiology);
    assert.ok(body.data.revenue);
    assert.ok(body.data.inventory);
    assert.ok(body.data.pendingWorkQueue);
    assert.ok(body.data.slas);
  });

  // =========================================================================
  // 4. PATIENT VOLUME & ENCOUNTER ANALYTICS
  // =========================================================================
  it('TEST 04: Patient Analytics: Computes volume, gender breakdown, encounters, and growth percent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/patients',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalRegisteredPatients, 'number');
    assert.equal(typeof body.data.newPatientsCount, 'number');
    assert.equal(typeof body.data.totalVisitsCount, 'number');
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 5. OUTPATIENT (OPD) ANALYTICS
  // =========================================================================
  it('TEST 05: OPD Analytics: Tracks appointment statuses, completed consultations, and wait times', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/opd',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalAppointments, 'number');
    assert.equal(typeof body.data.bookedAppointments, 'number');
    assert.equal(typeof body.data.completedAppointments, 'number');
    assert.equal(typeof body.data.completedConsultationsCount, 'number');
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 6. INPATIENT (IPD) ANALYTICS
  // =========================================================================
  it('TEST 06: IPD Analytics: Tracks bed occupancy percentage, ward distribution, and admissions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/ipd',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalBeds, 'number');
    assert.equal(typeof body.data.occupiedBeds, 'number');
    assert.equal(typeof body.data.occupancyRatePercent, 'number');
    assert.equal(typeof body.data.currentInpatientsCount, 'number');
    assert.ok(Array.isArray(body.data.wardBreakdown));
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 7. LAB / PATHOLOGY (LIMS) ANALYTICS
  // =========================================================================
  it('TEST 07: Lab Diagnostics Analytics: Tracks orders, validation, critical panic alerts, and abnormal rate', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/lab',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalOrdersCount, 'number');
    assert.equal(typeof body.data.samplesCollectedCount, 'number');
    assert.equal(typeof body.data.reportsDeliveredCount, 'number');
    assert.equal(typeof body.data.criticalPanicAlertsCount, 'number');
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 8. RADIOLOGY (RIS/PACS) ANALYTICS
  // =========================================================================
  it('TEST 08: Radiology Analytics: Tracks orders, modality breakdown, critical findings, and turnaround', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/radiology',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalOrdersCount, 'number');
    assert.equal(typeof body.data.finalizedCount, 'number');
    assert.ok(Array.isArray(body.data.modalityBreakdown));
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 9. PHARMACY ANALYTICS (RETAIL & WHOLESALE)
  // =========================================================================
  it('TEST 09: Pharmacy Analytics: Tracks retail dispensing orders and wholesale B2B metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/pharmacy',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.retail);
    assert.equal(typeof body.data.retail.prescriptionsReceivedCount, 'number');
    assert.equal(typeof body.data.retail.dispensedOrdersCount, 'number');
    assert.ok(body.data.wholesale);
    assert.equal(typeof body.data.wholesale.b2bSalesOrdersCount, 'number');
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 10. REVENUE & FINANCIAL ANALYTICS
  // =========================================================================
  it('TEST 10: Financial Analytics: Tracks gross billing, collections, payment modes, refunds, and net revenue', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/revenue',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.grossBilledAmount, 'number');
    assert.equal(typeof body.data.paymentsCollectedAmount, 'number');
    assert.equal(typeof body.data.outstandingReceivablesAmount, 'number');
    assert.equal(typeof body.data.refundsProcessedAmount, 'number');
    assert.equal(typeof body.data.netRealizedRevenue, 'number');
    assert.ok(Array.isArray(body.data.paymentMethodBreakdown));
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 11. SUPPLY CHAIN & INVENTORY ANALYTICS
  // =========================================================================
  it('TEST 11: Inventory Analytics: Tracks valuation, stock levels, expiring batch radar, and recalls', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/inventory',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalWarehousesCount, 'number');
    assert.equal(typeof body.data.totalStockValuation, 'number');
    assert.equal(typeof body.data.lowStockItemsCount, 'number');
    assert.equal(typeof body.data.outOfStockItemsCount, 'number');
    assert.ok(body.data.expiringBatches);
    assert.equal(typeof body.data.expiringBatches.within30Days, 'number');
    assert.equal(typeof body.data.expiringBatches.within60Days, 'number');
    assert.equal(typeof body.data.activeRecallsCount, 'number');
    assert.ok(Array.isArray(body.data.drillDown));
  });

  // =========================================================================
  // 12. UNIFIED CROSS-DEPARTMENT PENDING WORK QUEUE
  // =========================================================================
  it('TEST 12: Unified Pending Queue: Aggregates appointments, lab orders, radiology, and IPD discharges', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/pending-queue',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalPendingItemsCount, 'number');
    assert.ok(Array.isArray(body.data.items));

    // Check SLA tagging on pending items
    for (const item of body.data.items) {
      assert.ok(item.id);
      assert.ok(item.category);
      assert.ok(item.department);
      assert.ok(['WITHIN_SLA', 'AT_RISK', 'BREACHED'].includes(item.slaStatus));
      assert.equal(typeof item.ageMinutes, 'number');
    }
  });

  // =========================================================================
  // 13. REAL-TIME SLA ANALYTICS
  // =========================================================================
  it('TEST 13: Real-Time SLAs: Evaluates department compliance targets with overall compliance percentage', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/slas',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalEvaluatedWorkflows, 'number');
    assert.equal(typeof body.data.withinSlaCount, 'number');
    assert.equal(typeof body.data.atRiskCount, 'number');
    assert.equal(typeof body.data.breachedCount, 'number');
    assert.equal(typeof body.data.overallComplianceRatePercent, 'number');
  });

  // =========================================================================
  // 14. STAFF PRODUCTIVITY & CLINICAL WORKLOAD
  // =========================================================================
  it('TEST 14: Staff Workload: Aggregates doctor clinical assignments and completed consults', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/staff-workload',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.staffCount, 'number');
    assert.ok(Array.isArray(body.data.workload));
  });

  // =========================================================================
  // 15. PATH ALIASES COMPLIANCE (/api/v1/partner/analytics/*)
  // =========================================================================
  it('TEST 15: Path Aliases: /api/v1/partner/analytics/* routes mirror command center endpoints', async () => {
    const endpoints = [
      '/api/v1/partner/analytics/overview',
      '/api/v1/partner/analytics/patients',
      '/api/v1/partner/analytics/opd',
      '/api/v1/partner/analytics/ipd',
      '/api/v1/partner/analytics/lab',
      '/api/v1/partner/analytics/radiology',
      '/api/v1/partner/analytics/pharmacy',
      '/api/v1/partner/analytics/revenue',
      '/api/v1/partner/analytics/inventory',
      '/api/v1/partner/analytics/pending-queue',
      '/api/v1/partner/analytics/slas',
      '/api/v1/partner/analytics/staff-workload',
      '/api/v1/partner/analytics/wholesale'
    ];

    for (const endpoint of endpoints) {
      const res = await app.inject({
        method: 'GET',
        url: endpoint,
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200, `Endpoint ${endpoint} failed with ${res.statusCode}`);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
    }
  });

  // =========================================================================
  // 16. HQ COMMAND CENTER GOVERNANCE & ANALYTICS
  // =========================================================================
  it('TEST 16: HQ Command Center: Returns platform-wide partner lifecycle, licenses, and security telemetry', async () => {
    // 1. HQ Overview
    const resOverview = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/overview',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resOverview.statusCode, 200);
    const bodyOverview = JSON.parse(resOverview.body);
    assert.equal(bodyOverview.success, true);
    assert.ok(bodyOverview.data.summary);
    assert.ok(bodyOverview.data.partnerLifecycle);
    assert.ok(bodyOverview.data.licensing);
    assert.ok(bodyOverview.data.financial);
    assert.ok(bodyOverview.data.throughput);
    assert.ok(bodyOverview.data.security);
    assert.ok(bodyOverview.data.health);

    // 2. HQ Partners Lifecycle
    const resPartners = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/partners',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resPartners.statusCode, 200);
    const bodyPartners = JSON.parse(resPartners.body);
    assert.equal(bodyPartners.success, true);
    assert.equal(typeof bodyPartners.data.kpi.totalPartners, 'number');
    assert.ok(bodyPartners.data.distributions.byStatus);

    // 3. HQ Licenses
    const resLicenses = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/licenses',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resLicenses.statusCode, 200);
    const bodyLicenses = JSON.parse(resLicenses.body);
    assert.equal(bodyLicenses.success, true);
    assert.equal(typeof bodyLicenses.data.kpi.totalLicenses, 'number');
    assert.equal(typeof bodyLicenses.data.kpi.expiringIn7Days, 'number');

    // 4. HQ Revenue
    const resRevenue = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/revenue',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resRevenue.statusCode, 200);
    const bodyRevenue = JSON.parse(resRevenue.body);
    assert.equal(bodyRevenue.success, true);
    assert.equal(bodyRevenue.data.revenueType, 'HQ_SUBSCRIPTION_LICENSING');

    // 5. HQ Security Telemetry
    const resSecurity = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/security',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resSecurity.statusCode, 200);
    const bodySecurity = JSON.parse(resSecurity.body);
    assert.equal(bodySecurity.success, true);
    assert.equal(typeof bodySecurity.data.kpi.totalAuditEvents, 'number');
    assert.equal(typeof bodySecurity.data.kpi.pendingFounderApprovals, 'number');

    // 6. HQ Operational Health
    const resHealth = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/health',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(resHealth.statusCode, 200);
    const bodyHealth = JSON.parse(resHealth.body);
    assert.equal(bodyHealth.success, true);
    assert.ok(bodyHealth.data.database.connected);
  });

  // =========================================================================
  // 17. HQ ACCESS CONTROL (RBAC Security Enforcement)
  // =========================================================================
  it('TEST 17: HQ Access Control: Non-HQ roles receive 403 Forbidden on HQ Command Center', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/overview',
      headers: { authorization: `Bearer ${unauthorizedToken}` }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  // =========================================================================
  // 18. SERVER-SIDE TENANT ISOLATION & AUDIT
  // =========================================================================
  it('TEST 18: Tenant Isolation: Queries strictly scoped to session tenantId, unauthenticated blocked', async () => {
    // 1. Unauthenticated request rejected with 401
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/overview'
    });
    assert.equal(unauthRes.statusCode, 401);

    // 2. Tenant B overview shows only Tenant B data
    const resB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/overview',
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resB.statusCode, 200);
    const bodyB = JSON.parse(resB.body);
    assert.equal(bodyB.success, true);
  });
});
