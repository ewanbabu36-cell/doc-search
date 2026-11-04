import { Pool } from 'pg';
import crypto from 'node:crypto';
import { signJwt } from '../packages/auth/dist/index.js';

const API_BASE = 'http://127.0.0.1:4000';
const DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const MASTER_SECRET = 'supersecret-docsearch-jwt-key-2026-production-grade';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

// Provisioned Partner & Facility in Native PostgreSQL
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const PARTNER_A = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
const ORG_A = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
const BRANCH_A = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';
const DOCTOR_ID = 'dcce4591-eda7-475e-b927-e8303ff6b9d7';

const TENANT_B = '22222222-2222-4222-8222-222222222222';
const PARTNER_B = '22222222-2222-4222-8222-222222222222';

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
      'clinical:patients:update',
      'clinical:encounters',
      'clinical:encounters:create',
      'clinical:encounters:read',
      'clinical:encounters:update',
      'clinical:consultations',
      'clinical:consultations:create',
      'clinical:consultations:read',
      'clinical:consultations:update',
      'clinical:prescriptions',
      'clinical:prescriptions:create',
      'clinical:prescriptions:read',
      'clinical:history:read',
      'clinical:radiology',
      'clinical:radiology:create',
      'clinical:radiology:read',
      'clinical:radiology:update',
      'lab:orders',
      'lab:orders:create',
      'lab:orders:read',
      'lab:specimens',
      'lab:specimens:create',
      'lab:specimens:update',
      'lab:results',
      'lab:results:create',
      'lab:results:update',
      'lab:results:validate',
      'security:break_glass:manage',
      'partners:manage',
      'partners:update'
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
  console.log('  CATEGORY 10: DATA PERSISTENCE COMPLETE LIFECYCLE VERIFICATION');
  console.log('================================================================');
  console.log(`Target API: ${API_BASE}`);
  console.log(`Database:   ${DATABASE_URL}`);

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
    // 0. Verify Native Postgres Connection
    const dbCheck = await pool.query('SELECT current_database(), version()');
    record(
      'POSTGRES_LIVE_CONNECTION',
      dbCheck.rows.length > 0,
      `Connected to ${dbCheck.rows[0].current_database} on port 5432`
    );

    const testRunSuffix = Date.now().toString().slice(-6);
    const testMobile = `+9198${Date.now().toString().slice(-8)}`;

    // 1. OPD Flow: Patient Registration
    console.log('\n--- 1. OPD CLINICAL WORKFLOW PERSISTENCE ---');
    const patPayload = {
      firstName: `Ramesh_${testRunSuffix}`,
      lastName: 'Gupta',
      gender: 'MALE',
      dateOfBirth: '1978-05-14',
      mobileNumber: testMobile,
      bloodGroup: 'B_POSITIVE'
    };
    const patRes = await api('/api/v1/partner/patients', { method: 'POST', body: patPayload });
    const patientId = patRes.body?.data?.id;
    record(
      'PATIENT_CREATE_API',
      patRes.status === 201 && !!patientId,
      `HTTP ${patRes.status}, patientId=${patientId}`
    );

    // Direct DB Verification
    const patDb = await pool.query('SELECT * FROM clinical.patients WHERE id = $1', [patientId]);
    record(
      'PATIENT_POSTGRES_PERSISTENCE',
      patDb.rows.length === 1 && patDb.rows[0].first_name === `Ramesh_${testRunSuffix}`,
      `DB row found in clinical.patients: ${patDb.rows[0]?.first_name} ${patDb.rows[0]?.last_name} (MRN: ${patDb.rows[0]?.mrn})`
    );

    // API Re-Fetch
    const patRefetch = await api(`/api/v1/partner/patients/${patientId}`);
    record(
      'PATIENT_REFETCH_API',
      patRefetch.status === 200 && patRefetch.body?.data?.firstName === `Ramesh_${testRunSuffix}`,
      `Re-fetched patient from API: ${patRefetch.body?.data?.firstName}`
    );

    // 2. Encounter Check-in
    const encPayload = {
      patientId,
      doctorId: DOCTOR_ID,
      encounterType: 'WALK_IN',
      status: 'WAITING',
      chiefComplaint: 'Severe abdominal pain and fever'
    };
    const encRes = await api('/api/v1/partner/encounters', { method: 'POST', body: encPayload });
    const encounterId = encRes.body?.data?.id;
    record(
      'ENCOUNTER_CREATE_API',
      (encRes.status === 201 || encRes.status === 200) && !!encounterId,
      `HTTP ${encRes.status}, encounterId=${encounterId}`
    );

    const encDb = await pool.query('SELECT * FROM clinical.encounters WHERE id = $1', [encounterId]);
    record(
      'ENCOUNTER_POSTGRES_PERSISTENCE',
      encDb.rows.length === 1,
      `DB row found in clinical.encounters: status=${encDb.rows[0]?.status}, encounterNumber=${encDb.rows[0]?.encounter_number}`
    );

    // 3. Consultation + Vitals
    const consultPayload = {
      encounterId,
      patientId,
      doctorId: DOCTOR_ID,
      status: 'IN_PROGRESS',
      chiefComplaint: 'Severe abdominal pain and fever',
      clinicalNotes: 'Abdomen tender on palpation in right lower quadrant.',
      vitals: {
        systolicBp: 130,
        diastolicBp: 86,
        pulseBpm: 92,
        tempF: 101.4,
        spo2Percent: 98,
        bloodSugarMgDl: 110,
        bmi: 24.2
      },
      diagnoses: [
        { code: 'K35.80', name: 'Acute appendicitis', isPrimary: true }
      ]
    };
    const consultRes = await api('/api/v1/partner/consultations', { method: 'POST', body: consultPayload });
    const consultationId = consultRes.body?.data?.id;
    record(
      'CONSULTATION_SAVE_API',
      (consultRes.status === 201 || consultRes.status === 200) && !!consultationId,
      `HTTP ${consultRes.status}, consultationId=${consultationId}`
    );

    const consultDb = await pool.query('SELECT * FROM clinical.consultations WHERE id = $1', [consultationId]);
    record(
      'CONSULTATION_POSTGRES_PERSISTENCE',
      consultDb.rows.length === 1 && consultDb.rows[0].consultation_status === 'IN_PROGRESS',
      `DB row found in clinical.consultations: consultation_status=${consultDb.rows[0]?.consultation_status}`
    );

    // Finalize Consultation (State Transition)
    const finalizeRes = await api(`/api/v1/partner/consultations/${consultationId}/finalize`, { method: 'PATCH' });
    record(
      'CONSULTATION_FINALIZE_API',
      finalizeRes.status === 200 && finalizeRes.body?.data?.consultationStatus === 'FINALIZED',
      `HTTP ${finalizeRes.status}, status=${finalizeRes.body?.data?.consultationStatus}`
    );

    const consultFinalDb = await pool.query('SELECT consultation_status FROM clinical.consultations WHERE id = $1', [consultationId]);
    record(
      'CONSULTATION_FINALIZED_POSTGRES_PERSISTENCE',
      consultFinalDb.rows[0]?.consultation_status === 'FINALIZED',
      `DB row consultation_status=${consultFinalDb.rows[0]?.consultation_status}`
    );

    // 4. Prescription Generation
    const rxPayload = {
      consultationId,
      patientId,
      encounterId,
      items: [
        {
          medicationName: 'Amoxicillin + Clavulanic Acid 625mg',
          dosage: '625 mg',
          frequency: '1-0-1',
          duration: 5,
          instructions: 'Take after meals'
        },
        {
          medicationName: 'Paracetamol 650mg',
          dosage: '650 mg',
          frequency: '1-0-1-0',
          duration: 3,
          instructions: 'SOS for fever'
        }
      ]
    };
    const rxRes = await api('/api/v1/partner/prescriptions', { method: 'POST', body: rxPayload });
    const prescriptionId = rxRes.body?.data?.id;
    record(
      'PRESCRIPTION_CREATE_API',
      (rxRes.status === 201 || rxRes.status === 200) && !!prescriptionId,
      `HTTP ${rxRes.status}, prescriptionId=${prescriptionId}`
    );

    const rxDb = await pool.query('SELECT * FROM clinical.pharmacy_prescriptions WHERE id = $1', [prescriptionId]);
    record(
      'PRESCRIPTION_POSTGRES_PERSISTENCE',
      rxDb.rows.length === 1,
      `DB row found in clinical.pharmacy_prescriptions: prescription_number=${rxDb.rows[0]?.prescription_number}`
    );

    // Longitudinal History Re-Fetch
    const historyRes = await api(`/api/v1/partner/patients/${patientId}/history`);
    record(
      'PATIENT_LONGITUDINAL_HISTORY_API',
      historyRes.status === 200,
      `Longitudinal history retrieved (HTTP ${historyRes.status})`
    );

    // 5. Lab Diagnostics / Pathology Workflow
    console.log('\n--- 2. LAB DIAGNOSTICS WORKFLOW PERSISTENCE ---');
    const labOrderPayload = {
      patientId,
      patientName: `Ramesh_${testRunSuffix} Gupta`,
      patientGender: 'MALE',
      encounterId,
      consultationId,
      orderingDoctorId: DOCTOR_ID,
      orderingDoctorName: 'Dr. Rajesh Sharma, MD',
      testCode: 'CBC-001',
      testName: 'Complete Blood Count (CBC)',
      category: 'HEMATOLOGY',
      priority: 'URGENT',
      clinicalIndication: 'Rule out acute appendicitis leukocytosis',
      instructions: 'Fasting not required'
    };
    const labRes = await api('/api/v1/partner/lab/orders', { method: 'POST', body: labOrderPayload });
    const labOrderId = labRes.body?.data?.id;
    record(
      'LAB_ORDER_CREATE_API',
      (labRes.status === 201 || labRes.status === 200) && !!labOrderId,
      `HTTP ${labRes.status}, labOrderId=${labOrderId}`
    );

    const labDb = await pool.query('SELECT * FROM clinical.investigation_orders WHERE id = $1', [labOrderId]);
    record(
      'LAB_ORDER_POSTGRES_PERSISTENCE',
      labDb.rows.length === 1 && labDb.rows[0].status === 'ORDERED',
      `DB row found in clinical.investigation_orders: status=${labDb.rows[0]?.status}`
    );

    // Collect Specimen
    const specimenPayload = {
      specimenType: 'WHOLE_BLOOD',
      containerType: 'Purple Top Vacutainer',
      collectedBy: 'Phleb Sunita'
    };
    const specRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/collect-sample`, {
      method: 'POST',
      body: specimenPayload
    });
    record(
      'LAB_SPECIMEN_COLLECT_API',
      specRes.status === 200 || specRes.status === 201,
      `HTTP ${specRes.status}, status=${specRes.body?.data?.status || 'SAMPLE_COLLECTED'}`
    );

    const labSpecDb = await pool.query('SELECT status FROM clinical.investigation_orders WHERE id = $1', [labOrderId]);
    record(
      'LAB_SPECIMEN_POSTGRES_PERSISTENCE',
      labSpecDb.rows[0]?.status === 'SAMPLE_COLLECTED',
      `DB row status=${labSpecDb.rows[0]?.status}`
    );

    // Enter Result
    const resultPayload = {
      results: [
        { parameterCode: 'WBC', parameterName: 'WBC Count', resultValue: '14.2', unit: '10^3/uL', referenceRange: '4.0 - 11.0' },
        { parameterCode: 'HGB', parameterName: 'Hemoglobin', resultValue: '14.5', unit: 'g/dL', referenceRange: '13.0 - 17.0' },
        { parameterCode: 'PLT', parameterName: 'Platelets', resultValue: '250', unit: '10^3/uL', referenceRange: '150 - 450' }
      ]
    };
    const resultRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/results`, {
      method: 'POST',
      body: resultPayload
    });
    record(
      'LAB_RESULT_ENTER_API',
      resultRes.status === 200 || resultRes.status === 201,
      `HTTP ${resultRes.status}, status=${resultRes.body?.data?.status || 'RESULT_ENTERED'}`
    );

    const labResDb = await pool.query('SELECT status FROM clinical.investigation_orders WHERE id = $1', [labOrderId]);
    record(
      'LAB_RESULT_POSTGRES_PERSISTENCE',
      labResDb.rows[0]?.status === 'RESULT_ENTERED',
      `DB row status=${labResDb.rows[0]?.status}`
    );

    // Verify Result (Pathologist Signoff)
    const verifyRes = await api(`/api/v1/partner/lab/orders/${labOrderId}/verify`, {
      method: 'PATCH',
      body: { verifiedBy: DOCTOR_ID }
    });
    record(
      'LAB_RESULT_VERIFY_API',
      verifyRes.status === 200 || verifyRes.status === 201,
      `HTTP ${verifyRes.status}, status=${verifyRes.body?.data?.status || 'VERIFIED'}`
    );

    const labVerDb = await pool.query('SELECT status FROM clinical.investigation_orders WHERE id = $1', [labOrderId]);
    record(
      'LAB_VERIFIED_POSTGRES_PERSISTENCE',
      labVerDb.rows[0]?.status === 'VERIFIED',
      `DB row status=${labVerDb.rows[0]?.status}`
    );

    // Re-Fetch Lab Order
    const labRefetch = await api(`/api/v1/partner/lab/orders/${labOrderId}`);
    record(
      'LAB_ORDER_REFETCH_API',
      labRefetch.status === 200 && labRefetch.body?.data?.id === labOrderId,
      `HTTP 200, status=${labRefetch.body?.data?.status}`
    );

    // 6. Break-Glass Governance Persistence
    console.log('\n--- 3. BREAK-GLASS & SECURITY GOVERNANCE PERSISTENCE ---');
    const bgPayload = {
      patientId,
      reason: 'Emergency acute trauma triage requiring immediate unredacted records',
      expiresInSeconds: 3600
    };
    const bgRes = await api('/api/v1/partner/security/break-glass', { method: 'POST', body: bgPayload });
    const bgId = bgRes.body?.data?.id;
    record(
      'BREAK_GLASS_GRANT_API',
      bgRes.status === 201 && !!bgId,
      `HTTP ${bgRes.status}, breakGlassId=${bgId}`
    );

    // Direct DB Verification in company.break_glass_access
    const bgDb = await pool.query('SELECT * FROM company.break_glass_access WHERE id = $1', [bgId]);
    record(
      'BREAK_GLASS_POSTGRES_PERSISTENCE',
      bgDb.rows.length === 1 && bgDb.rows[0].revoked_at === null,
      `DB row found in company.break_glass_access: revoked_at=${bgDb.rows[0]?.revoked_at}, reason=${bgDb.rows[0]?.reason}`
    );

    // Expire Break-Glass
    const bgExpRes = await api(`/api/v1/partner/security/break-glass/${bgId}/expire`, { method: 'POST' });
    record(
      'BREAK_GLASS_EXPIRE_API',
      bgExpRes.status === 200 && bgExpRes.body?.data?.expired === true,
      `HTTP ${bgExpRes.status}, expired=${bgExpRes.body?.data?.expired}`
    );

    const bgExpDb = await pool.query('SELECT revoked_at FROM company.break_glass_access WHERE id = $1', [bgId]);
    record(
      'BREAK_GLASS_EXPIRED_POSTGRES_PERSISTENCE',
      bgExpDb.rows.length === 1 && bgExpDb.rows[0].revoked_at !== null,
      `DB row revoked_at=${bgExpDb.rows[0]?.revoked_at ? new Date(bgExpDb.rows[0].revoked_at).toISOString() : 'NULL'}`
    );

    // 7. Cross-Tenant Isolation (Anti-Persistence Leakage)
    console.log('\n--- 4. CROSS-TENANT ISOLATION (ZERO LEAKAGE) ---');
    const tenantBToken = createToken({
      userId: '00000000-0000-4000-8000-000000000202',
      email: 'doctor@tenantb.health',
      tenantId: TENANT_B,
      partnerId: PARTNER_B,
      organizationId: '00000000-0000-4000-8000-000000000002',
      facilityId: '00000000-0000-4000-8000-000000000022',
      branchId: '00000000-0000-4000-8000-000000000022'
    });

    const tenantBPermDenied = await api(`/api/v1/partner/patients/${patientId}`, { token: tenantBToken });
    record(
      'CROSS_TENANT_PATIENT_ISOLATION',
      tenantBPermDenied.status === 404 || tenantBPermDenied.status === 403,
      `Tenant B cannot view Tenant A patient: HTTP ${tenantBPermDenied.status}`
    );

    const tenantBLabDenied = await api(`/api/v1/partner/lab/orders/${labOrderId}`, { token: tenantBToken });
    record(
      'CROSS_TENANT_LAB_ISOLATION',
      tenantBLabDenied.status === 404 || tenantBLabDenied.status === 403,
      `Tenant B cannot view Tenant A lab order: HTTP ${tenantBLabDenied.status}`
    );

    // 8. Independent Second Session Verification
    console.log('\n--- 5. INDEPENDENT SECOND SESSION VERIFICATION ---');
    const session2Token = createToken({
      userId: '00000000-0000-4000-8000-000000000102',
      email: 'second.station@11111111.partner.local',
      tenantId: TENANT_A,
      partnerId: PARTNER_A
    });

    const session2Patient = await api(`/api/v1/partner/patients/${patientId}`, { token: session2Token });
    record(
      'SECOND_SESSION_PATIENT_FETCH',
      session2Patient.status === 200 && session2Patient.body?.data?.id === patientId,
      `Second independent terminal retrieved patient: ${session2Patient.body?.data?.firstName}`
    );

    const session2Encounter = await api(`/api/v1/partner/encounters/${encounterId}`, { token: session2Token });
    record(
      'SECOND_SESSION_ENCOUNTER_FETCH',
      session2Encounter.status === 200 && session2Encounter.body?.data?.id === encounterId,
      `Second independent terminal retrieved encounter: status=${session2Encounter.body?.data?.status}`
    );

    const session2Lab = await api(`/api/v1/partner/lab/orders/${labOrderId}`, { token: session2Token });
    record(
      'SECOND_SESSION_LAB_ORDER_FETCH',
      session2Lab.status === 200 && session2Lab.body?.data?.id === labOrderId,
      `Second independent terminal retrieved lab order: status=${session2Lab.body?.data?.status}`
    );

    // 9. Summary & Verification Matrix
    console.log('\n================================================================');
    console.log('  CATEGORY 10: VERIFICATION SUMMARY');
    console.log('================================================================');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`TOTAL CHECKS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);

    if (passedCount === totalCount) {
      console.log('\n🎉 ALL PERSISTENCE CHECKS PASSED WITH 100% POSTGRESQL INTEGRITY!');
    } else {
      console.error('\n⚠️ SOME PERSISTENCE CHECKS FAILED. INVESTIGATION REQUIRED.');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('LIFECYCLE RUNNER CRASHED:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
