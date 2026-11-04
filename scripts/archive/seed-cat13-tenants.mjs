import pg from 'pg';
import crypto from 'node:crypto';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

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

const SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const PLAN_HOSP_FREE_YR1 = 'e9604516-3049-d6ab-799b-7c8255df12f5';
const PRODUCT_ID = '968c2fd5-249b-7913-117f-a3f52891d9e2';

function generateSignature(key, partnerId, tenantId, subId, planId, expiry) {
  const canonicalIdentity = `${key}:${partnerId}:${tenantId}:${subId}:${planId}`;
  return crypto.createHmac('sha256', SECRET).update(canonicalIdentity).digest('hex');
}

export async function seedTenants() {
  console.log('Seeding tenants, branches, profiles, subscriptions, licenses, and doctors...');
  
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

  // 6. clinical.operational_departments
  await pool.query(`
    INSERT INTO clinical.operational_departments (id, tenant_id, partner_id, organization_id, branch_id, department_code, department_name, status)
    VALUES 
      ('${DEPT_A}', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', '${BRANCH_A1}', 'APOLLO-OPD', 'Outpatient Department', 'ACTIVE'),
      ('${DEPT_B}', '${TENANT_B}', '${TENANT_B}', '${TENANT_B}', '${BRANCH_B1}', 'FORTIS-OPD', 'Outpatient Department', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 7. clinical.operational_staff
  await pool.query(`
    INSERT INTO clinical.operational_staff (
      id, tenant_id, partner_id, organization_id, branch_id, department_id,
      staff_code, "fullName", work_email, staff_type, primary_role, employment_type,
      employment_status, joining_date
    )
    VALUES 
      (
        '${STAFF_A}', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', '${BRANCH_A1}', '${DEPT_A}',
        'STF-APOLLO-01', 'Dr. Ramesh Sharma', 'dr.ramesh@apollo.org', 'MEDICAL', 'DOCTOR', 'FULL_TIME',
        'ACTIVE', NOW()
      ),
      (
        '${STAFF_B}', '${TENANT_B}', '${TENANT_B}', '${TENANT_B}', '${BRANCH_B1}', '${DEPT_B}',
        'STF-FORTIS-01', 'Dr. Priya Mehta', 'dr.priya@fortis.org', 'MEDICAL', 'DOCTOR', 'FULL_TIME',
        'ACTIVE', NOW()
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  // 8. clinical.doctor_profiles
  await pool.query(`
    INSERT INTO clinical.doctor_profiles (
      id, tenant_id, partner_id, organization_id, branch_id, department_id, staff_id,
      doctor_code, medical_license_number, qualification, experience_years, primary_specialty,
      sub_specialties, consultation_modes, telehealth_eligible, availability_status, status
    )
    VALUES 
      (
        '${DOC_A}', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', '${BRANCH_A1}', '${DEPT_A}', '${STAFF_A}',
        'DOC-APOLLO-01', 'MED-TN-12345', 'MBBS, MD', 12, 'General Medicine',
        '["Internal Medicine"]'::jsonb, '["IN_PERSON", "TELECONSULT"]'::jsonb, 'YES', 'AVAILABLE', 'ACTIVE'
      ),
      (
        '${DOC_B}', '${TENANT_B}', '${TENANT_B}', '${TENANT_B}', '${BRANCH_B1}', '${DEPT_B}', '${STAFF_B}',
        'DOC-FORTIS-01', 'MED-DL-67890', 'MBBS, MS', 10, 'General Surgery',
        '["General Surgery"]'::jsonb, '["IN_PERSON"]'::jsonb, 'NO', 'AVAILABLE', 'ACTIVE'
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  // 9. company.partner_profiles
  await pool.query(`
    INSERT INTO company.partner_profiles (
      id, tenant_id, partner_type, operating_model, lifecycle_status, verification_status,
      legal_name, trade_name, primary_contact_name, primary_contact_email, metadata
    )
    VALUES 
      (
        '${TENANT_A}', '${TENANT_A}', 'HOSPITAL', 'STANDALONE_HOSPITAL', 'ACTIVE', 'APPROVED',
        'Apollo Multi-Speciality Hospital', 'Apollo Hospitals', 'Dr. Apollo Admin', 'admin@apollo.org',
        '{"partnerType": "HOSPITAL"}'::jsonb
      ),
      (
        '${TENANT_B}', '${TENANT_B}', 'HOSPITAL', 'STANDALONE_HOSPITAL', 'ACTIVE', 'APPROVED',
        'Fortis Healthcare Institute', 'Fortis Healthcare', 'Dr. Fortis Admin', 'admin@fortis.org',
        '{"partnerType": "HOSPITAL"}'::jsonb
      )
    ON CONFLICT (id) DO UPDATE SET verification_status = 'APPROVED', lifecycle_status = 'ACTIVE';
  `);

  // 10. company.subscriptions
  await pool.query(`
    INSERT INTO company.subscriptions (id, partner_id, product_id, plan_id, status, start_date, end_date)
    VALUES
      ('${TENANT_A}', '${TENANT_A}', '${PRODUCT_ID}', '${PLAN_HOSP_FREE_YR1}', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year'),
      ('${TENANT_B}', '${TENANT_B}', '${PRODUCT_ID}', '${PLAN_HOSP_FREE_YR1}', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year')
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `);

  // 11. company.licenses
  const expiryA = new Date(Date.now() + 86400000 * 365).toISOString();
  const expiryB = new Date(Date.now() + 86400000 * 365).toISOString();
  const sigA = generateSignature('LIC-CAT13-A-2026', TENANT_A, TENANT_A, TENANT_A, PLAN_HOSP_FREE_YR1, expiryA);
  const sigB = generateSignature('LIC-CAT13-B-2026', TENANT_B, TENANT_B, TENANT_B, PLAN_HOSP_FREE_YR1, expiryB);

  const licenseMeta = JSON.stringify({
    partnerType: 'HOSPITAL',
    includedModules: [
      'CLINICAL_EMR', 'CLINICAL', 'OPD', 'OPD_QUEUE',
      'PATHOLOGY_LIMS', 'LAB', 'RADIOLOGY', 'RADIOLOGY_PACS',
      'PHARMACY_POS', 'PHARMACY_WHOLESALE', 'OPERATIONS',
      'PATIENTS', 'APPOINTMENTS', 'BILLING', 'TPA_INSURANCE'
    ]
  });

  await pool.query(`
    INSERT INTO company.licenses (
      id, license_key, partner_id, tenant_id, subscription_id, plan_id,
      license_type, status, activation_status, expiry_date, signature, metadata
    )
    VALUES
      (
        '${TENANT_A}', 'LIC-CAT13-A-2026', '${TENANT_A}', '${TENANT_A}', '${TENANT_A}', '${PLAN_HOSP_FREE_YR1}',
        'COMMERCIAL', 'ACTIVE', 'ACTIVATED', '${expiryA}', '${sigA}', '${licenseMeta}'::jsonb
      ),
      (
        '${TENANT_B}', 'LIC-CAT13-B-2026', '${TENANT_B}', '${TENANT_B}', '${TENANT_B}', '${PLAN_HOSP_FREE_YR1}',
        'COMMERCIAL', 'ACTIVE', 'ACTIVATED', '${expiryB}', '${sigB}', '${licenseMeta}'::jsonb
      )
    ON CONFLICT (id) DO UPDATE SET
      status = 'ACTIVE',
      signature = EXCLUDED.signature,
      metadata = EXCLUDED.metadata;
  `);

  console.log('All tenant fixtures, departments, staff, doctors, subscriptions, and cryptographic licenses seeded successfully!');
  await pool.end();
}

seedTenants().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
