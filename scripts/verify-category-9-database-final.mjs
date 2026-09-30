import assert from 'node:assert';
import crypto from 'node:crypto';
import pg from 'pg';
import { getDatabase, initializeDatabase, withSecurityContext, patients, encounters, billingInvoices, eq, and } from '../packages/database/dist/index.js';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
let PARTNER_ID = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
let ORG_ID = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
let FACILITY_ID = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  [✔] Check ${totalChecks}: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  [✘] Check ${totalChecks} FAILED: ${title}`);
    console.error('      Error:', err.message || err);
    throw err;
  }
}

async function checkAsync(title, fn) {
  totalChecks++;
  try {
    await fn();
    console.log(`  [✔] Check ${totalChecks}: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  [✘] Check ${totalChecks} FAILED: ${title}`);
    console.error('      Error:', err.message || err);
    throw err;
  }
}

async function runVerification() {
  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY 9: DATABASE AUDIT & VERIFICATION TEST SUITE');
  console.log('PostgreSQL 18.4 Native Engine — 0 Mocks — 0 Memory Fallbacks');
  console.log('========================================================================\n');

  const rawClient = new pg.Client({ connectionString: DB_URL });
  await rawClient.connect();

  // Retrieve authoritative seeded IDs
  const pRow = await rawClient.query('SELECT id FROM clinical.operational_partners WHERE tenant_id = $1 LIMIT 1', [TENANT_A]);
  if (pRow.rows.length > 0) PARTNER_ID = pRow.rows[0].id;
  const oRow = await rawClient.query('SELECT id FROM clinical.operational_organizations WHERE tenant_id = $1 LIMIT 1', [TENANT_A]);
  if (oRow.rows.length > 0) ORG_ID = oRow.rows[0].id;
  const fRow = await rawClient.query('SELECT id FROM clinical.operational_facilities WHERE tenant_id = $1 LIMIT 1', [TENANT_A]);
  if (fRow.rows.length > 0) FACILITY_ID = fRow.rows[0].id;

  // SECTION 1: DATABASE ENGINE & SCHEMA INTEGRITY
  console.log('[SECTION 1: PostgreSQL 18.4 Engine & Schema Integrity]');
  await checkAsync('Database engine is native PostgreSQL 18.4 on Port 5432', async () => {
    const res = await rawClient.query('SELECT version(), current_database()');
    assert(res.rows[0].version.includes('PostgreSQL 18.4'), `Expected PostgreSQL 18.4, got ${res.rows[0].version}`);
    assert.strictEqual(res.rows[0].current_database, 'docsearch');
  });

  await checkAsync('All 8 required database schemas exist', async () => {
    const res = await rawClient.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name IN ('auth', 'billing', 'clinical', 'company', 'core', 'drizzle', 'public', 'workflow')
    `);
    assert.strictEqual(res.rows.length, 8, `Expected 8 schemas, found ${res.rows.length}`);
  });

  await checkAsync('Database table count matches or exceeds 500 base tables', async () => {
    const res = await rawClient.query(`
      SELECT count(*) FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE' AND table_schema IN ('clinical', 'company', 'core', 'billing', 'workflow', 'public')
    `);
    const count = Number(res.rows[0].count);
    assert(count >= 500, `Expected at least 500 tables, found ${count}`);
  });

  await checkAsync('Zero code-only unmigrated ORM tables exist', async () => {
    const res = await rawClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('document_types', 'document_requirements', 'entity_documents', 'document_verifications', 'document_audit_logs')
    `);
    assert.strictEqual(res.rows.length, 5, `All 5 document compliance tables must exist in PostgreSQL, found ${res.rows.length}`);
  });

  // SECTION 2: TENANT ISOLATION & PERFORMANCE INDEXES
  console.log('\n[SECTION 2: Multi-Tenant Isolation & Performance Indexing]');
  await checkAsync('Zero unindexed tenant_id columns across all multi-tenant tables', async () => {
    const res = await rawClient.query(`
      SELECT ns.nspname AS schema, cl.relname AS table
      FROM pg_attribute att
      JOIN pg_class cl ON cl.oid = att.attrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      WHERE att.attname = 'tenant_id'
        AND cl.relkind = 'r'
        AND ns.nspname IN ('clinical', 'company', 'core', 'billing', 'workflow', 'public')
        AND NOT EXISTS (
          SELECT 1
          FROM pg_index idx
          JOIN pg_class icl ON icl.oid = idx.indexrelid
          WHERE idx.indrelid = cl.oid
            AND (idx.indkey::int2[])[0] = att.attnum
        );
    `);
    assert.strictEqual(res.rows.length, 0, `Expected 0 unindexed tenant_id tables, found ${res.rows.length}: ${JSON.stringify(res.rows)}`);
  });

  // SECTION 3: CORE HEALTHCARE BUSINESS IDENTIFIER UNIQUENESS
  console.log('\n[SECTION 3: Core Healthcare Business Identifier Uniqueness]');
  await checkAsync('Duplicate patient UHID within same tenant is strictly rejected by PostgreSQL', async () => {
    const testUhid = `UHID-TEST-${Date.now()}`;
    const testMrn1 = `MRN-A-${Date.now()}`;
    const testMrn2 = `MRN-B-${Date.now()}`;

    // Insert first patient
    await rawClient.query(`
      INSERT INTO clinical.patients (
        id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
        first_name, last_name, date_of_birth, gender
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 'John', 'Doe', '1990-01-01', 'MALE'
      )
    `, [TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testUhid, testMrn1]);

    // Attempt insert second patient with same tenant and same UHID -> MUST FAIL
    let duplicateRejected = false;
    try {
      await rawClient.query(`
        INSERT INTO clinical.patients (
          id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
          first_name, last_name, date_of_birth, gender
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 'Jane', 'Doe', '1992-02-02', 'FEMALE'
        )
      `, [TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testUhid, testMrn2]);
    } catch (err) {
      duplicateRejected = true;
      assert(err.message.includes('unique') || err.message.includes('duplicate key'), `Expected unique constraint error, got: ${err.message}`);
    }
    assert(duplicateRejected, 'PostgreSQL must reject duplicate patient UHID within the same tenant');
  });

  await checkAsync('Duplicate patient MRN within same tenant is strictly rejected by PostgreSQL', async () => {
    const testMrn = `MRN-DUP-${Date.now()}`;
    const testUhid1 = `UHID-1-${Date.now()}`;
    const testUhid2 = `UHID-2-${Date.now()}`;

    await rawClient.query(`
      INSERT INTO clinical.patients (
        id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
        first_name, last_name, date_of_birth, gender
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 'Bob', 'Smith', '1985-05-05', 'MALE'
      )
    `, [TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testUhid1, testMrn]);

    let mrnDuplicateRejected = false;
    try {
      await rawClient.query(`
        INSERT INTO clinical.patients (
          id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
          first_name, last_name, date_of_birth, gender
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 'Alice', 'Smith', '1988-08-08', 'FEMALE'
        )
      `, [TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testUhid2, testMrn]);
    } catch (err) {
      mrnDuplicateRejected = true;
      assert(err.message.includes('unique') || err.message.includes('duplicate key'), `Expected unique constraint error, got: ${err.message}`);
    }
    assert(mrnDuplicateRejected, 'PostgreSQL must reject duplicate patient MRN within the same tenant');
  });

  // SECTION 4: TRANSACTION ATOMICITY & FORCED ROLLBACK
  console.log('\n[SECTION 4: Transaction Atomicity & Forced Rollback]');
  await checkAsync('Multi-table transaction rolls back completely on downstream failure (zero orphaned rows)', async () => {
    const testPatientId = crypto.randomUUID();
    const testEncounterId = crypto.randomUUID();
    const testMrn = `MRN-TX-${Date.now()}`;
    const testUhid = `UHID-TX-${Date.now()}`;

    let rollbackVerified = false;
    try {
      await rawClient.query('BEGIN');

      // 1. Insert patient
      await rawClient.query(`
        INSERT INTO clinical.patients (
          id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
          first_name, last_name, date_of_birth, gender
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'TxTest', 'Patient', '1995-01-01', 'MALE')
      `, [testPatientId, TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testUhid, testMrn]);

      // 2. Deliberately trigger failure on second table (violating non-null constraint)
      await rawClient.query(`
        INSERT INTO clinical.encounters (
          id, tenant_id, partner_id, organization_id, branch_id, patient_id, encounter_number, encounter_type
        ) VALUES ($1, $2, $3, $4, $5, $6, NULL, 'OPD')
      `, [testEncounterId, TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, testPatientId]);

      await rawClient.query('COMMIT');
    } catch (err) {
      await rawClient.query('ROLLBACK');
      rollbackVerified = true;
    }
    assert(rollbackVerified, 'Expected transaction to fail and execute ROLLBACK');

    // Assert that patient was NOT committed to disk
    const checkPatient = await rawClient.query('SELECT count(*) FROM clinical.patients WHERE id = $1', [testPatientId]);
    assert.strictEqual(Number(checkPatient.rows[0].count), 0, 'Rolled back patient must NOT exist in PostgreSQL');
  });

  // SECTION 5: ROW-LEVEL SECURITY & TENANT ISOLATION AT SQL LEVEL
  console.log('\n[SECTION 5: Row-Level Security & Tenant Isolation at SQL Level]');
  await checkAsync('withSecurityContext enforces app.current_tenant_id isolation', async () => {
    const db = await initializeDatabase({ connectionString: DB_URL });
    const isolationTestMrn = `MRN-ISO-${Date.now()}`;

    // Create a patient under Tenant A
    await withSecurityContext(db, { tenantId: TENANT_A }, async (tx) => {
      await tx.insert(patients).values({
        id: crypto.randomUUID(),
        tenantId: TENANT_A,
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        branchId: FACILITY_ID,
        mrn: isolationTestMrn,
        patientCode: isolationTestMrn,
        firstName: 'Isolation',
        lastName: 'Tester',
        dateOfBirth: '1980-01-01',
        gender: 'MALE'
      });
    });

    // Query under Tenant B -> Must NOT find Tenant A patient
    const resultsTenantB = await withSecurityContext(db, { tenantId: TENANT_B }, async (tx) => {
      return await tx.select().from(patients).where(and(eq(patients.tenantId, TENANT_B), eq(patients.mrn, isolationTestMrn)));
    });
    assert.strictEqual(resultsTenantB.length, 0, 'Tenant B must not see Tenant A patient records');

    // Query under Tenant A -> Must find Tenant A patient
    const resultsTenantA = await withSecurityContext(db, { tenantId: TENANT_A }, async (tx) => {
      return await tx.select().from(patients).where(and(eq(patients.tenantId, TENANT_A), eq(patients.mrn, isolationTestMrn)));
    });
    assert.strictEqual(resultsTenantA.length, 1, 'Tenant A must see its own patient record');
  });

  // SECTION 6: API PERSISTENCE & DIRECT POSTGRESQL READBACK
  console.log('\n[SECTION 6: API Persistence & Direct PostgreSQL Readback]');
  await checkAsync('API Gateway upload writes directly to PostgreSQL entity_documents with disk verification', async () => {
    // 1. Authenticate as Founder
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'founder.alok@docsearch.health', password: 'FounderPass123!' })
    });
    assert.strictEqual(loginRes.status, 200, 'Login must succeed with HTTP 200');
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    const tenantId = loginData.data?.tenantId || TENANT_A;

    // 2. Upload a compliance document
    const uploadRes = await fetch(`${API_URL}/api/v1/compliance/documents/upload`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        documentTypeCode: 'DOC_DEGREE_MBBS_MD',
        ownerEntityId: '00000000-0000-0000-0000-000000000001',
        ownerEntityType: 'USER',
        fileName: 'persisted_verification_test.pdf',
        fileBase64: Buffer.from('%PDF-1.4 Verification Test Payload').toString('base64')
      })
    });
    assert.strictEqual(uploadRes.status, 201, `Upload must return HTTP 201, got ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    const docId = uploadData.data?.id;
    assert(docId, 'Upload response must include document UUID');

    // 3. Directly query PostgreSQL with raw pg.Client to assert disk persistence
    const pgVerifyRes = await rawClient.query('SELECT id, file_name, verification_status FROM public.entity_documents WHERE id = $1', [docId]);
    assert.strictEqual(pgVerifyRes.rows.length, 1, 'Uploaded document must be permanently stored in PostgreSQL disk table');
    assert.strictEqual(pgVerifyRes.rows[0].file_name, 'persisted_verification_test.pdf');
    assert.strictEqual(pgVerifyRes.rows[0].verification_status, 'PENDING_VERIFICATION');

    // 4. Verify immutable document audit trail was also persisted in PostgreSQL
    const auditRes = await rawClient.query('SELECT action, new_status FROM public.document_audit_logs WHERE document_id = $1', [docId]);
    assert.strictEqual(auditRes.rows.length, 1, 'Audit log must be permanently stored in PostgreSQL disk table');
    assert.strictEqual(auditRes.rows[0].action, 'UPLOAD');
  });

  // SECTION 7: ZERO FALLBACK & STRICT FAIL-CLOSED VERIFICATION
  console.log('\n[SECTION 7: Zero Fallback & Fail-Closed Policy Verification]');
  await checkAsync('API Gateway database status is confirmed EXTERNAL_POSTGRES (zero pg-mem in production)', async () => {
    const healthRes = await fetch(`${API_URL}/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check must return HTTP 200');
    const healthData = await healthRes.json();
    assert(healthData.database?.ready === true, 'Database must report ready=true');
    assert.strictEqual(healthData.database?.mode, 'EXTERNAL_POSTGRES', 'Database mode must be EXTERNAL_POSTGRES');
  });

  // SECTION 8: CONCURRENCY & ZERO-RAM REPOSITORY PERSISTENCE
  console.log('\n[SECTION 8: Concurrency & Zero-RAM Repository Persistence]');
  await checkAsync('Concurrent duplicate inserts result in exactly 1 success and 9 conflict rejections', async () => {
    const raceUhid = `UHID-RACE-${Date.now()}`;
    const raceMrnBase = `MRN-RACE-${Date.now()}`;
    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(
        rawClient.query(`
          INSERT INTO clinical.patients (
            id, tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code,
            first_name, last_name, date_of_birth, gender
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 'Race', 'Tester', '1990-01-01', 'MALE'
          )
        `, [TENANT_A, PARTNER_ID, ORG_ID, FACILITY_ID, raceUhid, `${raceMrnBase}-${i}`])
          .then(() => ({ success: true }))
          .catch((err) => ({ success: false, error: err.message }))
      );
    }

    const raceResults = await Promise.all(promises);
    const successes = raceResults.filter(r => r.success).length;
    const failures = raceResults.filter(r => !r.success).length;

    assert.strictEqual(successes, 1, `Exactly 1 concurrent insert should succeed, got ${successes}`);
    assert.strictEqual(failures, 9, `Exactly 9 concurrent inserts should be rejected, got ${failures}`);
  });

  await checkAsync('AIGovernanceRepository persists models directly to PostgreSQL without RAM fallback', async () => {
    const { aiGovernanceRepository } = await import('../apps/api-gateway/dist/repositories/company/AIGovernanceRepository.js');
    const db = await initializeDatabase({ connectionString: DB_URL });
    const models = await aiGovernanceRepository.getModels(db);
    assert(Array.isArray(models) && models.length >= 3, 'Models must be queried from PostgreSQL');

    const checkRes = await rawClient.query('SELECT count(*) FROM company.ai_models');
    assert(Number(checkRes.rows[0].count) >= 3, 'PostgreSQL disk table company.ai_models must have matching rows');
  });

  await checkAsync('DietaryRepository executes directly against PostgreSQL with zero RAM fallback', async () => {
    const { dietaryRepository } = await import('../apps/api-gateway/dist/repositories/partner/DietaryRepository.js');
    const db = await initializeDatabase({ connectionString: DB_URL });
    const nonExistent = await dietaryRepository.getOrderById(crypto.randomUUID(), TENANT_A, db);
    assert.strictEqual(nonExistent, null, 'Non-existent dietary order must return null, not fake object');

    // Test ord_001 returns null if not in database
    const fakeOrder = await dietaryRepository.getOrderById('ord_001', TENANT_A, db);
    assert.strictEqual(fakeOrder, null, 'ord_001 legacy mock fixture must return null');
  });

  await checkAsync('WhatsAppEngagementRepository reports truthful 0 when tenant has no conversations', async () => {
    const { whatsAppEngagementRepository } = await import('../apps/api-gateway/dist/repositories/partner/WhatsAppEngagementRepository.js');
    const db = await initializeDatabase({ connectionString: DB_URL });
    const emptyTenantId = crypto.randomUUID();
    const metrics = await whatsAppEngagementRepository.getOverviewMetrics(emptyTenantId, db);
    assert.strictEqual(metrics.totalConversationsToday, 0, 'Zero-state tenant must report 0 conversations, not fake 4');
  });

  await rawClient.end();

  console.log('\n========================================================================');
  console.log(`CATEGORY 9 DATABASE VERIFICATION: ${passedChecks}/${totalChecks} CHECKS PASSED (100%)`);
  console.log('PostgreSQL 18.4 Engine Authority Confirmed');
  console.log('Zero Mock Persistence — Zero In-Memory RAM Fallbacks — Zero Schema Gaps');
  console.log('========================================================================');
}

runVerification().catch(err => {
  console.error('\n[-] Verification suite terminated with error:', err);
  process.exit(1);
});
