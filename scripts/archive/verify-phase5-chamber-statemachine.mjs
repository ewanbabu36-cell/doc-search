import pg from 'pg';
import crypto from 'node:crypto';

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

function createAuthToken(tenantId, branchId, doctorId, roles = ['SUPER_ADMIN', 'DOCTOR']) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: doctorId || 'usr-clinical-admin-001',
      email: 'doctor.state.machine@docsearch.health',
      tenantId: tenantId,
      branchId: branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: roles,
      permissions: ['*'],
      dataScope: 'tenant',
      iss: 'docsearch-api',
      aud: 'docsearch-platform',
      iat: now,
      exp: now + 7200
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', 'docsearch_master_jwt_secret_dev_32char_key_only')
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

async function api(path, options = {}, token, tenantId, branchId) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId,
      'x-branch-id': branchId,
      ...(options.headers || {})
    }
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: json };
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`\x1b[32m  ✔ [PASS]\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`\x1b[31m  ✖ [FAIL]\x1b[0m ${testName}`, details ? details : '');
    failed++;
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('🩺 PHASE 5 INDEPENDENT VERIFIER: CHAMBER STATE MACHINE & CLAIMS');
  console.log('================================================================\n');

  // Step 0: Fetch test doctor
  const docRows = await pool.query(`
    SELECT *
    FROM clinical.doctor_profiles
    ORDER BY created_at ASC
    LIMIT 1
  `);

  if (docRows.rows.length === 0) {
    throw new Error('No doctor profile found in database');
  }

  const docA = docRows.rows[0];
  const tenantId = docA.tenant_id;
  const branchId = docA.branch_id;

  // Find or create Doctor B in the same tenant for concurrency/claim conflict testing
  const docBRows = await pool.query(`
    SELECT *
    FROM clinical.doctor_profiles
    WHERE tenant_id = $1 AND id != $2
    LIMIT 1
  `, [tenantId, docA.id]);

  let docB;
  let createdDocB = false;
  let testStaffId = null;

  if (docBRows.rows.length > 0) {
    docB = docBRows.rows[0];
  } else {
    // Clone staff and doctor from docA
    const staffRow = await pool.query('SELECT * FROM clinical.operational_staff WHERE id = $1', [docA.staff_id]);
    const staffA = staffRow.rows[0];

    testStaffId = crypto.randomUUID();
    const docBId = crypto.randomUUID();

    await pool.query(`
      INSERT INTO clinical.operational_staff (
        id, tenant_id, partner_id, organization_id, branch_id, department_id,
        staff_code, "fullName", work_email, work_phone, staff_type, primary_role,
        employment_type, employment_status, joining_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, 'Dr. Sarah Sharma', $8, '+91-9999999999', 'DOCTOR', 'ATTENDING_PHYSICIAN',
        'FULL_TIME', 'ACTIVE', NOW()
      )
    `, [
      testStaffId, tenantId, staffA.partner_id, staffA.organization_id, staffA.branch_id, staffA.department_id,
      `STF-B-${Date.now().toString().slice(-4)}`, `doc.b.${Date.now()}@docsearch.health`
    ]);

    await pool.query(`
      INSERT INTO clinical.doctor_profiles (
        id, tenant_id, partner_id, organization_id, branch_id, department_id,
        staff_id, doctor_code, medical_license_number, qualification,
        primary_specialty, availability_status, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, 'MBBS, MD',
        'General Medicine', 'AVAILABLE', 'ACTIVE'
      )
    `, [
      docBId, tenantId, docA.partner_id, docA.organization_id, docA.branch_id, docA.department_id,
      testStaffId, `DOC-B-${Date.now().toString().slice(-4)}`, `LIC-B-${Date.now().toString().slice(-4)}`
    ]);

    docB = { id: docBId, tenant_id: tenantId, branch_id: branchId };
    createdDocB = true;
  }

  const tokenA = createAuthToken(tenantId, branchId, docA.id);
  const tokenB = createAuthToken(tenantId, branchId, docB.id);

  console.log(`Doctor A: ${docA.id} (tenant: ${tenantId})`);
  console.log(`Doctor B: ${docB.id} (tenant: ${docB.tenant_id})`);

  // TEST SUITE 1: Vacate Chamber & Server Status Authoritativeness
  console.log('\n--- SUITE 1: Chamber Vacate & Availability Status ---');
  {
    const vacateRes = await api('/api/v1/partner/clinical/chamber/vacate', {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    assert(vacateRes.status === 200, 'POST /chamber/vacate returns HTTP 200', vacateRes);
    assert(vacateRes.body.data?.availabilityStatus === 'AVAILABLE', 'Chamber vacate sets availabilityStatus to AVAILABLE');

    // Verify DB persistence of availabilityStatus
    const dbDoc = await pool.query('SELECT availability_status FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    assert(dbDoc.rows[0]?.availability_status === 'AVAILABLE', 'PostgreSQL database persists availability_status = AVAILABLE');

    // Query Chamber status
    const statusRes = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, {
      method: 'GET'
    }, tokenA, tenantId, branchId);

    assert(statusRes.status === 200, 'GET /chamber/status returns HTTP 200');
    assert(statusRes.body.data?.availabilityStatus === 'AVAILABLE', 'Status confirms doctor is AVAILABLE');
    assert(statusRes.body.data?.isOccupied === false, 'Status confirms chamber is not occupied');
    assert(statusRes.body.data?.activeEncounter === null, 'Active encounter is null when vacant');
  }

  // TEST SUITE 2: Deterministic Queue Ordering (EMERGENCY > URGENT > ROUTINE)
  console.log('\n--- SUITE 2: Deterministic Queue Ordering ---');
  let testEncRoutineId, testEncEmergencyId, testEncUrgentId;
  {
    const patRow = await pool.query('SELECT id, partner_id, organization_id FROM clinical.patients WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    const pat = patRow.rows[0];

    const now = new Date();
    // 1. ROUTINE token TK-PH5-001 created earlier
    testEncRoutineId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-PH5-RTN', 'OPD', 'WAITING', 'ROUTINE', 'PHYSICAL',
        'Routine cold', $8, $8
      )
    `, [testEncRoutineId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, new Date(now.getTime() - 30000)]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-PH5-RTN', CURRENT_DATE, 'WAITING', 20, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncRoutineId, new Date(now.getTime() - 30000)]);

    // 2. EMERGENCY token TK-PH5-EMG created later
    testEncEmergencyId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-PH5-EMG', 'OPD', 'WAITING', 'EMERGENCY', 'PHYSICAL',
        'Acute chest pain', $8, $8
      )
    `, [testEncEmergencyId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, now]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-PH5-EMG', CURRENT_DATE, 'WAITING', 0, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncEmergencyId, now]);

    // 3. URGENT token TK-PH5-URG created intermediate
    testEncUrgentId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-PH5-URG', 'OPD', 'WAITING', 'URGENT', 'PHYSICAL',
        'Severe asthma', $8, $8
      )
    `, [testEncUrgentId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, new Date(now.getTime() - 15000)]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-PH5-URG', CURRENT_DATE, 'WAITING', 10, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncUrgentId, new Date(now.getTime() - 15000)]);

    // Fetch queue via API
    const queueRes = await api(`/api/v1/partner/clinical/queues?branchId=${branchId}`, {
      method: 'GET'
    }, tokenA, tenantId, branchId);

    assert(queueRes.status === 200, 'GET /queues returns HTTP 200');
    const items = queueRes.body.data || [];
    const testItems = items.filter(q => ['TK-PH5-EMG', 'TK-PH5-URG', 'TK-PH5-RTN'].includes(q.tokenNumber));

    assert(testItems.length === 3, 'All 3 test tokens present in queue', { count: testItems.length });
    assert(testItems[0]?.tokenNumber === 'TK-PH5-EMG', 'First queue item is EMERGENCY (TK-PH5-EMG)', testItems[0]);
    assert(testItems[1]?.tokenNumber === 'TK-PH5-URG', 'Second queue item is URGENT (TK-PH5-URG)', testItems[1]);
    assert(testItems[2]?.tokenNumber === 'TK-PH5-RTN', 'Third queue item is ROUTINE (TK-PH5-RTN)', testItems[2]);
  }

  // TEST SUITE 3: Encounter Claim & Chamber Occupancy
  console.log('\n--- SUITE 3: Atomic Encounter Claim & Chamber Occupancy ---');
  {
    const claimRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    assert(claimRes.status === 200, 'POST /encounters/:id/claim returns HTTP 200');
    assert(claimRes.body.data?.encounter?.status === 'IN_CONSULTATION', 'Encounter status transitioned to IN_CONSULTATION');
    assert(claimRes.body.data?.consultation?.consultationStatus === 'IN_PROGRESS', 'Active consultation created with IN_PROGRESS');

    // Verify DB persistence of encounter and doctor status
    const dbEnc = await pool.query('SELECT status, doctor_id FROM clinical.encounters WHERE id = $1', [testEncEmergencyId]);
    assert(dbEnc.rows[0]?.status === 'IN_CONSULTATION', 'PostgreSQL encounters status is IN_CONSULTATION');
    assert(dbEnc.rows[0]?.doctor_id === docA.id, 'PostgreSQL encounters doctor_id is Doctor A');

    const dbDoc = await pool.query('SELECT availability_status FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    assert(dbDoc.rows[0]?.availability_status === 'BUSY', 'PostgreSQL doctor availability is BUSY');

    // Query Chamber status
    const statusRes = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, {
      method: 'GET'
    }, tokenA, tenantId, branchId);

    assert(statusRes.status === 200, 'GET /chamber/status returns HTTP 200');
    assert(statusRes.body.data?.isOccupied === true, 'Chamber is marked isOccupied = true');
    assert(statusRes.body.data?.activeEncounter?.id === testEncEmergencyId, 'Chamber activeEncounter matches claimed encounter');
  }

  // TEST SUITE 4: Concurrency & Conflict Protection (409 Conflict)
  console.log('\n--- SUITE 4: Concurrency & Conflict Protection ---');
  {
    // Doctor B attempts to claim the same encounter that Doctor A is currently consulting
    const conflictRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docB.id })
    }, tokenB, tenantId, branchId);

    const errMsg = conflictRes.body.error?.message || conflictRes.body.message || '';
    const errCode = conflictRes.body.error?.code || conflictRes.body.code || '';
    assert(errMsg.includes('already claimed') || errCode === 'CONFLICT', 'Conflict error message indicates encounter already claimed');
  }

  // TEST SUITE 5: Complete Consultation & Chamber Release
  console.log('\n--- SUITE 5: Complete Consultation & Auto-Release ---');
  {
    // Doctor A completes the consultation
    const completeRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        doctorId: docA.id,
        assessmentNotes: 'Treated for acute palpitations, stabilized',
        planNotes: 'Rest and follow up in 3 days'
      })
    }, tokenA, tenantId, branchId);

    assert(completeRes.status === 200, 'POST /encounters/:id/complete returns HTTP 200');

    // Verify DB state
    const dbEnc = await pool.query('SELECT status FROM clinical.encounters WHERE id = $1', [testEncEmergencyId]);
    assert(dbEnc.rows[0]?.status === 'COMPLETED', 'PostgreSQL encounter status is COMPLETED');

    const dbDoc = await pool.query('SELECT availability_status FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    assert(dbDoc.rows[0]?.availability_status === 'AVAILABLE', 'PostgreSQL doctor availability automatically reset to AVAILABLE');

    // Verify chamber status shows NOT occupied
    const statusRes = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, {
      method: 'GET'
    }, tokenA, tenantId, branchId);

    assert(statusRes.body.data?.activeEncounter === null, 'Chamber status activeEncounter is null after completion');

    // Doctor attempting to claim COMPLETED encounter must receive 400 Bad Request
    const reClaimRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    assert(reClaimRes.status === 400, 'Attempting to claim COMPLETED encounter receives HTTP 400 Bad Request', reClaimRes);
  }

  // TEST SUITE 6: Cross-Tenant Isolation
  console.log('\n--- SUITE 6: Cross-Tenant Isolation ---');
  {
    const foreignTenantId = '22222222-2222-4222-8222-222222222222';
    const foreignToken = createAuthToken(foreignTenantId, branchId, docA.id);

    // Foreign tenant tries to claim Tenant A's encounter
    const crossClaimRes = await api(`/api/v1/partner/clinical/encounters/${testEncUrgentId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, foreignToken, foreignTenantId, branchId);

    assert(crossClaimRes.status === 403 || crossClaimRes.status === 404, 'Cross-tenant claim is rejected with HTTP 403 or 404', { status: crossClaimRes.status });
  }

  // Cleanup test data
  await pool.query('DELETE FROM clinical.consultation_diagnoses WHERE consultation_id IN (SELECT id FROM clinical.consultations WHERE encounter_id IN ($1, $2, $3))', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.consultations WHERE encounter_id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.encounter_queues WHERE encounter_id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.encounters WHERE id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);

  if (createdDocB) {
    await pool.query('DELETE FROM clinical.doctor_profiles WHERE id = $1', [docB.id]);
    if (testStaffId) {
      await pool.query('DELETE FROM clinical.operational_staff WHERE id = $1', [testStaffId]);
    }
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
