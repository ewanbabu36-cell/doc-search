import pg from 'pg';
import crypto from 'node:crypto';

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

function createAuthToken(tenantId, branchId, doctorId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: doctorId || 'usr-clinical-admin-001',
      email: 'doctor.polling.test@docsearch.health',
      tenantId: tenantId,
      branchId: branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['SUPER_ADMIN', 'DOCTOR'],
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
  console.log('🔄 PHASE 5 STALE-POLLING & MULTI-TAB RACE CONDITION VERIFIER');
  console.log('================================================================\n');

  const docRows = await pool.query(`
    SELECT *
    FROM clinical.doctor_profiles
    ORDER BY created_at ASC
    LIMIT 1
  `);
  const doc = docRows.rows[0];
  const tenantId = doc.tenant_id;
  const branchId = doc.branch_id;
  const token = createAuthToken(tenantId, branchId, doc.id);

  // Prepare a patient and encounter
  const patRow = await pool.query('SELECT id, partner_id, organization_id FROM clinical.patients WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  const pat = patRow.rows[0];

  const now = new Date();
  const encId = crypto.randomUUID();
  await pool.query(`
    INSERT INTO clinical.encounters (
      id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id,
      encounter_number, encounter_type, status, priority, consultation_mode,
      chief_complaint, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      'ENC-POLL-01', 'OPD', 'WAITING', 'ROUTINE', 'PHYSICAL',
      'Stale polling test', $8, $8
    )
  `, [encId, tenantId, pat.partner_id, pat.organization_id, branchId, doc.department_id, pat.id, now]);

  await pool.query(`
    INSERT INTO clinical.encounter_queues (
      id, tenant_id, partner_id, organization_id, branch_id, department_id, encounter_id,
      token_number, queue_date, queue_status, estimated_wait_minutes, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      'TK-POLL-01', CURRENT_DATE, 'WAITING', 15, $8, $8
    )
  `, [crypto.randomUUID(), tenantId, pat.partner_id, pat.organization_id, branchId, doc.department_id, encId, now]);

  // SCENARIO A: Vacate Chamber, verify initial state
  console.log('--- SCENARIO A: Vacate Chamber ---');
  await api('/api/v1/partner/clinical/chamber/vacate', {
    method: 'POST',
    body: JSON.stringify({ doctorId: doc.id })
  }, token, tenantId, branchId);

  const initStatus = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${doc.id}`, { method: 'GET' }, token, tenantId, branchId);
  assert(initStatus.body.data?.isOccupied === false, 'Chamber is not occupied after vacate');
  assert(initStatus.body.data?.activeEncounter === null, 'Active encounter is null');

  // SCENARIO B: Doctor Claims Encounter
  console.log('\n--- SCENARIO B: Doctor Claims Encounter ---');
  const claimRes = await api(`/api/v1/partner/clinical/encounters/${encId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ doctorId: doc.id })
  }, token, tenantId, branchId);
  assert(claimRes.status === 200, 'Claim succeeds');
  const claimedConsId = claimRes.body.data?.consultation?.id;
  assert(Boolean(claimedConsId), 'Claim returns valid consultation ID');

  const occupiedStatus = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${doc.id}`, { method: 'GET' }, token, tenantId, branchId);
  assert(occupiedStatus.body.data?.isOccupied === true, 'Chamber is now occupied');
  assert(occupiedStatus.body.data?.activeEncounter?.id === encId, 'Active encounter matches claimed encounter');

  // SCENARIO C: Complete Consultation
  console.log('\n--- SCENARIO C: Complete Consultation ---');
  const completeRes = await api(`/api/v1/partner/clinical/encounters/${encId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ doctorId: doc.id })
  }, token, tenantId, branchId);
  assert(completeRes.status === 200, 'Consultation completion succeeds');

  // SCENARIO D: Stale Polling Simulation (simulating ClinicalConsultationDomainManager polling at 4s intervals)
  console.log('\n--- SCENARIO D: Polling After Completion (Stale Resurrect Defense) ---');
  for (let poll = 1; poll <= 3; poll++) {
    const pollStatus = await api(`/api/v1/partner/clinical/chamber/status?doctorId=${doc.id}`, { method: 'GET' }, token, tenantId, branchId);
    assert(pollStatus.body.data?.isOccupied === false, `Poll #${poll}: Chamber remains strictly VACANT`);
    assert(pollStatus.body.data?.activeEncounter === null, `Poll #${poll}: activeEncounter remains NULL`);
    assert(pollStatus.body.data?.activeConsultation === null, `Poll #${poll}: activeConsultation remains NULL (no stale resurrect)`);

    // Verify consultations list: the completed consultation is present in consultations list,
    // but MUST NOT be considered active
    const consRes = await api(`/api/v1/partner/clinical/consultations?doctorId=${doc.id}`, { method: 'GET' }, token, tenantId, branchId);
    const completedCons = (consRes.body.data || []).find(c => c.id === claimedConsId);
    const isFinished = ['COMPLETED', 'FINALIZED'].includes(completedCons?.consultationStatus || completedCons?.status);
    assert(isFinished, `Poll #${poll}: Completed consultation has terminal status (status = ${completedCons?.consultationStatus || completedCons?.status})`);
  }

  // SCENARIO E: Multi-tab Conflict Defense
  console.log('\n--- SCENARIO E: Multi-tab Re-claim Prevention ---');
  const tab2Claim = await api(`/api/v1/partner/clinical/encounters/${encId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ doctorId: doc.id })
  }, token, tenantId, branchId);
  assert(tab2Claim.status === 400, 'Second tab/session attempting to re-claim COMPLETED encounter is rejected with HTTP 400');

  // Cleanup
  await pool.query('DELETE FROM clinical.consultation_diagnoses WHERE consultation_id IN (SELECT id FROM clinical.consultations WHERE encounter_id = $1)', [encId]);
  await pool.query('DELETE FROM clinical.consultations WHERE encounter_id = $1', [encId]);
  await pool.query('DELETE FROM clinical.encounter_queues WHERE encounter_id = $1', [encId]);
  await pool.query('DELETE FROM clinical.encounters WHERE id = $1', [encId]);

  console.log('\n================================================================');
  console.log(`STALE-POLLING VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
