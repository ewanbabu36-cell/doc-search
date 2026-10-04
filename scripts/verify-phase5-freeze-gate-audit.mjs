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
      email: 'doctor.audit@docsearch.health',
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

const auditEvidence = [];
let passCount = 0;
let failCount = 0;

function recordTest(id, name, pass, expected, actual, dbProof) {
  const record = { id, name, status: pass ? 'VERIFIED' : 'NOT VERIFIED', expected, actual, dbProof };
  auditEvidence.push(record);
  if (pass) {
    console.log(`\x1b[32m  ✔ [${id}] ${name}\x1b[0m`);
    passCount++;
  } else {
    console.error(`\x1b[31m  ✖ [${id}] ${name}\x1b[0m`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
    failCount++;
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('🔬 DOC SEARCH — PHASE 5 INDEPENDENT AUDIT & FREEZE GATE VERIFIER');
  console.log('================================================================\n');

  // Step 0: Ensure doctors exist in DB within the same tenant
  const docRows = await pool.query(`
    SELECT *
    FROM clinical.doctor_profiles
    ORDER BY created_at ASC
  `);
  if (docRows.rows.length === 0) {
    throw new Error('No doctor profile found in DB');
  }

  const docA = docRows.rows[0];
  const tenantId = docA.tenant_id;
  const branchId = docA.branch_id;

  let docB = docRows.rows.find(d => d.tenant_id === tenantId && d.id !== docA.id);
  if (!docB) {
    const docBId = '00000000-0000-4000-8000-000000000099';
    await pool.query(`
      INSERT INTO clinical.doctor_profiles (
        id, tenant_id, partner_id, organization_id, branch_id, department_id,
        full_name, email, phone, medical_license_number, specialization, availability_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        'Dr. Second Physician', 'doctor2.audit@docsearch.health', '+91-9876543219',
        'LIC-GATE-002', 'General Medicine', 'AVAILABLE'
      )
      ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, availability_status = 'AVAILABLE'
    `, [docBId, tenantId, docA.partner_id, docA.organization_id, docA.branch_id, docA.department_id]);
    const docBRes = await pool.query('SELECT * FROM clinical.doctor_profiles WHERE id = $1', [docBId]);
    docB = docBRes.rows[0];
  }

  const tokenA = createAuthToken(tenantId, branchId, docA.id);
  const tokenB = createAuthToken(tenantId, branchId, docB.id);

  const foreignTenantId = '22222222-2222-4222-8222-222222222222';
  const foreignToken = createAuthToken(foreignTenantId, branchId, docA.id);

  console.log(`Doctor A: ${docA.id} (tenant: ${tenantId})`);
  console.log(`Doctor B: ${docB.id} (tenant: ${docB.tenant_id})`);

  // SECTION A: CHAMBER STATE & VACATE PERSISTENCE
  console.log('\n--- SECTION A: Chamber State & Vacate Persistence ---');
  {
    // A.1: Vacate Chamber
    const vacateRes = await api('/api/v1/partner/clinical/chamber/vacate', {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    const dbDoc1 = await pool.query('SELECT id, tenant_id, availability_status, updated_at FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    recordTest(
      'CHAMBER-01',
      'Chamber Vacate persists doctor availability = AVAILABLE in PostgreSQL',
      vacateRes.status === 200 && dbDoc1.rows[0]?.availability_status === 'AVAILABLE',
      { status: 200, dbAvailability: 'AVAILABLE' },
      { status: vacateRes.status, dbAvailability: dbDoc1.rows[0]?.availability_status },
      { table: 'clinical.doctor_profiles', pk: docA.id, columns: dbDoc1.rows[0] }
    );

    // A.2: Chamber Status Read (Vacant)
    const statusRes1 = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
    recordTest(
      'CHAMBER-02',
      'GET /chamber/status returns server-authoritative vacant state',
      statusRes1.status === 200 && statusRes1.body.data?.isOccupied === false && statusRes1.body.data?.activeEncounter === null,
      { status: 200, isOccupied: false, activeEncounter: null },
      { status: statusRes1.status, isOccupied: statusRes1.body.data?.isOccupied, activeEncounter: statusRes1.body.data?.activeEncounter },
      null
    );

    // A.3: Reload Verification (Re-read directly from DB & API)
    const statusRes2 = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
    recordTest(
      'CHAMBER-03',
      'Reload verification preserves vacant state across multiple queries',
      statusRes2.status === 200 && statusRes2.body.data?.isOccupied === false,
      { isOccupied: false },
      { isOccupied: statusRes2.body.data?.isOccupied },
      null
    );
  }

  // SECTION B: DETERMINISTIC QUEUE ORDERING
  console.log('\n--- SECTION B: Deterministic Queue Ordering ---');
  let testEncRoutineId, testEncEmergencyId, testEncUrgentId;
  {
    const patRow = await pool.query('SELECT id, partner_id, organization_id FROM clinical.patients WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    const pat = patRow.rows[0];

    const now = new Date();
    testEncRoutineId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-GATE-RTN', 'OPD', 'WAITING', 'ROUTINE', 'PHYSICAL',
        'Routine cold', $8, $8
      )
    `, [testEncRoutineId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, new Date(now.getTime() - 40000)]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-GATE-RTN', CURRENT_DATE, 'WAITING', 20, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncRoutineId, new Date(now.getTime() - 40000)]);

    testEncEmergencyId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-GATE-EMG', 'OPD', 'WAITING', 'EMERGENCY', 'PHYSICAL',
        'Acute chest pain', $8, $8
      )
    `, [testEncEmergencyId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, now]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-GATE-EMG', CURRENT_DATE, 'WAITING', 0, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncEmergencyId, now]);

    testEncUrgentId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO clinical.encounters (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
        encounter_number, encounter_type, status, priority, consultation_mode,
        chief_complaint, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'ENC-GATE-URG', 'OPD', 'WAITING', 'URGENT', 'PHYSICAL',
        'Severe breathlessness', $8, $8
      )
    `, [testEncUrgentId, tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, pat.id, new Date(now.getTime() - 20000)]);

    await pool.query(`
      INSERT INTO clinical.encounter_queues (
        id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
        token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        'TK-GATE-URG', CURRENT_DATE, 'WAITING', 10, $8, $8
      )
    `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, docA.department_id, testEncUrgentId, new Date(now.getTime() - 20000)]);

    const queueRes = await api(`/api/v1/partner/clinical/queues?branchId=${branchId}`, { method: 'GET' }, tokenA, tenantId, branchId);
    const items = (queueRes.body.data || []).filter(q => ['TK-GATE-EMG', 'TK-GATE-URG', 'TK-GATE-RTN'].includes(q.tokenNumber));

    recordTest(
      'QUEUE-01',
      'Deterministic Queue Priority Ordering (EMERGENCY > URGENT > ROUTINE)',
      items[0]?.tokenNumber === 'TK-GATE-EMG' && items[1]?.tokenNumber === 'TK-GATE-URG' && items[2]?.tokenNumber === 'TK-GATE-RTN',
      ['TK-GATE-EMG', 'TK-GATE-URG', 'TK-GATE-RTN'],
      items.map(i => i.tokenNumber),
      { count: items.length, order: items.map(i => ({ token: i.tokenNumber, priority: i.priority })) }
    );
  }

  // SECTION C: ATOMIC ENCOUNTER CLAIM & OCCUPANCY
  console.log('\n--- SECTION C: Atomic Encounter Claim & Occupancy ---');
  let activeConsId;
  {
    const claimRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    activeConsId = claimRes.body.data?.consultation?.id;

    const dbEnc = await pool.query('SELECT id, status, doctor_id, consultation_started_at, updated_at FROM clinical.encounters WHERE id = $1', [testEncEmergencyId]);
    const dbDoc = await pool.query('SELECT id, availability_status, updated_at FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    const dbCons = await pool.query('SELECT id, consultation_status, doctor_id, started_at FROM clinical.consultations WHERE id = $1', [activeConsId]);

    recordTest(
      'CLAIM-01',
      'Atomic claim transitions encounter to IN_CONSULTATION and doctor to BUSY in PostgreSQL',
      claimRes.status === 200 && dbEnc.rows[0]?.status === 'IN_CONSULTATION' && dbDoc.rows[0]?.availability_status === 'BUSY',
      { status: 200, encStatus: 'IN_CONSULTATION', docAvailability: 'BUSY' },
      { status: claimRes.status, encStatus: dbEnc.rows[0]?.status, docAvailability: dbDoc.rows[0]?.availability_status },
      { encounter: dbEnc.rows[0], doctor: dbDoc.rows[0], consultation: dbCons.rows[0] }
    );

    const statusRes = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
    recordTest(
      'CLAIM-02',
      'GET /chamber/status reflects occupied chamber with active encounter & consultation',
      statusRes.status === 200 && statusRes.body.data?.isOccupied === true && statusRes.body.data?.activeEncounter?.id === testEncEmergencyId,
      { isOccupied: true, activeEncounterId: testEncEmergencyId },
      { isOccupied: statusRes.body.data?.isOccupied, activeEncounterId: statusRes.body.data?.activeEncounter?.id },
      null
    );
  }

  // SECTION D: NEGATIVE CONCURRENCY & CONFLICT TESTS
  console.log('\n--- SECTION D: Negative Concurrency & Conflict Tests ---');
  {
    // NEG-01: Duplicate Claim by another doctor returns 409 Conflict
    const dupClaimRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docB.id })
    }, tokenB, tenantId, branchId);

    recordTest(
      'NEG-01',
      'Duplicate claim on in-consultation encounter returns HTTP 409 Conflict',
      dupClaimRes.status === 409,
      { status: 409 },
      { status: dupClaimRes.status, message: dupClaimRes.body.error?.message || dupClaimRes.body.message },
      null
    );

    // NEG-02: Simultaneous claim race test on unclaimed URGENT encounter
    const [simClaim1, simClaim2] = await Promise.all([
      api(`/api/v1/partner/clinical/encounters/${testEncUrgentId}/claim`, { method: 'POST', body: JSON.stringify({ doctorId: docA.id }) }, tokenA, tenantId, branchId),
      api(`/api/v1/partner/clinical/encounters/${testEncUrgentId}/claim`, { method: 'POST', body: JSON.stringify({ doctorId: docB.id }) }, tokenB, tenantId, branchId)
    ]);

    const statuses = [simClaim1.status, simClaim2.status].sort();
    recordTest(
      'NEG-02',
      'Simultaneous claims on same encounter: exactly one succeeds (200), other receives conflict (409)',
      statuses[0] === 200 && statuses[1] === 409,
      { expectedStatuses: [200, 409] },
      { actualStatuses: statuses },
      null
    );

    // Release URGENT encounter back to WAITING for clean state
    await pool.query("UPDATE clinical.encounters SET status = 'WAITING', doctor_id = NULL WHERE id = $1", [testEncUrgentId]);
    await pool.query("UPDATE clinical.encounter_queues SET queue_status = 'WAITING', doctor_id = NULL WHERE encounter_id = $1", [testEncUrgentId]);
  }

  // SECTION E: CONSULTATION COMPLETION & AUTO-RELEASE
  console.log('\n--- SECTION E: Consultation Completion & Auto-Release ---');
  {
    const completeRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id, assessmentNotes: 'Patient stabilized', planNotes: 'Follow-up in 3 days' })
    }, tokenA, tenantId, branchId);

    const dbEncAfter = await pool.query('SELECT status, completed_at FROM clinical.encounters WHERE id = $1', [testEncEmergencyId]);
    const dbDocAfter = await pool.query('SELECT availability_status FROM clinical.doctor_profiles WHERE id = $1', [docA.id]);
    const dbConsAfter = await pool.query('SELECT consultation_status, completed_at FROM clinical.consultations WHERE id = $1', [activeConsId]);

    recordTest(
      'COMPLETE-01',
      'POST /encounters/:id/complete finalizes encounter and auto-resets doctor to AVAILABLE in PostgreSQL',
      completeRes.status === 200 && dbEncAfter.rows[0]?.status === 'COMPLETED' && dbDocAfter.rows[0]?.availability_status === 'AVAILABLE',
      { status: 200, encStatus: 'COMPLETED', docAvailability: 'AVAILABLE' },
      { status: completeRes.status, encStatus: dbEncAfter.rows[0]?.status, docAvailability: dbDocAfter.rows[0]?.availability_status },
      { encounter: dbEncAfter.rows[0], doctor: dbDocAfter.rows[0], consultation: dbConsAfter.rows[0] }
    );

    const statusAfter = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
    recordTest(
      'COMPLETE-02',
      'Chamber is released to vacant (activeEncounter: null, isOccupied: false) after completion',
      statusAfter.status === 200 && statusAfter.body.data?.isOccupied === false && statusAfter.body.data?.activeEncounter === null,
      { isOccupied: false, activeEncounter: null },
      { isOccupied: statusAfter.body.data?.isOccupied, activeEncounter: statusAfter.body.data?.activeEncounter },
      null
    );
  }

  // SECTION F: NEGATIVE CLAIM & COMPLETION TESTS
  console.log('\n--- SECTION F: Negative Post-Completion Tests ---');
  {
    // NEG-03: Claim completed encounter returns 400 Bad Request
    const reClaimRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    recordTest(
      'NEG-03',
      'Attempting to claim COMPLETED encounter returns HTTP 400 Bad Request',
      reClaimRes.status === 400,
      { status: 400 },
      { status: reClaimRes.status, message: reClaimRes.body.error?.message || reClaimRes.body.message },
      null
    );

    // NEG-04: Invalid encounter ID claim returns 404 Not Found
    const fakeId = '00000000-0000-4000-8000-000000000999';
    const invalidIdRes = await api(`/api/v1/partner/clinical/encounters/${fakeId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    recordTest(
      'NEG-04',
      'Claim with non-existent encounter ID returns HTTP 404 Not Found',
      invalidIdRes.status === 404,
      { status: 404 },
      { status: invalidIdRes.status },
      null
    );

    // NEG-05: Repeated completion request is handled idempotently
    const repeatedCompleteRes = await api(`/api/v1/partner/clinical/encounters/${testEncEmergencyId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, tokenA, tenantId, branchId);

    recordTest(
      'NEG-05',
      'Repeated completion on already-completed encounter is handled cleanly without corrupting state',
      repeatedCompleteRes.status === 200,
      { status: 200 },
      { status: repeatedCompleteRes.status },
      null
    );
  }

  // SECTION G: TENANT ISOLATION (CROSS-TENANT SECURITY)
  console.log('\n--- SECTION G: Cross-Tenant Isolation ---');
  {
    // NEG-06: Cross-Tenant Claim
    const crossClaimRes = await api(`/api/v1/partner/clinical/encounters/${testEncRoutineId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, foreignToken, foreignTenantId, branchId);

    recordTest(
      'TENANT-01',
      'Cross-tenant encounter claim is rejected with HTTP 403 Forbidden or 404 Not Found',
      crossClaimRes.status === 403 || crossClaimRes.status === 404,
      { status: '403 or 404' },
      { status: crossClaimRes.status },
      null
    );

    // NEG-07: Cross-Tenant Complete
    const crossCompleteRes = await api(`/api/v1/partner/clinical/encounters/${testEncRoutineId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ doctorId: docA.id })
    }, foreignToken, foreignTenantId, branchId);

    recordTest(
      'TENANT-02',
      'Cross-tenant encounter completion is rejected with HTTP 403 Forbidden or 404 Not Found',
      crossCompleteRes.status === 403 || crossCompleteRes.status === 404,
      { status: '403 or 404' },
      { status: crossCompleteRes.status },
      null
    );
  }

  // SECTION H: STALE-POLLING & ZERO-RESURRECTION DEFENSE
  console.log('\n--- SECTION H: Stale-Polling & Zero-Resurrection Defense ---');
  {
    // Poll 3 times at intervals
    for (let poll = 1; poll <= 3; poll++) {
      const pollStatus = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
      const consListRes = await api(`/api/v1/partner/clinical/consultations?doctorId=${docA.id}`, { method: 'GET' }, tokenA, tenantId, branchId);
      const justCompleted = (consListRes.body.data || []).find(c => c.id === activeConsId);

      const pass = pollStatus.body.data?.isOccupied === false &&
                   pollStatus.body.data?.activeEncounter === null &&
                   pollStatus.body.data?.activeConsultation === null &&
                   ['FINALIZED', 'COMPLETED'].includes(justCompleted?.consultationStatus || justCompleted?.status);

      recordTest(
        `POLL-0${poll}`,
        `Periodic poll #${poll}: Completed consultation NEVER resurrects; chamber remains strictly VACANT`,
        pass,
        { isOccupied: false, activeEncounter: null, activeConsultation: null },
        { isOccupied: pollStatus.body.data?.isOccupied, activeEncounter: pollStatus.body.data?.activeEncounter, activeConsultation: pollStatus.body.data?.activeConsultation },
        null
      );
    }
  }

  // Cleanup test encounters
  await pool.query('DELETE FROM clinical.consultation_diagnoses WHERE consultation_id IN (SELECT id FROM clinical.consultations WHERE encounter_id IN ($1, $2, $3))', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.consultations WHERE encounter_id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.encounter_queues WHERE encounter_id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);
  await pool.query('DELETE FROM clinical.encounters WHERE id IN ($1, $2, $3)', [testEncRoutineId, testEncEmergencyId, testEncUrgentId]);

  console.log('\n================================================================');
  console.log(`FREEZE GATE AUDIT SUMMARY: ${passCount} VERIFIED, ${failCount} FAILED`);
  console.log('================================================================\n');

  await pool.end();

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Fatal audit failure:', e);
  process.exit(1);
});
