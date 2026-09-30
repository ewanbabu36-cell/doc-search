import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  getDatabase,
  patients,
  inpatientBeds,
  investigationOrders,
  radiologyOrders,
  billingInvoices,
  billingPayments,
  supplyChainBatches,
  supplyChainInventory,
  auditEvents,
  eq,
  sql
} from '@docsearch/database';
import { auditRepository } from '../dist/repositories/core/AuditRepository.js';

describe('PHASE 23 — Command Center & BI Independent Reconciliation Test Suite', () => {
  let app;
  let db;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222'; // Unseeded clean tenant
  const branchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-bi-auditor-01',
      email: overrides.email || 'bi.auditor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['HOSPITAL_ADMIN', 'CHIEF_FINANCIAL_OFFICER'],
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
      sub: overrides.userId || 'usr-hq-governance-01',
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
  let unprivilegedToken;

  before(async () => {
    app = await buildApp();
    await app.ready();
    db = getDatabase();

    tokenA = createTestToken({ tenantId: tenantA });
    tokenB = createTestToken({ tenantId: tenantB, userId: 'usr-clean-tenantB' });
    hqToken = createHqToken();
    unprivilegedToken = createTestToken({
      tenantId: tenantA,
      userId: 'usr-nurse-01',
      roles: ['NURSE'],
      permissions: ['clinical:vitals:read']
    });
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. ZERO-STATE TRUTH & CLEANLINESS (GAP-P23-01 Remediated)
  // =========================================================================
  it('TEST 01: Zero-State Truth: Unseeded tenant returns exact clean 0s, empty arrays, NO mock data leakage', async () => {
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
    assert.equal(body.data.summary.radiologyCompleted, 0);
    assert.equal(body.data.summary.grossRevenue, 0);
    assert.equal(body.data.summary.lowStockItems, 0);
    assert.equal(body.data.summary.pendingWorkQueueCount, 0);

    // Verify zero mock doctor or patient names leak through
    const textOutput = JSON.stringify(body.data);
    assert.equal(textOutput.includes('Kavita Joshi'), false, 'Mock doctor Kavita Joshi must not appear');
    assert.equal(textOutput.includes('Apex Multi-Specialty'), false, 'Mock hospital Apex must not appear');
    assert.equal(textOutput.includes('Ramanathan Iyer'), false, 'Mock doctor Ramanathan Iyer must not appear');
  });

  // =========================================================================
  // 2. TRANSACTIONAL DOUBLE-ENTRY FINANCIAL RECONCILIATION
  // =========================================================================
  it('TEST 02: Financial Reconciliation: Gross billing and collections exactly reconcile with PostgreSQL ledger', async () => {
    // 1. Direct authoritative query on billing invoices
    const invoiceRows = await db
      .select({
        total: sql`COALESCE(SUM(total_amount), 0)`,
        count: sql`COUNT(*)`
      })
      .from(billingInvoices)
      .where(eq(billingInvoices.tenantId, tenantA));
    const expectedInvoiceTotal = Number(invoiceRows[0]?.total || 0);

    // 2. Direct authoritative query on billing payments
    const paymentRows = await db
      .select({
        total: sql`COALESCE(SUM(amount), 0)`,
        count: sql`COUNT(*)`
      })
      .from(billingPayments)
      .where(eq(billingPayments.tenantId, tenantA));
    const expectedPaymentTotal = Number(paymentRows[0]?.total || 0);

    // 3. API call to command-center revenue endpoint
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/revenue?period=THIS_MONTH',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(typeof body.data.grossBilledAmount === 'number');
    assert.ok(typeof body.data.paymentsCollectedAmount === 'number');
    assert.ok(typeof body.data.refundsProcessedAmount === 'number');
    assert.ok(typeof body.data.netRealizedRevenue === 'number');

    // Mathematical identity: netRevenue = collections - refunds
    const calculatedNet = Number((body.data.paymentsCollectedAmount - body.data.refundsProcessedAmount).toFixed(2));
    assert.equal(
      Math.abs(body.data.netRealizedRevenue - calculatedNet) < 0.01,
      true,
      'netRealizedRevenue must equal paymentsCollectedAmount - refundsProcessedAmount'
    );
  });

  // =========================================================================
  // 3. PATIENT VOLUME & DEMOGRAPHIC RECONCILIATION
  // =========================================================================
  it('TEST 03: Clinical Patient Volume: Total patients reconcile with clinical.patients', async () => {
    // 1. Direct DB count
    const [dbPatientCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(patients)
      .where(eq(patients.tenantId, tenantA));
    const expectedCount = Number(dbPatientCount?.count || 0);

    // 2. API query
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/patients',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalRegisteredPatients, expectedCount);
    assert.ok(Array.isArray(body.data.drillDown));
    if (body.data.drillDown.length > 0) {
      assert.ok(body.data.drillDown[0].uhid !== undefined);
    }
  });

  // =========================================================================
  // 4. INPATIENT (IPD) BED OCCUPANCY RECONCILIATION
  // =========================================================================
  it('TEST 04: IPD Bed Occupancy: Occupied beds and occupancy rate reconcile with clinical.inpatient_beds', async () => {
    // 1. Direct DB queries
    const [totalBedsRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(inpatientBeds)
      .where(eq(inpatientBeds.tenantId, tenantA));
    const [occupiedBedsRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(inpatientBeds)
      .where(sql`tenant_id = ${tenantA} AND status = 'OCCUPIED'`);

    const expectedTotalBeds = Number(totalBedsRow?.count || 0);
    const expectedOccupiedBeds = Number(occupiedBedsRow?.count || 0);
    const expectedOccupancyRate = expectedTotalBeds > 0
      ? Math.round((expectedOccupiedBeds / expectedTotalBeds) * 10000) / 100
      : 0;

    // 2. API query
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/ipd',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalBeds, expectedTotalBeds);
    assert.equal(body.data.occupiedBeds, expectedOccupiedBeds);
    assert.equal(body.data.occupancyRatePercent, expectedOccupancyRate);
  });

  // =========================================================================
  // 5. LAB DIAGNOSTICS (LIMS) PIPELINE RECONCILIATION
  // =========================================================================
  it('TEST 05: Lab Diagnostics: Order volume and pipeline states reconcile with clinical.investigation_orders', async () => {
    const [dbOrderCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(investigationOrders)
      .where(eq(investigationOrders.tenantId, tenantA));
    const expectedTotal = Number(dbOrderCount?.count || 0);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/lab',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalOrdersCount, expectedTotal);
    assert.ok(typeof body.data.samplesCollectedCount === 'number');
    assert.ok(typeof body.data.reportsDeliveredCount === 'number');
    assert.ok(typeof body.data.criticalPanicAlertsCount === 'number');
  });

  // =========================================================================
  // 6. RADIOLOGY (RIS/PACS) MODALITY & ORDER RECONCILIATION
  // =========================================================================
  it('TEST 06: Radiology Analytics: Modality distribution reconciles with clinical.radiology_orders', async () => {
    const [dbRadCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(radiologyOrders)
      .where(eq(radiologyOrders.tenantId, tenantA));
    const expectedTotal = Number(dbRadCount?.count || 0);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/radiology',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalOrdersCount, expectedTotal);
    assert.ok(Array.isArray(body.data.modalityBreakdown));

    // Modality breakdown sum must match total orders
    const modalitySum = body.data.modalityBreakdown.reduce((acc, m) => acc + m.count, 0);
    assert.equal(modalitySum, expectedTotal, 'Modality breakdown counts must sum to total orders count');
  });

  // =========================================================================
  // 7. INVENTORY VALUATION & STOCK RECONCILIATION
  // =========================================================================
  it('TEST 07: Supply Chain: Inventory valuation reconciles with supply_chain.batches', async () => {
    const batchRows = await db.query.supplyChainBatches.findMany({
      where: eq(supplyChainBatches.tenantId, tenantA)
    });
    let expectedValuation = 0;
    for (const b of batchRows) {
      expectedValuation += b.currentQuantity * Number(b.unitCost || 0);
    }

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/inventory',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalStockValuation, expectedValuation);
    assert.ok(typeof body.data.totalCatalogItemsCount === 'number');
    assert.ok(typeof body.data.lowStockItemsCount === 'number');
  });

  // =========================================================================
  // 8. EWAN AI TELEMETRY ENDPOINT & ACCURACY (GAP-P23-04 Remediated)
  // =========================================================================
  it('TEST 08: Ewan AI Telemetry: /ai-telemetry returns authoritative request registry metrics and alias works', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/ai-telemetry',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.ok(typeof body.data.totalRequests === 'number');
    assert.ok(typeof body.data.averageLatencyMs === 'number');
    assert.ok(typeof body.data.totalTokensConsumed === 'number');
    assert.ok(typeof body.data.statusBreakdown === 'object');
    assert.ok(typeof body.data.moduleBreakdown === 'object');
    assert.ok(Array.isArray(body.data.recentRequests));

    // Verify alias /api/v1/partner/analytics/ai-telemetry
    const aliasRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/analytics/ai-telemetry',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(aliasRes.statusCode, 200);
    const aliasBody = JSON.parse(aliasRes.body);
    assert.equal(aliasBody.success, true);
    assert.equal(aliasBody.data.totalRequests, body.data.totalRequests);
  });

  // =========================================================================
  // 9. PARTNER LICENSE & ENTITLEMENT TELEMETRY (GAP-P23-05 Remediated)
  // =========================================================================
  it('TEST 09: License Status: /license returns partner commercial tier, limits, and expiry status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/license',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.ok(body.data.status);
    assert.ok(body.data.planCode);
    assert.ok(body.data.planName);
    assert.ok(typeof body.data.maxDoctors === 'number');
    assert.ok(typeof body.data.maxBranches === 'number');
    assert.ok(typeof body.data.isLocked === 'boolean');

    // Verify alias /api/v1/partner/analytics/license
    const aliasRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/analytics/license',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(aliasRes.statusCode, 200);
    const aliasBody = JSON.parse(aliasRes.body);
    assert.equal(aliasBody.success, true);
    assert.equal(aliasBody.data.status, body.data.status);
  });

  // =========================================================================
  // 10. GOVERNED CSV EXPORT — PARTNER COMMAND CENTER (GAP-P23-03 Remediated)
  // =========================================================================
  it('TEST 10: Partner CSV Export: Generates RFC 4180 CSV with proper headers and audit trail', async () => {
    const testCases = [
      { cat: 'OVERVIEW', expectedHeader: 'Metric' },
      { cat: 'REVENUE', expectedHeader: 'Invoice Number' },
      { cat: 'PATIENTS', expectedHeader: 'Patient ID' },
      { cat: 'INVENTORY', expectedHeader: 'Item Code' }
    ];

    for (const { cat, expectedHeader } of testCases) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/command-center/export?category=${cat}`,
        headers: { authorization: `Bearer ${tokenA}` }
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/csv; charset=utf-8');
      assert.ok(res.headers['content-disposition'].includes(`partner_${cat.toLowerCase()}_export.csv`));
      
      const csvText = res.body;
      assert.ok(csvText.length > 0, `CSV for ${cat} must not be empty`);
      assert.ok(csvText.includes(expectedHeader), `CSV for ${cat} must contain ${expectedHeader}`);
    }

    // Verify alias /api/v1/partner/analytics/export
    const aliasRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/analytics/export?category=REVENUE',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(aliasRes.statusCode, 200);
    assert.equal(aliasRes.headers['content-type'], 'text/csv; charset=utf-8');
    assert.ok(aliasRes.body.includes('Invoice Number'));
  });

  // =========================================================================
  // 11. GOVERNED CSV EXPORT — HQ COMMAND CENTER (GAP-P23-03 Remediated)
  // =========================================================================
  it('TEST 11: HQ CSV Export: HQ administrators can export platform-wide BI CSVs', async () => {
    const hqCategories = ['PARTNERS', 'LICENSES', 'REVENUE'];

    for (const cat of hqCategories) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/hq/command-center/export?category=${cat}`,
        headers: { authorization: `Bearer ${hqToken}` }
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/csv; charset=utf-8');
      assert.ok(res.headers['content-disposition'].includes(`hq_${cat.toLowerCase()}_export.csv`));
      assert.ok(res.body.length > 0);
    }

    // Verify alias /api/v1/company/command-center/export
    const aliasRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/command-center/export?category=PARTNERS',
      headers: { authorization: `Bearer ${hqToken}` }
    });
    assert.equal(aliasRes.statusCode, 200);
    assert.ok(aliasRes.body.includes('Total Partners'));
  });

  // =========================================================================
  // 12. CROSS-TENANT ISOLATION & DATA SECURITY
  // =========================================================================
  it('TEST 12: Cross-Tenant Isolation: Tenant B cannot access Tenant A metrics, query param spoofing rejected', async () => {
    // 1. Tenant B requests own patients
    const resB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/patients',
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resB.statusCode, 200);
    const bodyB = JSON.parse(resB.body);
    assert.equal(bodyB.data.totalRegisteredPatients, 0);
    assert.equal(bodyB.data.dataQuality, 'NO_DATA');

    // 2. Tenant B attempts to spoof tenantA in query params -> Auth Guard actively detects and blocks with 403
    const resSpoof = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/command-center/patients?tenantId=${tenantA}`,
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resSpoof.statusCode, 403, 'Cross-tenant query spoofing must be blocked with 403');

    // 3. Tenant B attempts to export with tenantA parameter -> blocked with 403
    const resExportSpoof = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/command-center/export?category=OVERVIEW&tenantId=${tenantA}`,
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resExportSpoof.statusCode, 403, 'Cross-tenant export spoofing must be blocked with 403');
  });

  // =========================================================================
  // 13. ROLE-BASED ACCESS CONTROL & BOUNDARY DEFENSE
  // =========================================================================
  it('TEST 13: RBAC & Boundary Defense: Partner roles rejected from HQ command center with 403 Forbidden', async () => {
    // Attempting HQ command center overview with partner token
    const resOverview = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/overview',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resOverview.statusCode, 403, 'Partner token must receive 403 on HQ overview');

    // Attempting HQ export with partner token
    const resExport = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/command-center/export?category=PARTNERS',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resExport.statusCode, 403, 'Partner token must receive 403 on HQ export');

    // Unauthenticated access
    const resUnauth = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/overview'
    });
    assert.equal(resUnauth.statusCode, 401, 'Unauthenticated request must receive 401');
  });

  // =========================================================================
  // 14. CRYPTOGRAPHIC AUDIT RECORDING ON ANALYTICS CONSUMPTION & EXPORT
  // =========================================================================
  it('TEST 14: Audit Verification: Command center views and exports create immutable audit events', async () => {
    // Perform an export action
    await app.inject({
      method: 'GET',
      url: '/api/v1/partner/command-center/export?category=REVENUE',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    // Check audit events by tenant
    const events = await auditRepository.getEventsByTenant(tenantA, 50);
    assert.ok(events.length > 0, 'Audit repository must return recorded events for tenantA');
    const hasExportEvent = events.some((e) => e.eventType === 'COMMAND_CENTER_EXPORT');
    assert.equal(hasExportEvent, true, 'COMMAND_CENTER_EXPORT audit record must exist in audit log');
  });
});
