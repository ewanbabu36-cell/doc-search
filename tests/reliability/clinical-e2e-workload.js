process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { realAuthService } from '../../apps/api-gateway/dist/services/core/RealAuthService.js';
import { setTestTransactionRunner } from '../../packages/database/dist/index.js';

console.log('\n======================================================================');
console.log('🏥 TEST SUITE 3 — REALISTIC 10-ROLE CLINICAL WORKLOAD SIMULATOR');
console.log('======================================================================\n');

async function runClinicalWorkload() {
  // Phase 1: Database Outage Resilience Check (Zero Silent Fallback)
  console.log('[+] Phase 1: Database Outage Resilience Check (Asserting Controlled 503, Zero RAM Fallback)...');
  setTestTransactionRunner(null); // Live/unmocked path with no DB running
  const appOutage = await buildApp();
  await appOutage.ready();

  const doctorAuth = await realAuthService.authenticateUser('doctor.rajesh@docsearch.health', 'DoctorPass123!');
  const adminAuth = await realAuthService.authenticateUser('admin.singhal@docsearch.health', 'AdminPass123!');

  const docLoginRes = await appOutage.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'doctor.rajesh@docsearch.health', password: 'DoctorPass123!' }
  });
  const docToken = JSON.parse(docLoginRes.payload).data?.accessToken;
  const docHeaders = {
    authorization: `Bearer ${docToken}`,
    'x-tenant-id': doctorAuth.tenantId,
    'x-branch-id': doctorAuth.branchId
  };

  const outageRes = await appOutage.inject({
    method: 'POST',
    url: '/api/v1/partner/patients',
    headers: docHeaders,
    payload: {
      firstName: 'Outage',
      lastName: 'Test',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      mobileNumber: '+919999999999'
    }
  });

  const outage503Verified = outageRes.statusCode === 503;
  console.log(`    ➔ Database Outage Response: HTTP ${outageRes.statusCode} (${outage503Verified ? 'PASS: Controlled 503 Service Unavailable' : 'FAIL'})`);
  await appOutage.close();

  if (!outage503Verified) {
    console.error('CRITICAL: Outage did not return 503 Service Unavailable!');
    process.exit(1);
  }

  // Phase 2: Active Database Clinical Workflow Simulation (10-Role Lifecycle)
  console.log('\n[+] Phase 2: Active Transaction Clinical Workflow (10-Role Lifecycle Execution)...');
  const mockStore = new Map();
  const mockTableStore = new Map();
  const getTableName = (tbl) => {
    if (!tbl) return 'default';
    if (typeof tbl === 'string') return tbl;
    if (tbl[Symbol.for('drizzle:Name')]) return tbl[Symbol.for('drizzle:Name')];
    if (tbl[Symbol.for('drizzle:OriginalName')]) return tbl[Symbol.for('drizzle:OriginalName')];
    if (tbl._?.name) return tbl._.name;
    for (const s of Object.getOwnPropertySymbols(tbl)) {
      if (s.description && s.description.includes('Name')) return tbl[s];
    }
    return tbl.name || 'default';
  };
  const getTableRecords = (tbl) => {
    const name = getTableName(tbl);
    if (!mockTableStore.has(name)) mockTableStore.set(name, new Map());
    return mockTableStore.get(name);
  };
  const createSelectChain = (tbl = null) => {
    const list = tbl ? Array.from(getTableRecords(tbl).values()) : Array.from(mockStore.values());
    const p = Promise.resolve(list);
    p.from = (table) => createSelectChain(table);
    p.where = () => p;
    p.limit = () => p;
    return p;
  };
  const mockTx = {
    execute: async () => [],
    insert: (table) => ({
      values: (data) => {
        const id = data.id || `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockStore.set(id, record);
        getTableRecords(table).set(id, record);
        const p = Promise.resolve([record]);
        p.returning = async () => [record];
        return p;
      }
    }),
    update: (table) => ({
      set: (data) => {
        const handler = () => [{ id: 'updated', ...data, updatedAt: new Date() }];
        const res = {
          where: () => {
            const p = Promise.resolve(handler());
            p.returning = async () => handler();
            return p;
          },
          returning: async () => handler()
        };
        return res;
      }
    }),
    select: () => createSelectChain()
  };

  setTestTransactionRunner(async (context, cb) => {
    return await cb(mockTx);
  });

  const app = await buildApp();
  await app.ready();

  const adminLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'admin.singhal@docsearch.health', password: 'AdminPass123!' }
  });
  const adminToken = JSON.parse(adminLoginRes.payload).data?.accessToken;
  const adminHeaders = {
    authorization: `Bearer ${adminToken}`,
    'x-tenant-id': adminAuth.tenantId
  };

  const workflowSteps = [];
  const startWorkflow = performance.now();

  // Step 1: Receptionist - Patient Registration
  const t1 = performance.now();
  const patientRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/patients',
    headers: docHeaders,
    payload: {
      firstName: 'Ramesh',
      lastName: 'Sharma',
      gender: 'MALE',
      dateOfBirth: '1985-04-12',
      mobileNumber: '+919876543210',
      bloodGroup: 'B_POSITIVE'
    }
  });
  const patientData = JSON.parse(patientRes.payload);
  const patientId = patientData.data?.id || `PAT-SIM-${Date.now()}`;
  workflowSteps.push({
    step: '1. Receptionist: Patient Registration',
    statusCode: patientRes.statusCode,
    durationMs: (performance.now() - t1).toFixed(2),
    entityId: patientId,
    status: patientRes.statusCode >= 200 && patientRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: patientRes.statusCode === 201 ? 'Patient MRN generated' : `HTTP ${patientRes.statusCode}`
  });

  // Step 2: Receptionist - OPD Encounter & Queue Token Generation
  const t2 = performance.now();
  const encounterRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/encounters',
    headers: docHeaders,
    payload: {
      patientId,
      doctorId: doctorAuth.id,
      encounterType: 'OPD',
      visitType: 'FIRST_VISIT',
      chiefComplaint: 'Acute chest discomfort and breathlessness'
    }
  });
  const encData = JSON.parse(encounterRes.payload);
  const encounterId = encData.data?.id || `ENC-SIM-${Date.now()}`;
  workflowSteps.push({
    step: '2. Receptionist: OPD Encounter & Token Queue',
    statusCode: encounterRes.statusCode,
    durationMs: (performance.now() - t2).toFixed(2),
    entityId: encounterId,
    status: encounterRes.statusCode >= 200 && encounterRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: encounterRes.statusCode === 201 ? 'Queue token issued' : `HTTP ${encounterRes.statusCode}`
  });

  // Step 3: Triage Nurse - Vitals Capture & Nursing Assessment
  const t3 = performance.now();
  const vitalsRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/consultations',
    headers: docHeaders,
    payload: {
      encounterId,
      patientId,
      doctorId: doctorAuth.id,
      status: 'TRIAGE_COMPLETED',
      vitals: {
        systolicBp: 145,
        diastolicBp: 92,
        heartRateBpm: 98,
        temperatureFahrenheit: 99.2,
        respiratoryRateBpm: 22,
        spO2Percentage: 96
      }
    }
  });
  workflowSteps.push({
    step: '3. Nurse: Vitals & Triage Assessment',
    statusCode: vitalsRes.statusCode,
    durationMs: (performance.now() - t3).toFixed(2),
    entityId: encounterId,
    status: vitalsRes.statusCode >= 200 && vitalsRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: vitalsRes.statusCode === 201 ? 'Vitals stored in EMR' : `HTTP ${vitalsRes.statusCode}`
  });

  // Step 4: Consulting Doctor - Clinical Examination & e-Prescription
  const t4 = performance.now();
  const consultRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/consultations',
    headers: docHeaders,
    payload: {
      encounterId,
      patientId,
      doctorId: doctorAuth.id,
      chiefComplaint: 'Acute chest discomfort',
      historyOfPresentIllness: 'Duration 2 days, aggravated on physical exertion',
      examinationNotes: 'S1/S2 heard, bilateral air entry equal, mild basal crepitations',
      assessmentNotes: 'ICD-10 I20.9: Angina pectoris, unspecified. Elevated arterial BP.',
      planNotes: 'Start anti-ischemic therapy, ECG, Troponin-I, Lipid Panel',
      status: 'DOCTOR_SIGNED'
    }
  });
  workflowSteps.push({
    step: '4. Doctor: SOAP Note, ICD-10 & e-Prescription',
    statusCode: consultRes.statusCode,
    durationMs: (performance.now() - t4).toFixed(2),
    entityId: encounterId,
    status: consultRes.statusCode >= 200 && consultRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: consultRes.statusCode === 201 ? 'Consultation signed' : `HTTP ${consultRes.statusCode}`
  });

  // Step 5: Laboratory Technician - Blood Sample Accession & Test Order
  const t5 = performance.now();
  const labRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/lab/orders',
    headers: docHeaders,
    payload: {
      encounterId,
      patientId,
      tests: ['SERUM_TROPONIN_I', 'LIPID_PROFILE_FASTING', 'COMPLETE_BLOOD_COUNT'],
      priority: 'STAT_URGENT',
      fastingStatus: true
    }
  });
  const labData = JSON.parse(labRes.payload);
  const labOrderId = labData.data?.id || `LAB-${Date.now()}`;
  workflowSteps.push({
    step: '5. Lab Tech: Sample Accession & STAT Order',
    statusCode: labRes.statusCode,
    durationMs: (performance.now() - t5).toFixed(2),
    entityId: labOrderId,
    status: labRes.statusCode >= 200 && labRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: labRes.statusCode === 201 ? 'STAT order created' : `HTTP ${labRes.statusCode}`
  });

  // Step 6: Pathologist - Result Validation & Critical Alert (PATCH verify)
  const t6 = performance.now();
  const resultRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/partner/lab/orders/${labOrderId}/results`,
    headers: docHeaders,
    payload: {
      results: [
        { testCode: 'TROP_I', value: 0.08, unit: 'ng/mL', flag: 'CRITICAL_HIGH', refRange: '< 0.04' },
        { testCode: 'CHOLESTEROL', value: 245, unit: 'mg/dL', flag: 'HIGH', refRange: '< 200' }
      ],
      validatorDoctorId: doctorAuth.id,
      validationStatus: 'PATHOLOGIST_VERIFIED'
    }
  });
  workflowSteps.push({
      step: '6. Pathologist: Critical Validation & Sign-off',
      statusCode: resultRes.statusCode,
      durationMs: (performance.now() - t6).toFixed(2),
      entityId: labOrderId,
      status: resultRes.statusCode >= 200 && resultRes.statusCode < 400 ? 'PASS' : 'FAIL',
      details: resultRes.statusCode === 200 || resultRes.statusCode === 201 ? 'Pathologist verified' : `HTTP ${resultRes.statusCode}`
    });

  // Step 7: Pharmacist - FEFO Stock Deduction & Dispensation
  const t7 = performance.now();
  const pharmRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/pharmacy/dispense',
    headers: docHeaders,
    payload: {
      encounterId,
      patientId,
      items: [
        { drugCode: 'SORBITRATE_5MG', quantity: 10, batchId: 'BATCH-2026-08', dosage: '1 tab sublingual SOS' },
        { drugCode: 'ATORVASTATIN_40MG', quantity: 30, batchId: 'BATCH-2027-01', dosage: '1 tab bedtime' }
      ]
    }
  });
  workflowSteps.push({
    step: '7. Pharmacist: FEFO Stock Reservation & Dispense',
    statusCode: pharmRes.statusCode,
    durationMs: (performance.now() - t7).toFixed(2),
    entityId: `DISP-${Date.now()}`,
    status: pharmRes.statusCode >= 200 && pharmRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: pharmRes.statusCode === 200 || pharmRes.statusCode === 201 ? 'Dispensed' : `HTTP ${pharmRes.statusCode}`
  });

  // Step 8: Billing Officer - GST Calculation & Final Tax Invoice
  const t8 = performance.now();
  const billRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/invoices',
    headers: docHeaders,
    payload: {
      encounterId,
      patientId,
      lineItems: [
        { description: 'Cardiology Specialist Consultation', sacCode: '999312', amount: 1200, gstRate: 0 },
        { description: 'STAT Cardiac Biomarker Panel (Troponin-I)', sacCode: '999312', amount: 1800, gstRate: 0 },
        { description: 'Pharmacy Prescription Medication Bundle', sacCode: '998313', amount: 950, gstRate: 12 }
      ],
      paymentMode: 'RAZORPAY_UPI',
      tpaClaimNumber: 'TPA-STAR-847291'
    }
  });
  workflowSteps.push({
    step: '8. Billing: GST SAC & Settlement Invoice',
    statusCode: billRes.statusCode,
    durationMs: (performance.now() - t8).toFixed(2),
    entityId: `INV-${Date.now()}`,
    status: billRes.statusCode >= 200 && billRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: billRes.statusCode === 200 || billRes.statusCode === 201 ? 'Invoice generated' : `HTTP ${billRes.statusCode}`
  });

  // Step 9: Company Admin - Dynamic Pricing & Multi-Branch Allocation
  const t9 = performance.now();
  const pricingRes = await app.inject({
    method: 'POST',
    url: '/api/v1/workflow/pricing/calculate',
    headers: adminHeaders,
    payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12, doctorSeats: 40, branches: 3 }
  });
  workflowSteps.push({
    step: '9. Company Admin: Dynamic Pricing & Multi-Branch P&L',
    statusCode: pricingRes.statusCode,
    durationMs: (performance.now() - t9).toFixed(2),
    entityId: 'HOSPITAL_ENTERPRISE',
    status: pricingRes.statusCode >= 200 && pricingRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: pricingRes.statusCode === 200 ? 'P&L calculated' : `HTTP ${pricingRes.statusCode}`
  });

  // Step 10: Partner Admin - Health & Integration Diagnostics
  const t10 = performance.now();
  const auditRes = await app.inject({
    method: 'GET',
    url: '/health',
    headers: adminHeaders
  });
  workflowSteps.push({
    step: '10. Partner Admin: Gateway Health & Diagnostics',
    statusCode: auditRes.statusCode,
    durationMs: (performance.now() - t10).toFixed(2),
    entityId: 'HEALTH_CHECK',
    status: auditRes.statusCode >= 200 && auditRes.statusCode < 400 ? 'PASS' : 'FAIL',
    details: auditRes.statusCode === 200 ? 'Healthy' : `HTTP ${auditRes.statusCode}`
  });

  const totalWorkflowTimeMs = performance.now() - startWorkflow;

  console.log('\n----------------------------------------------------------------------');
  console.log('📊 REALISTIC 10-ROLE CLINICAL WORKFLOW STEP EXECUTION TABLE');
  console.log('----------------------------------------------------------------------');
  console.table(workflowSteps);

  const passedSteps = workflowSteps.filter((s) => s.status === 'PASS').length;
  console.log(`\nOverall Workflow Result: ${passedSteps}/10 Steps Executed in ${totalWorkflowTimeMs.toFixed(2)}ms`);

  const mem = process.memoryUsage();
  console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log('======================================================================\n');

  await app.close();

  if (passedSteps !== 10) {
    process.exit(1);
  }
}

runClinicalWorkload().catch((err) => {
  console.error('Fatal clinical workload error:', err);
  process.exit(1);
});
