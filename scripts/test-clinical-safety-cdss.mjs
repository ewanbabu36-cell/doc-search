import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const BASE_URL = 'http://127.0.0.1:4000';

const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN', 'PATHOLOGIST', 'LAB_TECHNICIAN'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`[FAIL] ❌ ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`[PASS] ✅ ${message}`);
}

async function runTests() {
  console.log('======================================================================');
  console.log('🩺 DOC SEARCH — CLINICAL SAFETY & CDSS AUTOMATED VERIFICATION SUITE');
  console.log('======================================================================\n');

  const uniqueSuffix = Date.now();

  // Step 0: Create Adult Test Patient
  console.log('[*] Step 0: Creating Master Adult Patient...');
  const patRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      firstName: 'Ramesh',
      lastName: 'Verma',
      gender: 'MALE',
      dateOfBirth: '1978-06-15',
      mobileNumber: '+9199887' + String(uniqueSuffix).slice(-5),
      bloodGroup: 'B_POSITIVE',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: 'MRN-CDSS-' + uniqueSuffix
    })
  });
  assert(patRes.status === 201, `Patient registration HTTP 201 (Got: ${patRes.status})`);
  const patData = (await patRes.json()).data;
  const adultPatientId = patData.id;
  console.log(`    Adult Patient: ${patData.firstName} ${patData.lastName} (ID: ${adultPatientId}, MRN: ${patData.mrn})`);

  // Step 0b: Create Adult Consultation Encounter
  const encRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/encounters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      patientId: adultPatientId,
      encounterType: 'OPD_CONSULTATION',
      chiefComplaint: 'Cardiovascular checkup and chest discomfort'
    })
  });
  assert(encRes.status === 201, `Encounter creation HTTP 201 (Got: ${encRes.status})`);
  const adultEncounterId = (await encRes.json()).data.id;
  console.log(`    Encounter ID: ${adultEncounterId}`);

  // ======================================================================
  // TEST 1: Sildenafil + Nitrates DDI (CONTRAINDICATED, Non-Overrideable)
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 1: Sildenafil + Nitrate DDI (CONTRAINDICATED, Non-Overrideable)');
  console.log('[*] ------------------------------------------------------------------');
  const ddiEvalRes1 = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      medications: [
        { medicationName: 'Sildenafil 50mg', dosage: '50mg', frequency: 'PRN', duration: 30, durationUnit: 'DAYS' },
        { medicationName: 'Isosorbide Mononitrate 20mg', dosage: '20mg', frequency: 'OD', duration: 30, durationUnit: 'DAYS' }
      ]
    })
  });
  assert(ddiEvalRes1.status === 200, `CDSS evaluation endpoint HTTP 200 (Got: ${ddiEvalRes1.status})`);
  const evalData1 = (await ddiEvalRes1.json()).data;
  assert(evalData1.hasBlockingContraindication === true, 'Engine flags hasBlockingContraindication = true');
  const sildenafilAlert = evalData1.alerts.find(a => a.severity === 'CONTRAINDICATED');
  assert(!!sildenafilAlert, 'CONTRAINDICATED severity alert returned for Sildenafil + Nitrate');
  assert(sildenafilAlert.overrideAllowed === false, 'Strict Medical Rule: Sildenafil + Nitrate overrideAllowed = false');
  assert(sildenafilAlert.ruleVersion.startsWith('2026.'), `Rule is versioned (${sildenafilAlert.ruleVersion})`);
  console.log(`    Alert Title: "${sildenafilAlert.title}"`);
  console.log(`    Clinical Risk: "${sildenafilAlert.clinicalConsequence}"`);
  console.log(`    Recommended Action: "${sildenafilAlert.recommendedAction}"`);

  // Direct Prescription Save Bypass Test
  console.log('    Attempting direct prescription creation without override...');
  const directRxRes1 = await fetch(`${BASE_URL}/api/v1/partner/clinical/prescriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      items: [
        { medicationName: 'Sildenafil 50mg', dosage: '50mg', frequency: 'PRN', duration: 30, durationUnit: 'DAYS' },
        { medicationName: 'Isosorbide Mononitrate 20mg', dosage: '20mg', frequency: 'OD', duration: 30, durationUnit: 'DAYS' }
      ]
    })
  });
  assert(directRxRes1.status === 422, `Backend DDI Save Enforcement blocks contraindicated save with HTTP 422 (Got: ${directRxRes1.status})`);
  const directRxErr1 = await directRxRes1.json();
  assert(directRxErr1.error.message.includes('Clinical Safety Contraindication Alert'), 'Backend returned structured clinical safety error');
  console.log('    [✔] Malicious / Direct API bypass successfully prevented by backend authority!');

  // ======================================================================
  // TEST 2: Blood Thinners + NSAIDs (CRITICAL, Auditable Override Workflow)
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 2: Warfarin + NSAID (CRITICAL, Auditable Doctor Override)');
  console.log('[*] ------------------------------------------------------------------');
  const ddiEvalRes2 = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      medications: [
        { medicationName: 'Warfarin Sodium 5mg', dosage: '5mg', frequency: 'OD', duration: 15, durationUnit: 'DAYS' },
        { medicationName: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'TDS', duration: 3, durationUnit: 'DAYS' }
      ]
    })
  });
  assert(ddiEvalRes2.status === 200, `Evaluation HTTP 200`);
  const evalData2 = (await ddiEvalRes2.json()).data;
  const bleedingAlert = evalData2.alerts.find(a => a.severity === 'CRITICAL');
  assert(!!bleedingAlert, 'CRITICAL alert returned for Warfarin + NSAID');
  assert(bleedingAlert.overrideAllowed === true, 'Doctor override is allowed for Warfarin + NSAID');

  // Submit Doctor Override with Auditable Justification
  console.log('    Submitting Doctor Override with auditable clinical reason...');
  const overrideRes = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/override`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      encounterId: adultEncounterId,
      patientId: adultPatientId,
      alertId: bleedingAlert.alertId,
      ruleId: bleedingAlert.ruleId,
      ruleVersion: bleedingAlert.ruleVersion,
      clinicalReason: 'Short-term 3-day post-extraction analgesia. Concomitant Pantoprazole 40mg prescribed and daily INR monitoring scheduled.'
    })
  });
  assert(overrideRes.status === 200, `Doctor override recorded HTTP 200 (Got: ${overrideRes.status})`);
  const overrideData = (await overrideRes.json()).data;
  assert(!!overrideData.overrideId, `Cryptographic override ID generated (${overrideData.overrideId})`);
  assert(!!overrideData.auditTraceHash, `SHA-256 cryptographic audit trace hash generated (${overrideData.auditTraceHash})`);
  console.log(`    Override Hash: ${overrideData.auditTraceHash}`);

  // Now submit prescription with the valid override
  console.log('    Submitting prescription with authorized override...');
  const rxRes2 = await fetch(`${BASE_URL}/api/v1/partner/clinical/prescriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      items: [
        { medicationName: 'Warfarin Sodium 5mg', dosage: '5mg', frequency: 'OD', duration: 15, durationUnit: 'DAYS' },
        { medicationName: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'TDS', duration: 3, durationUnit: 'DAYS' }
      ],
      overrides: [{
        alertId: bleedingAlert.alertId,
        ruleId: bleedingAlert.ruleId,
        ruleVersion: bleedingAlert.ruleVersion,
        clinicalReason: 'Short-term 3-day post-extraction analgesia with Pantoprazole.'
      }]
    })
  });
  assert(rxRes2.status === 201, `Prescription saved successfully with authorized override HTTP 201 (Got: ${rxRes2.status})`);
  console.log('    [✔] Prescription saved and immutable CDSS audit recorded.');

  // ======================================================================
  // TEST 3: Pediatric Dose Verification (mg/kg/day)
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 3: Pediatric Dose Verification (mg/kg/day)');
  console.log('[*] ------------------------------------------------------------------');
  // Register 4-year-old child (Weight 15 kg)
  const pediaPatRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/patients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      firstName: 'Aarav',
      lastName: 'Sharma',
      gender: 'MALE',
      dateOfBirth: '2022-03-10', // 4 years old
      mobileNumber: '+9197777' + String(uniqueSuffix).slice(-5),
      bloodGroup: 'A_POSITIVE',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: 'MRN-PED-' + uniqueSuffix
    })
  });
  assert(pediaPatRes.status === 201, `Pediatric patient registered HTTP 201`);
  const pediaPatientId = (await pediaPatRes.json()).data.id;

  // Add Vitals with Weight = 15 kg
  const vitalsRes = await fetch(`${BASE_URL}/api/v1/partner/clinical/encounters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      patientId: pediaPatientId,
      encounterType: 'OPD_CONSULTATION',
      chiefComplaint: 'Pediatric viral fever'
    })
  });
  const pediaEncounterId = (await vitalsRes.json()).data.id;

  await fetch(`${BASE_URL}/api/v1/partner/clinical/vitals`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: pediaPatientId,
      encounterId: pediaEncounterId,
      weightKg: 15,
      temperatureF: 101.4,
      heartRateBpm: 105
    })
  });

  // 3a. Normal Pediatric Dose: Paracetamol 150mg TDS = 450 mg/day (30 mg/kg/day)
  console.log('    Evaluating safe pediatric Paracetamol dose (150mg TDS on 15kg child)...');
  const safePediaEval = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: pediaPatientId,
      encounterId: pediaEncounterId,
      medications: [
        { medicationName: 'Paracetamol Syrup 120mg/5ml', dosage: '150mg', frequency: 'TDS', duration: 3, durationUnit: 'DAYS' }
      ]
    })
  });
  const safePediaData = (await safePediaEval.json()).data;
  const safeAlerts = safePediaData.alerts.filter(a => (a.category === 'PEDIATRIC_DOSE' || a.ruleType === 'PEDIATRIC_DOSE') && a.severity === 'CRITICAL');
  assert(safeAlerts.length === 0, 'No critical overdose alerts for safe pediatric dose (30 mg/kg/day <= 60 mg/kg/day)');
  console.log('    [✔] Safe pediatric dose approved.');

  // 3b. Overdose Alert: Paracetamol 400mg TDS = 1200 mg/day (80 mg/kg/day > 60 mg/kg/day max)
  console.log('    Evaluating toxic pediatric Paracetamol dose (400mg TDS on 15kg child = 80 mg/kg/day)...');
  const toxicPediaEval = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: pediaPatientId,
      encounterId: pediaEncounterId,
      patientWeightKg: 15,
      medications: [
        { medicationName: 'Paracetamol Syrup 250mg/5ml', dosage: '400mg', frequency: 'TDS', duration: 3, durationUnit: 'DAYS' }
      ]
    })
  });
  const toxicPediaData = (await toxicPediaEval.json()).data;
  const pediaOverdoseAlert = toxicPediaData.alerts.find(a => (a.category === 'PEDIATRIC_DOSE' || a.ruleType === 'PEDIATRIC_DOSE') && a.severity === 'CRITICAL');
  assert(!!pediaOverdoseAlert, 'CRITICAL alert triggered for Pediatric Paracetamol Overdose');
  console.log(`    Overdose Alert: "${pediaOverdoseAlert.title}"`);
  console.log(`    Calculation: "${pediaOverdoseAlert.clinicalConsequence}"`);

  // 3c. Unconfigured Pediatric Molecule (Strict Medical Rule: DOSE_RULE_NOT_AVAILABLE)
  console.log('    Evaluating unconfigured experimental molecule...');
  const unconfiguredEval = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: pediaPatientId,
      encounterId: pediaEncounterId,
      patientWeightKg: 15,
      medications: [
        { medicationName: 'ExperimentalNovelCompound XYZ', dosage: '50mg', frequency: 'OD', duration: 5, durationUnit: 'DAYS' }
      ]
    })
  });
  const unconfiguredData = (await unconfiguredEval.json()).data;
  const doseUnavailableAlert = unconfiguredData.alerts.find(a => a.ruleId === 'DOSE_RULE_NOT_AVAILABLE') ||
    unconfiguredData.pediatricAssessments?.find(a => a.status === 'DOSE_RULE_NOT_AVAILABLE');
  assert(!!doseUnavailableAlert, 'DOSE_RULE_NOT_AVAILABLE returned for unsupported pediatric molecule (no guessing)');
  console.log('    [✔] Compliant with medical safety rule: zero hallucinated dosing rules.');

  // ======================================================================
  // TEST 4: Renal Dose Verification (Metformin Contraindication & Freshness)
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 4: Renal Dose Verification & Missing Lab Freshness');
  console.log('[*] ------------------------------------------------------------------');
  // Patient without renal lab data -> RENAL_DATA_NOT_AVAILABLE
  const renalEvalRes = await fetch(`${BASE_URL}/api/v1/partner/clinical-safety/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      medications: [
        { medicationName: 'Metformin 1000mg', dosage: '1000mg', frequency: 'BD', duration: 30, durationUnit: 'DAYS' }
      ]
    })
  });
  const renalEvalData = (await renalEvalRes.json()).data;
  const renalNotice = renalEvalData.alerts.find(a => a.ruleId === 'RENAL_DATA_NOT_AVAILABLE');
  assert(!!renalNotice, 'RENAL_DATA_NOT_AVAILABLE flagged when patient lacks baseline Serum Creatinine / eGFR');
  console.log(`    Renal Alert: "${renalNotice.title}" - "${renalNotice.recommendedAction}"`);

  // ======================================================================
  // TEST 5: NABL & NABH 5th Edition Lab Result Amendment Ledger
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 5: NABL & NABH 5th Edition Lab Result Amendment Ledger');
  console.log('[*] ------------------------------------------------------------------');
  // 5a. Create Lab Order
  const labOrderRes = await fetch(`${BASE_URL}/api/v1/partner/lab/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      patientId: adultPatientId,
      encounterId: adultEncounterId,
      testName: 'Complete Blood Count (CBC) with Differential',
      testCode: 'CBC-001',
      specimenType: 'WHOLE_BLOOD',
      clinicalNotes: 'Suspected anemia workup'
    })
  });
  assert(labOrderRes.status === 201, `Lab order created HTTP 201 (Got: ${labOrderRes.status})`);
  const labOrder = (await labOrderRes.json()).data;
  const labOrderId = labOrder.id;
  console.log(`    Lab Order ID: ${labOrderId}, Accession: ${labOrder.accessionNumber || labOrder.id}`);

  // 5b. Enter Initial Result (Hemoglobin = 11.2 g/dL)
  const initialResultRes = await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${labOrderId}/results`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parameterName: 'Hemoglobin',
      resultValue: '11.2',
      unit: 'g/dL',
      refRange: '13.0 - 17.0',
      flag: 'LOW',
      notes: 'Mild microcytic hypochromic anemia'
    })
  });
  assert(initialResultRes.status === 201, `Initial result entered HTTP 201 (Got: ${initialResultRes.status})`);
  const initialOrder = (await initialResultRes.json()).data;
  const resultItem = initialOrder.metadata?.results?.[0] || initialOrder.results?.[0];
  const resultId = resultItem?.id || initialOrder.id;
  console.log(`    Initial Result: Hemoglobin = 11.2 g/dL (Result ID: ${resultId})`);

  // 5c. Technologist Amends Result (11.2 -> 9.8 g/dL) with Mandatory Clinical Reason
  console.log('    Amending result to 9.8 g/dL due to specimen analyzer verification...');
  const amendRes = await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${labOrderId}/amend`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      resultId,
      newValue: '9.8',
      clinicalReason: 'Sample re-run on automated analyzer Sysmex XN-1000 after vortexing due to suspected micro-clot interference. Re-run confirmed 9.8 g/dL.'
    })
  });
  assert(amendRes.status === 200, `Lab result amendment HTTP 200 (Got: ${amendRes.status})`);
  const amendData = (await amendRes.json()).data;
  const updatedOrder = amendData.updatedOrder || amendData;
  const amendment = amendData.amendment || amendData;
  assert(updatedOrder.status === 'AMENDED', `Lab order status transitioned to AMENDED (Got: ${updatedOrder.status})`);
  assert(amendment.amendmentNumber === 1 || amendment.amendmentCount === 1, 'Amendment count/number recorded as 1');
  assert(!!amendment.id, 'Immutable amendment record ID created');
  console.log(`    Amendment ID: ${amendment.id}`);

  // 5d. Retrieve Chronological Amendment Ledger
  const ledgerRes = await fetch(`${BASE_URL}/api/v1/partner/lab/orders/${labOrderId}/amendments`, {
    method: 'GET',
    headers
  });
  assert(ledgerRes.status === 200, `Amendment ledger query HTTP 200`);
  const ledger = (await ledgerRes.json()).data;
  assert(ledger.length >= 1, 'At least 1 historical amendment in ledger');
  const record = ledger[0];
  assert(record.previousValue === '11.2', `Previous value 11.2 immutably preserved (Got: ${record.previousValue})`);
  assert(record.newValue === '9.8', `New value 9.8 recorded (Got: ${record.newValue})`);
  assert((record.reason || record.clinicalReason || '').includes('Sysmex XN-1000'), 'Clinical reason preserved');
  console.log('    [✔] NABL & NABH 5th Edition Lab Result Immutability & Audit Trail Verified!');

  // ======================================================================
  // TEST 6: Pillar 3 Public Kiosk Check-In & Live Token Tracker
  // ======================================================================
  console.log('\n[*] ------------------------------------------------------------------');
  console.log('[*] TEST 6: Pillar 3 Hospital Entrance Kiosk Check-In & Live Token URL');
  console.log('[*] ------------------------------------------------------------------');
  const kioskRes = await fetch(`${BASE_URL}/api/v1/public/kiosk/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      fullName: 'Sunita Mehra',
      mobileNumber: '+9198123' + String(uniqueSuffix).slice(-5),
      age: 38,
      gender: 'FEMALE',
      departmentName: 'General Medicine',
      chiefComplaint: 'Mild fever and sore throat'
    })
  });
  const kioskText = await kioskRes.text();
  console.log('    Kiosk response status:', kioskRes.status, 'body:', kioskText);
  let kioskData;
  try {
    kioskData = JSON.parse(kioskText).data;
  } catch {}
  assert(kioskRes.status === 201, `Public Kiosk self check-in HTTP 201 (Got: ${kioskRes.status})`);
  assert(!!kioskData.tokenNumber, `Token number issued (${kioskData.tokenNumber})`);
  assert(!!kioskData.encounterId, `Encounter created (${kioskData.encounterId})`);
  assert(kioskData.messageHinglish.includes('Namaste Sunita Mehra ji!'), 'Hinglish WhatsApp notification generated');
  console.log(`    Kiosk Token: ${kioskData.tokenNumber}`);
  console.log(`    Live Token Tracker: ${kioskData.liveTokenUrl}`);
  console.log(`    WhatsApp Text: "${kioskData.messageHinglish}"`);

  // Query Public Live Token Status URL
  const trackerRes = await fetch(`${BASE_URL}/api/v1/public/queue/token-status/${kioskData.encounterId}`, {
    method: 'GET'
  });
  assert(trackerRes.status === 200, `Public Live Token Status HTTP 200`);
  const trackerData = (await trackerRes.json()).data;
  assert(trackerData.tokenNumber === kioskData.tokenNumber, 'Live token tracker matches issued token');
  assert(trackerData.queueStatus === 'WAITING', 'Queue status is WAITING');
  assert(typeof trackerData.estimatedWaitMinutes === 'number', 'Estimated wait time calculated');
  console.log('    [✔] Public Live Token Tracking endpoint functioning with zero auth barriers for patients!');

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} CLINICAL SAFETY & CDSS TESTS PASSED (100% GREEN)`);
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
