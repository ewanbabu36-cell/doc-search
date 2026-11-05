import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;
const ADMIN_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const APP_DB_URL = 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch';

describe('Comprehensive Row-Level Security (RLS) Isolation Gate', () => {
  let adminClient;
  let appClient;

  const tenantA_id = crypto.randomUUID();
  const tenantB_id = crypto.randomUUID();
  const partnerA_id = crypto.randomUUID();
  const partnerB_id = crypto.randomUUID();
  const orgA_id = crypto.randomUUID();
  const orgB_id = crypto.randomUUID();
  const facilityA_id = crypto.randomUUID();
  const facilityB_id = crypto.randomUUID();
  const patientA_id = crypto.randomUUID();
  const patientB_id = crypto.randomUUID();

  test.before(async () => {
    adminClient = new Client({ connectionString: ADMIN_DB_URL });
    await adminClient.connect();

    appClient = new Client({ connectionString: APP_DB_URL });
    await appClient.connect();

    // Verify RLS is enabled on key tables across schemas
    const rlsCheck = await adminClient.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE (schemaname = 'clinical' AND tablename IN ('patients', 'operational_partners', 'operational_organizations', 'operational_facilities'))
         OR (schemaname = 'public' AND tablename IN ('cashier_blind_drops'))
      ORDER BY schemaname, tablename;
    `);

    assert.ok(rlsCheck.rows.length >= 4, 'Target tables must exist and be queried');
    for (const row of rlsCheck.rows) {
      assert.strictEqual(row.rowsecurity, true, `Table ${row.schemaname}.${row.tablename} must have rowsecurity = true`);
    }

    // Insert test tenants using SuperAdmin context
    await adminClient.query(`
      INSERT INTO core.tenants (id, name, slug, type, status, created_at, updated_at)
      VALUES 
        ($1, 'Hospital Alpha RLS Test', 'hospital-alpha-rls', 'hospital', 'active', NOW(), NOW()),
        ($2, 'Hospital Beta RLS Test', 'hospital-beta-rls', 'hospital', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [tenantA_id, tenantB_id]);

    // Insert operational partners
    await adminClient.query(`
      INSERT INTO clinical.operational_partners (id, tenant_id, partner_code, legal_business_name, partner_type, contact_email, status, created_at, updated_at)
      VALUES 
        ($1, $2, 'PRT-RLS-A', 'Hospital Alpha Ops', 'HOSPITAL_SYSTEM', 'alpha@hospital.local', 'ACTIVE', NOW(), NOW()),
        ($3, $4, 'PRT-RLS-B', 'Hospital Beta Ops', 'HOSPITAL_SYSTEM', 'beta@hospital.local', 'ACTIVE', NOW(), NOW());
    `, [partnerA_id, tenantA_id, partnerB_id, tenantB_id]);

    // Insert operational organizations
    await adminClient.query(`
      INSERT INTO clinical.operational_organizations (id, tenant_id, partner_id, organization_code, organization_name, organization_type, contact_email, status, created_at, updated_at)
      VALUES 
        ($1, $2, $3, 'ORG-RLS-A', 'Hospital Alpha Org', 'MAIN_HOSPITAL', 'alpha-org@hospital.local', 'ACTIVE', NOW(), NOW()),
        ($4, $5, $6, 'ORG-RLS-B', 'Hospital Beta Org', 'MAIN_HOSPITAL', 'beta-org@hospital.local', 'ACTIVE', NOW(), NOW());
    `, [orgA_id, tenantA_id, partnerA_id, orgB_id, tenantB_id, partnerB_id]);

    // Insert operational facilities
    await adminClient.query(`
      INSERT INTO clinical.operational_facilities (
        id, tenant_id, partner_id, organization_id, facility_code, facility_name, facility_type,
        address_street, address_city, address_state, address_postal_code, address_country,
        contact_email, contact_phone, status, created_at, updated_at
      )
      VALUES 
        ($1, $2, $3, $4, 'FAC-RLS-A', 'Hospital Alpha Wing', 'MAIN_HOSPITAL', 'Street A', 'Patna', 'Bihar', '800001', 'India', 'fac-a@hospital.local', '9998887771', 'ACTIVE', NOW(), NOW()),
        ($5, $6, $7, $8, 'FAC-RLS-B', 'Hospital Beta Wing', 'MAIN_HOSPITAL', 'Street B', 'Patna', 'Bihar', '800001', 'India', 'fac-b@hospital.local', '9998887772', 'ACTIVE', NOW(), NOW());
    `, [facilityA_id, tenantA_id, partnerA_id, orgA_id, facilityB_id, tenantB_id, partnerB_id, orgB_id]);

    // Insert test patients under Tenant A and Tenant B
    await adminClient.query(`
      INSERT INTO clinical.patients (
        id, tenant_id, partner_id, organization_id, branch_id,
        mrn, patient_code, first_name, last_name, gender, date_of_birth,
        preferred_language, status, registration_source, created_at, updated_at, uhid
      )
      VALUES 
        ($1, $2, $3, $4, $5, 'MRN-RLS-A', 'P-RLS-A', 'John', 'Doe-Alpha', 'male', '1985-05-15', 'en', 'ACTIVE', 'RECEPTION', NOW(), NOW(), 'UHID-RLS-A'),
        ($6, $7, $8, $9, $10, 'MRN-RLS-B', 'P-RLS-B', 'Jane', 'Smith-Beta', 'female', '1990-08-20', 'en', 'ACTIVE', 'RECEPTION', NOW(), NOW(), 'UHID-RLS-B');
    `, [
      patientA_id, tenantA_id, partnerA_id, orgA_id, facilityA_id,
      patientB_id, tenantB_id, partnerB_id, orgB_id, facilityB_id
    ]);
  });

  test.after(async () => {
    if (adminClient) {
      try {
        await adminClient.query(`DELETE FROM clinical.patients WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
        await adminClient.query(`DELETE FROM clinical.operational_facilities WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
        await adminClient.query(`DELETE FROM clinical.operational_organizations WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
        await adminClient.query(`DELETE FROM clinical.operational_partners WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
        await adminClient.query(`DELETE FROM core.tenants WHERE id IN ($1, $2)`, [tenantA_id, tenantB_id]);
      } catch (e) {
        // ignore
      } finally {
        await adminClient.end();
      }
    }
    if (appClient) {
      await appClient.end();
    }
  });

  test('1. Tenant A context isolates operational partners (only Alpha returned)', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`SET LOCAL app.current_tenant_id = '${tenantA_id}'`);

    const res = await appClient.query(`SELECT id, tenant_id, legal_business_name FROM clinical.operational_partners WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(res.rows.length, 1, 'Should return exactly 1 partner for Tenant A');
    assert.strictEqual(res.rows[0].tenant_id, tenantA_id);
    assert.strictEqual(res.rows[0].legal_business_name, 'Hospital Alpha Ops');
  });

  test('2. Tenant A context isolates patients (only Doe-Alpha returned, Smith-Beta invisible)', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`SET LOCAL app.current_tenant_id = '${tenantA_id}'`);

    const res = await appClient.query(`SELECT id, tenant_id, first_name, last_name FROM clinical.patients WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(res.rows.length, 1, 'Should return exactly 1 patient for Tenant A');
    assert.strictEqual(res.rows[0].tenant_id, tenantA_id);
    assert.strictEqual(res.rows[0].last_name, 'Doe-Alpha');
  });

  test('3. Tenant B context isolates patients (only Smith-Beta returned, Doe-Alpha invisible)', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`SET LOCAL app.current_tenant_id = '${tenantB_id}'`);

    const res = await appClient.query(`SELECT id, tenant_id, first_name, last_name FROM clinical.patients WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(res.rows.length, 1, 'Should return exactly 1 patient for Tenant B');
    assert.strictEqual(res.rows[0].tenant_id, tenantB_id);
    assert.strictEqual(res.rows[0].last_name, 'Smith-Beta');
  });

  test('4. Unset / missing tenant context fails closed (0 rows returned across all isolated tables)', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`RESET app.current_tenant_id`);

    const patRes = await appClient.query(`SELECT id FROM clinical.patients WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
    const prtRes = await appClient.query(`SELECT id FROM clinical.operational_partners WHERE tenant_id IN ($1, $2)`, [tenantA_id, tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(patRes.rows.length, 0, 'Unauthenticated query to clinical.patients must return 0 rows');
    assert.strictEqual(prtRes.rows.length, 0, 'Unauthenticated query to clinical.operational_partners must return 0 rows');
  });

  test('5. SuperAdmin context bypasses tenant isolation to see all tenants', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'true'`);
    await appClient.query(`RESET app.current_tenant_id`);

    const res = await appClient.query(`SELECT id, tenant_id, last_name FROM clinical.patients WHERE tenant_id IN ($1, $2) ORDER BY last_name`, [tenantA_id, tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(res.rows.length, 2, 'SuperAdmin query must return both tenants');
    const returnedTenants = res.rows.map(r => r.tenant_id);
    assert.ok(returnedTenants.includes(tenantA_id), 'SuperAdmin must see Tenant A');
    assert.ok(returnedTenants.includes(tenantB_id), 'SuperAdmin must see Tenant B');
  });

  test('6. Tenant A cannot insert a record with Tenant B tenant_id (WITH CHECK policy violation)', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`SET LOCAL app.current_tenant_id = '${tenantA_id}'`);

    let threw = false;
    try {
      await appClient.query(`
        INSERT INTO clinical.operational_partners (id, tenant_id, partner_code, legal_business_name, partner_type, contact_email, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'PRT-SPOOF', 'Spoofed Hospital Ops', 'HOSPITAL_SYSTEM', 'spoof@hospital.local', 'ACTIVE', NOW(), NOW())
      `, [tenantB_id]);
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('row-level security policy') || err.code === '44000', `Error should be RLS violation: ${err.message}`);
    } finally {
      await appClient.query('ROLLBACK');
    }

    assert.strictEqual(threw, true, 'Insert across tenant boundary must be blocked by RLS WITH CHECK policy');
  });

  test('7. Least-privilege application role (docsearch_app) is strictly constrained by RLS', async () => {
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.is_super_admin = 'false'`);
    await appClient.query(`SET LOCAL app.current_tenant_id = '${tenantA_id}'`);

    const res = await appClient.query(`SELECT COUNT(*) FROM clinical.operational_partners WHERE tenant_id = $1`, [tenantB_id]);
    await appClient.query('COMMIT');

    assert.strictEqual(parseInt(res.rows[0].count, 10), 0, 'RLS must prevent reading Tenant B when Tenant A is set');
  });
});
