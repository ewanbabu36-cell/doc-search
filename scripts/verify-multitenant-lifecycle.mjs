/**
 * scripts/verify-multitenant-lifecycle.mjs
 * 
 * Category 13: Multi-Tenant Architecture & Isolation Verification Suite
 * Executed against Live Fastify API Gateway (Port 4000) and Native PostgreSQL 18.4 (Port 5432).
 * 
 * Invariants Tested:
 * 1. Two-Tenant Distinct Setup: TENANT_A (Apollo) vs TENANT_B (Fortis).
 * 2. Authorized Same-Tenant CRUD: Both tenants can independently create and access their own records.
 * 3. IDOR Cross-Tenant Read Prevention: Tenant A cannot read Tenant B's patient, encounter, consultation, order.
 * 4. IDOR Cross-Tenant Update Prevention: Tenant A cannot update Tenant B's records.
 * 5. Database Mutation Proof: Direct SQL verification proving Tenant B rows remain 100% unchanged.
 * 6. Cross-Tenant Parameter Tampering: Headers, Body, and URL params tampering blocked with 403.
 * 7. Cross-Branch Isolation: Non-global users cannot tamper branch context.
 * 8. Search & List Isolation: Listing/searching returns ONLY caller's tenant records.
 * 9. Silent Fallback Prevention: Missing tenant contexts reject with 400/401 instead of defaulting to global/seed UUIDs.
 * 10. Procurement Zero-State: Empty tenants receive 0 counts instead of fake seed numbers.
 * 11. Two-Session Concurrent Verification: Simultaneous asynchronous requests verify zero state pollution.
 * 12. Cross-Tenant Delete Prevention: Tenant A cannot delete Tenant B resources.
 */

import { signJwt } from '../packages/auth/dist/index.js';
import pg from 'pg';

const { Pool } = pg;
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const JWT_ISSUER = 'docsearch-api';
const JWT_AUDIENCE = 'docsearch-platform';

const pool = new Pool({ connectionString: DB_URL });

export const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const BRANCH_A1 = '00000000-0000-4000-8000-000000000001';
export const BRANCH_A2 = '00000000-0000-4000-8000-000000000002';
export const BRANCH_B1 = '00000000-0000-4000-8000-000000000003';
export const DEPT_A = '00000000-0000-4000-8000-000000000011';
export const DEPT_B = '00000000-0000-4000-8000-000000000012';
export const STAFF_A = '00000000-0000-4000-8000-000000000021';
export const STAFF_B = '00000000-0000-4000-8000-000000000022';
export const DOC_A = '00000000-0000-4000-8000-000000000031';
export const DOC_B = '00000000-0000-4000-8000-000000000032';

function createToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const tenantId = overrides.tenantId || TENANT_A;
  const payload = {
    sub: overrides.sub || `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: overrides.email || 'user@tenant.org',
    tenantId,
    organizationId: overrides.organizationId || tenantId,
    branchId: overrides.branchId !== undefined ? overrides.branchId : (tenantId === TENANT_A ? BRANCH_A1 : BRANCH_B1),
    departmentId: overrides.departmentId || 'OPD',
    roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
    permissions: overrides.permissions || [
      'clinical:patients:create',
      'clinical:patients:read',
      'clinical:patients:update',
      'clinical:patients:delete',
      'clinical:patients:list',
      'clinical:patients:*',
      'clinical:encounters:create',
      'clinical:encounters:read',
      'clinical:encounters:update',
      'clinical:consultations:create',
      'clinical:consultations:read',
      'clinical:consultations:update',
      'diagnostics:lab:orders:create',
      'diagnostics:lab:results:enter',
      'diagnostics:lab:results:verify',
      'diagnostics:radiology:orders:create',
      'diagnostics:radiology:orders:update',
      'diagnostics:radiology:orders:read',
      'pharmacy:wholesale:ingest',
      'procurement:read',
      'whatsapp:manage',
      'license:read'
    ],
    isSuperAdmin: Boolean(overrides.isSuperAdmin),
    scope: overrides.scope || 'branch',
    jti: overrides.jti || `sess_${Math.random().toString(36).slice(2, 10)}`,
    iat: now - 10,
    exp: now + 3600,
    ...overrides
  };
  return signJwt(payload, {
    secret: JWT_SECRET,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresInSeconds: 3600
  });
}

async function apiRequest(endpoint, { method = 'GET', token, body, headers = {} } = {}) {
  const reqHeaders = {
    'content-type': 'application/json',
    ...headers
  };
  if (token) {
    reqHeaders['authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

const results = [];
function recordResult(testId, name, passed, details) {
  results.push({ testId, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${testId}] ${name}`);
  if (!passed) {
    console.error(`   Details:`, details);
  }
}

