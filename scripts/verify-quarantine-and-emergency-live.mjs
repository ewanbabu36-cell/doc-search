import http from 'http';
import pg from 'pg';
import { signJwt } from '../packages/auth/dist/index.js';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_ORG = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';

const authToken = signJwt({
  sub: 'aaaa1111-8492-4aaa-8aaa-849208492001',
  email: 'doctor@docsearch.health',
  tenantId: CANONICAL_TENANT,
  organizationId: CANONICAL_ORG,
  branchId: CANONICAL_BRANCH,
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
  permissions: ['*']
}, {
  secret: process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade',
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresInSeconds: 3600
});

async function queryDb(sql, params = []) {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

function fetchHttp(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port || 4000,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-id': CANONICAL_TENANT,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runLiveVerification() {
  console.log('=== VERIFYING HARMONIZATION & CLINICAL WORKFLOWS LIVE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${name} ${details}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} ${details}`);
      failed++;
    }
  }

  // 1. Verify Procurement Vendors via API Gateway
  try {
    const res = await fetchHttp('http://localhost:4000/api/v1/partner/procurement/vendors');
    console.log('Vendors API Response:', JSON.stringify(res));
    assert('API Gateway Procurement Vendors (HTTP 200)', res.status === 200 && (res.data?.data?.length || 0) > 0, `(Count: ${res.data?.data?.length || 0})`);
  } catch (e) {
    assert('API Gateway Procurement Vendors (HTTP 200)', false, e.message);
  }

  // 2. Verify Procurement Purchase Orders via API Gateway
  try {
    const res = await fetchHttp('http://localhost:4000/api/v1/partner/procurement/orders');
    assert('API Gateway Procurement Orders (HTTP 200)', res.status === 200, `(Count: ${res.data?.data?.length || 0})`);
  } catch (e) {
    assert('API Gateway Procurement Orders (HTTP 200)', false, e.message);
  }

  // 3. Verify Database: 18 Harmonized Tables
  try {
    const vendorRows = await queryDb('SELECT count(*) FROM clinical.procurement_vendors WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB procurement_vendors canonical', Number(vendorRows[0].count) >= 4, `Found: ${vendorRows[0].count}`);

    const itemRows = await queryDb('SELECT count(*) FROM clinical.procurement_items WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB procurement_items canonical', Number(itemRows[0].count) >= 5, `Found: ${itemRows[0].count}`);

    const surgicalRows = await queryDb('SELECT count(*) FROM clinical.surgical_procedures WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB surgical_procedures canonical', Number(surgicalRows[0].count) >= 8, `Found: ${surgicalRows[0].count}`);

    const khataRows = await queryDb('SELECT count(*) FROM clinical.pharmacy_khata_ledger WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB pharmacy_khata_ledger canonical', Number(khataRows[0].count) >= 6, `Found: ${khataRows[0].count}`);

    const stockMoveRows = await queryDb('SELECT count(*) FROM clinical.pharmacy_stock_movements WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB pharmacy_stock_movements canonical', Number(stockMoveRows[0].count) >= 32, `Found: ${stockMoveRows[0].count}`);

    const phlebRows = await queryDb('SELECT count(*) FROM clinical.phlebotomist_fleets WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB phlebotomist_fleets canonical', Number(phlebRows[0].count) >= 3, `Found: ${phlebRows[0].count}`);

    const poRows = await queryDb('SELECT count(*) FROM clinical.purchase_orders WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB purchase_orders canonical', Number(poRows[0].count) >= 1, `Found: ${poRows[0].count}`);

    const rxTemplateRows = await queryDb('SELECT count(*) FROM clinical.prescription_templates WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB prescription_templates canonical', Number(rxTemplateRows[0].count) >= 4, `Found: ${rxTemplateRows[0].count}`);
  } catch (e) {
    assert('Database Quarantined Tables Verification', false, e.message);
  }

  // 4. Verify Database: Emergency Trauma & Blood Bank Seeding
  try {
    const deptRows = await queryDb('SELECT count(*) FROM clinical.emergency_departments WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB emergency_departments seeded', Number(deptRows[0].count) >= 1, `Found: ${deptRows[0].count}`);

    const zoneRows = await queryDb('SELECT count(*) FROM clinical.emergency_zones WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB emergency_zones seeded', Number(zoneRows[0].count) === 3, `Found: ${zoneRows[0].count} (Red, Yellow, Green)`);

    const cartRows = await queryDb('SELECT count(*) FROM clinical.emergency_crash_carts WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB emergency_crash_carts seeded', Number(cartRows[0].count) >= 2, `Found: ${cartRows[0].count}`);

    const bbRows = await queryDb('SELECT count(*) FROM clinical.blood_banks WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB blood_banks seeded', Number(bbRows[0].count) >= 1, `Found: ${bbRows[0].count}`);

    const tempRows = await queryDb('SELECT count(*) FROM clinical.blood_temperature_logs WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB blood_temperature_logs seeded', Number(tempRows[0].count) >= 3, `Found: ${tempRows[0].count}`);

    const schedRows = await queryDb('SELECT count(*) FROM clinical.doctor_schedules WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB doctor_schedules seeded', Number(schedRows[0].count) >= 5, `Found: ${schedRows[0].count}`);

    const ipdReqRows = await queryDb('SELECT count(*) FROM clinical.inpatient_admission_requests WHERE tenant_id = $1', [CANONICAL_TENANT]);
    assert('DB inpatient_admission_requests seeded', Number(ipdReqRows[0].count) >= 1, `Found: ${ipdReqRows[0].count}`);
  } catch (e) {
    assert('Database Emergency & Blood Bank Verification', false, e.message);
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runLiveVerification().catch((err) => {
  console.error('Fatal probe error:', err);
  process.exit(1);
});
