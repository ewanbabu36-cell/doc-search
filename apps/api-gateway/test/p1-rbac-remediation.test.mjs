import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';

const BASE_URL = 'http://127.0.0.1:4000';
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const PARTNER_A = 'abc-multi-specialty';
const PARTNER_B = 'patna-specialty-clinic';
const PARTNER_A_TENANT_ID = '8ac64f87-221e-0242-4b54-f37fcaf999f0';
const PARTNER_B_TENANT_ID = '607ae072-2543-d185-2153-7884300c3185';

function createToken(payload = {}) {
  const claims = {
    sub: payload.sub || crypto.randomUUID(),
    email: payload.email || 'audit-test@docsearch.health',
    tenantId: payload.tenantId || PARTNER_A_TENANT_ID,
    branchId: payload.branchId || 'patna-branch-001',
    roles: payload.roles || ['DOCTOR'],
    permissions: payload.permissions || ['patient.read'],
    isSuperAdmin: payload.isSuperAdmin || false,
    dataScope: payload.dataScope || 'branch',
    iss: ISSUER,
    aud: AUDIENCE,
    jti: crypto.randomUUID()
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

const superAdminToken = createToken({
  sub: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  roles: ['SUPER_ADMIN'],
  isSuperAdmin: true,
  dataScope: 'global'
});

const companyAdminToken = createToken({
  sub: 'e0000000-0000-4000-8000-000000000002',
  email: 'admin@docsearch.health',
  roles: ['COMPANY_ADMIN'],
  permissions: ['partners:read', 'partners:manage', 'patient.read'],
  isSuperAdmin: false,
  dataScope: 'global'
});

const receptionistToken = createToken({
  sub: 'usr-receptionist-001',
  email: 'receptionist@partnera.health',
  roles: ['RECEPTIONIST'],
  dataScope: 'branch',
  branchId: 'patna-branch-001',
  isSuperAdmin: false
});

const nurseToken = createToken({
  sub: 'usr-nurse-001',
  email: 'nurse@partnera.health',
  roles: ['STAFF_NURSE'],
  dataScope: 'branch',
  branchId: 'patna-branch-001',
  isSuperAdmin: false
});

const doctorToken = createToken({
  sub: 'usr-doctor-001',
  email: 'doctor@partnera.health',
  roles: ['DOCTOR'],
  dataScope: 'branch',
  branchId: 'patna-branch-001',
  isSuperAdmin: false
});

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token !== undefined ? (options.token ? { 'Authorization': `Bearer ${options.token}` } : {}) : { 'Authorization': `Bearer ${superAdminToken}` }),
    ...options.headers
  };
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🛡️  P1 RBAC REMEDIATION VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function record(desc, ok, extra = '') {
    if (ok) {
      passed++;
      console.log(`  ✓ PASS: ${desc} ${extra}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${desc} ${extra}`);
    }
  }

  // =========================================================================
  // SECTION 1: P1-01 — CONFIGURATION HISTORY AND DIFF SECURITY
  // =========================================================================
  console.log('[SECTION 1] P1-01: Configuration History & Diff Security Enforcement');

  // 1.1 Unauthenticated requests
  const noAuthHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: null });
  record('1.1.1 GET /configuration/history rejects unauthenticated request (401)', noAuthHist.status === 401, `(got ${noAuthHist.status})`);

  const noAuthDiff = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/diff?v1=1&v2=2`, { token: null });
  record('1.1.2 GET /configuration/diff rejects unauthenticated request (401)', noAuthDiff.status === 401, `(got ${noAuthDiff.status})`);

  // 1.2 Low-privilege roles denied (403)
  const recHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: receptionistToken });
  record('1.2.1 RECEPTIONIST rejected from /configuration/history (403)', recHist.status === 403, `(got ${recHist.status})`);

  const recDiff = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/diff?v1=1&v2=2`, { token: receptionistToken });
  record('1.2.2 RECEPTIONIST rejected from /configuration/diff (403)', recDiff.status === 403, `(got ${recDiff.status})`);

  const nurseHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: nurseToken });
  record('1.2.3 STAFF_NURSE rejected from /configuration/history (403)', nurseHist.status === 403, `(got ${nurseHist.status})`);

  const docHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: doctorToken });
  record('1.2.4 DOCTOR rejected from /configuration/history (403)', docHist.status === 403, `(got ${docHist.status})`);

  // 1.3 Authorized roles granted (200)
  const coAdminHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: companyAdminToken });
  record('1.3.1 COMPANY_ADMIN permitted on /configuration/history (200)', coAdminHist.status === 200, `(got ${coAdminHist.status})`);

  const superAdminHist = await api(`/api/v1/company/partners/${PARTNER_A}/configuration/history`, { token: superAdminToken });
  record('1.3.2 SUPER_ADMIN permitted on /configuration/history (200)', superAdminHist.status === 200, `(got ${superAdminHist.status})`);

  // =========================================================================
  // SECTION 2: P1-02 — TENANT OWNERSHIP & BRANCH ISOLATION ON EFFECTIVE ACCESS
  // =========================================================================
  console.log('\n[SECTION 2] P1-02: Tenant Ownership & Branch Isolation Enforcement');

  // 2.1 Cross-tenant effective access evaluation
  const partnerAUser = createToken({
    tenantId: PARTNER_A_TENANT_ID,
    roles: ['DOCTOR'],
    dataScope: 'branch',
    branchId: 'patna-branch-001'
  });
  const crossTenantRes = await api(`/api/v1/company/partners/${PARTNER_B}/effective-access?role=DOCTOR&action=patient.view`, { token: partnerAUser });
  record('2.1.1 Cross-tenant effective access evaluation rejected (403)', crossTenantRes.status === 403, `(got ${crossTenantRes.status})`);

  // 2.2 Branch isolation for branch-scoped staff
  const branchUser = createToken({
    tenantId: PARTNER_A_TENANT_ID,
    roles: ['RECEPTIONIST'],
    dataScope: 'branch',
    branchId: 'patna-branch-001'
  });

  const crossBranchAttempt = await api(
    `/api/v1/company/partners/${PARTNER_A}/effective-access?role=RECEPTIONIST&branchId=delhi-branch-999&action=patient.view`,
    { token: branchUser }
  );
  record('2.2.1 Branch-scoped user requesting foreign branchId rejected (403)', crossBranchAttempt.status === 403, `(got ${crossBranchAttempt.status})`);

  const assignedBranchAttempt = await api(
    `/api/v1/company/partners/${PARTNER_A}/effective-access?role=RECEPTIONIST&branchId=patna-branch-001&action=patient.view`,
    { token: branchUser }
  );
  record('2.2.2 Branch-scoped user requesting assigned branchId allowed (200)', assignedBranchAttempt.status === 200, `(got ${assignedBranchAttempt.status})`);

  // 2.3 Privilege elevation defense (non-admin querying unassigned role)
  const roleElevationAttempt = await api(
    `/api/v1/company/partners/${PARTNER_A}/effective-access?role=SUPER_ADMIN&action=patient.view`,
    { token: branchUser }
  );
  record('2.3.1 Non-admin querying elevated unassigned role rejected (403)', roleElevationAttempt.status === 403, `(got ${roleElevationAttempt.status})`);

  // =========================================================================
  // SECTION 3: P1-03 — TIER 9 AUTHORITATIVE ROLE RESOLUTION & FAIL-CLOSED BOUNDARIES
  // =========================================================================
  console.log('\n[SECTION 3] P1-03: Tier 9 Authoritative Role & Permission Packs Matrix');

  const testMatrix = [
    // 3.1 Receptionist
    { role: 'RECEPTIONIST', action: 'patient.view', expect: 'ALLOW', desc: 'Receptionist lookup patient chart' },
    { role: 'RECEPTIONIST', action: 'appointment.create', expect: 'ALLOW', desc: 'Receptionist book appointment token' },
    { role: 'RECEPTIONIST', action: 'clinical.prescription.sign', expect: 'DENY', desc: 'Receptionist sign clinical prescription (Fail-Closed Negative)' },
    { role: 'RECEPTIONIST', action: 'lab.result.validate', expect: 'DENY', desc: 'Receptionist validate lab result (Fail-Closed Negative)' },
    { role: 'RECEPTIONIST', action: 'invoice.refund', expect: 'DENY', desc: 'Receptionist process invoice refund (Fail-Closed Negative)' },

    // 3.2 Front Desk Lead & Senior Reception Manager
    { role: 'FRONT_DESK_LEAD', action: 'patient.view', expect: 'ALLOW', desc: 'Front Desk Lead lookup patient' },
    { role: 'FRONT_DESK_LEAD', action: 'invoice.view', expect: 'ALLOW', desc: 'Front Desk Lead view invoice' },
    { role: 'FRONT_DESK_LEAD', action: 'clinical.prescription.sign', expect: 'DENY', desc: 'Front Desk Lead sign prescription (Fail-Closed Negative)' },
    { role: 'SENIOR_RECEPTION_MANAGER', action: 'invoice.view', expect: 'ALLOW', desc: 'Senior Reception Manager view invoice' },
    { role: 'SENIOR_RECEPTION_MANAGER', action: 'invoice.refund', expect: 'DENY', desc: 'Senior Reception Manager refund bill (Fail-Closed Negative)' },

    // 3.3 Nursing Roles
    { role: 'STAFF_NURSE', action: 'patient.vitals.record', expect: 'ALLOW', desc: 'Staff Nurse record patient vitals' },
    { role: 'STAFF_NURSE', action: 'clinical.prescription.sign', expect: 'DENY', desc: 'Staff Nurse sign doctor prescription (Fail-Closed Negative)' },
    { role: 'STAFF_NURSE', action: 'clinical.surgery.schedule', expect: 'DENY', desc: 'Staff Nurse schedule OT surgery (Fail-Closed Negative)' },
    { role: 'NURSE', action: 'patient.vitals.record', expect: 'ALLOW', desc: 'Nurse record vitals' },
    { role: 'NURSE', action: 'prescription.sign', expect: 'DENY', desc: 'Nurse sign prescription (Fail-Closed Negative)' },
    { role: 'CHARGE_NURSE', action: 'patient.vitals.record', expect: 'ALLOW', desc: 'Charge Nurse record vitals' },
    { role: 'CHARGE_NURSE', action: 'patient.discharge.sign', expect: 'DENY', desc: 'Charge Nurse sign patient discharge (Fail-Closed Negative)' },
    { role: 'ICU_NURSE', action: 'patient.vitals.record', expect: 'ALLOW', desc: 'ICU Nurse chart patient vitals' },
    { role: 'ICU_NURSE', action: 'prescription.sign', expect: 'DENY', desc: 'ICU Nurse sign prescription (Fail-Closed Negative)' },

    // 3.4 Pharmacy Roles
    { role: 'DISPENSING_PHARMACIST', action: 'pharmacy.dispense', expect: 'ALLOW', desc: 'Pharmacist dispense medication' },
    { role: 'DISPENSING_PHARMACIST', action: 'pharmacy.stock.view', expect: 'ALLOW', desc: 'Pharmacist view stock inventory' },
    { role: 'DISPENSING_PHARMACIST', action: 'clinical.surgery.schedule', expect: 'DENY', desc: 'Pharmacist book surgery (Fail-Closed Negative)' },
    { role: 'DISPENSING_PHARMACIST', action: 'clinical.diagnosis.enter', expect: 'DENY', desc: 'Pharmacist enter clinical diagnosis (Fail-Closed Negative)' },
    { role: 'PHARMACY_MANAGER', action: 'pharmacy.dispense', expect: 'ALLOW', desc: 'Pharmacy Manager dispense drugs' },
    { role: 'PHARMACY_MANAGER', action: 'pharmacy.stock.adjust', expect: 'ALLOW', desc: 'Pharmacy Manager adjust narcotics stock' },
    { role: 'PHARMACY_MANAGER', action: 'invoice.create', expect: 'ALLOW', desc: 'Pharmacy Manager create POS bill' },
    { role: 'PHARMACY_MANAGER', action: 'clinical.surgery.schedule', expect: 'DENY', desc: 'Pharmacy Manager book OT surgery (Fail-Closed Negative)' },

    // 3.5 Laboratory & Pathology Roles
    { role: 'SENIOR_LAB_TECH', action: 'lab.sample.accession', expect: 'ALLOW', desc: 'Lab Tech barcode accession' },
    { role: 'SENIOR_LAB_TECH', action: 'lab.result.enter', expect: 'ALLOW', desc: 'Lab Tech record test analyzer result' },
    { role: 'SENIOR_LAB_TECH', action: 'patient.discharge.sign', expect: 'DENY', desc: 'Lab Tech sign patient discharge (Fail-Closed Negative)' },
    { role: 'SENIOR_LAB_TECH', action: 'pharmacy.stock.adjust', expect: 'DENY', desc: 'Lab Tech modify pharmacy inventory (Fail-Closed Negative)' },
    { role: 'LAB_TECHNICIAN', action: 'lab.sample.accession', expect: 'ALLOW', desc: 'Lab Tech accession sample' },
    { role: 'LAB_TECHNICIAN', action: 'patient.discharge.sign', expect: 'DENY', desc: 'Lab Tech sign discharge (Fail-Closed Negative)' },
    { role: 'PATHOLOGIST', action: 'lab.result.validate', expect: 'ALLOW', desc: 'Pathologist validate diagnostic result' },
    { role: 'PATHOLOGIST', action: 'patient.discharge.sign', expect: 'DENY', desc: 'Pathologist sign patient discharge (Fail-Closed Negative)' },

    // 3.6 Radiology
    { role: 'RADIOLOGIST', action: 'radiology.report.sign', expect: 'ALLOW', desc: 'Radiologist sign imaging study' },
    { role: 'RADIOLOGIST', action: 'radiology.study.view', expect: 'ALLOW', desc: 'Radiologist view PACS DICOM study' },
    { role: 'RADIOLOGIST', action: 'pharmacy.stock.adjust', expect: 'DENY', desc: 'Radiologist modify pharmacy narcotics stock (Fail-Closed Negative)' },
    { role: 'RADIOLOGIST', action: 'invoice.refund', expect: 'DENY', desc: 'Radiologist issue cash refund (Fail-Closed Negative)' },

    // 3.7 Billing & Revenue Roles
    { role: 'BILLING_OFFICER', action: 'invoice.create', expect: 'ALLOW', desc: 'Billing Officer generate patient bill' },
    { role: 'BILLING_OFFICER', action: 'invoice.view', expect: 'ALLOW', desc: 'Billing Officer lookup patient invoices' },
    { role: 'BILLING_OFFICER', action: 'clinical.diagnosis.enter', expect: 'DENY', desc: 'Billing Officer enter clinical diagnosis (Fail-Closed Negative)' },
    { role: 'BILLING_OFFICER', action: 'clinical.prescription.sign', expect: 'DENY', desc: 'Billing Officer sign prescription (Fail-Closed Negative)' },
    { role: 'BILLING_MANAGER', action: 'invoice.create', expect: 'ALLOW', desc: 'Billing Manager generate bill' },
    { role: 'BILLING_MANAGER', action: 'clinical.diagnosis.enter', expect: 'DENY', desc: 'Billing Manager enter clinical diagnosis (Fail-Closed Negative)' },
    { role: 'TPA_OFFICER', action: 'invoice.view', expect: 'ALLOW', desc: 'TPA Officer inspect cashless claim bill' },
    { role: 'TPA_OFFICER', action: 'clinical.diagnosis.enter', expect: 'DENY', desc: 'TPA Officer enter diagnosis (Fail-Closed Negative)' },

    // 3.8 Doctors, Surgeons & Executives
    { role: 'DOCTOR', action: 'patient.view', expect: 'ALLOW', desc: 'Doctor view patient chart' },
    { role: 'DOCTOR', action: 'clinical.prescription.sign', expect: 'ALLOW', desc: 'Doctor sign prescription' },
    { role: 'DOCTOR', action: 'invoice.refund', expect: 'DENY', desc: 'Doctor process cash refund (Fail-Closed Negative)' },
    { role: 'DOCTOR', action: 'staff.payroll.manage', expect: 'DENY', desc: 'Doctor edit HR payroll (Fail-Closed Negative)' },
    { role: 'SURGEON', action: 'patient.view', expect: 'ALLOW', desc: 'Surgeon view patient record' },
    { role: 'SURGEON', action: 'invoice.refund', expect: 'DENY', desc: 'Surgeon process refund (Fail-Closed Negative)' },
    { role: 'HOSPITAL_DIRECTOR', action: 'executive.audit.view', expect: 'ALLOW', desc: 'Hospital Director executive oversight' }
  ];

  for (const item of testMatrix) {
    const res = await api(`/api/v1/company/partners/${PARTNER_A}/effective-access?role=${item.role}&action=${item.action}`);
    const actual = res.data?.data?.decision;
    const decisiveTier = res.data?.data?.decisiveTier;
    const ok = actual === item.expect;
    record(`3.x [${item.role}] -> ${item.action}`, ok, `(Got ${actual} at ${decisiveTier}, Expected ${item.expect})`);
  }

  // 3.9 Unprovisioned custom role (fail-closed)
  const unprovRole = await api('/api/v1/company/access/simulate', {
    method: 'POST',
    body: JSON.stringify({
      partnerId: PARTNER_A,
      role: 'UNKNOWN_RANDOM_ROLE',
      roles: ['UNKNOWN_RANDOM_ROLE'],
      action: 'patient.view'
    })
  });
  record('3.9.1 Unregistered role with no permissions rejected fail-closed (DENY)', unprovRole.data?.data?.decision === 'DENY', `(Got ${unprovRole.data?.data?.decision})`);

  // 3.10 Commercial License Expiry Precedence (Tier 3)
  const licExpireSim = await api('/api/v1/company/access/simulate', {
    method: 'POST',
    body: JSON.stringify({
      partnerId: PARTNER_A,
      role: 'HOSPITAL_DIRECTOR',
      action: 'patient.view',
      licenseStatusOverride: 'EXPIRED'
    })
  });
  record('3.10.1 Expired Commercial License takes precedence over Role (DENY at Tier 3)',
    licExpireSim.data?.data?.decision === 'DENY' && licExpireSim.data?.data?.decisiveTier === 'TIER_3_LICENSE_VALIDITY',
    `(${licExpireSim.data?.data?.decision} at ${licExpireSim.data?.data?.decisiveTier})`
  );

  // 3.11 HQ Global Freeze Override (Tier 1)
  const freezeSim = await api('/api/v1/company/access/simulate', {
    method: 'POST',
    body: JSON.stringify({
      partnerId: PARTNER_A,
      role: 'SUPER_ADMIN',
      action: 'patient.view',
      globalFreezeOverride: true
    })
  });
  record('3.11.1 Global Freeze kill switch takes precedence over all tiers (DENY at Tier 1)',
    freezeSim.data?.data?.decision === 'DENY' && freezeSim.data?.data?.decisiveTier === 'TIER_1_GLOBAL_KILL_SWITCH',
    `(${freezeSim.data?.data?.decision} at ${freezeSim.data?.data?.decisiveTier})`
  );

  // =========================================================================
  // SECTION 4: BUG-M01 — DOCTOR WILDCARD PERMISSION REMOVAL & LEAKAGE PREVENTION
  // =========================================================================
  console.log('\n[SECTION 4] BUG-M01: Doctor Wildcard Permission Removal & Route Guard Enforcement');

  // 4.1 Authenticate as doctor@docsearch.health
  const docLoginRes = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'doctor@docsearch.health',
      password: 'DoctorPass123!'
    })
  });
  record('4.1.1 doctor@docsearch.health login succeeds (200)', docLoginRes.status === 200, `(got ${docLoginRes.status})`);

  const docToken = docLoginRes.data?.data?.accessToken || docLoginRes.data?.accessToken;
  const docUser = docLoginRes.data?.data?.user || docLoginRes.data?.user;

  // 4.2 Verify permissions array does NOT contain wildcard '*'
  const hasWildcard = Array.isArray(docUser?.permissions) && docUser.permissions.includes('*');
  record('4.2.1 doctor@docsearch.health permissions array strictly excludes wildcard "*"', !hasWildcard, `(permissions: ${JSON.stringify(docUser?.permissions?.slice(0, 5))}...)`);

  // 4.3 Attempt GET /api/v1/company/partners/directory with doctor token (must be 403 Forbidden)
  const docDirRes = await api('/api/v1/company/partners/directory', { token: docToken });
  record('4.3.1 GET /api/v1/company/partners/directory returns 403 Forbidden for doctor', docDirRes.status === 403, `(got ${docDirRes.status})`);
  record('4.3.2 Error code is INSUFFICIENT_PERMISSIONS',
    docDirRes.data?.error?.code === 'INSUFFICIENT_PERMISSIONS' || docDirRes.data?.code === 'INSUFFICIENT_PERMISSIONS',
    `(code: ${docDirRes.data?.error?.code || docDirRes.data?.code})`
  );

  // 4.4 Test B: Doctor legitimate clinical workflow still works (2xx)
  const docMeRes = await api('/api/v1/auth/me', { token: docToken });
  record('4.4.1 Test B: doctor can access /api/v1/auth/me (200)', docMeRes.status === 200, `(got ${docMeRes.status})`);

  // 4.5 Test C: Authorized administrative role still works on company partner directory (200)
  const adminDirRes = await api('/api/v1/company/partners/directory', { token: companyAdminToken });
  record('4.5.1 Test C: COMPANY_ADMIN permitted on /company/partners/directory (200)', adminDirRes.status === 200, `(got ${adminDirRes.status})`);

  const superDirRes = await api('/api/v1/company/partners/directory', { token: superAdminToken });
  record('4.5.2 Test C: SUPER_ADMIN permitted on /company/partners/directory (200)', superDirRes.status === 200, `(got ${superDirRes.status})`);

  console.log('\n================================================================');
  console.log(`🏁 P1 RBAC REMEDIATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