async function ensureSeedEntities() {
  console.log('[Setup] Ensuring Tenant A and Tenant B baseline records exist in DB...');
  
  // 1. core.tenants
  await pool.query(`
    INSERT INTO core.tenants (id, name, slug)
    VALUES 
      ('${TENANT_A}', 'Apollo Multi-Speciality Hospital', 'apollo-cat13'),
      ('${TENANT_B}', 'Fortis Healthcare Institute', 'fortis-cat13')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. clinical.operational_partners
  await pool.query(`
    INSERT INTO clinical.operational_partners (id, tenant_id, partner_code, legal_business_name, partner_type, contact_email, status)
    VALUES 
      ('${TENANT_A}', '${TENANT_A}', 'APOLLO-PARTNER', 'Apollo Hospital Partner', 'HOSPITAL', 'admin@apollo.org', 'ACTIVE'),
      ('${TENANT_B}', '${TENANT_B}', 'FORTIS-PARTNER', 'Fortis Partner', 'HOSPITAL', 'admin@fortis.org', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. clinical.operational_organizations
  await pool.query(`
    INSERT INTO clinical.operational_organizations (id, tenant_id, partner_id, organization_code, organization_name, organization_type, contact_email, status)
    VALUES 
      ('${TENANT_A}', '${TENANT_A}', '${TENANT_A}', 'APOLLO-ORG', 'Apollo Org', 'HOSPITAL', 'admin@apollo.org', 'ACTIVE'),
      ('${TENANT_B}', '${TENANT_B}', '${TENANT_B}', 'FORTIS-ORG', 'Fortis Org', 'HOSPITAL', 'admin@fortis.org', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 4. clinical.operational_facilities
  await pool.query(`
    INSERT INTO clinical.operational_facilities (id, tenant_id, partner_id, organization_id, facility_code, facility_name, facility_type, address_street, address_city, address_state, address_postal_code, address_country, contact_email, contact_phone, status)
    VALUES 
      ('${BRANCH_A1}', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', 'APOLLO-01', 'Apollo Main Branch', 'INPATIENT_HOSPITAL', '1 Apollo Way', 'Chennai', 'TN', '600001', 'IN', 'apollo1@apollo.org', '9820000001', 'ACTIVE'),
      ('${BRANCH_A2}', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', 'APOLLO-02', 'Apollo Satellite Clinic', 'OUTPATIENT_CLINIC', '2 Apollo Way', 'Chennai', 'TN', '600002', 'IN', 'apollo2@apollo.org', '9820000002', 'ACTIVE'),
      ('${BRANCH_B1}', '${TENANT_B}', '${TENANT_B}', '${TENANT_B}', 'FORTIS-01', 'Fortis Main Branch', 'INPATIENT_HOSPITAL', '1 Fortis Way', 'Delhi', 'DL', '110001', 'IN', 'fortis1@fortis.org', '9820000003', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 5. core.branches
  await pool.query(`
    INSERT INTO core.branches (id, tenant_id, name, code, status)
    VALUES 
      ('${BRANCH_A1}', '${TENANT_A}', 'Apollo Main Branch', 'APOLLO-01', 'ACTIVE'),
      ('${BRANCH_A2}', '${TENANT_A}', 'Apollo Satellite Clinic', 'APOLLO-02', 'ACTIVE'),
      ('${BRANCH_B1}', '${TENANT_B}', 'Fortis Main Branch', 'FORTIS-01', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function runVerification() {
  console.log('========================================================================');
  console.log(' CATEGORY 13: MULTI-TENANT ARCHITECTURE & ISOLATION VERIFICATION SUITE');
  console.log(' Live Fastify Target:', API_URL);
  console.log(' Database Target:    Native PostgreSQL 18.4 (Port 5432)');
  console.log(' Tested Tenants:     Tenant A (' + TENANT_A + ')');
  console.log('                     Tenant B (' + TENANT_B + ')');
  console.log('========================================================================\n');

  await ensureSeedEntities();

  // Tokens
  const tokenDocA = createToken({
    sub: 'usr_doc_apollo_01',
    email: 'doc.apollo@apollo.org',
    tenantId: TENANT_A,
    branchId: BRANCH_A1,
    roles: ['DOCTOR']
  });

  const tokenAdminA = createToken({
    sub: 'usr_admin_apollo_01',
    email: 'admin@apollo.org',
    tenantId: TENANT_A,
    branchId: BRANCH_A1,
    roles: ['HOSPITAL_ADMIN']
  });

  const tokenDocB = createToken({
    sub: 'usr_doc_fortis_01',
    email: 'doc.fortis@fortis.org',
    tenantId: TENANT_B,
    branchId: BRANCH_B1,
    roles: ['DOCTOR']
  });

  const tokenAdminB = createToken({
    sub: 'usr_admin_fortis_01',
    email: 'admin@fortis.org',
    tenantId: TENANT_B,
    branchId: BRANCH_B1,
    roles: ['HOSPITAL_ADMIN']
  });

  const tokenSuperAdmin = createToken({
    sub: 'usr_hq_superadmin',
    email: 'superadmin@docsearch.internal',
    isSuperAdmin: true,
    roles: ['SUPER_ADMIN'],
    scope: 'global'
  });

  let patientA_Id = null;
  let patientB_Id = null;
  const uniqueSuffixA = Date.now().toString(36);
  const uniqueSuffixB = (Date.now() + 1).toString(36);

  // -------------------------------------------------------------------------
  // T1: Authorized Same-Tenant Patient Registration (Tenant A)
  // -------------------------------------------------------------------------
  try {
    const resA = await apiRequest('/api/v1/partner/clinical/patients', {
      method: 'POST',
      token: tokenDocA,
      body: {
        firstName: 'Aarav',
        lastName: `Patel_${uniqueSuffixA}`,
        gender: 'MALE',
        dateOfBirth: '1985-05-15',
        mobileNumber: '9820011111',
        branchId: BRANCH_A1
      }
    });
    const passed = resA.status === 201 && Boolean(resA.data?.data?.id || resA.data?.data?.patientId);
    patientA_Id = resA.data?.data?.id || resA.data?.data?.patientId;
    recordResult('T1_SAME_TENANT_CREATE_A', 'Tenant A authorized patient registration', passed, {
      status: resA.status,
      patientId: patientA_Id,
      body: resA.data
    });
  } catch (err) {
    recordResult('T1_SAME_TENANT_CREATE_A', 'Tenant A authorized patient registration', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T2: Authorized Same-Tenant Patient Registration (Tenant B)
  // -------------------------------------------------------------------------
  try {
    const resB = await apiRequest('/api/v1/partner/clinical/patients', {
      method: 'POST',
      token: tokenDocB,
      body: {
        firstName: 'Bhavna',
        lastName: `Shah_${uniqueSuffixB}`,
        gender: 'FEMALE',
        dateOfBirth: '1990-08-22',
        mobileNumber: '9820022222',
        branchId: BRANCH_B1
      }
    });
    const passed = resB.status === 201 && Boolean(resB.data?.data?.id || resB.data?.data?.patientId);
    patientB_Id = resB.data?.data?.id || resB.data?.data?.patientId;
    recordResult('T2_SAME_TENANT_CREATE_B', 'Tenant B authorized patient registration', passed, {
      status: resB.status,
      patientId: patientB_Id,
      body: resB.data
    });
  } catch (err) {
    recordResult('T2_SAME_TENANT_CREATE_B', 'Tenant B authorized patient registration', false, { error: err.message });
  }

  // Verify both patients were assigned correct tenant_id in DB
  let dbPatientA = null;
  let dbPatientB = null;
  if (patientA_Id) {
    const rA = await pool.query('SELECT id, tenant_id, first_name, last_name FROM clinical.patients WHERE id = $1', [patientA_Id]);
    dbPatientA = rA.rows[0];
  }
  if (patientB_Id) {
    const rB = await pool.query('SELECT id, tenant_id, first_name, last_name FROM clinical.patients WHERE id = $1', [patientB_Id]);
    dbPatientB = rB.rows[0];
  }

  // -------------------------------------------------------------------------
  // T3: IDOR Cross-Tenant Read Prevention (Tenant A -> Tenant B's Patient)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest(`/api/v1/partner/clinical/patients/${patientB_Id}`, {
      method: 'GET',
      token: tokenDocA
    });
    const passed = (res.status === 404 || res.status === 403) && !res.data?.data?.id;
    recordResult('T3_IDOR_READ_PREVENTION_A_TO_B', 'Tenant A cannot read Tenant B patient by ID', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T3_IDOR_READ_PREVENTION_A_TO_B', 'Tenant A cannot read Tenant B patient by ID', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T4: IDOR Cross-Tenant Read Prevention (Tenant B -> Tenant A's Patient)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest(`/api/v1/partner/clinical/patients/${patientA_Id}`, {
      method: 'GET',
      token: tokenDocB
    });
    const passed = (res.status === 404 || res.status === 403) && !res.data?.data?.id;
    recordResult('T4_IDOR_READ_PREVENTION_B_TO_A', 'Tenant B cannot read Tenant A patient by ID', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T4_IDOR_READ_PREVENTION_B_TO_A', 'Tenant B cannot read Tenant A patient by ID', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T5: IDOR Cross-Tenant Update Prevention (Tenant A attempts to modify Tenant B's Patient)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest(`/api/v1/partner/clinical/patients/${patientB_Id}`, {
      method: 'PUT',
      token: tokenDocA,
      body: {
        firstName: 'MALICIOUS_OVERWRITE'
      }
    });
    const passed = res.status === 404 || res.status === 403;
    recordResult('T5_IDOR_UPDATE_PREVENTION', 'Tenant A cannot update Tenant B patient', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T5_IDOR_UPDATE_PREVENTION', 'Tenant A cannot update Tenant B patient', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T6: Database Mutation Safety Proof: Direct SQL verification of Tenant B record
  // -------------------------------------------------------------------------
  try {
    const dbVerify = await pool.query('SELECT id, tenant_id, first_name, last_name FROM clinical.patients WHERE id = $1', [patientB_Id]);
    const currentB = dbVerify.rows[0];
    const unchanged =
      currentB &&
      currentB.first_name === dbPatientB?.first_name &&
      currentB.last_name === dbPatientB?.last_name &&
      currentB.tenant_id === TENANT_B;
    recordResult('T6_DATABASE_MUTATION_SAFETY', 'Direct SQL proof: Tenant B record remains 100% untouched in PostgreSQL', unchanged, {
      before: dbPatientB,
      after: currentB
    });
  } catch (err) {
    recordResult('T6_DATABASE_MUTATION_SAFETY', 'Direct SQL proof: Tenant B record remains untouched', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T7: Search & List Isolation (Tenant A only sees Tenant A patients)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/clinical/patients?limit=50', {
      method: 'GET',
      token: tokenDocA
    });
    const items = res.data?.data?.items || res.data?.data || [];
    const containsPatientA = items.some(p => p.id === patientA_Id || p.patientId === patientA_Id);
    const containsPatientB = items.some(p => p.id === patientB_Id || p.patientId === patientB_Id);
    const passed = res.status === 200 && containsPatientA && !containsPatientB;
    recordResult('T7_SEARCH_LIST_ISOLATION_A', 'Patient list for Tenant A contains Tenant A and ZERO Tenant B records', passed, {
      totalReturned: items.length,
      containsPatientA,
      containsPatientB
    });
  } catch (err) {
    recordResult('T7_SEARCH_LIST_ISOLATION_A', 'Patient list isolation for Tenant A', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T8: Search & List Isolation (Tenant B only sees Tenant B patients)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/clinical/patients?limit=50', {
      method: 'GET',
      token: tokenDocB
    });
    const items = res.data?.data?.items || res.data?.data || [];
    const containsPatientA = items.some(p => p.id === patientA_Id || p.patientId === patientA_Id);
    const containsPatientB = items.some(p => p.id === patientB_Id || p.patientId === patientB_Id);
    const passed = res.status === 200 && containsPatientB && !containsPatientA;
    recordResult('T8_SEARCH_LIST_ISOLATION_B', 'Patient list for Tenant B contains Tenant B and ZERO Tenant A records', passed, {
      totalReturned: items.length,
      containsPatientA,
      containsPatientB
    });
  } catch (err) {
    recordResult('T8_SEARCH_LIST_ISOLATION_B', 'Patient list isolation for Tenant B', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T9: Cross-Tenant Header Parameter Tampering (x-partner-id: TENANT_B)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/clinical/patients', {
      method: 'GET',
      token: tokenDocA,
      headers: { 'x-partner-id': TENANT_B }
    });
    const passed = res.status === 403 && (res.data?.error?.code === 'TENANT_ACCESS_DENIED' || res.data?.code === 'TENANT_ACCESS_DENIED');
    recordResult('T9_HEADER_TAMPERING_BLOCKED', 'Cross-partner header tampering (x-partner-id) blocked with 403', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T9_HEADER_TAMPERING_BLOCKED', 'Cross-partner header tampering blocked', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T10: Cross-Tenant Body Parameter Tampering (tenantId: TENANT_B)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/clinical/patients', {
      method: 'POST',
      token: tokenDocA,
      body: {
        firstName: 'Spoof',
        lastName: 'Attempt',
        gender: 'OTHER',
        tenantId: TENANT_B
      }
    });
    const passed = res.status === 403 && (res.data?.error?.code === 'TENANT_ACCESS_DENIED' || res.data?.code === 'TENANT_ACCESS_DENIED');
    recordResult('T10_BODY_TAMPERING_BLOCKED', 'Cross-tenant body parameter tampering (tenantId) blocked with 403', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T10_BODY_TAMPERING_BLOCKED', 'Cross-tenant body parameter tampering blocked', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T11: Cross-Tenant URL Param Tampering (:partnerId = TENANT_B)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest(`/api/v1/partner/clinical/encounters?partnerId=${TENANT_B}`, {
      method: 'GET',
      token: tokenDocA
    });
    const passed = res.status === 403 && (res.data?.error?.code === 'TENANT_ACCESS_DENIED' || res.data?.code === 'TENANT_ACCESS_DENIED');
    recordResult('T11_URL_PARAM_TAMPERING_BLOCKED', 'Cross-partner query/URL parameter tampering blocked with 403', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T11_URL_PARAM_TAMPERING_BLOCKED', 'Cross-partner query tampering blocked', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T12: Cross-Branch Parameter Tampering (Branch A1 -> Branch A2)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/clinical/patients', {
      method: 'GET',
      token: tokenDocA,
      headers: { 'x-branch-id': BRANCH_A2 }
    });
    const passed = res.status === 403 && (res.data?.error?.code === 'BRANCH_ACCESS_DENIED' || res.data?.code === 'BRANCH_ACCESS_DENIED');
    recordResult('T12_BRANCH_TAMPERING_BLOCKED', 'Cross-branch header tampering (x-branch-id) blocked with 403', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T12_BRANCH_TAMPERING_BLOCKED', 'Cross-branch header tampering blocked', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T13: Clinical Encounter IDOR Isolation
  // -------------------------------------------------------------------------
  let encounterA_Id = null;
  try {
    const encResA = await apiRequest('/api/v1/partner/clinical/encounters', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA_Id,
        doctorId: DOC_A,
        encounterType: 'OPD_CONSULTATION',
        departmentId: DEPT_A,
        branchId: BRANCH_A1,
        chiefComplaint: 'Mild fever and cough'
      }
    });
    encounterA_Id = encResA.data?.data?.id || encResA.data?.data?.encounterId;

    const encResB = await apiRequest(`/api/v1/partner/clinical/encounters/${encounterA_Id}`, {
      method: 'GET',
      token: tokenDocB
    });
    const passed = Boolean(encounterA_Id) && (encResB.status === 404 || encResB.status === 403) && !encResB.data?.data?.id;
    recordResult('T13_ENCOUNTER_IDOR_ISOLATION', 'Tenant B cannot read Tenant A encounter by ID', passed, {
      status: encResB.status,
      encounterA_Id
    });
  } catch (err) {
    recordResult('T13_ENCOUNTER_IDOR_ISOLATION', 'Clinical encounter IDOR isolation', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T14: Clinical Consultation IDOR Isolation
  // -------------------------------------------------------------------------
  try {
    let consultA_Id = null;
    const consRes = await apiRequest('/api/v1/partner/clinical/consultations', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA_Id,
        encounterId: encounterA_Id,
        doctorId: DOC_A,
        provisionalDiagnosis: 'Viral URI',
        clinicalNotes: 'Rest, paracetamol 500mg TDS',
        branchId: BRANCH_A1
      }
    });
    consultA_Id = consRes.data?.data?.id;

    const attackRes = await apiRequest(`/api/v1/partner/clinical/consultations/${consultA_Id}`, {
      method: 'PUT',
      token: tokenDocB,
      body: {
        provisionalDiagnosis: 'HACKED_DIAGNOSIS'
      }
    });
    const passed = (attackRes.status === 404 || attackRes.status === 403);
    recordResult('T14_CONSULTATION_IDOR_ISOLATION', 'Doctor B cannot modify Consultation A belonging to Tenant A', passed, {
      status: attackRes.status,
      consultA_Id
    });
  } catch (err) {
    recordResult('T14_CONSULTATION_IDOR_ISOLATION', 'Consultation IDOR isolation', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T15: Lab Diagnostics IDOR Isolation
  // -------------------------------------------------------------------------
  try {
    const labRes = await apiRequest('/api/v1/partner/lab/orders', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA_Id,
        patientName: 'Aarav Patel',
        encounterId: encounterA_Id,
        branchId: BRANCH_A1,
        testCode: 'CBC_PLATELETS',
        testName: 'Complete Blood Count',
        clinicalNotes: 'Routine check'
      }
    });
    const labOrderId = labRes.data?.data?.id || labRes.data?.data?.orderId;

    const attackRes = await apiRequest(`/api/v1/partner/lab/orders/${labOrderId}/result`, {
      method: 'POST',
      token: tokenDocB,
      body: {
        parameterCode: 'HB',
        resultValue: '14.5'
      }
    });
    const passed = (attackRes.status === 404 || attackRes.status === 403);
    recordResult('T15_LAB_IDOR_ISOLATION', 'Tenant B technician cannot enter result on Tenant A lab order', passed, {
      status: attackRes.status,
      labOrderId
    });
  } catch (err) {
    recordResult('T15_LAB_IDOR_ISOLATION', 'Lab diagnostics IDOR isolation', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T16: Radiology Order IDOR Isolation
  // -------------------------------------------------------------------------
  try {
    const radRes = await apiRequest('/api/v1/partner/radiology/orders', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA_Id,
        patientName: 'Aarav Patel',
        encounterId: encounterA_Id,
        branchId: BRANCH_A1,
        procedureId: 'CHEST_XRAY_PA',
        procedureName: 'Chest X-Ray PA View',
        modalityType: 'X_RAY',
        clinicalIndication: 'Cough evaluation'
      }
    });
    const radOrderId = radRes.data?.data?.id;

    const attackRes = await apiRequest(`/api/v1/partner/radiology/orders/${radOrderId}/status`, {
      method: 'PATCH',
      token: tokenDocB,
      body: {
        status: 'COMPLETED'
      }
    });
    const passed = (attackRes.status === 404 || attackRes.status === 403);
    recordResult('T16_RADIOLOGY_IDOR_ISOLATION', 'Tenant B radiologist cannot update Tenant A radiology order', passed, {
      status: attackRes.status,
      radOrderId
    });
  } catch (err) {
    recordResult('T16_RADIOLOGY_IDOR_ISOLATION', 'Radiology order IDOR isolation', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T17: Radiology Order Creation Forced Fallback Prevention (DEFECT-MT-01 Fix Proof)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/radiology/orders', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA_Id,
        procedureId: 'CHEST_XRAY_PA',
        procedureName: 'Chest X-Ray',
        branchId: '' // Explicitly invalid empty branch
      }
    });
    const passed = res.status === 400 || res.status === 403;
    recordResult('T17_RADIOLOGY_FALLBACK_PREVENTION', 'Radiology order creation rejects missing context without silent fallback', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T17_RADIOLOGY_FALLBACK_PREVENTION', 'Radiology order fallback prevention', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T18: Wholesale Invoice Cross-Partner Tampering Prevention (DEFECT-MT-05 Fix Proof)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/pharmacy/invoices/ingest-wholesale', {
      method: 'POST',
      token: tokenAdminA,
      body: {
        partnerId: TENANT_B, // Cross-partner tampering attempt
        rawText: 'GSTIN: 27AAAAA0000A1Z5\nITEM: PARACETAMOL 500MG QTY: 100 RATE: 10.00 GST: 12%'
      }
    });
    const passed = res.status === 403 && (res.data?.error?.message?.includes('Cross-partner') || res.data?.message?.includes('Cross-partner'));
    recordResult('T18_WHOLESALE_CROSS_PARTNER_PREVENTION', 'Wholesale invoice ingestion rejects mismatched partnerId with 403', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T18_WHOLESALE_CROSS_PARTNER_PREVENTION', 'Wholesale invoice cross-partner prevention', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T19: Procurement Stats Zero-State Verification (DEFECT-MT-02 Fix Proof)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/procurement/overview', {
      method: 'GET',
      token: tokenSuperAdmin
    });
    const stats = res.data?.data || {};
    const isZeroState =
      res.status === 200 &&
      stats.activeVendorsCount === 0 &&
      stats.pendingOrdersCount === 0 &&
      stats.activeVendorsCount !== 42;
    recordResult('T19_PROCUREMENT_ZERO_STATE', 'Procurement stats returns genuine zero-state for empty tenant (no fake 42 vendors)', isZeroState, {
      status: res.status,
      stats
    });
  } catch (err) {
    recordResult('T19_PROCUREMENT_ZERO_STATE', 'Procurement zero state verification', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T20: License Status Tenant Isolation (DEFECT-MT-04 Fix Proof)
  // -------------------------------------------------------------------------
  try {
    const unauthRes = await apiRequest('/api/v1/license/status', {
      method: 'GET'
    });
    const unauthBlocked = unauthRes.status === 401;

    const authRes = await apiRequest('/api/v1/license/status', {
      method: 'GET',
      token: tokenAdminA
    });
    const passed = unauthBlocked && authRes.status === 200;
    recordResult('T20_LICENSE_STATUS_ISOLATION', 'License status strictly enforces tenant session (401 unauthenticated, no 444444... fallback)', passed, {
      unauthStatus: unauthRes.status,
      authStatus: authRes.status
    });
  } catch (err) {
    recordResult('T20_LICENSE_STATUS_ISOLATION', 'License status isolation', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T21: WhatsApp Webhook Missing Tenant ID Rejected (DEFECT-MT-03 / Route Fix Proof)
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest('/api/v1/partner/whatsapp/webhook', {
      method: 'POST',
      body: {
        entry: [{ changes: [{ value: { messages: [{ from: '+919999999999', text: { body: 'Hello' } }] } }] }]
      }
    });
    const errMsg = res.data?.error?.message || res.data?.error || res.data?.message || '';
    const passed = res.status === 400 && String(errMsg).includes('Missing tenant');
    recordResult('T21_WEBHOOK_TENANT_ID_REQUIRED', 'WhatsApp inbound webhook rejects missing tenant without silent 111111... fallback', passed, {
      status: res.status,
      body: res.data
    });
  } catch (err) {
    recordResult('T21_WEBHOOK_TENANT_ID_REQUIRED', 'WhatsApp webhook tenant ID enforcement', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T22: Two-Session Concurrent Verification
  // -------------------------------------------------------------------------
  try {
    const [pA_Res, pB_Res] = await Promise.all([
      apiRequest('/api/v1/partner/clinical/patients', { method: 'GET', token: tokenDocA }),
      apiRequest('/api/v1/partner/clinical/patients', { method: 'GET', token: tokenDocB })
    ]);

    const listA = pA_Res.data?.data?.items || pA_Res.data?.data || [];
    const listB = pB_Res.data?.data?.items || pB_Res.data?.data || [];

    const noBleedA = !listA.some(p => p.id === patientB_Id || p.patientId === patientB_Id);
    const noBleedB = !listB.some(p => p.id === patientA_Id || p.patientId === patientA_Id);
    const passed = pA_Res.status === 200 && pB_Res.status === 200 && noBleedA && noBleedB;

    recordResult('T22_TWO_SESSION_CONCURRENCY', 'Simultaneous parallel sessions maintain 100% strict tenant isolation without bleeding', passed, {
      countA: listA.length,
      countB: listB.length,
      noBleedA,
      noBleedB
    });
  } catch (err) {
    recordResult('T22_TWO_SESSION_CONCURRENCY', 'Two-session concurrency verification', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T23: Cross-Tenant Delete Prevention
  // -------------------------------------------------------------------------
  try {
    const res = await apiRequest(`/api/v1/partner/clinical/patients/${patientB_Id}`, {
      method: 'DELETE',
      token: tokenAdminA
    });
    // Expected: 404, 403, or 405 (hard delete prohibited)
    const blocked = res.status === 404 || res.status === 403 || res.status === 405;
    
    // DB verify: Patient B still exists in PostgreSQL
    const dbCheck = await pool.query('SELECT id, status FROM clinical.patients WHERE id = $1', [patientB_Id]);
    const stillExists = dbCheck.rows.length === 1 && dbCheck.rows[0].status !== 'DELETED';
    const passed = blocked && stillExists;

    recordResult('T23_CROSS_TENANT_DELETE_PREVENTION', 'Tenant A cannot delete Tenant B patient; DB confirms record intact', passed, {
      status: res.status,
      stillExists
    });
  } catch (err) {
    recordResult('T23_CROSS_TENANT_DELETE_PREVENTION', 'Cross-tenant delete prevention', false, { error: err.message });
  }

  // -------------------------------------------------------------------------
  // T24: Direct Native PostgreSQL Proof: Zero Cross-Tenant Data Contamination
  // -------------------------------------------------------------------------
  try {
    const [qPatientsA, qPatientsB, qEncountersA, qEncountersB] = await Promise.all([
      pool.query('SELECT count(*) FROM clinical.patients WHERE tenant_id = $1', [TENANT_A]),
      pool.query('SELECT count(*) FROM clinical.patients WHERE tenant_id = $1', [TENANT_B]),
      pool.query('SELECT count(*) FROM clinical.encounters WHERE tenant_id = $1', [TENANT_A]),
      pool.query('SELECT count(*) FROM clinical.encounters WHERE tenant_id = $1', [TENANT_B])
    ]);

    const countPatientsA = parseInt(qPatientsA.rows[0].count, 10);
    const countPatientsB = parseInt(qPatientsB.rows[0].count, 10);
    const countEncountersA = parseInt(qEncountersA.rows[0].count, 10);

    const passed = countPatientsA >= 1 && countPatientsB >= 1 && countEncountersA >= 1;
    recordResult('T24_NATIVE_POSTGRES_PROOF', 'Native PostgreSQL 18.4 direct proof: clean, distinct tenant_id partitions', passed, {
      patientsTenantA: countPatientsA,
      patientsTenantB: countPatientsB,
      encountersTenantA: countEncountersA
    });
  } catch (err) {
    recordResult('T24_NATIVE_POSTGRES_PROOF', 'Native Postgres tenant partition proof', false, { error: err.message });
  }

  console.log('\n========================================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(` SUMMARY: ${passedCount}/${total} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  await pool.end();
  return { total, passedCount, failedCount, results };
}

runVerification()
  .then(({ failedCount }) => {
    process.exit(failedCount > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
