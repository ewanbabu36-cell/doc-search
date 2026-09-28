import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  getDatabase,
  TEST_SEEDS,
  tenants,
  branches,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  partnerProfiles,
  subscriptions,
  licenses,
  features,
  plans,
  planEntitlements,
  pharmacyBatches,
  pharmacyStockMovements,
  pharmacyReturns,
  pharmacyStockAdjustments,
  eq,
  and
} from '@docsearch/database';
import { licenseService } from '../dist/services/company/LicenseService.js';

describe('Phase 9 — Pharmacy Enterprise Suite (Retail + Wholesale)', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  // Tenant A: Retail Pharmacy
  const TENANT_RETAIL = TEST_SEEDS.TENANT_A;
  const BRANCH_RETAIL = TEST_SEEDS.BRANCH_A;
  const PHARMACIST_RETAIL_ID = '77777777-7777-4777-8777-777777777777';

  // Tenant W: Wholesale Pharmacy
  const TENANT_WHOLESALE = '33333333-3333-4333-8333-333333333333';
  const PARTNER_WHOLESALE = '00000000-0000-4000-8000-000000000099';
  const ORG_WHOLESALE = '00000000-0000-4000-8000-000000000098';
  const BRANCH_WHOLESALE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const FACILITY_WHOLESALE = BRANCH_WHOLESALE;
  const DEPT_WHOLESALE = '00000000-0000-4000-8000-000000000096';
  const SUB_WHOLESALE = '33333333-3333-4333-8333-333333333399';
  const LIC_WHOLESALE_ID = '44444444-4444-4444-8444-444444444499';
  const LIC_KEY_WHOLESALE = 'LIC-WHOLESALE-PRO-001';
  const PLAN_WHOLESALE_ID = '88888888-8888-4888-8888-888888888899';
  const FEAT_WHOLESALE_ID = '66666666-6666-4666-8666-666666666699';
  const PHARMACIST_WHOLESALE_ID = '88888888-8888-4888-8888-777777777777';

  function createRetailToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || PHARMACIST_RETAIL_ID,
      email: overrides.email || 'retail.pharmacist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_RETAIL,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_RETAIL,
      partnerType: 'PHARMACY',
      facilityType: 'PHARMACY',
      roles: overrides.roles || ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'pharmacy:medications:create',
        'pharmacy:medications:read',
        'pharmacy:inventory:create',
        'pharmacy:inventory:read',
        'pharmacy:dispense:create',
        'pharmacy:orders:read'
      ],
      accessibleFeatures: ['PHARMACY_POS', 'PHARMACY', 'BILLING', 'PATIENTS'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createDoctorToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || TEST_SEEDS.DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_RETAIL,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_RETAIL,
      partnerType: 'HOSPITAL',
      facilityType: 'HOSPITAL',
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:prescriptions:create',
        'clinical:prescriptions:read'
      ],
      accessibleFeatures: ['CLINICAL_EMR', 'OPD_CLINICAL', 'PATIENTS'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createWholesaleToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || PHARMACIST_WHOLESALE_ID,
      email: overrides.email || 'wholesale.manager@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_WHOLESALE,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_WHOLESALE,
      partnerType: 'PHARMACY_WHOLESALE',
      facilityType: 'PHARMACY_WHOLESALE',
      roles: overrides.roles || ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'pharmacy:medications:create',
        'pharmacy:medications:read',
        'pharmacy:inventory:create',
        'pharmacy:inventory:read',
        'pharmacy:dispense:create',
        'pharmacy:orders:read'
      ],
      accessibleFeatures: ['PHARMACY_WHOLESALE', 'PHARMACY', 'BILLING'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  // Shared test entity IDs
  let patientId;
  let medicationId;
  let batchIdA; // Nearer expiry
  let batchIdB; // Further expiry
  let prescriptionId;
  let dispensingId;
  let wholesaleCustomerId;
  let wholesaleOrderId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    const db = getDatabase();

    // 1. Explicitly mark Tenant A as Retail Pharmacy profile in partner_profiles
    await db
      .update(partnerProfiles)
      .set({
        partnerType: 'PHARMACY',
        metadata: {
          partnerType: 'PHARMACY',
          facilityType: 'PHARMACY',
          organizationType: 'PHARMACY'
        }
      })
      .where(eq(partnerProfiles.tenantId, TENANT_RETAIL));

    // 2. Seed Wholesale Feature & Plan into Authoritative Catalog
    await db.insert(features).values({
      id: FEAT_WHOLESALE_ID,
      code: 'PHARMACY_WHOLESALE',
      name: 'Wholesale Pharmacy & Distribution',
      description: 'B2B sales orders, FEFO allocation, and Marg ERP ingestion',
      category: 'MODULE_ACCESS',
      status: 'ACTIVE'
    }).onConflictDoNothing();

    await db.insert(plans).values({
      id: PLAN_WHOLESALE_ID,
      productId: TEST_SEEDS.PRODUCT_ID,
      code: 'PLAN_PHARMACY_WHOLESALE',
      name: 'Wholesale Pharma Enterprise Plan',
      description: 'Complete B2B Wholesale Distribution Suite',
      status: 'ACTIVE',
      version: '1.0.0',
      basePrice: 50000,
      currency: 'INR',
      billingInterval: 'ANNUAL',
      metadata: { targetPartnerType: 'PHARMACY_WHOLESALE' }
    }).onConflictDoNothing();

    await db.insert(planEntitlements).values([
      {
        id: '55555555-5555-4555-8555-555555555091',
        planId: PLAN_WHOLESALE_ID,
        featureId: FEAT_WHOLESALE_ID,
        entitlementType: 'FEATURE_ACCESS',
        value: { enabled: true },
        status: 'ACTIVE'
      },
      {
        id: '55555555-5555-4555-8555-555555555092',
        planId: PLAN_WHOLESALE_ID,
        featureId: TEST_SEEDS.FEAT_PHARMACY_ID,
        entitlementType: 'FEATURE_ACCESS',
        value: { enabled: true },
        status: 'ACTIVE'
      },
      {
        id: '55555555-5555-4555-8555-555555555093',
        planId: PLAN_WHOLESALE_ID,
        featureId: TEST_SEEDS.FEAT_BILLING_ID,
        entitlementType: 'FEATURE_ACCESS',
        value: { enabled: true },
        status: 'ACTIVE'
      }
    ]).onConflictDoNothing();

    // 3. Seed Wholesale Tenant Architecture
    await db.insert(tenants).values({
      id: TENANT_WHOLESALE,
      name: 'Apex Pharma Distributors',
      slug: 'apex-pharma-wholesale'
    }).onConflictDoNothing();

    await db.insert(branches).values({
      id: BRANCH_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      name: 'Apex Wholesale Central Depot',
      code: 'WDEP-01'
    }).onConflictDoNothing();

    await db.insert(operationalPartners).values({
      id: PARTNER_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      partnerCode: 'PARTNER-WS-01',
      legalBusinessName: 'Apex Pharma Distributors LLP',
      partnerType: 'PHARMACY_WHOLESALE',
      contactEmail: 'trade@apexpharma.test'
    }).onConflictDoNothing();

    await db.insert(operationalOrganizations).values({
      id: ORG_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      organizationCode: 'ORG-WS-01',
      organizationName: 'Apex Pharma Wholesale Org',
      contactEmail: 'trade@apexpharma.test'
    }).onConflictDoNothing();

    await db.insert(operationalFacilities).values({
      id: FACILITY_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      organizationId: ORG_WHOLESALE,
      facilityCode: 'FAC-WS-01',
      facilityName: 'Central Pharma Warehouse Depot',
      addressStreet: 'Plot 45, GIDC Industrial Estate',
      addressCity: 'Ahmedabad',
      addressState: 'Gujarat',
      addressPostalCode: '382445',
      contactEmail: 'trade@apexpharma.test',
      contactPhone: '9876543210'
    }).onConflictDoNothing();

    await db.insert(operationalDepartments).values({
      id: DEPT_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      organizationId: ORG_WHOLESALE,
      branchId: BRANCH_WHOLESALE,
      departmentCode: 'DEP-WS-01',
      departmentName: 'Wholesale B2B Operations'
    }).onConflictDoNothing();

    await db.insert(partnerProfiles).values({
      id: PARTNER_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      legalName: 'Apex Pharma Distributors LLP',
      tradeName: 'Apex Pharma Wholesale',
      partnerType: 'PHARMACY_WHOLESALE',
      primaryContactName: 'Rajesh Mehta',
      primaryContactEmail: 'trade@apexpharma.test',
      verificationStatus: 'VERIFIED',
      lifecycleStatus: 'ACTIVE',
      metadata: {
        partnerType: 'PHARMACY_WHOLESALE',
        facilityType: 'PHARMACY_WHOLESALE',
        organizationType: 'PHARMACY_WHOLESALE',
        wholesaleDrugLicenseNumber: '20B/GJ-AH-10492, 21B/GJ-AH-10493',
        wholesaleDrugLicenseExpiry: '2028-12-31'
      }
    }).onConflictDoNothing();

    await db.insert(subscriptions).values({
      id: SUB_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      productId: TEST_SEEDS.PRODUCT_ID,
      planId: PLAN_WHOLESALE_ID,
      planVersion: '1.0.0',
      status: 'ACTIVE',
      billingCycle: 'ANNUAL',
      startDate: new Date(Date.now() - 30 * 86400000),
      renewalDate: new Date(Date.now() + 335 * 86400000),
      endDate: new Date(Date.now() + 335 * 86400000)
    }).onConflictDoNothing();

    const expiryIso = new Date(Date.now() + 335 * 86400000).toISOString();
    const sigW = licenseService.signLicensePayload({
      licenseKey: LIC_KEY_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      subscriptionId: SUB_WHOLESALE,
      planId: PLAN_WHOLESALE_ID,
      expiryDate: expiryIso
    });

    await db.insert(licenses).values({
      id: LIC_WHOLESALE_ID,
      licenseKey: LIC_KEY_WHOLESALE,
      partnerId: PARTNER_WHOLESALE,
      tenantId: TENANT_WHOLESALE,
      subscriptionId: SUB_WHOLESALE,
      planId: PLAN_WHOLESALE_ID,
      licenseType: 'COMMERCIAL',
      status: 'ACTIVE',
      activationStatus: 'ACTIVATED',
      maxConcurrentUsers: 50,
      maxDoctors: 0,
      maxBranches: 5,
      issuedAt: new Date(Date.now() - 30 * 86400000),
      startDate: new Date(Date.now() - 30 * 86400000),
      expiryDate: new Date(expiryIso),
      gracePeriodEnd: new Date(Date.now() + 350 * 86400000),
      signature: sigW,
      metadata: {
        partnerType: 'PHARMACY_WHOLESALE',
        facilityType: 'PHARMACY_WHOLESALE',
        entitledFeatures: ['PHARMACY_WHOLESALE', 'PHARMACY', 'BILLING'],
        wholesaleDrugLicenseNumber: '20B/GJ-AH-10492, 21B/GJ-AH-10493',
        wholesaleDrugLicenseExpiry: '2028-12-31'
      }
    }).onConflictDoNothing();

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // =========================================================================
  // SECTION 1: RETAIL PHARMACY LIFECYCLE (Catalog -> FEFO -> Dispense -> POS)
  // =========================================================================

  it('1.1: Register active patient in retail pharmacy', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Siddharth',
        lastName: 'Menon',
        gender: 'MALE',
        dateOfBirth: '1987-09-12',
        mobileNumber: '+91-9876509988',
        bloodGroup: 'AB_POSITIVE'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    patientId = body.data.id;
    assert.ok(patientId);
  });

  it('1.2: POST /api/v1/partner/pharmacy/medications creates Paracetamol 650mg (Schedule H)', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationCode: 'MED-PCM-650',
        name: 'Paracetamol 650 mg Tablet',
        genericName: 'Paracetamol',
        brandName: 'Dolo-650',
        dosageForm: 'TABLET',
        strength: '650 mg',
        category: 'ANALGESIC',
        scheduleType: 'SCHEDULE_H',
        unitPrice: 3.5
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.medicationCode, 'MED-PCM-650');
    medicationId = body.data.id;
    assert.ok(medicationId);
  });

  it('1.3: Receive two batches (nearer expiry vs further expiry) for FEFO validation', async () => {
    const token = createRetailToken();

    // Batch A: Expiry in 30 days
    const resA = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchNumber: 'BATCH-PCM-NEAR',
        manufacturer: 'Micro Labs Ltd',
        manufacturingDate: '2026-01-01T00:00:00Z',
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        quantity: 100,
        unitCost: 2.0,
        supplierReference: 'PO-2026-PCM-01'
      }
    });
    assert.strictEqual(resA.statusCode, 201);
    batchIdA = JSON.parse(resA.body).data.id;

    // Batch B: Expiry in 180 days
    const resB = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchNumber: 'BATCH-PCM-FAR',
        manufacturer: 'Micro Labs Ltd',
        manufacturingDate: '2026-02-01T00:00:00Z',
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        quantity: 200,
        unitCost: 1.9,
        supplierReference: 'PO-2026-PCM-02'
      }
    });
    assert.strictEqual(resB.statusCode, 201);
    batchIdB = JSON.parse(resB.body).data.id;
  });

  it('1.4: GET /api/v1/partner/pharmacy/batches returns batches sorted by FEFO (nearest expiry first)', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/batches?medicationId=${medicationId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 2);
    // Earliest expiry should be first
    assert.strictEqual(body.data[0].id, batchIdA);
    assert.strictEqual(body.data[1].id, batchIdB);
  });

  it('1.5: Retail walk-in digital prescription initialized for 20 tablets', async () => {
    prescriptionId = crypto.randomUUID();
    assert.ok(prescriptionId);
  });

  it('1.6: Partial Dispense (Qty: 10 of 20) verifies FEFO deduction, billing invoice, and stock ledger', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        prescriptionId,
        isPartial: true,
        items: [
          {
            medicationId,
            batchId: batchIdA,
            quantity: 10,
            unitPrice: 3.5
          }
        ]
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.dispensingStatus, 'PARTIALLY_DISPENSED');
    assert.strictEqual(body.data.totalBillAmount, 35.0);
    assert.ok(body.data.invoiceNumber);
    assert.ok(body.data.receiptNumber);
    dispensingId = body.data.id;

    // Verify batch stock reduced from 100 to 90
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 90);

    // Verify stock movement ledger recorded DISPENSE with -10
    const [mov] = await db
      .select()
      .from(pharmacyStockMovements)
      .where(and(eq(pharmacyStockMovements.batchId, batchIdA), eq(pharmacyStockMovements.movementType, 'DISPENSE')));
    assert.ok(mov);
    assert.strictEqual(Number(mov.quantity), -10);
    assert.strictEqual(Number(mov.beforeQuantity), 100);
    assert.strictEqual(Number(mov.afterQuantity), 90);
  });

  it('1.7: Complete Remaining Dispense (Qty: 10) completes prescription', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        prescriptionId,
        isPartial: false,
        items: [
          {
            medicationId,
            batchId: batchIdA,
            quantity: 10,
            unitPrice: 3.5
          }
        ]
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.dispensingStatus, 'DISPENSED');

    // Batch A stock now 80
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 80);
  });

  it('1.8: Duplicate dispense on fully dispensed prescription is rejected with 500/400 error', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        prescriptionId,
        isPartial: false,
        items: [
          {
            medicationId,
            batchId: batchIdA,
            quantity: 5,
            unitPrice: 3.5
          }
        ]
      }
    });
    assert.ok(res.statusCode >= 400);
  });

  // =========================================================================
  // SECTION 2: RETAIL RETURNS (Restock vs Quarantine)
  // =========================================================================

  it('2.1: POST /api/v1/partner/pharmacy/returns with RESTOCK increases batch stock and logs ledger', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/returns',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        dispensingId,
        patientId,
        medicationId,
        batchId: batchIdA,
        quantity: 5,
        returnReason: 'Customer unneeded excess medication',
        condition: 'INTACT_SEALED',
        disposition: 'RESTOCK',
        notes: 'Unopened strip returned by patient'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.disposition, 'RESTOCK');
    assert.strictEqual(body.data.quantity, 5);

    // Stock should increase from 80 to 85
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 85);

    // Verify stock ledger movement
    const [retMov] = await db
      .select()
      .from(pharmacyStockMovements)
      .where(and(eq(pharmacyStockMovements.batchId, batchIdA), eq(pharmacyStockMovements.movementType, 'RETURN')));
    assert.ok(retMov);
    assert.strictEqual(Number(retMov.quantity), 5);
    assert.strictEqual(Number(retMov.beforeQuantity), 80);
    assert.strictEqual(Number(retMov.afterQuantity), 85);
  });

  it('2.2: POST /api/v1/partner/pharmacy/returns with QUARANTINE does NOT increase stock', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/returns',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        dispensingId,
        patientId,
        medicationId,
        batchId: batchIdA,
        quantity: 2,
        returnReason: 'Blister foil torn and compromised',
        condition: 'DAMAGED',
        disposition: 'QUARANTINE_FOR_DESTRUCTION',
        notes: 'Discarded in hazardous bin'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.disposition, 'QUARANTINE_FOR_DESTRUCTION');

    // Stock must REMAIN 85 (quarantined, not restocked)
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 85);
  });

  it('2.3: GET /api/v1/partner/pharmacy/returns returns authoritative return records', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/returns',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 2);
  });

  // =========================================================================
  // SECTION 3: PHYSICAL STOCK ADJUSTMENTS
  // =========================================================================

  it('3.1: Upward stock adjustment (+15 units) updates stock and logs ledger', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/adjustments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchId: batchIdA,
        adjustmentQuantity: 15,
        reason: 'ANNUAL_STOCK_AUDIT',
        justification: 'Physical count verified 100 units on shelf',
        approvedBy: 'CHIEF_PHARMACIST'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.adjustmentQuantity, 15);
    assert.strictEqual(body.data.beforeQuantity, 85);
    assert.strictEqual(body.data.afterQuantity, 100);

    // Verify batch stock updated to 100
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 100);
  });

  it('3.2: Downward stock adjustment (-10 units) updates stock and logs ledger', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/adjustments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchId: batchIdA,
        adjustmentQuantity: -10,
        reason: 'SPOILAGE_WATER_DAMAGE',
        justification: 'Rainwater leak on bottom shelf',
        approvedBy: 'AUDIT_OFFICER'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.afterQuantity, 90);

    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(Number(batch.availableQuantity), 90);
  });

  it('3.3: Adjustment attempting to reduce stock below 0 is rejected with 400', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/adjustments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchId: batchIdA,
        adjustmentQuantity: -200, // current is 90
        reason: 'AUDIT_CORRECTION',
        justification: 'Attempting invalid negative stock adjustment'
      }
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('3.4: GET /api/v1/partner/pharmacy/adjustments returns adjustment audit entries', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/adjustments',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.length >= 2);
  });

  // =========================================================================
  // SECTION 4: BATCH RECALL & SAFETY QUARANTINE GUARD
  // =========================================================================

  it('4.1: POST /api/v1/partner/pharmacy/recalls marks batch BLOCKED and traces affected dispensations', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/recalls',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        batchId: batchIdA,
        reason: 'CDSCO Quality Alert: Impurity exceeding pharmacopeial threshold'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'BLOCKED');
    assert.ok(body.data.blockReason.includes('Impurity exceeding'));
    assert.strictEqual(body.data.quarantinedQuantity, 90);

    // Verify affected dispensations list includes our dispensed patient
    assert.ok(Array.isArray(body.data.affectedDispensations));
    assert.ok(body.data.affectedDispensations.length >= 1);
    const affected = body.data.affectedDispensations.find((d) => d.patientId === patientId);
    assert.ok(affected, 'Dispensation to Siddharth Menon must be traceable in recall response');
  });

  it('4.2: Dispensing from BLOCKED batch is immediately rejected (fail-closed safety)', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        items: [
          {
            medicationId,
            batchId: batchIdA,
            quantity: 5,
            unitPrice: 3.5
          }
        ]
      }
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(
      body.error?.message?.includes('blocked/recalled') || body.message?.includes('blocked/recalled'),
      'Must reject with explicit blocked/recalled batch error'
    );
  });

  it('4.3: POST /api/v1/partner/pharmacy/batches/:id/unblock restores batch to ACTIVE', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/pharmacy/batches/${batchIdA}/unblock`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.status, 'ACTIVE');

    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchIdA));
    assert.strictEqual(batch.status, 'ACTIVE');
  });

  // =========================================================================
  // SECTION 5: COMMERCIAL PROFILE ISOLATION (Retail vs Wholesale Boundary)
  // =========================================================================

  it('5.1: Retail tenant accessing Wholesale customer API is rejected with 403 Forbidden', async () => {
    const token = createRetailToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/wholesale/customers',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        businessName: 'Unintended Retail Trade Customer',
        contactPerson: 'Mr. X',
        billingAddress: 'Address 1',
        dlNumber: '20B/MH-12345'
      }
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('5.2: Wholesale tenant accessing Retail POS Dispense API is rejected with 403 Forbidden', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        items: [
          {
            medicationId,
            quantity: 5,
            unitPrice: 3.5
          }
        ]
      }
    });
    assert.strictEqual(res.statusCode, 403);
  });

  // =========================================================================
  // SECTION 6: WHOLESALE B2B SALES ORDER WORKFLOW
  // =========================================================================

  let wholesaleMedicationId;
  let wholesaleBatchId;

  it('6.1: Seed Wholesale stock in Wholesale Tenant depot', async () => {
    const token = createWholesaleToken();

    // 1. Create medication in wholesale catalog
    const medRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationCode: 'MED-WS-AZI-500',
        name: 'Azithromycin 500 mg Tablet (Trade Pack)',
        genericName: 'Azithromycin',
        brandName: 'Aziwok',
        dosageForm: 'TABLET',
        strength: '500 mg',
        category: 'ANTIBIOTIC',
        scheduleType: 'SCHEDULE_H',
        unitPrice: 22.0
      }
    });
    assert.strictEqual(medRes.statusCode, 201);
    wholesaleMedicationId = JSON.parse(medRes.body).data.id;

    // 2. Inward bulk batch stock (1,000 units)
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId: wholesaleMedicationId,
        batchNumber: 'BATCH-WS-AZI-901',
        manufacturer: 'Wockhardt Ltd',
        manufacturingDate: '2026-03-01T00:00:00Z',
        expiryDate: '2028-06-30T00:00:00Z',
        quantity: 1000,
        unitCost: 14.5,
        supplierReference: 'PO-WS-MFR-1001'
      }
    });
    assert.strictEqual(batchRes.statusCode, 201);
    wholesaleBatchId = JSON.parse(batchRes.body).data.id;
  });

  it('6.2: POST /api/v1/partner/pharmacy/wholesale/customers creates B2B Trade Customer with DL & GSTIN', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/wholesale/customers',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        businessName: 'Shree Krishna Medicos & Healthcare',
        customerType: 'PHARMACY_RETAIL',
        contactPerson: 'Suresh Patel',
        contactPhone: '9822012345',
        contactEmail: 'skmedicos@gmail.test',
        billingAddress: 'Shop 4, Ground Floor, Royal Complex, Station Road, Surat - 395001',
        gstin: '24AABCS1429B1Z2',
        dlNumber: '20/21B-GJ-SR-94812',
        dlExpiryDate: '2028-12-31',
        creditTermsDays: 30,
        creditLimit: 500000
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.businessName, 'Shree Krishna Medicos & Healthcare');
    assert.strictEqual(body.data.dlNumber, '20/21B-GJ-SR-94812');
    wholesaleCustomerId = body.data.id;
    assert.ok(wholesaleCustomerId);
  });

  it('6.3: GET /api/v1/partner/pharmacy/wholesale/customers returns wholesale customers', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/wholesale/customers',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.length >= 1);
    assert.strictEqual(body.data[0].id, wholesaleCustomerId);
  });

  it('6.4: POST /api/v1/partner/pharmacy/wholesale/orders creates B2B Trade Sales Order', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/wholesale/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        customerId: wholesaleCustomerId,
        buyerName: 'Shree Krishna Medicos & Healthcare',
        buyerGstin: '24AABCS1429B1Z2',
        buyerDlNo: '20/21B-GJ-SR-94812',
        paymentTerms: '30 DAYS NET',
        items: [
          {
            medicationId: wholesaleMedicationId,
            quantity: 150,
            unitPrice: 18.0,
            gstRate: 12
          }
        ]
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'CONFIRMED');
    assert.strictEqual(body.data.subtotal, 2700); // 150 * 18
    assert.strictEqual(body.data.taxTotal, 324); // 12% GST
    assert.strictEqual(body.data.totalAmount, 3024);
    wholesaleOrderId = body.data.id;
    assert.ok(wholesaleOrderId);
  });

  it('6.5: POST /api/v1/partner/pharmacy/wholesale/orders/:id/allocate allocates batch stock', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/pharmacy/wholesale/orders/${wholesaleOrderId}/allocate`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'ALLOCATED');
    assert.strictEqual(body.data.items[0].batchId, wholesaleBatchId);
    assert.strictEqual(body.data.items[0].allocatedQuantity, 150);
  });

  it('6.6: POST /api/v1/partner/pharmacy/wholesale/orders/:id/dispatch dispatches order and deducts stock', async () => {
    const token = createWholesaleToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/pharmacy/wholesale/orders/${wholesaleOrderId}/dispatch`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        transportMode: 'ROAD_TRANSPORT',
        vehicleNumber: 'GJ-05-BX-8419',
        lrNumber: 'LR-2026-9481'
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'DISPATCHED');
    assert.ok(body.data.dispatchChallanNumber.startsWith('CHL-WS-'));
    assert.ok(body.data.invoiceNumber.startsWith('INV-WS-'));

    // Verify wholesale batch stock reduced from 1000 to 850
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, wholesaleBatchId));
    assert.strictEqual(Number(batch.availableQuantity), 850);

    // Verify stock movement recorded with referenceType WHOLESALE_DISPATCH
    const [mov] = await db
      .select()
      .from(pharmacyStockMovements)
      .where(
        and(
          eq(pharmacyStockMovements.batchId, wholesaleBatchId),
          eq(pharmacyStockMovements.referenceType, 'WHOLESALE_DISPATCH')
        )
      );
    assert.ok(mov);
    assert.strictEqual(Number(mov.quantity), -150);
    assert.strictEqual(Number(mov.beforeQuantity), 1000);
    assert.strictEqual(Number(mov.afterQuantity), 850);
  });

  // =========================================================================
  // SECTION 7: CONCURRENCY & ATOMICITY SAFETY (No negative stock)
  // =========================================================================

  it('7.1: Concurrent dispensing on limited stock: exactly one succeeds, other fails (no negative stock)', async () => {
    const token = createRetailToken();

    // 1. Create a limited batch with exactly 5 units
    const resBatch = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchNumber: 'BATCH-CONCURRENT-05',
        manufacturer: 'Cipla Ltd',
        manufacturingDate: '2026-01-01T00:00:00Z',
        expiryDate: '2027-01-01T00:00:00Z',
        quantity: 5,
        unitCost: 2.0,
        supplierReference: 'PO-CONC-TEST'
      }
    });
    assert.strictEqual(resBatch.statusCode, 201);
    const concBatchId = JSON.parse(resBatch.body).data.id;

    // 2. Launch two simultaneous dispense requests each attempting to take all 5 units
    const req1 = app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        items: [{ medicationId, batchId: concBatchId, quantity: 5, unitPrice: 3.5 }]
      }
    });

    const req2 = app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        items: [{ medicationId, batchId: concBatchId, quantity: 5, unitPrice: 3.5 }]
      }
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statusCodes = [res1.statusCode, res2.statusCode];
    // Exactly one 201 Created and one 409 Conflict
    assert.ok(statusCodes.includes(201), 'One dispense request must succeed');
    assert.ok(
      statusCodes.includes(409),
      'The competing dispense request must be rejected with 409 INSUFFICIENT_PHARMACY_STOCK'
    );

    // Verify stock is exactly 0 (never negative)
    const db = getDatabase();
    const [batch] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, concBatchId));
    assert.strictEqual(Number(batch.availableQuantity), 0);
    assert.strictEqual(batch.status, 'DEPLETED');
  });
});
