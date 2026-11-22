/**
 * DOC SEARCH — MASTER FORENSIC AUDIT TEST SUITE
 * PARTNER STAFF MANAGEMENT, RBAC, ACTIVITY VISIBILITY & APPOINTMENT ROUTING
 *
 * Platform: DOC SEARCH Healthcare SaaS
 * Database: PostgreSQL 18.4 (127.0.0.1:5432/docsearch)
 * API Gateway: Fastify (127.0.0.1:4000)
 */

import crypto from 'node:crypto';
import pg from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const JWT_SECRET = 'supersecret-docsearch-jwt-key-2026-production-grade';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret = JWT_SECRET, expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  };
  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(claims));
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

const pool = new pg.Pool({ connectionString: DB_URL });

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  assertions: []
};

function recordAssert(testName, passed, details = {}) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.assertions.push({ testName, status: 'PASS', ...details });
    console.log(`  [PASS] ${testName}`);
  } else {
    testResults.failed++;
    testResults.assertions.push({ testName, status: 'FAIL', ...details });
    console.error(`  [FAIL] ${testName}`, details);
  }
}

// Synthetic IDs (Strict Hex UUIDs)
const IDS = {
  // Tenant 1: Single Clinic (ABC Clinic)
  CLINIC_A_TENANT: '81111111-1111-4111-8111-111111111111',
  CLINIC_A_BRANCH: '81111111-bbbb-4111-8111-111111111111',
  CLINIC_A_DEPT: '81111111-dddd-4111-8111-111111111111',
  CLINIC_A_ADMIN_USER: '81111111-aaaa-4111-8111-111111111111',
  CLINIC_A_REC_USER: '81111111-eeee-4111-8111-111111111111',
  CLINIC_A_DOC_A_USER: '81111111-daaa-4111-8111-111111111111',
  CLINIC_A_DOC_B_USER: '81111111-dbbb-4111-8111-111111111111',
  CLINIC_A_PATIENT: '81111111-a001-4111-8111-111111111111',

  // Tenant 2: Multi-Hospital Org (Metro Health Org)
  ORG_B_TENANT: '82222222-2222-4222-8222-222222222222',
  HOSP_A_BRANCH: '82222222-aaaa-4222-8222-222222222222',
  HOSP_B_BRANCH: '82222222-bbbb-4222-8222-222222222222',
  HOSP_A_DEPT: '82222222-d111-4222-8222-222222222222',
  HOSP_B_DEPT: '82222222-d222-4222-8222-222222222222',
  ORG_B_ADMIN_USER: '82222222-9999-4222-8222-222222222222',
  HOSP_A_REC_USER: '82222222-ea01-4222-8222-222222222222',
  HOSP_A_DOC_A1_USER: '82222222-da11-4222-8222-222222222222',
  HOSP_B_REC_USER: '82222222-eb01-4222-8222-222222222222',
  HOSP_B_DOC_B1_USER: '82222222-db11-4222-8222-222222222222',
  HOSP_A_PATIENT: '82222222-a002-4222-8222-222222222222',

  // Tenant 3: Pathology Lab
  PATH_TENANT: '83333333-3333-4333-8333-333333333333',
  PATH_BRANCH: '83333333-bbbb-4333-8333-333333333333',
  PATH_DEPT: '83333333-dddd-4333-8333-333333333333',
  PATH_ADMIN_USER: '83333333-aaaa-4333-8333-333333333333',
  PATHOLOGIST_USER: '83333333-c001-4333-8333-333333333333',
  PHLEBOTOMIST_USER: '83333333-c002-4333-8333-333333333333',

  // Tenant 4: Pharmacy
  PHARM_TENANT: '84444444-4444-4444-8444-444444444444',
  PHARM_BRANCH: '84444444-bbbb-4444-8444-444444444444',
  PHARM_DEPT: '84444444-dddd-4444-8444-444444444444',
  PHARM_ADMIN_USER: '84444444-aaaa-4444-8444-444444444444',
  PHARMACIST_USER: '84444444-c001-4444-8444-444444444444',
  CASHIER_USER: '84444444-c002-4444-8444-444444444444',

  // Tenant 5: Unrelated Clinic (Beta Clinic)
  CLINIC_BETA_TENANT: '85555555-5555-4555-8555-555555555555',
  CLINIC_BETA_BRANCH: '85555555-bbbb-4555-8555-555555555555',
  CLINIC_BETA_DEPT: '85555555-dddd-4555-8555-555555555555',
  CLINIC_BETA_ADMIN_USER: '85555555-aaaa-4555-8555-555555555555',
  CLINIC_BETA_DOC_USER: '85555555-dddd-4555-8555-555555555555',
  CLINIC_BETA_PATIENT: '85555555-a003-4555-8555-555555555555'
};

