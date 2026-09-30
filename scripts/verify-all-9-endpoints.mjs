import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = '99999999-9999-4999-8999-999999999999';

// Create superadmin token to exercise all clinical, hospital, and operations modules
const claims = {
  sub: USER_ID,
  email: 'superadmin@docsearch.health',
  tenantId: TENANT_ID,
  branchId: BRANCH_ID,
  isSuperAdmin: true,
  roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATHOLOGIST'],
  permissions: [
    'clinical:encounters:read',
    'clinical:encounters:create',
    'partners:read',
    'partners:create',
    'partners:update',
    'lab:orders:read',
    'lab:orders:create'
  ],
  iss: ISSUER,
  aud: AUDIENCE
};

const token = signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
const BASE_URL = 'http://127.0.0.1:4000';

const results = [];

async function callApi(name, path, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE_URL}${path}`, opts);
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    const r = {
      name,
      path,
      method,
      status: res.status,
      ok: res.ok,
      payloadSummary: typeof data === 'object' ? JSON.stringify(data).slice(0, 150) : String(data).slice(0, 150)
    };
    results.push(r);
    console.log(`[${res.ok ? '✔ PASS' : '❌ FAIL'}] ${method} ${path} -> HTTP ${res.status}`);
    return data;
  } catch (err) {
    results.push({
      name,
      path,
      method,
      status: 0,
      ok: false,
      payloadSummary: 'Network error: ' + err.message
    });
    console.error(`[❌ ERROR] ${method} ${path} -> ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('============================================================');
  console.log('🔬 ZERO-TRUST VERIFICATION: 9 RECONCILED API ENDPOINTS');
  console.log('============================================================\n');

  // 1. Blood Bank Overview
  await callApi('Blood Bank Overview', '/api/v1/partner/blood-bank/overview');

  // 2. Blood Bank Crossmatches
  await callApi('Blood Bank Crossmatches', '/api/v1/partner/blood-bank/crossmatches');

  // 3. Blood Bank Issues
  await callApi('Blood Bank Issues', '/api/v1/partner/blood-bank/issues');

  // Ensure department and staff exist for Staff testing
  let testStaffId = null;
  const staffList = await callApi('Get Staff Directory', '/api/v1/partner/staff/members');
  if (staffList?.data && staffList.data.length > 0) {
    testStaffId = staffList.data[0].id;
  } else {
    // Create department and staff member
    const dept = await callApi('Create Department', '/api/v1/partner/staff/departments', 'POST', {
      departmentCode: 'DEP-GEN-MED',
      departmentName: 'General Medicine & OPD',
      organizationId: TENANT_ID,
      branchId: BRANCH_ID,
      partnerId: TENANT_ID,
      status: 'ACTIVE'
    });
    const staff = await callApi('Create Staff Member', '/api/v1/partner/staff/members', 'POST', {
      fullName: 'Dr. Vikram Malhotra',
      workEmail: 'vikram.malhotra@docsearch.health',
      staffCode: 'STF-MALHOTRA-01',
      staffType: 'DOCTOR',
      primaryRole: 'DOCTOR',
      employmentType: 'FULL_TIME',
      departmentId: dept?.data?.id || 'd1a22222-2222-4222-8222-222222222222',
      branchId: BRANCH_ID,
      organizationId: TENANT_ID,
      partnerId: TENANT_ID,
      joiningDate: new Date().toISOString()
    });
    testStaffId = staff?.data?.id;
  }

  console.log(`\n[*] Testing staff lifecycle mutations on staff ID: ${testStaffId}`);

  // 4. Staff Revoke
  await callApi('Staff Revoke', `/api/v1/partner/staff/members/${testStaffId}/revoke`, 'POST', {
    reason: 'Zero-Trust Audit Revocation Test'
  });

  // 5. Staff Restore
  await callApi('Staff Restore', `/api/v1/partner/staff/members/${testStaffId}/restore`, 'POST');

  // 6. Staff Permissions
  await callApi('Staff Permissions', `/api/v1/partner/staff/members/${testStaffId}/permissions`, 'PATCH', {
    permissions: { 'clinical:patients': ['read', 'create'] }
  });

  // 7. Staff Audit Traces
  await callApi('Staff Audit', '/api/v1/partner/staff/audit');

  // 8. Clinical Investigations Overview
  await callApi('Investigations Overview', '/api/v1/partner/investigations/overview');

  // 9. Clinical Investigations Panels
  await callApi('Investigations Panels', '/api/v1/partner/investigations/panels');

  console.log('\n============================================================');
  console.log('📊 RECONCILIATION SUMMARY TABLE');
  console.log('============================================================');
  console.table(results);
}

run();
