import { Pool } from 'pg';
import { signJwt } from '../packages/auth/dist/index.js';

const API_BASE = 'http://127.0.0.1:4000';
const DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const MASTER_SECRET = 'supersecret-docsearch-jwt-key-2026-production-grade';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const PARTNER_A = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
const ORG_A = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
const BRANCH_A = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';
const DOCTOR_ID = 'dcce4591-eda7-475e-b927-e8303ff6b9d7';

function createToken(overrides = {}) {
  const claims = {
    sub: overrides.userId || DOCTOR_ID,
    email: overrides.email || 'admin@11111111.partner.local',
    tenantId: overrides.tenantId || TENANT_A,
    partnerId: overrides.partnerId || PARTNER_A,
    organizationId: overrides.organizationId || ORG_A,
    facilityId: overrides.facilityId || BRANCH_A,
    branchId: overrides.branchId || BRANCH_A,
    roles: overrides.roles || ['SUPER_ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN'],
    permissions: overrides.permissions || [
      'clinical:patients',
      'clinical:patients:create',
      'clinical:patients:read',
      'clinical:encounters',
      'clinical:encounters:create',
      'clinical:encounters:read',
      'clinical:consultations',
      'clinical:consultations:read',
      'clinical:prescriptions',
      'clinical:prescriptions:read',
      'clinical:history:read',
      'lab:orders',
      'lab:orders:read',
      'security:break_glass:manage'
    ],
    iss: ISSUER,
    aud: AUDIENCE
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 });
}

async function api(path, options = {}) {
  const token = options.token || createToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function main() {
  console.log('================================================================');
  console.log('  CATEGORY 10: PROCESS RESTART SURVIVAL VERIFICATION');
  console.log('================================================================');

  const pool = new Pool({ connectionString: DATABASE_URL });
  const results = [];

  function record(check, passed, details) {
    results.push({ check, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${check}: ${details}`);
    if (!passed) {
      console.error(`FAILURE DETAILS:`, details);
    }
  }

  try {
    // 1. Fetch latest persisted patient, encounter, consultation, prescription, lab order from DB
    const latestPatient = await pool.query('SELECT id, first_name, last_name, mrn FROM clinical.patients ORDER BY created_at DESC LIMIT 1');
    const latestEncounter = await pool.query('SELECT id, encounter_number, status FROM clinical.encounters ORDER BY created_at DESC LIMIT 1');
    const latestConsultation = await pool.query('SELECT id, consultation_status FROM clinical.consultations ORDER BY created_at DESC LIMIT 1');
    const latestPrescription = await pool.query('SELECT id, prescription_number FROM clinical.pharmacy_prescriptions ORDER BY created_at DESC LIMIT 1');
    const latestLabOrder = await pool.query('SELECT id, order_number, status FROM clinical.investigation_orders ORDER BY created_at DESC LIMIT 1');
    const latestBreakGlass = await pool.query('SELECT id, revoked_at FROM company.break_glass_access ORDER BY triggered_at DESC LIMIT 1');

    record('EXISTING_PATIENT_IN_DB', latestPatient.rows.length === 1, `Found ${latestPatient.rows[0]?.first_name} (ID: ${latestPatient.rows[0]?.id})`);
    record('EXISTING_ENCOUNTER_IN_DB', latestEncounter.rows.length === 1, `Found ${latestEncounter.rows[0]?.encounter_number} (ID: ${latestEncounter.rows[0]?.id})`);
    record('EXISTING_CONSULTATION_IN_DB', latestConsultation.rows.length === 1, `Found status ${latestConsultation.rows[0]?.consultation_status} (ID: ${latestConsultation.rows[0]?.id})`);
    record('EXISTING_PRESCRIPTION_IN_DB', latestPrescription.rows.length === 1, `Found ${latestPrescription.rows[0]?.prescription_number} (ID: ${latestPrescription.rows[0]?.id})`);
    record('EXISTING_LAB_ORDER_IN_DB', latestLabOrder.rows.length === 1, `Found status ${latestLabOrder.rows[0]?.status} (ID: ${latestLabOrder.rows[0]?.id})`);
    record('EXISTING_BREAK_GLASS_IN_DB', latestBreakGlass.rows.length === 1, `Found break-glass (ID: ${latestBreakGlass.rows[0]?.id})`);

    const patientId = latestPatient.rows[0]?.id;
    const encounterId = latestEncounter.rows[0]?.id;
    const labOrderId = latestLabOrder.rows[0]?.id;

    // 2. Query freshly started API server
    console.log('\n--- VERIFYING API HYDRATION FROM POSTGRESQL POST-RESTART ---');
    const apiPat = await api(`/api/v1/partner/patients/${patientId}`);
    record(
      'SURVIVED_RESTART_PATIENT_API',
      apiPat.status === 200 && apiPat.body?.data?.id === patientId,
      `API returned HTTP 200: ${apiPat.body?.data?.firstName} ${apiPat.body?.data?.lastName}`
    );

    const apiEnc = await api(`/api/v1/partner/encounters/${encounterId}`);
    record(
      'SURVIVED_RESTART_ENCOUNTER_API',
      apiEnc.status === 200 && apiEnc.body?.data?.id === encounterId,
      `API returned HTTP 200: encounter ${apiEnc.body?.data?.encounterNumber} status=${apiEnc.body?.data?.status}`
    );

    const apiHistory = await api(`/api/v1/partner/patients/${patientId}/history`);
    record(
      'SURVIVED_RESTART_PATIENT_HISTORY_API',
      apiHistory.status === 200 && Array.isArray(apiHistory.body?.data?.encounters),
      `API returned longitudinal history with ${apiHistory.body?.data?.encounters?.length || 0} encounters and ${apiHistory.body?.data?.prescriptions?.length || 0} prescriptions`
    );

    const apiLab = await api(`/api/v1/partner/lab/orders/${labOrderId}`);
    record(
      'SURVIVED_RESTART_LAB_ORDER_API',
      apiLab.status === 200 && apiLab.body?.data?.id === labOrderId,
      `API returned HTTP 200: lab order ${apiLab.body?.data?.orderNumber} status=${apiLab.body?.data?.status}`
    );

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`\nTOTAL POST-RESTART CHECKS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);

    if (passedCount === totalCount) {
      console.log('🎉 100% DATA PERSISTENCE SURVIVED PROCESS RESTART & PROCESS DEATH!');
    } else {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('VERIFICATION CRASHED:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
