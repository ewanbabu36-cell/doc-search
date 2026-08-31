import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 2.11 — Procurement & Supply Chain Management (SCM) Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-proc-001',
      email: overrides.email || 'procurement.manager@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['PROCUREMENT_MANAGER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'procurement:vendor:read',
        'procurement:vendor:create',
        'procurement:po:read',
        'procurement:po:create',
        'procurement:po:update',
        'procurement:grn:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdVendorId;
  let createdItemId;
  let createdRequisitionId;
  let createdPoId;
  let createdGrnId;
  let createdInvoiceId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-proc-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/procurement/overview returns SCM KPI dashboard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/procurement/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.activeVendorsCount > 0);
    assert.ok(body.data.onTimeDeliveryPercentage >= 90);
  });

  it('TEST 02: GET /api/v1/partner/procurement/analytics returns spend & vendor leaderboard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/procurement/analytics',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.spendByCategory));
    assert.ok(body.data.leadTimeDaysAverage > 0);
  });

  it('TEST 03: POST /api/v1/partner/procurement/vendors onboards approved pharmaceutical vendor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/vendors',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        vendorCategory: 'PHARMACEUTICALS',
        vendorType: 'MANUFACTURER',
        taxIdGstin: '27AAACN1234F1Z8',
        contactPerson: 'Mr. Arvind Gupta',
        contactEmail: 'arvind.gupta@novartis.in',
        contactPhone: '+91 98200 11223',
        riskClassification: 'LOW_RISK'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.vendorCode.startsWith('VND-'));
    assert.equal(body.data.vendorName, 'Novartis Healthcare India Pvt Ltd');
    createdVendorId = body.data.id;
  });

  it('TEST 04: POST /api/v1/partner/procurement/items registers critical inventory catalog item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/items',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        itemName: 'Meropenem 1g IV Injection',
        category: 'MEDICINE',
        unitOfMeasure: 'VIAL',
        standardPriceMinorUnits: 125000,
        reorderLevel: 50,
        safetyStock: 20,
        currentStock: 120,
        hsnCode: '30042064',
        taxRatePercent: 12.0
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.itemCode.startsWith('ITM-'));
    createdItemId = body.data.id;
  });

  it('TEST 05: POST /api/v1/partner/procurement/requisitions raises purchase requisition', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/requisitions',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        departmentName: 'Inpatient Pharmacy',
        requestorName: 'Chief Pharmacist',
        urgency: 'HIGH',
        items: [
          { itemId: createdItemId, itemName: 'Meropenem 1g IV Injection', quantity: 200, unitPriceMinorUnits: 125000 }
        ],
        totalEstimatedCostMinorUnits: 25000000,
        justification: 'ICU stock reaching minimum safety buffer'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.requisitionNumber.startsWith('PR-'));
    assert.equal(body.data.status, 'PENDING_APPROVAL');
    createdRequisitionId = body.data.id;
  });

  it('TEST 06: PATCH /api/v1/partner/procurement/requisitions/:id/approve approves PR by HOD', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/procurement/requisitions/${createdRequisitionId}/approve`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'APPROVED');
  });

  it('TEST 07: POST /api/v1/partner/procurement/purchase-orders creates Purchase Order (PO)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/purchase-orders',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        vendorId: createdVendorId,
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        requisitionId: createdRequisitionId,
        items: [
          { itemId: createdItemId, itemName: 'Meropenem 1g IV Injection', quantity: 200, unitPriceMinorUnits: 125000, lineTotalMinorUnits: 25000000 }
        ],
        subtotalMinorUnits: 25000000,
        taxMinorUnits: 3000000,
        paymentTerms: 'NET_30_DAYS',
        shippingAddress: 'Central Pharmacy Warehouse Dock 1'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.poNumber.startsWith('PO-'));
    assert.equal(body.data.totalMinorUnits, 28000000);
    createdPoId = body.data.id;
  });

  it('TEST 08: PATCH /api/v1/partner/procurement/purchase-orders/:id/approve signs off PO budget', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/procurement/purchase-orders/${createdPoId}/approve`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'APPROVED');
  });

  it('TEST 09: POST /api/v1/partner/procurement/goods-receipts creates Goods Receipt Note (GRN)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/goods-receipts',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        poId: createdPoId,
        poNumber: 'PO-2026-8891',
        vendorId: createdVendorId,
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        challanNumber: 'DC-NOV-99120',
        receivedBy: 'Store In-charge',
        items: [
          { itemId: createdItemId, itemName: 'Meropenem 1g IV Injection', quantityReceived: 200, batchNumber: 'BAT-2026-M09', expiryDate: '2028-08-31' }
        ]
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.grnNumber.startsWith('GRN-'));
    createdGrnId = body.data.id;
  });

  it('TEST 10: POST /api/v1/partner/procurement/inspections records Quality Inspection PASS', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/inspections',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        grnId: createdGrnId,
        grnNumber: 'GRN-2026-8891',
        inspectorName: 'Quality Control Officer',
        overallResult: 'PASSED_100_PERCENT',
        items: [
          { itemId: createdItemId, inspectedQuantity: 200, acceptedQuantity: 200, rejectedQuantity: 0, coldChainIntact: true }
        ],
        remarks: 'Cold chain temperature logs verified at +4°C continuously.'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.inspectionNumber.startsWith('INSP-'));
    assert.equal(body.data.overallResult, 'PASSED_100_PERCENT');
  });

  it('TEST 11: POST /api/v1/partner/procurement/invoices registers vendor invoice', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/invoices',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        invoiceNumber: 'INV-NOV-2026-4410',
        poId: createdPoId,
        poNumber: 'PO-2026-8891',
        grnId: createdGrnId,
        grnNumber: 'GRN-2026-8891',
        vendorId: createdVendorId,
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        totalAmountMinorUnits: 28000000,
        taxAmountMinorUnits: 3000000
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.invoiceNumber, 'INV-NOV-2026-4410');
    createdInvoiceId = body.data.id;
  });

  it('TEST 12: POST /api/v1/partner/procurement/invoices/match reconciles 3-Way Matching', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/invoices/match',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        invoiceId: createdInvoiceId,
        poId: createdPoId,
        grnId: createdGrnId,
        varianceAmountMinorUnits: 0,
        variancePercentage: 0.0
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.matchStatus, 'MATCHED_APPROVED_FOR_PAYMENT');
    assert.equal(body.data.withinTolerance, true);
  });

  it('TEST 13: POST /api/v1/partner/procurement/returns records Vendor Return note for damaged batch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/returns',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        grnId: createdGrnId,
        vendorId: createdVendorId,
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        reason: 'Broken ampoule seal discovered in secondary box packaging',
        items: [
          { itemId: createdItemId, returnQuantity: 5, unitPriceMinorUnits: 125000 }
        ]
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.returnNumber.startsWith('RET-'));
    assert.equal(body.data.status, 'RETURN_DISPATCHED');
  });

  it('TEST 14: POST /api/v1/partner/procurement/purchase-orders/emergency creates STAT emergency PO', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/procurement/purchase-orders/emergency',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        vendorId: createdVendorId,
        vendorName: 'Novartis Healthcare India Pvt Ltd',
        items: [
          { itemName: 'STAT Polyvalent Snake Antivenom 10ml', quantity: 20, unitPriceMinorUnits: 150000 }
        ],
        subtotalMinorUnits: 3000000,
        taxMinorUnits: 360000
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.poNumber.startsWith('PO-EMG-'));
    assert.equal(body.data.status, 'DISPATCHED_TO_VENDOR');
  });

  it('TEST 15: Cross-tenant isolation & SHA-256 audit trail integrity', async () => {
    // Tenant B cannot access Tenant A vendors
    const tenantBRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/procurement/vendors',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(tenantBRes.statusCode, 200);
    const tenantBBody = JSON.parse(tenantBRes.body);
    const leaked = tenantBBody.data.find(v => v.id === createdVendorId);
    assert.equal(leaked, undefined, 'Tenant B must not see Tenant A vendor records');

    // Unauthenticated request rejected with 401
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/procurement/vendors'
    });
    assert.equal(unauthRes.statusCode, 401);

    // Audit traces verification
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/procurement/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(auditRes.statusCode, 200);
    const auditBody = JSON.parse(auditRes.body);
    assert.ok(auditBody.data.length > 0, 'Audit events must be recorded');
    assert.ok(auditBody.data.every(a => typeof a.integrityHash === 'string' && a.integrityHash.length === 64), 'All audit records must have SHA-256 hash');
  });
});
