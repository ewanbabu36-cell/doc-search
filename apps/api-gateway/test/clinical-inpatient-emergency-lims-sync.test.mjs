import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:4000';

async function api(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

describe('Clinical, Inpatient, Emergency & LIMS Multi-Department Live Persistence Suite', () => {
  let adminToken;
  let doctorToken;
  let tenantId;
  let partnerId;
  let branchId;
  let testPatientId;
  let testEncounterId;
  let testConsultationId;
  let testWardId;
  let testBedId1;
  let testBedId2;
  let testAdmissionId;
  let testEmergencyEncounterId;
  let testLabOrderId;

  before(async () => {
    // 1. Acquire Admin Token
    const adminAuth = await api('/api/v1/auth/quick-session', {
      method: 'POST',
      body: JSON.stringify({
        email: 'founder@docsearch.health',
        role: 'SUPER_ADMIN',
        permissions: ['*']
      })
    });
    assert(adminAuth.ok, `Admin Auth failed: ${JSON.stringify(adminAuth.body)}`);
    adminToken = adminAuth.body.data.accessToken;

    // 2. Onboard Partner Facility
    const suffix = Date.now().toString().slice(-4);
    const doctorEmail = `dr.persistence.${suffix}@docsearch.test`;
    const partnerRes = await api('/api/v1/company/partners', {
      method: 'POST',
      body: JSON.stringify({
        legalName: `Apex Super Specialty Hospital ${suffix} Ltd`,
        tradeName: `Apex Hospital Delhi ${suffix}`,
        partnerType: 'HOSPITAL_NETWORK',
        primaryContactName: 'Dr. Alok Verma',
        primaryContactEmail: doctorEmail,
        primaryContactPhone: '011-23456789',
        primaryContactRole: 'Medical Director',
        planCode: 'PLAN_HOSP_FREE_YR1',
        billingCycle: 'ANNUAL',
        isTrial: false,
        initialFacilityName: 'Apex Central Block'
      })
    }, adminToken);
    assert(partnerRes.ok, `Partner onboarding failed: ${JSON.stringify(partnerRes.body)}`);
    const pData = partnerRes.body.data;
    tenantId = pData.tenantId;
    partnerId = pData.id || pData.partner.id;
    branchId = pData.branchId || pData.facilityId;

    // 3. Acquire Doctor Token for Onboarded Facility
    const docAuth = await api('/api/v1/auth/quick-session', {
      method: 'POST',
      body: JSON.stringify({
        email: doctorEmail,
        role: 'DOCTOR',
        roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'PATHOLOGIST'],
        tenantId,
        partnerId,
        branchId,
        permissions: ['*']
      })
    });
    assert(docAuth.ok, `Doctor auth failed: ${JSON.stringify(docAuth.body)}`);
    doctorToken = docAuth.body.data.accessToken;
  });

  it('STAGE 1: Register Patient and Create OPD Encounter in Database', async () => {
    // 1. Register Patient
    const patRes = await api('/api/v1/partner/patients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Suresh',
        lastName: 'Menon',
        gender: 'MALE',
        dateOfBirth: '1982-07-15',
        mobileNumber: '+91 98450 11223',
        bloodGroup: 'O+',
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(patRes.ok, `Patient registration failed: ${JSON.stringify(patRes.body)}`);
    assert.equal(patRes.status, 201);
    testPatientId = patRes.body.data.id;
    assert.ok(testPatientId);

    // 2. Create Encounter
    const encRes = await api('/api/v1/partner/encounters', {
      method: 'POST',
      body: JSON.stringify({
        patientId: testPatientId,
        encounterType: 'OPD',
        status: 'CHECKED_IN',
        chiefComplaint: 'Chest tightness, low-grade fever and mild dyspnea on exertion',
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(encRes.ok, `Encounter creation failed: ${JSON.stringify(encRes.body)}`);
    assert.equal(encRes.status, 201);
    testEncounterId = encRes.body.data.id;
    assert.ok(testEncounterId);
  });

  it('STAGE 2: Clinical Consultation - Save, Query by ID, Encounter, Search & Overview in DB', async () => {
    // 1. Save Consultation (POST)
    const consRes = await api('/api/v1/partner/consultations', {
      method: 'POST',
      body: JSON.stringify({
        encounterId: testEncounterId,
        patientId: testPatientId,
        status: 'IN_PROGRESS',
        chiefComplaint: 'Chest tightness and evening fever for 4 days',
        historyOfPresentIllness: 'Gradual onset, productive cough with yellow sputum',
        pastMedicalHistory: 'Non-smoker, mild hypertension',
        examinationNotes: 'BP 130/84, HR 88, Temp 99.8F, Rhonchi in right lower zone',
        assessmentNotes: 'Acute Bronchitis with secondary bacterial infection',
        planNotes: 'Antibiotic therapy, bronchodilator nebulization, order CBC',
        diagnoses: [
          {
            code: 'J20.9',
            description: 'Acute bronchitis, unspecified',
            isPrimary: true,
            type: 'PRIMARY'
          }
        ],
        medications: [
          {
            medicationName: 'Cefuroxime Axetil 500mg',
            genericName: 'Cefuroxime',
            dosage: '1 tab',
            frequency: 'BID',
            duration: 5,
            instructions: 'Take after meals'
          }
        ],
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(consRes.ok, `Consultation creation failed: ${JSON.stringify(consRes.body)}`);
    assert.equal(consRes.status, 201);
    testConsultationId = consRes.body.data.id;
    assert.ok(testConsultationId);

    // 2. Query Consultation by ID (GET)
    const getRes = await api(`/api/v1/partner/consultations/${testConsultationId}`, {}, doctorToken);
    assert(getRes.ok, `Get consultation failed: ${JSON.stringify(getRes.body)}`);
    assert.equal(getRes.body.data.id, testConsultationId);
    assert.equal(getRes.body.data.patientId, testPatientId);
    assert.equal(getRes.body.data.diagnoses.length, 1);
    assert.equal(getRes.body.data.medications.length, 1);

    // 3. Query Consultation by Encounter (GET)
    const encRes = await api(`/api/v1/partner/consultations/encounter/${testEncounterId}`, {}, doctorToken);
    assert(encRes.ok, `Get consultation by encounter failed: ${JSON.stringify(encRes.body)}`);
    assert.equal(encRes.body.data.id, testConsultationId);

    // 4. Search Consultations (GET)
    const searchRes = await api(`/api/v1/partner/consultations?patientId=${testPatientId}`, {}, doctorToken);
    assert(searchRes.ok, `Search consultations failed: ${JSON.stringify(searchRes.body)}`);
    assert.ok(Array.isArray(searchRes.body.data));
    assert.ok(searchRes.body.data.some(c => c.id === testConsultationId));

    // 5. Consultation Overview Metrics (GET)
    const overviewRes = await api('/api/v1/partner/consultations/overview', {}, doctorToken);
    assert(overviewRes.ok, `Overview failed: ${JSON.stringify(overviewRes.body)}`);
    assert.ok(overviewRes.body.data.totalConsultationsCount >= 1);

    // 6. Finalize Consultation (PATCH)
    const finRes = await api(`/api/v1/partner/consultations/${testConsultationId}/finalize`, {
      method: 'PATCH'
    }, doctorToken);
    assert(finRes.ok, `Finalize consultation failed: ${JSON.stringify(finRes.body)}`);
    assert.equal(finRes.body.data.status, 'FINALIZED');
  });

  it('STAGE 3: Laboratory LIMS - Order, Collect Sample, Enter Results & Verify', async () => {
    // 1. Create Lab Order
    const orderRes = await api('/api/v1/partner/lab/orders', {
      method: 'POST',
      body: JSON.stringify({
        patientId: testPatientId,
        encounterId: testEncounterId,
        consultationId: testConsultationId,
        testCode: 'LAB-HEM-CBC',
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        priority: 'ROUTINE',
        clinicalIndication: 'Evaluation of pyrexia and leukocytosis',
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(orderRes.ok, `Lab order failed: ${JSON.stringify(orderRes.body)}`);
    assert.equal(orderRes.status, 201);
    testLabOrderId = orderRes.body.data.id;
    assert.ok(testLabOrderId);

    // 2. Collect Specimen
    const collRes = await api(`/api/v1/partner/lab/orders/${testLabOrderId}/collect-sample`, {
      method: 'POST',
      body: JSON.stringify({
        specimenType: 'WHOLE_BLOOD_EDTA',
        containerType: 'LAVENDER_TOP',
        collectionNotes: 'Sample collected from left arm vein'
      })
    }, doctorToken);

    assert(collRes.ok, `Collect sample failed: ${JSON.stringify(collRes.body)}`);
    assert.equal(collRes.body.data.status || collRes.body.data.orderStatus, 'SAMPLE_COLLECTED');

    // 3. Enter Results
    const resRes = await api(`/api/v1/partner/lab/orders/${testLabOrderId}/results`, {
      method: 'POST',
      body: JSON.stringify({
        parameterCode: 'WBC',
        parameterName: 'Total Leukocyte Count',
        resultValue: '11.8',
        numericValue: 11.8,
        unit: '10^3/uL',
        referenceRange: '4.0 - 11.0',
        abnormalFlag: 'HIGH',
        results: [
          {
            parameterCode: 'WBC',
            parameterName: 'Total Leukocyte Count',
            resultValue: '11.8',
            numericValue: 11.8,
            unit: '10^3/uL',
            referenceRange: '4.0 - 11.0',
            abnormalFlag: 'HIGH'
          }
        ]
      })
    }, doctorToken);

    assert(resRes.ok, `Enter results failed: ${JSON.stringify(resRes.body)}`);

    // 4. Verify Results
    const verifyRes = await api(`/api/v1/partner/lab/orders/${testLabOrderId}/results/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        doctorNotes: 'Mild leukocytosis verified by pathologist'
      })
    }, doctorToken);

    assert(verifyRes.ok, `Verify results failed: ${JSON.stringify(verifyRes.body)}`);
    assert.equal(verifyRes.body.data.status || verifyRes.body.data.orderStatus, 'VERIFIED');
  });

  it('STAGE 4: Inpatient IPD - Provision Ward, Bed, Admit Patient, Transfer & Discharge', async () => {
    // 1. Create Ward
    const wardRes = await api('/api/v1/partner/inpatient/wards', {
      method: 'POST',
      body: JSON.stringify({
        wardName: 'Medical Special Care Ward',
        wardCode: 'MSCW-1',
        wardType: 'STEPDOWN',
        floor: '3rd Floor',
        building: 'Main Tower',
        totalBeds: 12,
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(wardRes.ok, `Create ward failed: ${JSON.stringify(wardRes.body)}`);
    assert.equal(wardRes.status, 201);
    testWardId = wardRes.body.data.id;
    assert.ok(testWardId);

    // 2. Create Bed 1
    const bed1Res = await api('/api/v1/partner/inpatient/beds', {
      method: 'POST',
      body: JSON.stringify({
        wardId: testWardId,
        bedNumber: 'MSCW-101',
        bedType: 'ELECTRIC_3_FUNCTION',
        dailyRate: 2000,
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(bed1Res.ok, `Create bed 1 failed: ${JSON.stringify(bed1Res.body)}`);
    testBedId1 = bed1Res.body.data.id;
    assert.ok(testBedId1);

    // 3. Create Bed 2
    const bed2Res = await api('/api/v1/partner/inpatient/beds', {
      method: 'POST',
      body: JSON.stringify({
        wardId: testWardId,
        bedNumber: 'MSCW-102',
        bedType: 'ELECTRIC_5_FUNCTION',
        dailyRate: 3500,
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(bed2Res.ok, `Create bed 2 failed: ${JSON.stringify(bed2Res.body)}`);
    testBedId2 = bed2Res.body.data.id;
    assert.ok(testBedId2);

    // 4. Admit Patient to Bed 1
    const admRes = await api('/api/v1/partner/inpatient/admissions', {
      method: 'POST',
      body: JSON.stringify({
        patientId: testPatientId,
        wardId: testWardId,
        bedId: testBedId1,
        admittingDoctorId: partnerId,
        admissionReason: 'Acute respiratory exacerbation requiring monitored observation',
        admissionType: 'EMERGENCY',
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(admRes.ok, `Admit patient failed: ${JSON.stringify(admRes.body)}`);
    testAdmissionId = admRes.body.data.id;
    assert.ok(testAdmissionId);

    // 5. Transfer Bed to Bed 2
    const trfRes = await api('/api/v1/partner/inpatient/transfers', {
      method: 'POST',
      body: JSON.stringify({
        admissionId: testAdmissionId,
        destinationBedId: testBedId2,
        transferReason: 'Patient transferred to motorized 5-function bed'
      })
    }, doctorToken);

    assert(trfRes.ok, `Transfer bed failed: ${JSON.stringify(trfRes.body)}`);
    assert.equal(trfRes.body.data.destinationBedId, testBedId2);

    // 6. Discharge Patient
    const dcRes = await api(`/api/v1/partner/inpatient/admissions/${testAdmissionId}/discharge`, {
      method: 'POST',
      body: JSON.stringify({
        dischargeReason: 'CLINICALLY_STABLE',
        dischargeCondition: 'Patient stable, vitals within normal parameters',
        finalClinicalNotes: 'Oral antibiotics continued. Follow up after 5 days.'
      })
    }, doctorToken);

    assert(dcRes.ok, `Discharge patient failed: ${JSON.stringify(dcRes.body)}`);
    assert.equal(dcRes.body.data.status, 'DISCHARGED');
  });

  it('STAGE 5: Emergency ED - Register Emergency Patient, Triage, Treatment & Disposition', async () => {
    // 1. Register Emergency Patient
    const emgRes = await api('/api/v1/partner/emergency/registrations', {
      method: 'POST',
      body: JSON.stringify({
        patientId: testPatientId,
        arrivalMode: 'AMBULANCE_BLS',
        broughtBy: 'CAT Ambulance Crew',
        chiefComplaint: 'Acute diaphoresis and dizziness following exertion',
        priority: 'EMERGENCY',
        isTrauma: false,
        isMlc: false,
        partnerId,
        branchId
      })
    }, doctorToken);

    assert(emgRes.ok, `Emergency registration failed: ${JSON.stringify(emgRes.body)}`);
    testEmergencyEncounterId = emgRes.body.data.id;
    assert.ok(testEmergencyEncounterId);

    // 2. Perform Emergency Triage
    const triageRes = await api(`/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/triage`, {
      method: 'POST',
      body: JSON.stringify({
        triageCategory: 'YELLOW_URGENT',
        systolicBp: 110,
        diastolicBp: 70,
        pulseRate: 92,
        respiratoryRate: 20,
        oxygenSaturation: 97,
        glasgowComaScale: 15,
        triageNotes: 'Alert, responsive, mild dehydration'
      })
    }, doctorToken);

    assert(triageRes.ok, `Triage assessment failed: ${JSON.stringify(triageRes.body)}`);

    // 3. Record Treatment & Clinical Orders
    const treatRes = await api(`/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/treatments`, {
      method: 'POST',
      body: JSON.stringify({
        treatmentNotes: 'IV Normal Saline 500ml bolus administered, vitals stabilized',
        medicationsAdministered: [
          { drug: 'Normal Saline 0.9%', dose: '500ml IV' },
          { drug: 'Ondansetron', dose: '4mg IV' }
        ],
        proceduresPerformed: ['IV Cannulation 20G', 'Point of Care Blood Glucose']
      })
    }, doctorToken);

    assert(treatRes.ok, `Record treatment failed: ${JSON.stringify(treatRes.body)}`);

    // 4. Record Emergency Disposition
    const dispRes = await api(`/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/disposition`, {
      method: 'POST',
      body: JSON.stringify({
        disposition: 'DISCHARGE_HOME',
        dispositionNotes: 'Dehydration resolved, oral rehydration advised, discharged in stable condition',
        transferredToWardId: null
      })
    }, doctorToken);

    assert(dispRes.ok, `Emergency disposition failed: ${JSON.stringify(dispRes.body)}`);
    assert.ok(dispRes.body.data.status === 'DISPOSITION_COMPLETED' || dispRes.body.data.status === 'DISPOSED');
  });
});
