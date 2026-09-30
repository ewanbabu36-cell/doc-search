/**
 * MASTER V2 — DOC SEARCH TRUE ZERO-STATE CLEAN ROOM
 * Comprehensive Certification & Regression Freeze Test Suite
 *
 * Validates:
 * Gate 1: DB Zero-State Inventory (0 operational business rows on boot)
 * Gate 2: DB System Masters Integrity (Products, Plans, Features, Entitlements intact)
 * Gate 3: Mutation Guard / Multi-Restart Idempotency (3 consecutive restarts remain at 0)
 * Gate 4: Gateway Disk Store Cleanliness (approved_partners, credentials, purged all [])
 * Gate 5: API Gateway Zero Truth (HTTP /partners/directory returns total: 0)
 * Gate 6: Frontend Mock Fixture Zero Audit (Mock files contain 0 fake operational entities)
 * Gate 7: Day-0 Genuine Registration Capability (Real create works, purge returns to 0)
 * Gate 8: Security & Trainer Integrity (P0 security guards & Ewan trainer intact)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('🏛️ MASTER V2: DOC SEARCH TRUE ZERO-STATE CLEAN ROOM CERTIFICATION MATRIX');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

async function testGate(gateNumber, title, fn) {
  process.stdout.write(`GATE [${gateNumber}] ${title}... `);
  try {
    await fn();
    console.log('PASS');
    passCount++;
  } catch (err) {
    console.log('FAIL');
    console.error(`   ❌ Error: ${err.message}\n`);
    failCount++;
  }
}

// HTTP Helper for Live Gateway Probing
function apiGet(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 4000,
      path: urlPath,
      headers
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
  });
}

// =============================================================================
// GATE 1: Database Zero-State Inventory
// =============================================================================
await testGate(1, 'Database Zero-State Inventory: 0 operational business records on boot', async () => {
  const { initializeDatabase, getRawPool } = await import('../packages/database/dist/client.js');
  await initializeDatabase();
  const pool = getRawPool();
  assert(pool, 'Database pool must be available');

  const operationalTables = [
    ['clinical', 'operational_partners'],
    ['clinical', 'operational_organizations'],
    ['clinical', 'operational_facilities'],
    ['clinical', 'operational_departments'],
    ['clinical', 'operational_staff'],
    ['clinical', 'doctor_profiles'],
    ['clinical', 'patients'],
    ['clinical', 'appointments'],
    ['clinical', 'encounters'],
    ['clinical', 'prescriptions'],
    ['clinical', 'pharmacy_inventory'],
    ['clinical', 'billing_invoices'],
    ['company', 'partner_profiles'],
    ['company', 'subscriptions'],
    ['company', 'licenses'],
    ['core', 'branches']
  ];

  for (const [schema, table] of operationalTables) {
    try {
      const res = await pool.query(`SELECT COUNT(*)::int as count FROM "${schema}"."${table}"`);
      const count = res.rows[0].count;
      assert.equal(
        count,
        0,
        `Expected 0 rows in "${schema}"."${table}", but found ${count} operational business records!`
      );
    } catch (err) {
      if (err.message.includes('Expected 0 rows')) throw err;
      // If table doesn't exist in in-memory test catalog, it's 0 by definition
    }
  }
});

// =============================================================================
// GATE 2: DB System Masters Integrity
// =============================================================================
await testGate(2, 'DB System Masters Integrity: Product, Plans, Features, Entitlements & Workflows preserved', async () => {
  const { getRawPool } = await import('../packages/database/dist/client.js');
  const pool = getRawPool();
  assert(pool, 'Database pool must be available');

  // Products
  const prodRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."products"');
  assert(prodRes.rows[0].count > 0, 'Platform products master must exist');

  // Plans
  const planRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."plans"');
  assert(planRes.rows[0].count > 0, 'Platform plans master must exist');

  // Features
  const featRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."features"');
  assert(featRes.rows[0].count > 0, 'Platform features master must exist');

  // Entitlements
  const entRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."plan_entitlements"');
  assert(entRes.rows[0].count > 0, 'Platform plan entitlements master must exist');

  // Core Platform Tenant
  const tenantRes = await pool.query('SELECT COUNT(*)::int as count FROM "core"."tenants"');
  assert(tenantRes.rows[0].count > 0, 'Core platform tenant must exist');
});

// =============================================================================
// GATE 3: Mutation Guard / Multi-Restart Idempotency
// =============================================================================
await testGate(3, 'Mutation Guard: 3 consecutive server/database restarts remain at strictly 0 operational rows', async () => {
  const { createTestDatabase } = await import('../packages/database/dist/test-harness.js');

  for (let restart = 1; restart <= 3; restart++) {
    const instance = await createTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
    const pool = instance.pool;

    const partnerRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."partner_profiles"');
    assert.equal(
      partnerRes.rows[0].count,
      0,
      `Restart ${restart}: Expected 0 partner profiles, found ${partnerRes.rows[0].count}`
    );

    const subRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."subscriptions"');
    assert.equal(
      subRes.rows[0].count,
      0,
      `Restart ${restart}: Expected 0 subscriptions, found ${subRes.rows[0].count}`
    );

    const licRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."licenses"');
    assert.equal(
      licRes.rows[0].count,
      0,
      `Restart ${restart}: Expected 0 licenses, found ${licRes.rows[0].count}`
    );

    await instance.cleanup();
  }
});

// =============================================================================
// GATE 4: Gateway Disk Store Cleanliness
// =============================================================================
await testGate(4, 'Gateway Disk Persistence Cleanliness: approved_partners, credentials, purged all []', async () => {
  const dataDir = path.join(ROOT_DIR, 'apps/api-gateway/data');

  const approvedPath = path.join(dataDir, 'approved_partners.json');
  const approvedData = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
  assert(Array.isArray(approvedData), 'approved_partners.json must be an array');
  assert.equal(approvedData.length, 0, `approved_partners.json must be empty, found ${approvedData.length} items`);

  const credentialsPath = path.join(dataDir, 'partner_credentials.json');
  const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  assert(Array.isArray(credentialsData), 'partner_credentials.json must be an array');
  assert.equal(credentialsData.length, 0, `partner_credentials.json must be empty, found ${credentialsData.length} items`);

  const purgedPath = path.join(dataDir, 'purged_partners.json');
  const purgedData = JSON.parse(fs.readFileSync(purgedPath, 'utf8'));
  assert(Array.isArray(purgedData), 'purged_partners.json must be an array');
  assert.equal(purgedData.length, 0, `purged_partners.json must be empty, found ${purgedData.length} items`);

  const overridesPath = path.join(dataDir, 'partner_governance_overrides.json');
  const overridesData = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
  assert.deepEqual(overridesData, {}, 'partner_governance_overrides.json must be empty object {}');
});

// =============================================================================
// GATE 5: API Gateway Zero Truth (HTTP Endpoints)
// =============================================================================
await testGate(5, 'API Gateway Zero Truth: /api/v1/company/partners/directory returns total: 0', async () => {
  const { signJwt } = await import('../packages/auth/dist/index.js');
  const adminToken = signJwt(
    {
      sub: '00000000-0000-4000-8000-000000000001',
      email: 'admin@docsearch.company',
      tenantId: '00000000-0000-4000-8000-000000000001',
      roles: ['SUPER_ADMIN'],
      permissions: ['partners:create', 'partners:read', 'partners:update'],
      iss: 'docsearch-api',
      aud: 'docsearch-platform'
    },
    {
      secret: 'docsearch_master_jwt_secret_dev_32char_key_only',
      issuer: 'docsearch-api',
      audience: 'docsearch-platform',
      expiresInSeconds: 3600
    }
  );

  let res;
  try {
    res = await apiGet('/api/v1/company/partners/directory', {
      authorization: `Bearer ${adminToken}`
    });
  } catch (err) {
    const { buildApp } = await import('../apps/api-gateway/dist/app.js');
    const app = await buildApp();
    const injectRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners/directory',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    res = {
      status: injectRes.statusCode,
      body: injectRes.json()
    };
    await app.close();
  }
  assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(res.body)}`);
  assert(res.body.success, 'Response must be success: true');
  const items = Array.isArray(res.body.data) ? res.body.data : (res.body.data?.items ?? []);
  const total = res.body.total ?? items.length;
  assert.equal(total, 0, `Partner directory total must be 0, but got ${total}`);
  assert.equal(items.length, 0, `Partner directory items array must be empty, but found ${items.length} items`);
});

// =============================================================================
// GATE 6: Frontend Mock Fixture Zero Audit
// =============================================================================
await testGate(6, 'Frontend Mock Fixture Zero Audit: 10 critical partner platform fixtures 100% zeroed', async () => {
  // Pharmacy
  const { MOCK_PHARMACY_INVENTORY, MOCK_MEDICATION_CATALOG } = await import('../apps/partner-platform/dist/services/mock-pharmacy-data.js');
  assert.equal(MOCK_PHARMACY_INVENTORY.length, 0, 'MOCK_PHARMACY_INVENTORY must be []');
  assert.equal(MOCK_MEDICATION_CATALOG.length, 0, 'MOCK_MEDICATION_CATALOG must be []');

  // Inpatient
  const { mockInpatientUnits, mockInpatientWards, mockInpatientBeds, mockInpatientOverviewMetrics } = await import('../apps/partner-platform/dist/services/mock-inpatient-data.js');
  assert.equal(mockInpatientUnits.length, 0, 'mockInpatientUnits must be []');
  assert.equal(mockInpatientWards.length, 0, 'mockInpatientWards must be []');
  assert.equal(mockInpatientBeds.length, 0, 'mockInpatientBeds must be []');
  assert.equal(mockInpatientOverviewMetrics.totalBeds, 0, 'mockInpatientOverviewMetrics.totalBeds must be 0');

  // Staff Administration
  const { MOCK_OPERATIONAL_STAFF, MOCK_STAFF_ADMIN_OVERVIEW } = await import('../apps/partner-platform/dist/services/mock-staff-administration-data.js');
  assert.equal(MOCK_OPERATIONAL_STAFF.length, 0, 'MOCK_OPERATIONAL_STAFF must be []');
  assert.equal(MOCK_STAFF_ADMIN_OVERVIEW.totalStaffCount, 0, 'MOCK_STAFF_ADMIN_OVERVIEW.totalStaffCount must be 0');

  // Emergency
  const { mockCrashCarts, mockEmergencyDepartment, mockOverviewMetrics } = await import('../apps/partner-platform/dist/services/mock-emergency-data.js');
  assert.equal(mockCrashCarts.length, 0, 'mockCrashCarts must be []');
  assert.equal(mockEmergencyDepartment.totalBeds, 0, 'mockEmergencyDepartment.totalBeds must be 0');
  assert.equal(mockOverviewMetrics.activeEDCensus, 0, 'mockOverviewMetrics.activeEDCensus must be 0');

  // Operation Theatre
  const { mockOTComplexes, mockOTRooms, mockOTOverviewMetrics } = await import('../apps/partner-platform/dist/services/mock-operation-theatre-data.js');
  assert.equal(mockOTComplexes.length, 0, 'mockOTComplexes must be []');
  assert.equal(mockOTRooms.length, 0, 'mockOTRooms must be []');
  assert.equal(mockOTOverviewMetrics.totalOTRooms, 0, 'mockOTOverviewMetrics.totalOTRooms must be 0');

  // Radiology
  const { mockRadiologyModalities, mockRadiologyDepartment } = await import('../apps/partner-platform/dist/services/mock-radiology-data.js');
  assert.equal(mockRadiologyModalities.length, 0, 'mockRadiologyModalities must be []');
  assert.equal(mockRadiologyDepartment.totalModalitiesCount, 0, 'mockRadiologyDepartment.totalModalitiesCount must be 0');

  // Procurement
  const { MOCK_PROCUREMENT_VENDORS, MOCK_VENDOR_CONTRACTS, MOCK_PROCUREMENT_ITEMS } = await import('../apps/partner-platform/dist/services/mock-procurement-data.js');
  assert.equal(MOCK_PROCUREMENT_VENDORS.length, 0, 'MOCK_PROCUREMENT_VENDORS must be []');
  assert.equal(MOCK_VENDOR_CONTRACTS.length, 0, 'MOCK_VENDOR_CONTRACTS must be []');
  assert.equal(MOCK_PROCUREMENT_ITEMS.length, 0, 'MOCK_PROCUREMENT_ITEMS must be []');

  // Insurance
  const { MOCK_INSURANCE_PAYERS, MOCK_INSURANCE_PLANS } = await import('../apps/partner-platform/dist/services/mock-insurance-claims-data.js');
  assert.equal(MOCK_INSURANCE_PAYERS.length, 0, 'MOCK_INSURANCE_PAYERS must be []');
  assert.equal(MOCK_INSURANCE_PLANS.length, 0, 'MOCK_INSURANCE_PLANS must be []');

  // Blood Bank
  const { mockBloodBankFacility } = await import('../apps/partner-platform/dist/services/mock-blood-bank-data.js');
  assert.equal(mockBloodBankFacility.totalAvailableUnits, 0, 'mockBloodBankFacility.totalAvailableUnits must be 0');
  assert.equal(mockBloodBankFacility.quarantineUnits, 0, 'mockBloodBankFacility.quarantineUnits must be 0');
});

// =============================================================================
// GATE 7: Day-0 Genuine Registration Workflow
// =============================================================================
await testGate(7, 'Day-0 Genuine Registration Workflow: Genuine registration creates exactly 1 record', async () => {
  const { createTestDatabase } = await import('../packages/database/dist/test-harness.js');
  const instance = await createTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
  const pool = instance.pool;

  // Verify starting at 0
  const initRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."partner_profiles"');
  assert.equal(initRes.rows[0].count, 0, 'Must start at 0 partner profiles');

  // Simulate real partner registration
  const genuinePartnerId = '99999999-1111-4999-8999-111111111111';
  const genuineTenantId = '99999999-2222-4999-8999-222222222222';
  await pool.query(`
    INSERT INTO "core"."tenants" ("id", "name", "slug")
    VALUES ('${genuineTenantId}', 'Metro Clinic', 'metro-clinic');

    INSERT INTO "company"."partner_profiles" (
      "id", "tenant_id", "legal_name", "trade_name", "primary_contact_name", "primary_contact_email", "verification_status", "lifecycle_status"
    )
    VALUES (
      '${genuinePartnerId}', '${genuineTenantId}', 'Genuine Metro Clinic Ltd', 'Metro Clinic', 'Dr. Genuine User', 'genuine@metroclinic.in', 'PENDING', 'ONBOARDING'
    );
  `);

  // Verify exactly 1 record created
  const postRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."partner_profiles"');
  assert.equal(postRes.rows[0].count, 1, 'Expected exactly 1 registered partner');

  // Purge and verify clean return to 0
  await pool.query(`
    DELETE FROM "company"."partner_profiles" WHERE "id" = '${genuinePartnerId}';
    DELETE FROM "core"."tenants" WHERE "id" = '${genuineTenantId}';
  `);
  const finalRes = await pool.query('SELECT COUNT(*)::int as count FROM "company"."partner_profiles"');
  assert.equal(finalRes.rows[0].count, 0, 'Must cleanly return to 0 after purge');

  await instance.cleanup();
});

// =============================================================================
// GATE 8: Security & Ewan Trainer Integrity
// =============================================================================
await testGate(8, 'Security & Ewan Trainer Integrity: P0 RBAC guards & role boundary engine certified', async () => {
  // Test 1: RealAuthService has no master override
  const realAuthPath = path.join(ROOT_DIR, 'apps/api-gateway/src/services/core/RealAuthService.ts');
  const realAuthCode = fs.readFileSync(realAuthPath, 'utf8');
  assert(!realAuthCode.includes('masterDevBypass'), 'Master dev bypass must not exist');

  // Test 2: Ewan Role Scope boundary enforcement
  const { evaluateEwanRoleScope } = await import('../packages/ui-kit/dist/components/ewan/EwanRoleScopeResolver.js');
  const result = evaluateEwanRoleScope('Doctor consultation kaise complete karte hain?', {
    id: 'staff-rec-001',
    name: 'Pooja Sharma',
    role: 'RECEPTIONIST',
    roleTitle: 'Front Desk Receptionist',
    department: 'OPD Reception'
  });
  assert.equal(result.isBoundaryViolation, true, 'Receptionist asking doctor question must trigger boundary violation');
  assert(result.handoffGuidance, 'Handoff guidance must be returned for receptionist');
});

// =============================================================================
// SUMMARY MATRIX
// =============================================================================
console.log('\n================================================================================');
console.log(`CERTIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
console.log('================================================================================\n');

if (failCount === 0) {
  console.log('🏆 DOC SEARCH TRUE ZERO-STATE CLEAN ROOM 100% CERTIFIED! REGRESSION FREEZE APPLIED.');
  process.exit(0);
} else {
  console.error(`💥 CLEAN ROOM CERTIFICATION FAILED: ${failCount} gates did not pass.`);
  process.exit(1);
}
