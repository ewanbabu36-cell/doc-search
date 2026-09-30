import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  getDatabase,
  TEST_SEEDS,
  partnerProfiles,
  subscriptions,
  licenses,
  pharmacyPrescriptions,
  pharmacyDispensing,
  investigationCatalog,
  investigationOrders,
  radiologyOrders,
  eq
} from '@docsearch/database';

describe('Phase 10 — Hospital Operations: Admission -> Bed -> Care -> Orders -> Departments -> Billing -> Discharge', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  // Tenant A: Apollo Hospital Network
  const TENANT_A = TEST_SEEDS.TENANT_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;
  const DOCTOR_A_ID = TEST_SEEDS.DOCTOR_ID;
  const NURSE_A_ID = '66666666-6666-4666-8666-666666666666';

  // Tenant B: Hospital B (for cross-tenant tests)
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const BRANCH_B = TEST_SEEDS.FACILITY_ID_B;
  const DOCTOR_B_ID = '88888888-8888-4888-8888-888888888802';

  function createToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_A_ID,
      email: overrides.email || 'doctor.apollo@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      partnerType: overrides.partnerType || 'HOSPITAL',
      facilityType: overrides.facilityType || 'HOSPITAL',
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN', 'NURSE'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'clinical:orders:create',
        'clinical:orders:read',
        'billing:invoices:create',
        'billing:invoices:read'
      ],
      accessibleFeatures: ['INPATIENT_IPD', 'INPATIENT_ADT', 'CLINICAL_EMR', 'BILLING', 'PATIENTS'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  // Shared test entity IDs
  let testPatientId;
  let testIcuWardId;
  let testGenWardId;
  let testIcuBedId;
  let testGenBedId;
  let testAdmissionId;
  let testEncounterId;
  let testRoundId;
  let testVitalId;
  let testTransferId;
  let testInvoiceId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    const db = getDatabase();

    // 1. Configure Tenant A as HOSPITAL partner profile with active license
    await db
      .update(partnerProfiles)
      .set({
        partnerType: 'HOSPITAL',
        metadata: { partnerType: 'HOSPITAL', facilityType: 'HOSPITAL' }
      })
      .where(eq(partnerProfiles.tenantId, TENANT_A));

    // 2. Configure Tenant B as HOSPITAL partner profile for multi-tenant isolation tests
    await db
      .update(partnerProfiles)
      .set({
        partnerType: 'HOSPITAL',
        metadata: { partnerType: 'HOSPITAL', facilityType: 'HOSPITAL' }
      })
      .where(eq(partnerProfiles.tenantId, TENANT_B));

    await db
      .update(subscriptions)
      .set({ planId: TEST_SEEDS.PLAN_PRO_ID })
      .where(eq(subscriptions.partnerId, TEST_SEEDS.PARTNER_ID_B));

    const licenseSecret =
      process.env['LICENSE_HMAC_SECRET'] ||
      process.env['JWT_SECRET'] ||
      MASTER_SECRET;
    const sigB = crypto
      .createHmac('sha256', licenseSecret)
      .update(`LIC-CARE-STARTER-001:${TEST_SEEDS.PARTNER_ID_B}:${TENANT_B}:${TEST_SEEDS.SUBSCRIPTION_ID_B}:${TEST_SEEDS.PLAN_PRO_ID}`)
      .digest('hex');

    await db
      .update(licenses)
      .set({ planId: TEST_SEEDS.PLAN_PRO_ID, signature: sigB })
      .where(eq(licenses.tenantId, TENANT_B));

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // SETUP: REGISTER INPATIENT
  // =========================================================================
  it('SETUP: Register active patient for hospital admission', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Rajendra',
        lastName: 'Prasad',
        gender: 'MALE',
        dateOfBirth: '1970-08-25',
        mobileNumber: '+91-9876112233',
        bloodGroup: 'O_POSITIVE'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    testPatientId = body.data.id;
  });

  // =========================================================================
  // STEP 1: WARD & BED PROVISIONING (ICU vs GENERAL WARD WITH DAILY RATES)
  // =========================================================================
  it('STEP 1: Provision ICU and General Wards with daily rates and bed classes', async () => {
    const token = createToken();

    // 1. Create ICU Ward
    const icuWardRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/wards',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardCode: 'WARD-ICU-01',
        name: 'Critical Care ICU Ward',
        wardType: 'ICU',
        capacity: 10
      }
    });
    assert.strictEqual(icuWardRes.statusCode, 201);
    testIcuWardId = JSON.parse(icuWardRes.body).data.id;

    // 2. Create General Ward
    const genWardRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/wards',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardCode: 'WARD-GEN-01',
        name: 'General Medical Ward',
        wardType: 'GENERAL_WARD',
        capacity: 30
      }
    });
    assert.strictEqual(genWardRes.statusCode, 201);
    testGenWardId = JSON.parse(genWardRes.body).data.id;

    // 3. Create ICU Bed with high rate (₹5000/day)
    const icuBedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardId: testIcuWardId,
        bedNumber: 'ICU-BED-01',
        bedType: 'ICU_CRITICAL',
        bedClass: 'ICU',
        dailyChargeRate: 5000.00
      }
    });
    assert.strictEqual(icuBedRes.statusCode, 201);
    const icuBedData = JSON.parse(icuBedRes.body).data;
    testIcuBedId = icuBedData.id;
    assert.strictEqual(icuBedData.status, 'AVAILABLE');
    assert.strictEqual(icuBedData.dailyChargeRate, 5000.00);

    // 4. Create General Bed with standard rate (₹1500/day)
    const genBedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardId: testGenWardId,
        bedNumber: 'GEN-BED-01',
        bedType: 'STANDARD_ELECTRIC',
        bedClass: 'GENERAL',
        dailyChargeRate: 1500.00
      }
    });
    assert.strictEqual(genBedRes.statusCode, 201);
    const genBedData = JSON.parse(genBedRes.body).data;
    testGenBedId = genBedData.id;
    assert.strictEqual(genBedData.status, 'AVAILABLE');
    assert.strictEqual(genBedData.dailyChargeRate, 1500.00);

    // 5. Query Beds and verify rates & classes
    const bedsQueryRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(bedsQueryRes.statusCode, 200);
    const allBeds = JSON.parse(bedsQueryRes.body).data;
    const foundIcu = allBeds.find(b => b.id === testIcuBedId);
    assert.ok(foundIcu);
    assert.strictEqual(foundIcu.bedClass, 'ICU');
    assert.strictEqual(foundIcu.dailyChargeRate, 5000.00);
  });

  // =========================================================================
  // STEP 2: INPATIENT ADMISSION (ADT) & BED OCCUPANCY
  // =========================================================================
  it('STEP 2: Admit patient into ICU Bed and verify admission number & bed status', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/admissions',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        doctorId: DOCTOR_A_ID,
        bedId: testIcuBedId,
        department: 'CARDIOLOGY_ICU',
        admissionReason: 'Acute Coronary Syndrome - Unstable Angina',
        encounterType: 'IPD'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.match(body.data.admissionNumber, /^ADM-\d+$/);
    assert.strictEqual(body.data.status, 'ADMITTED');
    assert.strictEqual(body.data.bedId, testIcuBedId);

    testAdmissionId = body.data.id;
    testEncounterId = body.data.encounterId;

    // Verify Bed is now OCCUPIED
    const bedCheck = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` },
      query: { status: 'OCCUPIED' }
    });
    assert.strictEqual(bedCheck.statusCode, 200);
    const occupied = JSON.parse(bedCheck.body).data;
    const found = occupied.find(b => b.id === testIcuBedId);
    assert.ok(found);
    assert.strictEqual(found.status, 'OCCUPIED');
    assert.strictEqual(found.currentPatientId, testPatientId);
  });

  // =========================================================================
  // STEP 3: PREVENT CONFLICT / DOUBLE-BOOKING ON OCCUPIED BED
  // =========================================================================
  it('STEP 3: Attempting to admit another patient into OCCUPIED bed is rejected with 409 Conflict', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/admissions',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        doctorId: DOCTOR_A_ID,
        bedId: testIcuBedId, // Already occupied
        department: 'CARDIOLOGY_ICU',
        admissionReason: 'Conflict Test'
      }
    });

    assert.strictEqual(res.statusCode, 409);
    const body = JSON.parse(res.body);
    assert.match(body.error.message, /not available/i);
  });

  // =========================================================================
  // STEP 4: CLINICAL INPATIENT CARE — DOCTOR DAILY ROUNDS
  // =========================================================================
  it('STEP 4: Record Doctor Daily Round with clinical assessment & discharge readiness score', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/rounds',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        admissionId: testAdmissionId,
        patientId: testPatientId,
        doctorName: 'Dr. Ramesh Gupta, MD (Cardiology)',
        doctorSpecialty: 'Cardiology',
        roundType: 'MORNING_PRIMARY_ROUND',
        subjectiveAssessment: 'Patient resting comfortably. Chest discomfort subsided after sublingual nitrates.',
        objectiveClinicalFindings: 'S1, S2 heard. No murmur. Bilateral clear air entry. BP 124/80 mmHg, HR 76 regular.',
        clinicalImpression: 'Acute Coronary Syndrome stabilized. Troponin levels trending downward.',
        treatmentPlanUpdates: 'Continue dual antiplatelet therapy and statins. Plan step-down transfer to General Medical Ward.',
        orderedInvestigationsSummary: 'Repeat Troponin-T STAT, 12-lead ECG, Lipid Profile',
        medicationAdjustments: 'Aspirin 75mg OD, Clopidogrel 75mg OD, Atorvastatin 40mg HS',
        dischargeReadinessScore: 45
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.admissionId, testAdmissionId);
    assert.strictEqual(body.data.dischargeReadinessScore, 45);
    testRoundId = body.data.id;

    // Query Rounds
    const roundsListRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/rounds',
      headers: { Authorization: `Bearer ${token}` },
      query: { admissionId: testAdmissionId }
    });
    assert.strictEqual(roundsListRes.statusCode, 200);
    const rounds = JSON.parse(roundsListRes.body).data;
    assert.strictEqual(rounds.length, 1);
    assert.strictEqual(rounds[0].doctorName, 'Dr. Ramesh Gupta, MD (Cardiology)');
  });

  // =========================================================================
  // STEP 5: NURSING CARE — STRUCTURED VITALS OBSERVATIONS & PROGRESS NOTES
  // =========================================================================
  it('STEP 5: Record structured nursing vitals observations and shift progress notes', async () => {
    const token = createToken();

    // 1. Structured Vitals
    const vitalsRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/vitals',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        admissionId: testAdmissionId,
        patientId: testPatientId,
        recordedBy: 'Nurse Priya Sharma, RN',
        temperatureCelsius: 37.0,
        pulseBpm: 76,
        respiratoryRateBpm: 16,
        systolicBpMmHg: 124,
        diastolicBpMmHg: 80,
        spo2Percentage: 99,
        bloodGlucoseMgDl: 110.0,
        painScaleScore: 1,
        isAbnormal: false,
        notes: 'Patient alert and oriented x 3. Vital signs stable within normal limits.'
      }
    });
    assert.strictEqual(vitalsRes.statusCode, 201);
    const vitalsData = JSON.parse(vitalsRes.body).data;
    assert.ok(vitalsData.id);
    assert.strictEqual(vitalsData.pulseBpm, 76);
    assert.strictEqual(vitalsData.spo2Percentage, 99);
    testVitalId = vitalsData.id;

    // 2. Query Vitals
    const vitalsQuery = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/vitals',
      headers: { Authorization: `Bearer ${token}` },
      query: { admissionId: testAdmissionId }
    });
    assert.strictEqual(vitalsQuery.statusCode, 200);
    const vitalsList = JSON.parse(vitalsQuery.body).data;
    assert.strictEqual(vitalsList.length, 1);
    assert.strictEqual(vitalsList[0].systolicBpMmHg, 124);

    // 3. Nursing Care Note
    const noteRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/nursing-notes',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        admissionId: testAdmissionId,
        patientId: testPatientId,
        notes: 'Morning medications administered. IV cannula site clean without phlebitis. Patient educated on low-sodium cardiac diet.',
        careObservations: 'Patient ambulating with assistance. Voiding spontaneously.'
      }
    });
    assert.strictEqual(noteRes.statusCode, 201);
  });

  // =========================================================================
  // STEP 6: BED STEP-DOWN TRANSFER (ICU -> GENERAL WARD)
  // =========================================================================
  it('STEP 6: Transfer patient from ICU to General Ward, verify bed status transitions and transfer audit', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/transfers',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        admissionId: testAdmissionId,
        patientId: testPatientId,
        sourceBedId: testIcuBedId,
        destinationBedId: testGenBedId,
        transferReason: 'Clinical condition stabilized. Stepping down from ICU to General Ward for continuing medical observation.'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.sourceBedId, testIcuBedId);
    assert.strictEqual(body.data.destinationBedId, testGenBedId);
    testTransferId = body.data.id;

    // Verify Bed Statuses:
    // 1. Old ICU Bed should now be AVAILABLE
    const beds = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    const bedList = JSON.parse(beds.body).data;
    const oldIcu = bedList.find(b => b.id === testIcuBedId);
    const newGen = bedList.find(b => b.id === testGenBedId);

    assert.strictEqual(oldIcu.status, 'AVAILABLE');
    assert.strictEqual(newGen.status, 'OCCUPIED');
    assert.strictEqual(newGen.currentPatientId, testPatientId);

    // 2. Admission should now point to new Bed
    const admRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/admissions',
      headers: { Authorization: `Bearer ${token}` },
      query: { patientId: testPatientId }
    });
    const adms = JSON.parse(admRes.body).data;
    assert.strictEqual(adms[0].bedId, testGenBedId);
  });

  // =========================================================================
  // STEP 7: DEPARTMENT ORDERS INTEGRATION (PHARMACY, LAB, RADIOLOGY)
  // =========================================================================
  it('STEP 7: Cross-department orders (Pathology LIMS, Radiology RIS, Pharmacy Dispense) link to IPD encounter', async () => {
    const db = getDatabase();
    const now = new Date();

    // 1. Seed Inpatient Prescription
    const rxId = crypto.randomUUID();
    await db.insert(pharmacyPrescriptions).values({
      id: rxId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A,
      patientId: testPatientId,
      encounterId: testEncounterId,
      prescribingDoctorId: DOCTOR_A_ID,
      prescriptionNumber: `RX-IPD-${Math.floor(100000 + Math.random() * 900000)}`,
      prescribingDoctorName: 'Dr. Ramesh Gupta',
      prescriptionStatus: 'ACTIVE',
      prescribedAt: now
    });

    // 2. Seed Inpatient Pharmacy Bedside Dispense
    await db.insert(pharmacyDispensing).values({
      id: crypto.randomUUID(),
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A,
      prescriptionId: rxId,
      patientId: testPatientId,
      dispensingNumber: `DISP-${Math.floor(100000 + Math.random() * 900000)}`,
      pharmacistId: DOCTOR_A_ID,
      pharmacistName: 'Hospital Pharmacist',
      dispensingStatus: 'DISPENSED',
      dispensingMode: 'BEDSIDE_IPD',
      dispensedAt: now,
      metadata: {
        totalAmount: 472.50,
        netAmount: 472.50
      }
    });

    // 2. Seed Inpatient Pathology Order
    const labCatId = crypto.randomUUID();
    await db.insert(investigationCatalog).values({
      id: labCatId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A,
      testCode: 'CBC-IPD',
      testName: 'Complete Blood Count (IPD Routine)',
      category: 'HEMATOLOGY',
      department: 'Pathology',
      specimenType: 'WHOLE_BLOOD',
      status: 'ACTIVE'
    });

    await db.insert(investigationOrders).values({
      id: crypto.randomUUID(),
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A,
      patientId: testPatientId,
      encounterId: testEncounterId,
      orderNumber: `LAB-${Math.floor(100000 + Math.random() * 900000)}`,
      orderingDoctorId: DOCTOR_A_ID,
      investigationId: labCatId,
      priority: 'ROUTINE',
      clinicalIndication: 'IPD Routine Blood Work',
      specimenType: 'WHOLE_BLOOD',
      status: 'COMPLETED',
      metadata: {
        totalAmount: 850.00,
        netAmount: 850.00
      },
      createdAt: now
    });

    // 3. Seed Inpatient Radiology Order (Chest X-Ray)
    await db.insert(radiologyOrders).values({
      id: crypto.randomUUID(),
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A,
      orderNumber: `RAD-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: testPatientId,
      patientName: 'Rajendra Prasad',
      patientMrn: 'MRN-IPD-001',
      encounterId: testEncounterId,
      orderingDoctorName: 'Dr. Ramesh Gupta',
      orderingDepartment: 'CARDIOLOGY_ICU',
      procedureId: 'PROC-CXR-001',
      procedureName: 'Chest X-Ray PA View',
      modalityType: 'XRAY',
      priority: 'ROUTINE_ELECTIVE',
      clinicalIndication: 'Pre-procedure chest evaluation',
      status: 'REPORTED',
      metadata: {
        totalAmount: 1200.00,
        netAmount: 1200.00
      },
      orderedAt: now
    });

    assert.ok(true, 'Cross-department IPD orders successfully placed');
  });

  // =========================================================================
  // STEP 8: INTERIM IPD BILLING SUMMARY / HOSPITAL LEDGER
  // =========================================================================
  it('STEP 8: Query Interim IPD Billing Summary auto-aggregating bed days, rounds, nursing, pharmacy, lab, radiology', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/billing-summary`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    const ledger = body.data;

    assert.strictEqual(ledger.admissionId, testAdmissionId);
    assert.ok(ledger.totalDays >= 1);

    // Bed charges (at least ₹1500)
    assert.ok(ledger.bedCharges.totalBedAmount >= 1500);
    assert.ok(ledger.bedCharges.bedsOccupied.length >= 1);

    // Doctor rounds charges (1 round @ ₹500 = ₹500)
    assert.strictEqual(ledger.doctorRoundsCharges.count, 1);
    assert.strictEqual(ledger.doctorRoundsCharges.totalRoundsAmount, 500.00);

    // Nursing care charges (1 day @ ₹300 = ₹300)
    assert.strictEqual(ledger.nursingCareCharges.days, ledger.totalDays);
    assert.strictEqual(ledger.nursingCareCharges.totalNursingAmount, ledger.totalDays * 300);

    // Department charges aggregated
    assert.ok(ledger.pharmacyCharges.totalPharmacyAmount > 0);
    assert.ok(ledger.labCharges.totalLabAmount > 0);
    assert.ok(ledger.radiologyCharges.totalRadiologyAmount > 0);

    // Total computation
    assert.ok(ledger.subtotalAmount > 0);
    assert.ok(ledger.taxAmount > 0);
    assert.ok(ledger.totalPayableAmount > ledger.subtotalAmount);
  });

  // =========================================================================
  // STEP 9: CONSOLIDATED IPD INVOICE GENERATION
  // =========================================================================
  it('STEP 9: POST /inpatient/admissions/:id/generate-bill generates consolidated IPD invoice with itemized line items', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/generate-bill`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.invoice);
    assert.ok(body.data.items);
    assert.ok(body.data.summary);

    const invoice = body.data.invoice;
    testInvoiceId = invoice.id;
    assert.match(invoice.invoiceNumber, /^INV-IPD-\d+$/);
    assert.strictEqual(invoice.invoiceType, 'IPD');
    assert.strictEqual(invoice.status, 'ISSUED');
    assert.ok(Number(invoice.totalAmount) > 0);

    // Verify itemized breakdown in items
    const items = body.data.items;
    const itemCodes = items.map(i => i.serviceCode);
    assert.ok(itemCodes.includes('IPD_BED'), 'Invoice contains IPD_BED charges');
    assert.ok(itemCodes.includes('IPD_NURSING'), 'Invoice contains IPD_NURSING charges');
    assert.ok(itemCodes.includes('IPD_ROUNDS'), 'Invoice contains IPD_ROUNDS charges');
    assert.ok(itemCodes.includes('IPD_PHARMACY'), 'Invoice contains IPD_PHARMACY charges');
    assert.ok(itemCodes.includes('IPD_LAB'), 'Invoice contains IPD_LAB charges');
    assert.ok(itemCodes.includes('IPD_RADIOLOGY'), 'Invoice contains IPD_RADIOLOGY charges');
  });

  // =========================================================================
  // STEP 10: PATIENT DISCHARGE & STRUCTURED DISCHARGE SUMMARY
  // =========================================================================
  it('STEP 10: Finalize patient discharge, release General Bed, and retrieve structured discharge summary', async () => {
    const token = createToken();

    // 1. Discharge Patient
    const dischRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/discharge`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        dischargeReason: 'Ischemic Heart Disease - Acute Coronary Syndrome (Resolved)',
        dischargeCondition: 'Patient stable, ambulant, vitals within normal limits. Hemodynamically stable.',
        finalClinicalNotes: 'Course in hospital uneventful following medical stabilization. Serial ECGs stable. Cardiac enzymes normal.'
      }
    });

    assert.strictEqual(dischRes.statusCode, 200);
    const dischData = JSON.parse(dischRes.body).data;
    assert.strictEqual(dischData.status, 'DISCHARGED');
    assert.ok(dischData.dischargedAt);

    // 2. Verify General Bed is now AVAILABLE
    const bedCheck = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    const allBeds = JSON.parse(bedCheck.body).data;
    const releasedBed = allBeds.find(b => b.id === testGenBedId);
    assert.strictEqual(releasedBed.status, 'AVAILABLE');
    assert.strictEqual(releasedBed.currentPatientId, null);

    // 3. Retrieve Structured Discharge Summary Document
    const summaryRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/discharge-summary`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(summaryRes.statusCode, 200);
    const summaryData = JSON.parse(summaryRes.body).data;
    assert.ok(summaryData.id);
    assert.match(summaryData.summaryNumber, /^DIS-\d+$/);
    assert.strictEqual(summaryData.admissionId, testAdmissionId);
    assert.strictEqual(summaryData.patientId, testPatientId);
    assert.strictEqual(summaryData.finalPrimaryDiagnosis, 'Ischemic Heart Disease - Acute Coronary Syndrome (Resolved)');
    assert.strictEqual(summaryData.isFinalized, true);
    assert.ok(summaryData.dischargeMedicationAdvice);
    assert.ok(summaryData.warningSignsToSeekImmediateCare);
  });

  // =========================================================================
  // STEP 11: FAIL-CLOSED MULTI-TENANT & SCOPEGUARD ISOLATION
  // =========================================================================
  it('STEP 11: Tenant B (Hospital B) cannot access Tenant A admissions, rounds, vitals, bills, or discharge summaries', async () => {
    const tokenTenantB = createToken({
      userId: DOCTOR_B_ID,
      tenantId: TENANT_B,
      branchId: BRANCH_B,
      partnerType: 'HOSPITAL',
      facilityType: 'HOSPITAL'
    });

    // 1. Tenant B querying Tenant A's Patient Inpatient History -> Returns 0 records
    const histRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/inpatient-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(histRes.statusCode, 200);
    assert.strictEqual(JSON.parse(histRes.body).data.length, 0);

    // 2. Tenant B querying Doctor Rounds for Tenant A admission -> Returns 0 records
    const roundsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/rounds',
      headers: { Authorization: `Bearer ${tokenTenantB}` },
      query: { admissionId: testAdmissionId }
    });
    assert.strictEqual(roundsRes.statusCode, 200);
    assert.strictEqual(JSON.parse(roundsRes.body).data.length, 0);

    // 3. Tenant B querying Vitals for Tenant A admission -> Returns 0 records
    const vitalsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/vitals',
      headers: { Authorization: `Bearer ${tokenTenantB}` },
      query: { admissionId: testAdmissionId }
    });
    assert.strictEqual(vitalsRes.statusCode, 200);
    assert.strictEqual(JSON.parse(vitalsRes.body).data.length, 0);

    // 4. Tenant B requesting Discharge Summary for Tenant A admission -> 404 Not Found
    const dischRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/discharge-summary`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(dischRes.statusCode, 404);

    // 5. Tenant B requesting Billing Summary for Tenant A admission -> 404 Not Found
    const billSumRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/billing-summary`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(billSumRes.statusCode, 404);

    // 6. Tenant B attempting to generate bill for Tenant A admission -> 404 Not Found
    const genBillRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/generate-bill`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(genBillRes.statusCode, 404);
  });
});