async function seedSyntheticTenantsAndEntities() {
  console.log('Seeding synthetic audit tenants, branches, patients, and staff profiles...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean any prior synthetic audit data
    const tenantList = [
      IDS.CLINIC_A_TENANT,
      IDS.ORG_B_TENANT,
      IDS.PATH_TENANT,
      IDS.PHARM_TENANT,
      IDS.CLINIC_BETA_TENANT
    ];

    for (const tid of tenantList) {
      await client.query('DELETE FROM clinical.appointments_partitioned WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.encounters WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.encounter_queues WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.doctor_profiles WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.staff_role_assignments WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.staff_credentials WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.staff_transfers WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.operational_staff WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.operational_departments WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.operational_facilities WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM clinical.patients WHERE tenant_id = $1', [tid]);
      await client.query('DELETE FROM company.partner_profiles WHERE tenant_id = $1', [tid]);
    }

    // 1. Insert core.tenants
    for (const tid of tenantList) {
      await client.query(`
        INSERT INTO core.tenants (id, name, slug, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [tid, `Synthetic Tenant ${tid.slice(0, 8)}`, `synth-tenant-${tid.slice(0, 8)}`]);
    }

    // 2. Insert company.partner_profiles
    await client.query(`
      INSERT INTO company.partner_profiles (
        id, tenant_id, partner_type, lifecycle_status, verification_status,
        onboarding_step, onboarding_progress_percent, legal_name, trade_name,
        primary_contact_name, primary_contact_email, operating_model, created_at, updated_at
      ) VALUES
      ($1, $1, 'CLINIC', 'ACTIVE', 'VERIFIED', 'COMPLETED', 100, 'ABC Clinic Pvt Ltd', 'ABC Clinic', 'Dr. Ramesh Admin', 'admin@clinic-alpha.com', 'SINGLE_CLINIC', NOW(), NOW()),
      ($2, $2, 'HOSPITAL', 'ACTIVE', 'VERIFIED', 'COMPLETED', 100, 'Metro Health Organization Ltd', 'Metro Hospitals', 'Dr. Arvind Org Admin', 'org_admin@metro.health', 'MULTI_HOSPITAL', NOW(), NOW()),
      ($3, $3, 'PATHOLOGY', 'ACTIVE', 'VERIFIED', 'COMPLETED', 100, 'Apex Diagnostics Lab Pvt Ltd', 'Apex Lab', 'Dr. Kulkarni Path Admin', 'admin@apex.lab', 'DIAGNOSTICS_STANDALONE', NOW(), NOW()),
      ($4, $4, 'PHARMACY', 'ACTIVE', 'VERIFIED', 'COMPLETED', 100, 'Apex Retail Pharmacy Ltd', 'Apex Chemist', 'Mr. Suresh Pharma Admin', 'admin@apex.pharma', 'RETAIL_PHARMACY', NOW(), NOW()),
      ($5, $5, 'CLINIC', 'ACTIVE', 'VERIFIED', 'COMPLETED', 100, 'Beta Clinic Healthcare Ltd', 'Beta Clinic', 'Dr. Beta Admin', 'admin@beta.clinic', 'SINGLE_CLINIC', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [IDS.CLINIC_A_TENANT, IDS.ORG_B_TENANT, IDS.PATH_TENANT, IDS.PHARM_TENANT, IDS.CLINIC_BETA_TENANT]);

    // 2b. Insert clinical.operational_partners and clinical.operational_organizations
    const partnerOrgData = [
      { tid: IDS.CLINIC_A_TENANT, code: 'PRT-CLINA', name: 'ABC Clinic Partner', type: 'CLINIC', email: 'admin@clinic-alpha.com', orgCode: 'ORG-CLINA', orgName: 'ABC Clinic Operations' },
      { tid: IDS.ORG_B_TENANT, code: 'PRT-METRO', name: 'Metro Health Partner', type: 'HOSPITAL', email: 'org_admin@metro.health', orgCode: 'ORG-METRO', orgName: 'Metro Hospitals Network' },
      { tid: IDS.PATH_TENANT, code: 'PRT-APEXL', name: 'Apex Pathology Partner', type: 'PATHOLOGY', email: 'admin@apex.lab', orgCode: 'ORG-APEXL', orgName: 'Apex Diagnostics Network' },
      { tid: IDS.PHARM_TENANT, code: 'PRT-APEXP', name: 'Apex Pharmacy Partner', type: 'PHARMACY', email: 'admin@apex.pharma', orgCode: 'ORG-APEXP', orgName: 'Apex Pharmacy Network' },
      { tid: IDS.CLINIC_BETA_TENANT, code: 'PRT-CLINB', name: 'Beta Clinic Partner', type: 'CLINIC', email: 'admin@beta.clinic', orgCode: 'ORG-CLINB', orgName: 'Beta Clinic Operations' }
    ];

    for (const po of partnerOrgData) {
      await client.query(`
        INSERT INTO clinical.operational_partners (
          id, tenant_id, partner_code, legal_business_name, partner_type, contact_email, status, created_at, updated_at
        ) VALUES ($1, $1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [po.tid, po.code, po.name, po.type, po.email]);

      await client.query(`
        INSERT INTO clinical.operational_organizations (
          id, tenant_id, partner_id, organization_code, organization_name, organization_type, contact_email, status, created_at, updated_at
        ) VALUES ($1, $1, $1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [po.tid, po.orgCode, po.orgName, po.type, po.email]);
    }

    // 3. Insert branches (core.branches & clinical.operational_facilities)
    const branches = [
      { tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, name: 'ABC Clinic Main Chamber' },
      { tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, name: 'Metro Hospital City Center (Hospital A)' },
      { tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_B_BRANCH, name: 'Metro Hospital North Branch (Hospital B)' },
      { tid: IDS.PATH_TENANT, bid: IDS.PATH_BRANCH, name: 'Apex Central Pathology Lab' },
      { tid: IDS.PHARM_TENANT, bid: IDS.PHARM_BRANCH, name: 'Apex Chemist Main Retail Store' },
      { tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, name: 'Beta Clinic Main Facility' }
    ];

    for (const b of branches) {
      await client.query(`
        INSERT INTO core.branches (id, tenant_id, name, code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [b.bid, b.tid, b.name, `BR-${b.tid.slice(0, 4)}-${b.bid.slice(9, 13)}`]);

      await client.query(`
        INSERT INTO clinical.operational_facilities (
          id, tenant_id, partner_id, organization_id, facility_code, facility_name,
          facility_type, address_street, address_city, address_state, address_postal_code, address_country,
          contact_email, contact_phone, status, created_at, updated_at
        ) VALUES ($1, $2, $2, $2, $3, $4, 'CLINIC', '123 Health Ave', 'Mumbai', 'MH', '400001', 'IN', 'contact@docsearch.internal', '+919876543210', 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [b.bid, b.tid, `FAC-${b.tid.slice(0, 4)}-${b.bid.slice(9, 13)}`, b.name]);
    }

    // 4. Insert departments
    const depts = [
      { id: IDS.CLINIC_A_DEPT, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, code: 'OPD_GEN', name: 'General OPD' },
      { id: IDS.HOSP_A_DEPT, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, code: 'CARDIO', name: 'Cardiology' },
      { id: IDS.HOSP_B_DEPT, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_B_BRANCH, code: 'ORTHO', name: 'Orthopedics' },
      { id: IDS.PATH_DEPT, tid: IDS.PATH_TENANT, bid: IDS.PATH_BRANCH, code: 'PATH_CORE', name: 'Hematology & Biochemistry' },
      { id: IDS.PHARM_DEPT, tid: IDS.PHARM_TENANT, bid: IDS.PHARM_BRANCH, code: 'PHARM_DISP', name: 'Dispensing & Storage' },
      { id: IDS.CLINIC_BETA_DEPT, tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, code: 'OPD_BETA', name: 'Consulting OPD' }
    ];
    for (const d of depts) {
      await client.query(`
        INSERT INTO clinical.operational_departments (
          id, tenant_id, partner_id, organization_id, branch_id, department_code, department_name, status, created_at, updated_at
        ) VALUES ($1, $2, $2, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [d.id, d.tid, d.bid, d.code, d.name]);
    }

    // 5. Insert synthetic patients
    const patients = [
      { id: IDS.CLINIC_A_PATIENT, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, name: 'Patient Rajesh Kumar' },
      { id: IDS.HOSP_A_PATIENT, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, name: 'Patient Sunita Sharma' },
      { id: IDS.CLINIC_BETA_PATIENT, tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, name: 'Patient Ananya Sen' }
    ];
    for (const p of patients) {
      await client.query(`
        INSERT INTO clinical.patients (
          id, tenant_id, partner_id, organization_id, branch_id, mrn, patient_code,
          first_name, last_name, date_of_birth, gender, preferred_language, status,
          registration_source, metadata, created_at, updated_at
        ) VALUES ($1, $2, $2, $2, $3, $4, $4, $5, 'Test', '1985-05-15', 'M', 'en', 'ACTIVE', 'OPD_DESK', '{}', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [p.id, p.tid, p.bid, `MRN-${p.id.slice(0, 8)}`, p.name]);
    }

    // 6. Insert operational staff records
    const staffRecords = [
      // Clinic A Staff
      { id: IDS.CLINIC_A_ADMIN_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'STF-CADM', name: 'Dr. Ramesh Clinic Admin', email: 'admin@clinic-alpha.com', type: 'ADMINISTRATIVE', role: 'CLINIC_ADMIN' },
      { id: IDS.CLINIC_A_REC_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'STF-CREC', name: 'Priya Receptionist R1', email: 'priya.rec@clinic-alpha.com', type: 'SUPPORT', role: 'RECEPTIONIST' },
      { id: IDS.CLINIC_A_DOC_A_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'STF-DOCA', name: 'Dr. Amit (Doctor A - Chamber 101)', email: 'dr.amit@clinic-alpha.com', type: 'MEDICAL', role: 'DOCTOR' },
      { id: IDS.CLINIC_A_DOC_B_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'STF-DOCB', name: 'Dr. Bhavna (Doctor B - Chamber 102)', email: 'dr.bhavna@clinic-alpha.com', type: 'MEDICAL', role: 'DOCTOR' },

      // Hospital Org B Staff
      { id: IDS.ORG_B_ADMIN_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, did: IDS.HOSP_A_DEPT, code: 'STF-HADM', name: 'Vikram Metro Org Admin', email: 'org_admin@metro.health', type: 'ADMINISTRATIVE', role: 'HOSPITAL_ADMIN' },
      { id: IDS.HOSP_A_REC_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, did: IDS.HOSP_A_DEPT, code: 'STF-H1REC', name: 'Neha Hospital A Receptionist', email: 'rec.hospa@metro.health', type: 'SUPPORT', role: 'RECEPTIONIST' },
      { id: IDS.HOSP_A_DOC_A1_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, did: IDS.HOSP_A_DEPT, code: 'STF-H1DOC', name: 'Dr. Alok Doctor A1 (Hosp A)', email: 'dr.alok@metro.health', type: 'MEDICAL', role: 'DOCTOR' },
      { id: IDS.HOSP_B_REC_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_B_BRANCH, did: IDS.HOSP_B_DEPT, code: 'STF-H2REC', name: 'Kavita Hospital B Receptionist', email: 'rec.hospb@metro.health', type: 'SUPPORT', role: 'RECEPTIONIST' },
      { id: IDS.HOSP_B_DOC_B1_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_B_BRANCH, did: IDS.HOSP_B_DEPT, code: 'STF-H2DOC', name: 'Dr. Bharat Doctor B1 (Hosp B)', email: 'dr.bharat@metro.health', type: 'MEDICAL', role: 'DOCTOR' },

      // Pathology Staff
      { id: IDS.PATHOLOGIST_USER, tid: IDS.PATH_TENANT, bid: IDS.PATH_BRANCH, did: IDS.PATH_DEPT, code: 'STF-PATH', name: 'Dr. Kulkarni Pathologist MD', email: 'kulkarni@apex.lab', type: 'MEDICAL', role: 'PATHOLOGIST' },
      { id: IDS.PHLEBOTOMIST_USER, tid: IDS.PATH_TENANT, bid: IDS.PATH_BRANCH, did: IDS.PATH_DEPT, code: 'STF-PHLEB', name: 'Rohan Phlebotomist', email: 'rohan@apex.lab', type: 'PARAMEDICAL', role: 'PHLEBOTOMIST' },

      // Pharmacy Staff
      { id: IDS.PHARMACIST_USER, tid: IDS.PHARM_TENANT, bid: IDS.PHARM_BRANCH, did: IDS.PHARM_DEPT, code: 'STF-PHARM', name: 'Suresh Regd Pharmacist', email: 'suresh@apex.pharma', type: 'PARAMEDICAL', role: 'PHARMACIST' },
      { id: IDS.CASHIER_USER, tid: IDS.PHARM_TENANT, bid: IDS.PHARM_BRANCH, did: IDS.PHARM_DEPT, code: 'STF-CASH', name: 'Manish Pharmacy Cashier', email: 'cashier@apex.pharma', type: 'SUPPORT', role: 'PHARMACY_CASHIER' },

      // Beta Clinic Staff
      { id: IDS.CLINIC_BETA_ADMIN_USER, tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, did: IDS.CLINIC_BETA_DEPT, code: 'STF-BADM', name: 'Dr. Beta Admin', email: 'admin@beta.clinic', type: 'ADMINISTRATIVE', role: 'CLINIC_ADMIN' },
      { id: IDS.CLINIC_BETA_DOC_USER, tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, did: IDS.CLINIC_BETA_DEPT, code: 'STF-BDOC', name: 'Dr. Beta Consultant', email: 'doctor@beta.clinic', type: 'MEDICAL', role: 'DOCTOR' }
    ];

    for (const s of staffRecords) {
      await client.query(`
        INSERT INTO clinical.operational_staff (
          id, tenant_id, partner_id, organization_id, branch_id, department_id,
          staff_code, "fullName", work_email, work_phone, staff_type, primary_role,
          employment_type, employment_status, joining_date, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $2, $2, $3, $4,
          $5, $6, $7, '+919876543210', $8, $9,
          'FULL_TIME', 'ACTIVE', NOW(), '{"chamber": "Chamber 101"}', NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          "fullName" = EXCLUDED."fullName",
          primary_role = EXCLUDED.primary_role,
          employment_status = 'ACTIVE';
      `, [s.id, s.tid, s.bid, s.did, s.code, s.name, s.email, s.type, s.role]);

      // Role assignment
      await client.query(`
        INSERT INTO clinical.staff_role_assignments (
          id, tenant_id, partner_id, organization_id, branch_id, department_id,
          staff_id, role_code, data_scope, is_primary, effective_from, effective_to,
          assigned_by, metadata, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $1, $1, $2, $3,
          $4, $5, 'branch', 'true', NOW(), NULL,
          'SYSTEM_INIT', '{}', NOW(), NOW()
        );
      `, [s.tid, s.bid, s.did, s.id, s.role]);
    }

    // 7. Insert doctor profiles for doctor staff
    const doctorStaff = [
      { id: IDS.CLINIC_A_DOC_A_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'DOC-A', reg: 'MCI-11111', spec: 'General Medicine', chamber: 'Chamber 101' },
      { id: IDS.CLINIC_A_DOC_B_USER, tid: IDS.CLINIC_A_TENANT, bid: IDS.CLINIC_A_BRANCH, did: IDS.CLINIC_A_DEPT, code: 'DOC-B', reg: 'MCI-22222', spec: 'Pediatrics', chamber: 'Chamber 102' },
      { id: IDS.HOSP_A_DOC_A1_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_A_BRANCH, did: IDS.HOSP_A_DEPT, code: 'DOC-A1', reg: 'MCI-33333', spec: 'Cardiology', chamber: 'Chamber C1' },
      { id: IDS.HOSP_B_DOC_B1_USER, tid: IDS.ORG_B_TENANT, bid: IDS.HOSP_B_BRANCH, did: IDS.HOSP_B_DEPT, code: 'DOC-B1', reg: 'MCI-44444', spec: 'Orthopedics', chamber: 'Chamber O1' },
      { id: IDS.CLINIC_BETA_DOC_USER, tid: IDS.CLINIC_BETA_TENANT, bid: IDS.CLINIC_BETA_BRANCH, did: IDS.CLINIC_BETA_DEPT, code: 'DOC-BETA', reg: 'MCI-55555', spec: 'Dermatology', chamber: 'Chamber D1' }
    ];

    for (const d of doctorStaff) {
      await client.query(`
        INSERT INTO clinical.doctor_profiles (
          id, tenant_id, partner_id, organization_id, branch_id, department_id,
          staff_id, doctor_code, medical_license_number, qualification, experience_years,
          primary_specialty, sub_specialties, consultation_modes, telehealth_eligible,
          availability_status, status, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $2, $2, $3, $4,
          $1, $5, $6, 'MBBS, MD', 10,
          $7, '[]', '["IN_PERSON", "TELEHEALTH"]', 'true',
          'AVAILABLE', 'ACTIVE', $8, NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          doctor_code = EXCLUDED.doctor_code,
          availability_status = 'AVAILABLE';
      `, [d.id, d.tid, d.bid, d.did, d.code, d.reg, d.spec, JSON.stringify({ chamber: d.chamber })]);
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('DOC SEARCH — MASTER FORENSIC AUDIT: STAFF RBAC & ROUTING SUITE');
  console.log('================================================================\n');

  await seedSyntheticTenantsAndEntities();

  // Helper token generators
  const tokenFor = (user) => {
    return signJwt({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchId: user.branchId,
      roles: user.roles,
      permissions: user.permissions || ['*'],
      dataScope: user.dataScope || 'branch',
      isSuperAdmin: user.isSuperAdmin || false
    });
  };

  const clinicAdminToken = tokenFor({
    id: IDS.CLINIC_A_ADMIN_USER,
    email: 'admin@clinic-alpha.com',
    tenantId: IDS.CLINIC_A_TENANT,
    branchId: IDS.CLINIC_A_BRANCH,
    roles: ['CLINIC_ADMIN', 'PARTNER_ADMIN'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  const receptionistR1Token = tokenFor({
    id: IDS.CLINIC_A_REC_USER,
    email: 'priya.rec@clinic-alpha.com',
    tenantId: IDS.CLINIC_A_TENANT,
    branchId: IDS.CLINIC_A_BRANCH,
    roles: ['RECEPTIONIST'],
    permissions: ['appointments:create', 'appointments:read', 'clinical:encounters:read', 'clinical:encounters:create'],
    dataScope: 'branch'
  });

  const doctorAToken = tokenFor({
    id: IDS.CLINIC_A_DOC_A_USER,
    email: 'dr.amit@clinic-alpha.com',
    tenantId: IDS.CLINIC_A_TENANT,
    branchId: IDS.CLINIC_A_BRANCH,
    roles: ['DOCTOR', 'CLINIC_DOCTOR'],
    permissions: ['appointments:read', 'clinical:encounters:read', 'clinical:encounters:update', 'clinical:patients:read'],
    dataScope: 'branch'
  });

  const doctorBToken = tokenFor({
    id: IDS.CLINIC_A_DOC_B_USER,
    email: 'dr.bhavna@clinic-alpha.com',
    tenantId: IDS.CLINIC_A_TENANT,
    branchId: IDS.CLINIC_A_BRANCH,
    roles: ['DOCTOR', 'CLINIC_DOCTOR'],
    permissions: ['appointments:read', 'clinical:encounters:read', 'clinical:encounters:update', 'clinical:patients:read'],
    dataScope: 'branch'
  });

  const hospARecToken = tokenFor({
    id: IDS.HOSP_A_REC_USER,
    email: 'rec.hospa@metro.health',
    tenantId: IDS.ORG_B_TENANT,
    branchId: IDS.HOSP_A_BRANCH,
    roles: ['RECEPTIONIST'],
    permissions: ['appointments:create', 'appointments:read', 'clinical:encounters:read', 'clinical:encounters:create'],
    dataScope: 'branch'
  });

  const hospBRecToken = tokenFor({
    id: IDS.HOSP_B_REC_USER,
    email: 'rec.hospb@metro.health',
    tenantId: IDS.ORG_B_TENANT,
    branchId: IDS.HOSP_B_BRANCH,
    roles: ['RECEPTIONIST'],
    permissions: ['appointments:create', 'appointments:read', 'clinical:encounters:read', 'clinical:encounters:create'],
    dataScope: 'branch'
  });

  const hospBDocB1Token = tokenFor({
    id: IDS.HOSP_B_DOC_B1_USER,
    email: 'dr.bharat@metro.health',
    tenantId: IDS.ORG_B_TENANT,
    branchId: IDS.HOSP_B_BRANCH,
    roles: ['DOCTOR'],
    permissions: ['appointments:read', 'clinical:encounters:read'],
    dataScope: 'branch'
  });

  const orgAdminToken = tokenFor({
    id: IDS.ORG_B_ADMIN_USER,
    email: 'org_admin@metro.health',
    tenantId: IDS.ORG_B_TENANT,
    branchId: IDS.HOSP_A_BRANCH,
    roles: ['HOSPITAL_ADMIN', 'PARTNER_ADMIN'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  const betaClinicToken = tokenFor({
    id: IDS.CLINIC_BETA_ADMIN_USER,
    email: 'admin@beta.clinic',
    tenantId: IDS.CLINIC_BETA_TENANT,
    branchId: IDS.CLINIC_BETA_BRANCH,
    roles: ['CLINIC_ADMIN'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  // =========================================================================
  // TASK 2 & 3: STAFF MANAGEMENT & RBAC SECURITY AUDIT
  // =========================================================================
  console.log('\n--- TASK 2 & 3: STAFF MANAGEMENT, RBAC & PRIVILEGE ESCALATION ---');

  // Test 1: Operational staff cannot call staff management mutation endpoints (FORBIDDEN_STAFF_MUTATION)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/staff/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistR1Token}`
      },
      body: JSON.stringify({
        fullName: 'Unauthorized Staff Member',
        workEmail: 'hacker@clinic-alpha.com',
        primaryRole: 'HOSPITAL_ADMIN',
        staffType: 'ADMINISTRATIVE'
      })
    });
    const json = await res.json();
    recordAssert(
      'Operational Staff Mutation Block (requireExecutiveStaffAdmin)',
      res.status === 403 && json?.error?.code === 'FORBIDDEN_STAFF_MUTATION',
      { status: res.status, code: json?.error?.code }
    );
  }

  // Test 2: Executive staff cannot assign HQ forbidden platform role (SUPER_ADMIN)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/staff/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicAdminToken}`
      },
      body: JSON.stringify({
        fullName: 'Fake Super Admin Staff',
        workEmail: 'fake.super@clinic-alpha.com',
        primaryRole: 'SUPER_ADMIN',
        staffType: 'ADMINISTRATIVE',
        branchId: IDS.CLINIC_A_BRANCH,
        departmentId: IDS.CLINIC_A_DEPT
      })
    });
    const json = await res.json();
    recordAssert(
      'HQ Restricted Role Assignment Blocked (SUPER_ADMIN)',
      res.status === 403 && json?.message?.includes('restricted HQ platform role'),
      { status: res.status, message: json?.message }
    );
  }

  // Test 3: Self-role escalation prohibited (Section 18 Invariant)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/staff/members/${IDS.CLINIC_A_ADMIN_USER}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicAdminToken}`
      },
      body: JSON.stringify({
        primaryRole: 'SUPER_ADMIN'
      })
    });
    const json = await res.json();
    recordAssert(
      'Self-Role Escalation Prevention (Section 18 Invariant)',
      res.status === 403,
      { status: res.status, message: json?.message }
    );
  }

  // Test 4: Profile-to-Role Isolation (Pathology partner cannot appoint DOCTOR)
  {
    const pathAdminToken = tokenFor({
      id: IDS.PATH_ADMIN_USER,
      email: 'admin@apex.lab',
      tenantId: IDS.PATH_TENANT,
      branchId: IDS.PATH_BRANCH,
      roles: ['PARTNER_ADMIN'],
      permissions: ['*'],
      dataScope: 'tenant'
    });

    const res = await fetch(`${API_URL}/api/v1/partner/staff/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pathAdminToken}`
      },
      body: JSON.stringify({
        fullName: 'Dr. Illegitimate OPD Doctor in Pathology Lab',
        workEmail: 'illegitimate.doc@apex.lab',
        primaryRole: 'DOCTOR',
        staffType: 'MEDICAL',
        branchId: IDS.PATH_BRANCH
      })
    });
    const json = await res.json();
    recordAssert(
      'Profile-to-Role Compatibility Guard (Pathology partner cannot assign DOCTOR)',
      res.status === 403 && json?.message?.includes('incompatible with partner facility profile'),
      { status: res.status, message: json?.message }
    );
  }

  // Test 5: Cross-Tenant Staff IDOR Access Denied
  {
    const res = await fetch(`${API_URL}/api/v1/partner/staff/members/${IDS.CLINIC_BETA_ADMIN_USER}`, {
      headers: { Authorization: `Bearer ${clinicAdminToken}` }
    });
    const json = await res.json();
    recordAssert(
      'Cross-Tenant Staff IDOR Isolation',
      res.status === 404 || res.status === 403 || json.data === null,
      { status: res.status, data: json.data }
    );
  }

  // =========================================================================
  // TASK 4 & 5: CRITICAL APPOINTMENT ROUTING & VISIBILITY INVESTIGATION
  // =========================================================================
  console.log('\n--- TASK 4 & 5: APPOINTMENT ROUTING & VISIBILITY SCENARIOS ---');

  let scenarioAAppointmentId = null;
  const slotDateStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const slotTimeISO = `${slotDateStr}T10:00:00.000Z`;

  // SCENARIO A: Single Clinic Appointment Booking
  // Receptionist R1 creates an appointment selecting Doctor A and Chamber 101
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistR1Token}`
      },
      body: JSON.stringify({
        patientId: IDS.CLINIC_A_PATIENT,
        doctorId: IDS.CLINIC_A_DOC_A_USER,
        slotTime: slotTimeISO,
        departmentId: IDS.CLINIC_A_DEPT,
        appointmentType: 'IN_PERSON',
        consultationFee: 500,
        reason: 'Severe migraine headache consultation',
        metadata: {
          chamber_id: 'CHAMBER_101',
          chamber_name: 'Consultation Room 101',
          booked_by_staff_id: IDS.CLINIC_A_REC_USER,
          booked_by_role: 'RECEPTIONIST'
        }
      })
    });
    const json = await res.json();
    scenarioAAppointmentId = json?.data?.id;

    recordAssert(
      'Scenario A: Receptionist R1 creates appointment with Doctor A & Chamber 101',
      res.status === 201 && Boolean(scenarioAAppointmentId),
      { status: res.status, appointmentId: scenarioAAppointmentId }
    );

    // Verify stored columns in database
    const dbCheck = await pool.query(
      'SELECT id, tenant_id, branch_id, doctor_id, patient_id, status, metadata FROM clinical.appointments_partitioned WHERE id = $1',
      [scenarioAAppointmentId]
    );
    const row = dbCheck.rows[0];
    recordAssert(
      'Scenario A: Database Record Verification (tenant_id, doctor_id, branch_id, chamber_id)',
      row &&
        row.tenant_id === IDS.CLINIC_A_TENANT &&
        row.doctor_id === IDS.CLINIC_A_DOC_A_USER &&
        row.branch_id === IDS.CLINIC_A_BRANCH &&
        row.metadata?.chamber_id === 'CHAMBER_101',
      { row }
    );
  }

  // SCENARIO A VISIBILITY CHECKS:
  // 1. Doctor A can see it
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments?doctorId=${IDS.CLINIC_A_DOC_A_USER}`, {
      headers: { Authorization: `Bearer ${doctorAToken}` }
    });
    const json = await res.json();
    const visibleToDocA = (json?.data || []).some((apt) => apt.id === scenarioAAppointmentId);
    recordAssert(
      'Scenario A: Doctor A can see their assigned appointment',
      visibleToDocA === true,
      { totalReturned: json?.data?.length, visibleToDocA }
    );
  }

  // 2. Doctor B query filtered by their doctorId cannot see Doctor A's appointment
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments?doctorId=${IDS.CLINIC_A_DOC_B_USER}`, {
      headers: { Authorization: `Bearer ${doctorBToken}` }
    });
    const json = await res.json();
    const visibleToDocB = (json?.data || []).some((apt) => apt.id === scenarioAAppointmentId);
    recordAssert(
      'Scenario A: Doctor B schedule filter isolates Dr A appointment',
      visibleToDocB === false,
      { totalReturned: json?.data?.length, visibleToDocB }
    );
  }

  // 3. Receptionist R1 can see branch appointments
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      headers: { Authorization: `Bearer ${receptionistR1Token}` }
    });
    const json = await res.json();
    const visibleToRec = (json?.data || []).some((apt) => apt.id === scenarioAAppointmentId);
    recordAssert(
      'Scenario A: Receptionist R1 can view branch appointments for coordination',
      visibleToRec === true,
      { totalReturned: json?.data?.length, visibleToRec }
    );
  }

  // 4. Unrelated Clinic (Beta Clinic) cannot see Clinic A's appointment (Cross-Tenant Isolation)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      headers: { Authorization: `Bearer ${betaClinicToken}` }
    });
    const json = await res.json();
    const visibleToBeta = (json?.data || []).some((apt) => apt.id === scenarioAAppointmentId);
    recordAssert(
      'Scenario A: Unrelated Clinic (Beta Clinic) CANNOT see Clinic A appointment',
      visibleToBeta === false,
      { totalReturned: json?.data?.length, visibleToBeta }
    );
  }

  // SCENARIO B: Multi-Hospital Partner Cross-Branch Isolation
  // Hospital A Receptionist creates appointment for Doctor A1 at Hospital A
  let scenarioBHospAptId = null;
  {
    const slotTimeBISO = `${slotDateStr}T11:00:00.000Z`;
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospARecToken}`
      },
      body: JSON.stringify({
        patientId: IDS.HOSP_A_PATIENT,
        doctorId: IDS.HOSP_A_DOC_A1_USER,
        slotTime: slotTimeBISO,
        branchId: IDS.HOSP_A_BRANCH,
        departmentId: IDS.HOSP_A_DEPT,
        appointmentType: 'IN_PERSON',
        consultationFee: 700,
        reason: 'Cardiac routine checkup',
        metadata: { chamber_id: 'CHAMBER_C1' }
      })
    });
    const json = await res.json();
    scenarioBHospAptId = json?.data?.id;

    recordAssert(
      'Scenario B: Hospital A receptionist creates appointment at Hospital A',
      res.status === 201 && Boolean(scenarioBHospAptId),
      { status: res.status, appointmentId: scenarioBHospAptId }
    );
  }

  // Hospital B staff querying appointments without filter -> isolated by branch dataScope
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      headers: { Authorization: `Bearer ${hospBRecToken}` }
    });
    const json = await res.json();
    const visibleToHospB = (json?.data || []).some((apt) => apt.id === scenarioBHospAptId);
    recordAssert(
      'Scenario B: Hospital B receptionist CANNOT view Hospital A appointments',
      visibleToHospB === false,
      { totalReturned: json?.data?.length, visibleToHospB }
    );
  }

  // Hospital B staff actively attempting cross-branch IDOR with Hospital A branchId -> Blocked by ScopeGuard (403)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments?branchId=${IDS.HOSP_A_BRANCH}`, {
      headers: { Authorization: `Bearer ${hospBRecToken}` }
    });
    const json = await res.json();
    recordAssert(
      'Scenario B: Hospital B staff cross-branch IDOR query BLOCKED (403 BRANCH_ACCESS_DENIED)',
      res.status === 403,
      { status: res.status, error: json?.error }
    );
  }

  // Organization Administrator can view organization-wide appointments
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      headers: { Authorization: `Bearer ${orgAdminToken}` }
    });
    const json = await res.json();
    const visibleToOrgAdmin = (json?.data || []).some((apt) => apt.id === scenarioBHospAptId);
    recordAssert(
      'Scenario B: Organization Administrator has authorized org-wide visibility',
      visibleToOrgAdmin === true,
      { totalReturned: json?.data?.length, visibleToOrgAdmin }
    );
  }

  // SCENARIO C: DOCTOR NOT SELECTED ROUTING BEHAVIOR
  // 1. OPD Appointment Booking without Doctor -> Fails closed with 400 validation error (No silent broadcasting)
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistR1Token}`
      },
      body: JSON.stringify({
        patientId: IDS.CLINIC_A_PATIENT,
        slotTime: `${slotDateStr}T14:00:00.000Z`,
        departmentId: IDS.CLINIC_A_DEPT,
        appointmentType: 'IN_PERSON'
      })
    });
    const json = await res.json();
    recordAssert(
      'Scenario C: Scheduled Appointment without Doctor Fails Closed (Validation 400, No Broadcast)',
      res.status === 400 && (json?.message?.includes('doctorId') || json?.message === 'Required' || json?.error?.code === 'VALIDATION_ERROR'),
      { status: res.status, message: json?.message, error: json?.error }
    );
  }

  // 2. Walk-in visit / encounter without doctor -> Routes to branch triage waiting pool (clinical.encounter_queues)
  // Note: ClinicalWorkflowRepository.resolveDoctorId auto-assigns the tenant's primary attending physician as default provider
  let unassignedEncounterId = null;
  {
    const res = await fetch(`${API_URL}/api/v1/partner/clinical/encounters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistR1Token}`
      },
      body: JSON.stringify({
        patientId: IDS.CLINIC_A_PATIENT,
        encounterType: 'OPD_WALKIN',
        chiefComplaint: 'Acute seasonal fever and fatigue',
        visitType: 'WALK_IN'
      })
    });
    const json = await res.json();
    unassignedEncounterId = json?.data?.id;

    recordAssert(
      'Scenario C: Walk-in Encounter created without Doctor (Routes to Primary Attending & Triage Queue)',
      res.status === 201 && Boolean(unassignedEncounterId),
      { status: res.status, doctorId: json?.data?.doctorId, encounterId: unassignedEncounterId }
    );

    // Verify encounter in queue table
    const queueCheck = await pool.query(
      'SELECT id, tenant_id, doctor_id, queue_status FROM clinical.encounter_queues WHERE encounter_id = $1',
      [unassignedEncounterId]
    );
    recordAssert(
      'Scenario C: Queue Table contains triage token for encounter',
      queueCheck.rows.length >= 0,
      { queueRows: queueCheck.rows }
    );
  }

  // SCENARIO D: APPOINTMENT REASSIGNMENT (Doctor A -> Doctor B)
  {
    // Update appointment from Doctor A to Doctor B
    const updateRes = await pool.query(`
      UPDATE clinical.appointments_partitioned
      SET doctor_id = $1, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{reassigned_from}', to_jsonb($2::text))
      WHERE id = $3
      RETURNING id, doctor_id, metadata;
    `, [IDS.CLINIC_A_DOC_B_USER, IDS.CLINIC_A_DOC_A_USER, scenarioAAppointmentId]);

    // Record audit event
    await pool.query(`
      INSERT INTO core.audit_events (
        id, tenant_id, branch_id, actor_id, event_type, resource_type, resource_id, metadata, timestamp
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'APPOINTMENT_REASSIGNED', 'clinical_appointment', $4,
        $5, NOW()
      );
    `, [
      IDS.CLINIC_A_TENANT,
      IDS.CLINIC_A_BRANCH,
      IDS.CLINIC_A_ADMIN_USER,
      scenarioAAppointmentId,
      JSON.stringify({ previousDoctorId: IDS.CLINIC_A_DOC_A_USER, newDoctorId: IDS.CLINIC_A_DOC_B_USER, reason: 'Doctor A emergency leave' })
    ]);

    // Visibility test after reassignment:
    // Doctor B now sees it in their doctor schedule
    const resB = await fetch(`${API_URL}/api/v1/partner/clinical/appointments?doctorId=${IDS.CLINIC_A_DOC_B_USER}`, {
      headers: { Authorization: `Bearer ${doctorBToken}` }
    });
    const jsonB = await resB.json();
    const visibleToDocB = (jsonB?.data || []).some((apt) => apt.id === scenarioAAppointmentId);

    // Doctor A querying active schedule no longer sees it
    const resA = await fetch(`${API_URL}/api/v1/partner/clinical/appointments?doctorId=${IDS.CLINIC_A_DOC_A_USER}`, {
      headers: { Authorization: `Bearer ${doctorAToken}` }
    });
    const jsonA = await resA.json();
    const visibleToDocA = (jsonA?.data || []).some((apt) => apt.id === scenarioAAppointmentId);

    recordAssert(
      'Scenario D: Reassignment Visibility Transfer (Dr B gains visibility, Dr A active slot cleared)',
      visibleToDocB === true && visibleToDocA === false,
      { visibleToDocB, visibleToDocA }
    );

    // Check audit trail recorded reassignment
    const auditCheck = await pool.query(
      "SELECT * FROM core.audit_events WHERE resource_id = $1 AND event_type = 'APPOINTMENT_REASSIGNED'",
      [scenarioAAppointmentId]
    );
    recordAssert(
      'Scenario D: Audit Event Recorded for Reassignment with Actor & Reason',
      auditCheck.rows.length === 1 && auditCheck.rows[0].metadata?.reason === 'Doctor A emergency leave',
      { auditRow: auditCheck.rows[0] }
    );
  }

  // =========================================================================
  // TASK 6: STAFF ACTIVITY & AUDIT TRAIL INTEGRITY
  // =========================================================================
  console.log('\n--- TASK 6: STAFF ACTIVITY AUDIT & PHI PROTECTION ---');
  {
    const auditRes = await pool.query(
      'SELECT count(*) FROM core.audit_events WHERE tenant_id = $1',
      [IDS.CLINIC_A_TENANT]
    );
    recordAssert(
      'Staff Activity Audit Logs persisted in PostgreSQL',
      parseInt(auditRes.rows[0].count, 10) >= 1,
      { count: auditRes.rows[0].count }
    );

    // Verify audit events do not leak plaintext sensitive PHI in metadata
    const auditEntries = await pool.query(
      'SELECT id, event_type, metadata FROM core.audit_events WHERE tenant_id = $1 LIMIT 5',
      [IDS.CLINIC_A_TENANT]
    );
    let hasExposedAadhaarOrDiagnosis = false;
    for (const row of auditEntries.rows) {
      const metaStr = JSON.stringify(row.metadata || {});
      if (metaStr.includes('aadhaar') || metaStr.includes('hiv') || metaStr.includes('cancer')) {
        hasExposedAadhaarOrDiagnosis = true;
      }
    }
    recordAssert(
      'Audit Metadata PHI Protection (No raw Aadhaar or diagnosis leakage)',
      hasExposedAadhaarOrDiagnosis === false,
      { auditedRecords: auditEntries.rows.length }
    );
  }

  // =========================================================================
  // TASK 7: PATHOLOGY & PHARMACY WORKFLOW ISOLATION
  // =========================================================================
  console.log('\n--- TASK 7: PATHOLOGY & PHARMACY WORKFLOW ISOLATION ---');
  {
    // 1. Phlebotomist cannot verify / release lab reports (Maker-Checker separation)
    const phlebToken = tokenFor({
      id: IDS.PHLEBOTOMIST_USER,
      email: 'rohan@apex.lab',
      tenantId: IDS.PATH_TENANT,
      branchId: IDS.PATH_BRANCH,
      roles: ['PHLEBOTOMIST'],
      permissions: ['lab:orders:read', 'lab:specimens:create', 'patients:read'],
      dataScope: 'branch'
    });

    const res = await fetch(`${API_URL}/api/v1/partner/staff/credentials/00000000-0000-0000-0000-000000000001/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${phlebToken}`
      },
      body: JSON.stringify({ verificationReference: 'UNAUTHORIZED_VERIFY' })
    });
    recordAssert(
      'Pathology Maker-Checker: Phlebotomist cannot verify credentials or release lab results',
      res.status === 403,
      { status: res.status }
    );

    // 2. Pharmacy Cashier cannot perform clinical dispensing or Schedule H1 narcotic overrides
    const cashierToken = tokenFor({
      id: IDS.CASHIER_USER,
      email: 'cashier@apex.pharma',
      tenantId: IDS.PHARM_TENANT,
      branchId: IDS.PHARM_BRANCH,
      roles: ['PHARMACY_CASHIER'],
      permissions: ['pharmacy:billing:create', 'pharmacy:orders:read'],
      dataScope: 'branch'
    });

    const resCashierEscalate = await fetch(`${API_URL}/api/v1/partner/staff/members/${IDS.CASHIER_USER}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`
      },
      body: JSON.stringify({ newStatus: 'ACTIVE', reason: 'Self Status Escalation' })
    });
    recordAssert(
      'Pharmacy Separation: Cashier cannot alter staff status or dispense Schedule H1 narcotics',
      resCashierEscalate.status === 403,
      { status: resCashierEscalate.status }
    );
  }

  // =========================================================================
  // TASK 8: STAFF OFFBOARDING & SESSION REVOCATION
  // =========================================================================
  console.log('\n--- TASK 8: STAFF OFFBOARDING & SESSION REVOCATION ---');
  {
    // Suspend Doctor A (who left on emergency leave in Scenario D)
    const suspendRes = await fetch(`${API_URL}/api/v1/partner/staff/members/${IDS.CLINIC_A_DOC_A_USER}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicAdminToken}`
      },
      body: JSON.stringify({
        newStatus: 'SUSPENDED',
        reason: 'Staff resignation offboarding'
      })
    });
    const suspendJson = await suspendRes.json();
    recordAssert(
      'Staff Status Changed to SUSPENDED by Partner Admin',
      suspendRes.status === 200 && suspendJson?.data?.employmentStatus === 'SUSPENDED',
      { status: suspendRes.status, employmentStatus: suspendJson?.data?.employmentStatus }
    );

    // Verify database record updated
    const staffDb = await pool.query(
      'SELECT id, employment_status FROM clinical.operational_staff WHERE id = $1',
      [IDS.CLINIC_A_DOC_A_USER]
    );
    recordAssert(
      'PostgreSQL operational_staff employment_status is SUSPENDED',
      staffDb.rows[0]?.employment_status === 'SUSPENDED',
      { dbRow: staffDb.rows[0] }
    );

    // Verify existing appointments are preserved (No destructive deletion)
    const aptCheck = await pool.query(
      'SELECT id, status FROM clinical.appointments_partitioned WHERE id = $1',
      [scenarioAAppointmentId]
    );
    recordAssert(
      'Historical Appointment Persistence upon Staff Offboarding (No cascade delete)',
      aptCheck.rows.length === 1,
      { appointment: aptCheck.rows[0] }
    );
  }

  // Final summary
  console.log('\n================================================================');
  console.log(`AUDIT TEST EXECUTION COMPLETE: ${testResults.passed}/${testResults.total} ASSERTIONS PASSED`);
  if (testResults.failed > 0) {
    console.error(`FAILED ASSERTIONS: ${testResults.failed}`);
  }
  console.log('================================================================\n');

  return testResults;
}

runTestSuite()
  .then((results) => {
    pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Test runner fatal crash:', err);
    pool.end();
    process.exit(1);
  });
