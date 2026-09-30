import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('PHASE 12 — Supply Chain Management (SCM) Production Verification Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const cleanTenant = '33333333-3333-4333-8333-333333333333';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-scm-001',
      email: overrides.email || 'supplychain.director@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['SUPPLY_CHAIN_DIRECTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'supply_chain:warehouse:read',
        'supply_chain:warehouse:create',
        'supply_chain:inventory:read',
        'supply_chain:inventory:consume',
        'supply_chain:transfer:create',
        'supply_chain:transfer:approve',
        'supply_chain:transfer:dispatch',
        'supply_chain:transfer:receive',
        'supply_chain:recall:create',
        'supply_chain:audit:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let tokenA;
  let tokenB;
  let cleanToken;

  // Shared test entity IDs
  let centralWarehouseId;
  let otWarehouseId;
  let labWarehouseId;
  let coldLocationId;
  let vendorId;
  let medicineItemId;
  let consumableItemId;
  let reagentItemId;
  let requisitionId;
  let poId;
  let poItemId;
  let grnId;
  let batch1Number = 'BAT-TEST-001';
  let batch2Number = 'BAT-TEST-002';
  let transferId;
  let stockCountId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    tokenA = createTestToken({ tenantId: tenantA });
    tokenB = createTestToken({ tenantId: tenantB, userId: 'usr-tenantB' });
    cleanToken = createTestToken({ tenantId: cleanTenant, userId: 'usr-clean' });
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. ZERO-STATE COMPLIANCE (Non-negotiable)
  // =========================================================================
  it('TEST 01: Zero-State Compliance: Unseeded tenant returns clean 0s without synthetic mocks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/supply-chain/metrics',
      headers: { authorization: `Bearer ${tokenB}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalWarehousesCount, 0);
    assert.equal(body.data.totalInventoryItemsCount, 0);
    assert.equal(body.data.totalStockValuation, 0);
    assert.equal(body.data.lowStockItemsCount, 0);
    assert.equal(body.data.expiringBatchesCount, 0);
    assert.equal(body.data.quarantinedBatchesCount, 0);
    assert.equal(body.data.pendingTransfersCount, 0);
  });

  // =========================================================================
  // 2. WAREHOUSES & LOCATIONS SETUP (Central, OT, Pharmacy, LIMS)
  // =========================================================================
  it('TEST 02: Register Central Store, OT Store & LIMS Reagent Depot', async () => {
    // 1. Central Warehouse
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/warehouses',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        code: 'MAIN-CENTRAL',
        name: 'Central Hospital Medical Depot',
        type: 'CENTRAL',
        departmentName: 'CENTRAL',
        location: 'Ground Floor, Logistics Wing',
        isColdChain: false,
        managerName: 'Col. Rajesh Sharma'
      }
    });
    if (res1.statusCode !== 201) console.error('RES1 FAILED:', res1.statusCode, res1.body);
    assert.equal(res1.statusCode, 201);
    const body1 = JSON.parse(res1.body);
    assert.equal(body1.success, true);
    assert.equal(body1.data.code, 'MAIN-CENTRAL');
    centralWarehouseId = body1.data.id;

    // 2. OT Consumables Store
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/warehouses',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        code: 'OT-DEPOT',
        name: 'Operating Theatre Surgical Supply Depot',
        type: 'DEPARTMENTAL',
        departmentName: 'OT',
        location: 'Level 3, Clean Corridor',
        isColdChain: false,
        managerName: 'Nurse Incharge Sunita'
      }
    });
    if (res2.statusCode !== 201) console.error('RES2 FAILED:', res2.statusCode, res2.body);
    assert.equal(res2.statusCode, 201);
    const body2 = JSON.parse(res2.body);
    otWarehouseId = body2.data.id;

    // 3. LIMS Cold Chain Store
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/warehouses',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        code: 'LIMS-COLD',
        name: 'Pathology Diagnostics Reagent Chamber',
        type: 'DEPARTMENTAL',
        departmentName: 'LIMS',
        location: 'Basement 1, Pathology Wing',
        isColdChain: true,
        managerName: 'Dr. Vivek Pathak'
      }
    });
    assert.equal(res3.statusCode, 201);
    const body3 = JSON.parse(res3.body);
    labWarehouseId = body3.data.id;

    // Create a cold storage bin in LIMS
    const resLoc = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/supply-chain/warehouses/${labWarehouseId}/locations`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        code: 'COLD-FRIDGE-01',
        zone: 'COLD_CHAIN',
        isTemperatureControlled: true,
        minTempCelsius: '2.00',
        maxTempCelsius: '8.00'
      }
    });
    assert.equal(resLoc.statusCode, 201);
    const locBody = JSON.parse(resLoc.body);
    coldLocationId = locBody.data.id;
    assert.ok(coldLocationId);
  });

  // =========================================================================
  // 3. VENDOR & ITEM MASTER ONBOARDING
  // =========================================================================
  it('TEST 03: Register Vendor and Multi-Category Items (Medicine, Consumable, Reagent)', async () => {
    // Vendor
    const resVnd = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/vendors',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        vendorName: 'Serum Institute of India Logistics',
        vendorCategory: 'PHARMACEUTICALS',
        vendorType: 'MANUFACTURER',
        taxIdGstin: '27AABCS1429B1ZB',
        contactPerson: 'Adar Poonawalla Ops Desk',
        contactEmail: 'orders@seruminstitute.com'
      }
    });
    if (resVnd.statusCode !== 201) console.error('RES_VND ERROR:', resVnd.statusCode, resVnd.body);
    assert.equal(resVnd.statusCode, 201);
    const vndBody = JSON.parse(resVnd.body);
    vendorId = vndBody.data.id;
    assert.ok(vendorId);

    // Item 1: Critical Medicine (Ceftriaxone 1g Injection)
    const resItm1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/items',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        itemName: 'Ceftriaxone 1g IV Injection',
        category: 'MEDICINE',
        unit: 'VIAL',
        standardCost: '85.50',
        reorderLevel: 50,
        safetyStock: 20,
        maxStock: 500,
        isExpiryApplicable: true,
        isBatchApplicable: true
      }
    });
    assert.equal(resItm1.statusCode, 201);
    medicineItemId = JSON.parse(resItm1.body).data.id;

    // Item 2: Surgical Consumable (Nitrile Gloves Size 7.5)
    const resItm2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/items',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        itemName: 'Sterile Surgical Gloves 7.5',
        category: 'SURGICAL_CONSUMABLE',
        unit: 'PAIR',
        standardCost: '32.00',
        reorderLevel: 100,
        safetyStock: 50,
        maxStock: 1000,
        isExpiryApplicable: true,
        isBatchApplicable: true
      }
    });
    assert.equal(resItm2.statusCode, 201);
    consumableItemId = JSON.parse(resItm2.body).data.id;

    // Item 3: LIMS Reagent (Troponin I Kit)
    const resItm3 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/items',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        itemName: 'Troponin I High-Sensitivity Assay Kit',
        category: 'LAB_REAGENT',
        unit: 'KIT',
        standardCost: '1450.00',
        reorderLevel: 10,
        safetyStock: 5,
        maxStock: 50,
        isExpiryApplicable: true,
        isBatchApplicable: true
      }
    });
    assert.equal(resItm3.statusCode, 201);
    reagentItemId = JSON.parse(resItm3.body).data.id;
  });

  // =========================================================================
  // 4. PURCHASE REQUISITION & PO WORKFLOW
  // =========================================================================
  it('TEST 04: Raise Requisition & Convert to Approved Purchase Order', async () => {
    // Requisition
    const resReq = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/requisitions',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        departmentName: 'OT',
        urgency: 'HIGH',
        notes: 'Replenishing emergency surgical supplies for trauma ward',
        items: [
          { procurementItemId: consumableItemId, requestedQuantity: 200, estimatedUnitCost: '32.00' }
        ]
      }
    });
    assert.equal(resReq.statusCode, 201);
    requisitionId = JSON.parse(resReq.body).data.id;

    // Approve Requisition
    const resApprReq = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/supply-chain/requisitions/${requisitionId}/approve`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resApprReq.statusCode, 200);
    assert.equal(JSON.parse(resApprReq.body).data.status, 'APPROVED');

    // Create PO
    const resPo = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/purchase-orders',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        vendorId,
        requisitionId,
        deliveryLocation: 'Central Hospital Gate 2 Stores',
        expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        paymentTerms: 'NET_30',
        items: [
          { procurementItemId: medicineItemId, orderedQuantity: 200, unitPrice: '85.50' },
          { procurementItemId: consumableItemId, orderedQuantity: 300, unitPrice: '32.00' }
        ]
      }
    });
    assert.equal(resPo.statusCode, 201);
    const poBody = JSON.parse(resPo.body);
    poId = poBody.data.id;
    assert.equal(poBody.data.status, 'APPROVED');
  });

  // =========================================================================
  // 5. GOODS RECEIPT NOTE (GRN) & ATOMIC LEDGER INGESTION
  // =========================================================================
  it('TEST 05: Ingest GRN: Create batches, increment inventory, and append immutable ledger', async () => {
    const dummyPoItemId = '00000000-0000-4000-8000-000000000099';
    const futureExpiry = new Date(Date.now() + 365 * 86400000); // 1 year out

    const resGrn = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/goods-receipts',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        purchaseOrderId: poId,
        warehouseId: centralWarehouseId,
        receivingDepartment: 'CENTRAL',
        storeName: 'Central Hospital Medical Depot',
        receivedBy: 'Store Officer Anil',
        deliveryDocumentNumber: 'DC-2026-8812',
        items: [
          {
            purchaseOrderItemId: dummyPoItemId,
            procurementItemId: medicineItemId,
            receivedQuantity: 200,
            acceptedQuantity: 200,
            batchNumber: batch1Number,
            expiryDate: futureExpiry.toISOString(),
            unitPrice: '85.50'
          },
          {
            purchaseOrderItemId: dummyPoItemId,
            procurementItemId: consumableItemId,
            receivedQuantity: 300,
            acceptedQuantity: 300,
            batchNumber: 'BAT-GLV-01',
            expiryDate: futureExpiry.toISOString(),
            unitPrice: '32.00'
          }
        ]
      }
    });

    assert.equal(resGrn.statusCode, 201);
    const grnBody = JSON.parse(resGrn.body);
    grnId = grnBody.data.id;
    assert.equal(grnBody.data.status, 'INSPECTED_PASSED');
    assert.equal(grnBody.data.totalAcceptedItems, 500);

    // Verify Inventory was updated
    const resInv = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/inventory?warehouseId=${centralWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resInv.statusCode, 200);
    const invList = JSON.parse(resInv.body).data;
    const medInv = invList.find(i => i.procurementItemId === medicineItemId);
    assert.ok(medInv);
    assert.equal(medInv.currentStock, 200);
    assert.equal(medInv.availableStock, 200);

    // Verify Immutable Stock Ledger has GRN movement
    const resLedger = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/stock-ledger?warehouseId=${centralWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resLedger.statusCode, 200);
    const ledger = JSON.parse(resLedger.body).data;
    const grnEntry = ledger.find(l => l.referenceType === 'GRN' && l.procurementItemId === medicineItemId);
    assert.ok(grnEntry);
    assert.equal(grnEntry.movementType, 'GRN_RECEIPT');
    assert.equal(grnEntry.quantity, 200);
    assert.equal(grnEntry.balanceAfter, 200);
  });

  // =========================================================================
  // 6. DETERMINISTIC FEFO (FIRST EXPIRY FIRST OUT) VERIFICATION
  // =========================================================================
  it('TEST 06: FEFO Engine: Prioritizes earliest expiring batch over newly arrived batches', async () => {
    // Ingest a second batch of medicine that expires SOONER (in 60 days)
    const earlierExpiry = new Date(Date.now() + 60 * 86400000);
    const dummyPoItemId = '00000000-0000-4000-8000-000000000099';

    await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/goods-receipts',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        purchaseOrderId: poId,
        warehouseId: centralWarehouseId,
        receivingDepartment: 'CENTRAL',
        receivedBy: 'Store Officer Anil',
        items: [
          {
            purchaseOrderItemId: dummyPoItemId,
            procurementItemId: medicineItemId,
            receivedQuantity: 50,
            acceptedQuantity: 50,
            batchNumber: batch2Number, // Earlier expiring batch
            expiryDate: earlierExpiry.toISOString(),
            unitPrice: '85.50'
          }
        ]
      }
    });

    // Query FEFO batch order
    const resFefo = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/batches/fefo?warehouseId=${centralWarehouseId}&procurementItemId=${medicineItemId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });

    assert.equal(resFefo.statusCode, 200);
    const fefoBatches = JSON.parse(resFefo.body).data;
    assert.equal(fefoBatches.length, 2);
    // Earliest expiring batch MUST be index 0
    assert.equal(fefoBatches[0].batchNumber, batch2Number, 'FEFO must return batch with earliest expiry first');
    assert.equal(fefoBatches[1].batchNumber, batch1Number);
  });

  // =========================================================================
  // 7. MATERIAL CONSUMPTION & NEGATIVE STOCK PREVENTION
  // =========================================================================
  it('TEST 07: Material Consumption decrements stock via FEFO and rejects negative stock attempts', async () => {
    // 1. Consume 10 vials of Ceftriaxone in OT Department
    const resCsm = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/consumptions',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        warehouseId: centralWarehouseId,
        departmentName: 'OT',
        procedureName: 'Emergency Laparotomy Surgery',
        notes: 'Administered pre-op prophylactic antibiotic',
        items: [
          { procurementItemId: medicineItemId, quantity: 10 } // should auto-pick batch2 (FEFO)
        ]
      }
    });

    assert.equal(resCsm.statusCode, 201);
    const csmBody = JSON.parse(resCsm.body);
    assert.equal(csmBody.success, true);
    assert.equal(csmBody.data.departmentName, 'OT');

    // Verify batch2 quantity reduced from 50 to 40
    const resBatches = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/batches?warehouseId=${centralWarehouseId}&procurementItemId=${medicineItemId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const b2 = JSON.parse(resBatches.body).data.find(b => b.batchNumber === batch2Number);
    assert.equal(b2.availableQuantity, 40);

    // 2. Negative stock protection: Attempt to consume 9999 vials (more than available)
    const resOver = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/consumptions',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        warehouseId: centralWarehouseId,
        departmentName: 'OT',
        items: [
          { procurementItemId: medicineItemId, quantity: 9999 }
        ]
      }
    });

    assert.equal(resOver.statusCode, 400);
    const errBody = JSON.parse(resOver.body);
    assert.match(errBody.error.message, /Insufficient/i, 'Must block negative stock with clear 400 error');
  });

  // =========================================================================
  // 8. INTER-STORE TRANSFERS (Request -> Approve -> Dispatch -> Receive)
  // =========================================================================
  it('TEST 08: Inter-Store Transfer Lifecycle: Central Store -> OT Depot with in-transit state', async () => {
    // 1. Request Transfer: 50 pairs of gloves from Central Store to OT Depot
    const resTrf = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/transfers',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        sourceWarehouseId: centralWarehouseId,
        destinationWarehouseId: otWarehouseId,
        requestingDepartment: 'OT',
        requestedBy: 'OT Head Nurse',
        notes: 'Stock replenishment for upcoming surgical list',
        items: [
          { procurementItemId: consumableItemId, requestedQuantity: 50 }
        ]
      }
    });
    assert.equal(resTrf.statusCode, 201);
    transferId = JSON.parse(resTrf.body).data.id;
    assert.equal(JSON.parse(resTrf.body).data.status, 'REQUESTED');

    // 2. Approve Transfer
    const resAppr = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/supply-chain/transfers/${transferId}/approve`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resAppr.statusCode, 200);
    assert.equal(JSON.parse(resAppr.body).data.status, 'APPROVED');

    // 3. Dispatch Transfer: Deducts from source store & marks IN_TRANSIT
    const resDisp = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/supply-chain/transfers/${transferId}/dispatch`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resDisp.statusCode, 200);
    assert.equal(JSON.parse(resDisp.body).data.status, 'IN_TRANSIT');

    // Verify Central Store stock reduced from 300 to 250
    const resSrcInv = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/inventory?warehouseId=${centralWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const glvSrc = JSON.parse(resSrcInv.body).data.find(i => i.procurementItemId === consumableItemId);
    assert.equal(glvSrc.availableStock, 250);

    // 4. Receive Transfer: Adds to destination OT store & marks RECEIVED
    const resRecv = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/supply-chain/transfers/${transferId}/receive`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resRecv.statusCode, 200);
    assert.equal(JSON.parse(resRecv.body).data.status, 'RECEIVED');

    // Verify OT Store now has 50 pairs of gloves
    const resDstInv = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/inventory?warehouseId=${otWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const glvDst = JSON.parse(resDstInv.body).data.find(i => i.procurementItemId === consumableItemId);
    assert.ok(glvDst);
    assert.equal(glvDst.availableStock, 50);
  });

  // =========================================================================
  // 9. BATCH RECALL & QUARANTINE LOCKOUT
  // =========================================================================
  it('TEST 09: Batch Recall & Quarantine: Immediately freezes availability and blocks dispensing', async () => {
    // Recall batch1 (BAT-TEST-001) of Ceftriaxone due to manufacturer quality alert
    const resRcl = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/recalls',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        procurementItemId: medicineItemId,
        batchNumber: batch1Number,
        recallClass: 'CLASS_I',
        reason: 'CDSCO alert: Particulate contamination detected in lot',
        dispositionAction: 'RETURN_TO_VENDOR'
      }
    });

    assert.equal(resRcl.statusCode, 201);
    const rclBody = JSON.parse(resRcl.body);
    assert.equal(rclBody.data.status, 'ACTIVE');
    assert.equal(rclBody.data.totalQuarantinedQuantity, 200);

    // Verify batch1 is now RECALLED with availableQuantity = 0
    const resBatches = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/batches?warehouseId=${centralWarehouseId}&procurementItemId=${medicineItemId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const b1 = JSON.parse(resBatches.body).data.find(b => b.batchNumber === batch1Number);
    assert.equal(b1.status, 'RECALLED');
    assert.equal(b1.availableQuantity, 0);

    // Verify attempting to explicitly consume this batch fails
    const resTry = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/consumptions',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        warehouseId: centralWarehouseId,
        departmentName: 'IPD',
        items: [
          { procurementItemId: medicineItemId, quantity: 1, batchId: b1.id }
        ]
      }
    });
    assert.equal(resTry.statusCode, 400);
    assert.match(JSON.parse(resTry.body).error.message, /locked|insufficient/i);
  });

  // =========================================================================
  // 10. PHYSICAL CYCLE COUNT & AUDIT RECONCILIATION
  // =========================================================================
  it('TEST 10: Physical Stock Audit: Blind count detects variance and posts reconciliation adjustment', async () => {
    // 1. Initiate stock count for OT Depot
    const resInit = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/supply-chain/stock-counts',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        warehouseId: otWarehouseId,
        countType: 'CYCLE',
        notes: 'Monthly physical audit of OT consumables'
      }
    });
    assert.equal(resInit.statusCode, 201);
    stockCountId = JSON.parse(resInit.body).data.id;
    assert.equal(JSON.parse(resInit.body).data.totalExpectedQuantity, 50);

    // 2. Auditor records counted quantity: only 48 found (2 pairs damaged/missing)
    const resRecord = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/supply-chain/stock-counts/${stockCountId}/record`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        conductedBy: 'Auditor Mehra',
        counts: [
          { procurementItemId: consumableItemId, countedQuantity: 48 }
        ]
      }
    });
    assert.equal(resRecord.statusCode, 200);
    const recBody = JSON.parse(resRecord.body).data;
    assert.equal(recBody.status, 'REVIEW_REQUIRED');
    assert.equal(recBody.totalVarianceQuantity, -2);

    // 3. Supervisor approves and reconciles variance
    const resRec = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/supply-chain/stock-counts/${stockCountId}/reconcile`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resRec.statusCode, 200);
    assert.equal(JSON.parse(resRec.body).data.status, 'RECONCILED');

    // Verify inventory at OT Depot is now 48
    const resInv = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/inventory?warehouseId=${otWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const glv = JSON.parse(resInv.body).data.find(i => i.procurementItemId === consumableItemId);
    assert.equal(glv.currentStock, 48);

    // Verify ledger posted CYCLE_COUNT_ADJUSTMENT
    const resLedger = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/stock-ledger?warehouseId=${otWarehouseId}`,
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const adj = JSON.parse(resLedger.body).data.find(l => l.movementType === 'CYCLE_COUNT_ADJUSTMENT');
    assert.ok(adj);
    assert.equal(adj.quantity, -2);
    assert.equal(adj.balanceAfter, 48);
  });

  // =========================================================================
  // 11. EXPIRY DASHBOARDS & AUTOMATED REORDER RECOMMENDATIONS
  // =========================================================================
  it('TEST 11: Expiry Dashboard & Reorder Alerts generate real actionable SCM insights', async () => {
    // Expiry dashboard (within 90 days)
    const resExp = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/supply-chain/expiry-dashboard?days=90',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resExp.statusCode, 200);
    const expData = JSON.parse(resExp.body).data;
    assert.ok(expData.expiringBatchesCount > 0);
    assert.ok(expData.totalAtRiskValuation > 0);

    // Reorder recommendations
    const resReorder = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/supply-chain/reorder-alerts',
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resReorder.statusCode, 200);
    const reorderData = JSON.parse(resReorder.body).data;
    assert.ok(Array.isArray(reorderData.recommendations));
  });

  // =========================================================================
  // 12. STRICT MULTI-TENANT ISOLATION
  // =========================================================================
  it('TEST 12: Multi-Tenant Boundary: Tenant B cannot access Tenant A warehouses or inventory', async () => {
    // Tenant B attempts to fetch Tenant A's warehouse
    const resCrossWh = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/supply-chain/warehouses/${centralWarehouseId}`,
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resCrossWh.statusCode, 404, 'Must return 404 for cross-tenant warehouse lookup');

    // Tenant B gets its own warehouses list (should not contain Tenant A warehouses)
    const resWhB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/supply-chain/warehouses',
      headers: { authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resWhB.statusCode, 200);
    const bList = JSON.parse(resWhB.body).data;
    assert.equal(bList.some(w => w.id === centralWarehouseId), false, 'Tenant A warehouse leaked to Tenant B');
  });
});
