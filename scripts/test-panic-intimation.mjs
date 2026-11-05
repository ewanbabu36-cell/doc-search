import pg from 'pg';
import { signJwt } from '../packages/auth/dist/index.js';

const API_BASE = 'http://127.0.0.1:4000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const MASTER_SECRET = 'supersecret-docsearch-jwt-key-2026-production-grade';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const PARTNER_A = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
const ORG_A = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
const BRANCH_A = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';
const DOCTOR_ID = 'dcce4591-eda7-475e-b927-e8303ff6b9d7';

const token = signJwt({
  sub: DOCTOR_ID,
  email: 'pathologist@docsearch.health',
  tenantId: TENANT_A,
  partnerId: PARTNER_A,
  organizationId: ORG_A,
  facilityId: BRANCH_A,
  branchId: BRANCH_A,
  roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN', 'LAB_TECH', 'PATHOLOGIST'],
  permissions: ['*']
}, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 });

const client = new pg.Client({ connectionString: DB_URL });

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, body: json };
}

async function main() {
  await client.connect();
  console.log('--- PB-02 NABL CRITICAL LAB PANIC INTIMATION & PERSISTENCE AUDIT ---');

  const suffix = Date.now().toString().slice(-6);

  // 1. Create Patient
  const patRes = await api('/api/v1/partner/patients', {
    method: 'POST',
    body: {
      firstName: `Panic_${suffix}`,
      lastName: 'Verma',
      gender: 'MALE',
      dateOfBirth: '1980-08-20',
      mobileNumber: `+9198${Date.now().toString().slice(-8)}`,
      bloodGroup: 'O_POSITIVE'
    }
  });
  const patientId = patRes.body?.data?.id;
  console.log(`1. Patient created: ${patientId} (Status: ${patRes.status})`);

  // 2. Create Encounter
  const encRes = await api('/api/v1/partner/encounters', {
    method: 'POST',
    body: {
      patientId,
      doctorId: DOCTOR_ID,
      encounterType: 'EMERGENCY',
      status: 'TRIAGED',
      chiefComplaint: 'Acute cardiac arrhythmia with hyperkalemia symptoms'
    }
  });
  const encounterId = encRes.body?.data?.id;
  console.log(`2. Encounter created: ${encounterId} (Status: ${encRes.status})`);

  // 3. Create Consultation
  const consultRes = await api('/api/v1/partner/consultations', {
    method: 'POST',
    body: {
      encounterId,
      patientId,
      doctorId: DOCTOR_ID,
      status: 'IN_PROGRESS',
      chiefComplaint: 'Suspected severe hyperkalemia',
      clinicalNotes: 'ECG demonstrates peaked T waves. STAT serum electrolytes ordered.',
      vitals: { systolicBp: 140, diastolicBp: 90, pulseBpm: 110, spo2Percent: 96 }
    }
  });
  const consultationId = consultRes.body?.data?.id;
  console.log(`3. Consultation created: ${consultationId} (Status: ${consultRes.status})`);

  // 4. Create STAT Lab Order
  const labRes = await api('/api/v1/partner/lab/orders', {
    method: 'POST',
    body: {
      patientId,
      patientName: `Panic_${suffix} Verma`,
      patientGender: 'MALE',
      encounterId,
      consultationId,
      orderingDoctorId: DOCTOR_ID,
      orderingDoctorName: 'Dr. Vivek Sharma (Cardiologist)',
      testCode: 'ELECTRO-01',
      testName: 'Serum Electrolytes (Potassium/Sodium)',
      category: 'BIOCHEMISTRY',
      priority: 'STAT',
      clinicalIndication: 'ECG Peaked T Waves - Rule out hyperkalemia cardiac arrest',
      instructions: 'STAT urgent processing'
    }
  });
  const labOrderId = labRes.body?.data?.id;
  console.log(`4. STAT Lab Order created: ${labOrderId} (Status: ${labRes.status})`);

  // 5. Collect Specimen
  const specRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/collect-sample`, {
    method: 'POST',
    body: {
      specimenType: 'WHOLE_BLOOD',
      containerType: 'Green Top Heparin Vacutainer',
      collectedBy: 'Phleb Ritu'
    }
  });
  console.log(`5. Specimen collected (Status: ${specRes.status})`);

  // 6. Enter Critical Panic Result (Potassium: 7.2 mEq/L, Critical Max: 6.2)
  const resultRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/enter-results`, {
    method: 'POST',
    body: {
      parameterName: 'Serum Potassium',
      resultValue: '7.2',
      unit: 'mEq/L',
      referenceRange: '3.5 - 5.1',
      abnormalFlag: 'CRITICAL_HIGH',
      notes: 'Severe hyperkalemia confirmed on duplicate analyzer run'
    }
  });
  console.log(`6. Critical Panic Result entered: 7.2 mEq/L (Status: ${resultRes.status})`);

  // 7. Log Verbal Panic Intimation per NABL ISO-15189
  const intimationRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/panic-intimation`, {
    method: 'POST',
    body: {
      doctorName: 'Dr. Vivek Sharma (Cardiologist)',
      doctorPhone: '+91 98112 34567',
      callerStaffName: 'Sunita Mehra (Senior Pathologist)',
      readBackConfirmed: true,
      criticalParameters: ['Serum Potassium: 7.2 mEq/L (Critical High > 6.2)'],
      notes: 'Verbal telephone intimation per NABL ISO-15189 clause 5.8.2. Clinician verbally repeated back patient name, MRN, and potassium value word-for-word.'
    }
  });
  console.log(`7. NABL Verbal Panic Intimation Logged (Status: ${intimationRes.status}):`, intimationRes.body);

  // 8. Direct PostgreSQL Database Verification
  const dbOrder = await client.query('SELECT * FROM clinical.investigation_orders WHERE id = $1', [labOrderId]);
  const orderRow = dbOrder.rows[0];
  const meta = orderRow?.metadata || {};

  console.log('\n--- POSTGRESQL DATABASE PERSISTENCE VERIFICATION ---');
  console.log(`- Order Number: ${orderRow?.order_number}`);
  console.log(`- is_critical flag: ${orderRow?.is_critical} (Expected: true)`);
  console.log(`- metadata.isPanicIntimated: ${meta?.isPanicIntimated} (Expected: true)`);
  console.log(`- metadata.panicIntimation.status: ${meta?.panicIntimation?.status} (Expected: VERBAL_READBACK_CONFIRMED)`);
  console.log(`- metadata.panicIntimation.doctorName: ${meta?.panicIntimation?.doctorName}`);

  // Audit trace verification
  const auditRes = await client.query(`
    SELECT * FROM core.audit_events 
    WHERE resource_id = $1 AND event_type = 'CRITICAL_PANIC_INTIMATED'
  `, [labOrderId]);
  console.log(`- Immutable Audit Event in core.audit_events: ${auditRes.rowCount > 0 ? 'FOUND' : 'MISSING'}`);

  await client.end();

  const passAll = (
    intimationRes.status === 200 &&
    orderRow?.is_critical === true &&
    meta?.isPanicIntimated === true &&
    meta?.panicIntimation?.status === 'VERBAL_READBACK_CONFIRMED' &&
    auditRes.rowCount > 0
  );

  if (passAll) {
    console.log('\n🏆 PB-02 NABL CRITICAL LAB PANIC INTIMATION PERSISTENCE AUDIT PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ PB-02 NABL PANIC INTIMATION AUDIT FAILED!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in panic test:', err);
  process.exit(1);
});
