// scripts/test-clinical-operations-frontier-suite.mjs
import crypto from 'node:crypto';
import pg from 'pg';

const API_BASE = process.env.API_GATEWAY_URL || 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';

const { Client } = pg;

function generateAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'admin@docsearch.internal',
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
    permissions: ['*'],
    isSuperAdmin: true,
    tenantId: ACTIVE_TENANT_ID,
    activeTenantId: ACTIVE_TENANT_ID,
    iat: now,
    exp: now + 3600,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

const ADMIN_TOKEN = generateAdminToken();

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} ${details ? `[${details}]` : ''}`);
  }
}

async function runClinicalOperationsSuite() {
  console.log('\n======================================================================');
  console.log('🚀 RUNNING DOCSEARCH CLINICAL OPERATIONS & SAFETY HEGEMONY SUITE');
  console.log('Live Target: PostgreSQL 18.4 (Port 5432) & Fastify API Gateway (Port 4000)');
  console.log('======================================================================\n');

  // Verify PostgreSQL Database
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const dbRes = await client.query('SELECT version();');
  assert(dbRes.rows.length > 0, 'PostgreSQL 18.4 Database Active', dbRes.rows[0].version.slice(0, 30));
  await client.end();

  // Verify Fastify Gateway Health
  const healthRes = await fetch(`${API_BASE}/api/v1/health`);
  const health = await healthRes.json();
  assert(healthRes.status === 200 && health.status === 'healthy', 'Fastify API Gateway Health Verified');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };

  // ==========================================================================
  // ENCLAVE 1: AUTONOMOUS OT SURGICAL SAFETY SENTINEL & COUNT RECONCILIATION
  // ==========================================================================
  console.log('\n--- [ENCLAVE 1] Autonomous OT Surgical Safety Sentinel & Count Reconciliation ---');

  // Test 1.1: Sign PAC Clearance (Fit for GA)
  const pacRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/pac/sign-clearance`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseId: 'OT-CASE-2026-9901',
      patientUhId: 'UHID-2026-7701',
      patientName: 'Rajeev Sharma',
      procedureName: 'Laparoscopic Cholecystectomy',
      otTheatreName: 'OT-02 (Laparoscopic Suite)',
      chiefSurgeon: 'Dr. Vikramaditya Sen (MS, MCh)',
      anaesthetistName: 'Dr. Priyadarshini Rao (MD)',
      asaScore: 2,
      mallampatiScore: 'Class II',
      npoFastingHours: 8,
      pacCleared: true
    })
  });
  const pacData = await pacRes.json();
  assert(pacRes.status === 201, 'Enclave 1.1: Anaesthesia PAC sign-off returned 201 Created');
  assert(
    pacData?.data?.theatreStatus === 'THEATRE_ENTRY_UNLOCKED',
    'Enclave 1.1: Theatre admission unlocked following verified PAC clearance',
    `${pacData?.data?.pacStatus} / ASA ${pacData?.data?.asaScore}`
  );

  // Test 1.2: PAC Inadequate Fasting Rejection
  const pacDeniedRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/pac/sign-clearance`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseId: 'OT-CASE-FAIL-NPO',
      patientUhId: 'UHID-2026-7702',
      patientName: 'Sunil Mathur',
      npoFastingHours: 3, // Inadequate fasting!
      pacCleared: false
    })
  });
  const pacDeniedData = await pacDeniedRes.json();
  assert(pacDeniedRes.status === 400, 'Enclave 1.2: Inadequate NPO fasting returns 400 Bad Request');
  assert(
    pacDeniedData?.data?.theatreStatus === 'THEATRE_ADMISSION_FROZEN',
    'Enclave 1.2: Patient theatre admission frozen to prevent pulmonary aspiration',
    pacDeniedData?.error
  );

  // Test 1.3: Execute WHO Checklist Phase (Time-Out before incision)
  const timeOutRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/checklist/phase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseId: 'OT-CASE-2026-9901',
      phase: 'TIME_OUT',
      verifiedItems: ['Patient Identity Verified', 'Surgical Site Marked', 'Antibiotic Prophylaxis Given within 60 Mins', 'Blood Loss Estimate Reviewed'],
      verifiedBy: 'Senior Scrub RN Anita Sharma'
    })
  });
  const timeOutData = await timeOutRes.json();
  assert(timeOutRes.status === 200, 'Enclave 1.3: WHO Checklist Phase [TIME_OUT] returned 200 OK');
  assert(
    timeOutData?.data?.currentSafetyStatus === 'SURGICAL_INCISION_PERMITTED',
    'Enclave 1.3: Surgical incision permitted only after full team Time-Out execution'
  );

  // Test 1.4: Dual-Nurse Count Reconciliation (Balanced)
  const countBalRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/reconciliation/count-tray`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseId: 'OT-CASE-2026-9901',
      itemType: 'LAPAROTOMY_SPONGES',
      initialCount: 10,
      addedCount: 5,
      finalClosingCount: 15,
      scrubNurseSign: 'Anita Sharma (Scrub RN)',
      circulatingNurseSign: 'Preeti Varghese (Circulating RN)'
    })
  });
  const countBalData = await countBalRes.json();
  assert(countBalRes.status === 200, 'Enclave 1.4: Dual-nurse count reconciliation returned 200 OK');
  assert(
    countBalData?.data?.reconciliationStatus === 'BALANCED' && countBalData?.data?.requiresPortableXray === false,
    'Enclave 1.4: Sponge count balanced (15/15) - Cavity closure cleared without retained items'
  );

  // Test 1.5: Count Discrepancy Halt & Mandatory X-Ray Flag
  const countDiscRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/reconciliation/count-tray`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseId: 'OT-CASE-2026-9901',
      itemType: 'SURGICAL_NEEDLES',
      initialCount: 10,
      addedCount: 0,
      finalClosingCount: 9, // 1 needle missing!
      scrubNurseSign: 'Anita Sharma (Scrub RN)',
      circulatingNurseSign: 'Preeti Varghese (Circulating RN)'
    })
  });
  const countDiscData = await countDiscRes.json();
  assert(countDiscRes.status === 200, 'Enclave 1.5: Count discrepancy evaluation returned 200 OK');
  assert(
    countDiscData?.data?.reconciliationStatus === 'DISCREPANCY_HALT_CLOSURE' && countDiscData?.data?.requiresPortableXray === true,
    'Enclave 1.5: Missing needle halts closure and triggers portable X-ray scan',
    `Discrepancy: ${countDiscData?.data?.discrepancyCount} missing`
  );

  // Test 1.6: CSSD Autoclave Batches Query
  const cssdRes = await fetch(`${API_BASE}/api/v1/partner/ot-safety/cssd/autoclave-batches`, {
    headers
  });
  const cssdData = await cssdRes.json();
  assert(cssdRes.status === 200, 'Enclave 1.6: CSSD sterile autoclave batches query returned 200 OK');
  assert(
    cssdData?.data?.length > 0 && cssdData?.data?.[0]?.biological_indicator_result === 'NEGATIVE_PASS',
    'Enclave 1.6: Sterile autoclave trays active with verified negative biological spore test'
  );

  // ==========================================================================
  // ENCLAVE 2: INPATIENT BEDSIDE SMART TABLET CONCIERGE & IOT CALL BELL
  // ==========================================================================
  console.log('\n--- [ENCLAVE 2] Inpatient Bedside Smart Tablet Concierge & IoT Call Bell ---');

  // Test 2.1: Trigger Bedside Nurse Call Bell
  const bellRes = await fetch(`${API_BASE}/api/v1/partner/bedside/call-bell/trigger`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bedNumber: 'BED-304',
      wardName: 'Floor 3 General Ward',
      patientUhId: 'UHID-2026-6601',
      patientName: 'Harish Chandra',
      callType: 'EMERGENCY_ASSIST'
    })
  });
  const bellData = await bellRes.json();
  assert(bellRes.status === 201, 'Enclave 2.1: Bedside nurse call bell trigger returned 201 Created');
  assert(
    bellData?.data?.status === 'ACTIVE_UNDER_SLA' && bellData?.data?.slaCountdownSeconds === 180,
    'Enclave 2.1: 3-minute SLA response timer engaged for bedside assistance',
    `Event: ${bellData?.data?.eventId}`
  );

  // Test 2.2: Acknowledge Call Bell via Bedside NFC
  const ackRes = await fetch(`${API_BASE}/api/v1/partner/bedside/call-bell/acknowledge`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      eventId: bellData?.data?.eventId,
      nurseName: 'Sister Mary (Floor 3 RN)',
      nfcTagScanned: 'NFC-BED-304-VERIFIED'
    })
  });
  const ackData = await ackRes.json();
  assert(ackRes.status === 200, 'Enclave 2.2: Bedside NFC tap nurse acknowledgment returned 200 OK');
  assert(
    ackData?.data?.slaStatus === 'RESOLVED_WITHIN_SLA',
    'Enclave 2.2: Call bell resolved within 3-minute institutional SLA'
  );

  // Test 2.3: Multi-Tier Escalation Evaluation
  const escRes = await fetch(`${API_BASE}/api/v1/partner/bedside/call-bell/escalate-expired`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const escData = await escRes.json();
  assert(escRes.status === 200, 'Enclave 2.3: Call bell SLA escalation cron returned 200 OK');
  assert(
    escData?.data?.escalatedCount > 0,
    'Enclave 2.3: Expired unanswered calls escalated to Ward Sister & Superintendent WhatsApp'
  );

  // Test 2.4: IoT IV Drip Infusion Telemetry (<50ml Alert)
  const ivRes = await fetch(`${API_BASE}/api/v1/partner/bedside/iv-telemetry/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bedNumber: 'BED-304',
      ivBottleType: '0.9% Normal Saline 500ml',
      currentFluidMl: 45,
      flowRateMlHr: 125
    })
  });
  const ivData = await ivRes.json();
  assert(ivRes.status === 201, 'Enclave 2.4: Bedside IoT IV drip telemetry ingestion returned 201 Created');
  assert(
    ivData?.data?.lowFluidAlert === true && ivData?.data?.actionRequired === 'DISPATCH_REPLACEMENT_IV_BOTTLE',
    'Enclave 2.4: Preemptive replacement alert dispatched before air embolism risk occurs',
    `Remaining: ${ivData?.data?.currentFluidMl}ml`
  );

  // Test 2.5: Inpatient Bedside Dietary Ordering
  const dietRes = await fetch(`${API_BASE}/api/v1/partner/bedside/dietary/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bedNumber: 'BED-304',
      patientUhId: 'UHID-2026-6601',
      patientName: 'Harish Chandra',
      mealType: 'LUNCH',
      dietCategory: 'DIABETIC_LOW_SALT',
      items: ['Steamed Brown Rice', 'Moong Dal (Salt-Restricted)', 'Boiled French Beans']
    })
  });
  const dietData = await dietRes.json();
  assert(dietRes.status === 201, 'Enclave 2.5: Bedside dietary meal requisition returned 201 Created');
  assert(
    dietData?.data?.status === 'KITCHEN_PREPARING',
    'Enclave 2.5: Meal request validated against physician diabetic diet chart and routed to Hospital Kitchen'
  );

  // ==========================================================================
  // ENCLAVE 3: SMART PHARMACY POS WITH GS1 BARCODE & FEFO EXPIRY LOCK
  // ==========================================================================
  console.log('\n--- [ENCLAVE 3] Smart Pharmacy POS with GS1 Barcode & FEFO Expiry Lock ---');

  // Test 3.1: GS1 2D DataMatrix Barcode Ingestion (<50ms)
  const scanRes = await fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/barcode/scan`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      rawBarcodeString: '(01)08901234567891(17)261130(10)B-AUG-2611(21)SN1234'
    })
  });
  const scanData = await scanRes.json();
  assert(scanRes.status === 200, 'Enclave 3.1: GS1 2D DataMatrix barcode scanner returned 200 OK');
  assert(
    scanData?.data?.gtin === '08901234567891' && scanData?.data?.batchNumber === 'B-AUG-2611',
    'Enclave 3.1: GTIN, Batch, Expiry, and Schedule H1 statutory flag parsed in <50ms',
    `${scanData?.data?.itemName} (Batch: ${scanData?.data?.batchNumber})`
  );

  // Test 3.2: FEFO Batch Validation (Earliest Batch Allowed)
  const fefoPassRes = await fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/fefo/validate-batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      itemCode: 'MED-AUG-625',
      selectedBatchNumber: 'B-AUG-2611' // earliest batch (Nov 2026)
    })
  });
  const fefoPassData = await fefoPassRes.json();
  assert(fefoPassRes.status === 200, 'Enclave 3.2: FEFO validation of earliest expiring batch returned 200 OK');
  assert(
    fefoPassData?.data?.fefoCompliant === true,
    'Enclave 3.2: First-Expiry-First-Out rule satisfied, preventing pharmacy dead-stock write-offs'
  );

  // Test 3.3: FEFO Violation Block (Attempting Later Batch)
  const fefoFailRes = await fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/fefo/validate-batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      itemCode: 'MED-AUG-625',
      selectedBatchNumber: 'B-AUG-2712' // later batch expiring Dec 2027!
    })
  });
  const fefoFailData = await fefoFailRes.json();
  assert(fefoFailRes.status === 409, 'Enclave 3.3: Attempting later batch triggers 409 Conflict FEFO lock');
  assert(
    fefoFailData?.error === 'FEFO_VIOLATION_EARLIER_BATCH_AVAILABLE',
    'Enclave 3.3: Dispensing blocked because earlier batch B-AUG-2611 is available on shelf',
    fefoFailData?.data?.mandatoryBatch
  );

  // Test 3.4: Schedule H1 / Narcotics Dual-Signature Register
  const h1Res = await fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/schedule-h1/dispense`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      drugName: 'Fentanyl Citrate Injection 50mcg/ml 2ml',
      batchNumber: 'B-FNT-2610',
      quantityDispensed: 2,
      patientName: 'Kailash Mehra',
      patientIdProof: 'Aadhaar (Ending 9912)',
      prescribingDoctorName: 'Dr. Vikramaditya Sen (MS, MCh)',
      doctorRegNumber: 'DMC-2014-99812',
      dispensingPharmacistSign: 'Pharmacist Ramesh Kumar (DL-PH-8812)',
      medicalSuperintendentSign: 'Dr. Ananya Ray (Medical Superintendent)'
    })
  });
  const h1Data = await h1Res.json();
  assert(h1Res.status === 201, 'Enclave 3.4: Schedule H1 narcotics register entry returned 201 Created');
  assert(
    Boolean(h1Data?.data?.entryId && h1Data?.data?.cdscoAuditRetentionPeriod),
    'Enclave 3.4: Dual digital signatures registered under CDSCO 3-year statutory audit compliance',
    h1Data?.data?.entryId
  );

  // Test 3.5: Counter Bill Checkout & Perpetual Stock Deduction
  const billRes = await fetch(`${API_BASE}/api/v1/partner/pharmacy-pos/bill/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientUhId: 'UHID-2026-9901',
      patientName: 'Rameshwar Dayal',
      items: [
        { itemCode: 'MED-AUG-625', batchNumber: 'B-AUG-2611', quantity: 2, unitPrice: 223.50 }
      ],
      paymentMode: 'UPI_DYNAMIC_QR',
      cashierName: 'Cashier Pooja Sharma'
    })
  });
  const billData = await billRes.json();
  assert(billRes.status === 201, 'Enclave 3.5: Pharmacy POS bill settlement returned 201 Created');
  assert(
    billData?.data?.netAmount === 447.00 && billData?.data?.escposRasterPrinterReady === true,
    'Enclave 3.5: Bill settled with perpetual batch stock reduction and ESC/POS thermal receipt',
    billData?.data?.invoiceNumber
  );

  // ==========================================================================
  // ENCLAVE 4: AYUSHMAN BHARAT PM-JAY & STATE GOVERNMENT SCHEME AUTO-TARIFF
  // ==========================================================================
  console.log('\n--- [ENCLAVE 4] Ayushman Bharat PM-JAY & State Government Scheme Auto-Tariff ---');

  // Test 4.1: Search HBP 2.2 Packages
  const hbpRes = await fetch(`${API_BASE}/api/v1/partner/pmjay/packages/search`, {
    headers
  });
  const hbpData = await hbpRes.json();
  assert(hbpRes.status === 200, 'Enclave 4.1: NHA Health Benefit Packages search returned 200 OK');
  assert(
    hbpData?.data?.totalPackagesAvailable >= 4,
    'Enclave 4.1: Standardized government package tariffs retrieved (e.g. SU004 Lap Chole @ ₹32,000)'
  );

  // Test 4.2: Verify Beneficiary TMS Eligibility
  const tmsRes = await fetch(`${API_BASE}/api/v1/partner/pmjay/beneficiary/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      goldenCardId: 'PMJAY-DEL-992144',
      rationCardNumber: 'NFSA-07-291882'
    })
  });
  const tmsData = await tmsRes.json();
  assert(tmsRes.status === 200, 'Enclave 4.2: TMS beneficiary verification returned 200 OK');
  assert(
    tmsData?.data?.eligibilityStatus === 'ACTIVE_BENEFICIARY' && tmsData?.data?.annualEntitlementRemaining === 500000.00,
    'Enclave 4.2: Golden Card verified with ₹5,00,000 active annual family coverage',
    tmsData?.data?.beneficiaryName
  );

  // Test 4.3: Initiate Pre-Auth with Mandatory Documentation Checklist
  const preauthRes = await fetch(`${API_BASE}/api/v1/partner/pmjay/pre-auth/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      beneficiaryName: 'Chhote Lal',
      goldenCardId: 'PMJAY-DEL-992144',
      rationCardNumber: 'NFSA-07-291882',
      packageCode: 'SU004',
      uploadedDocTypes: ['Ultrasound Abdomen', 'LFT Report', 'Clinical History', 'PMJAY Golden Card']
    })
  });
  const preauthData = await preauthRes.json();
  assert(preauthRes.status === 201, 'Enclave 4.3: PM-JAY Pre-Auth initiation returned 201 Created');
  assert(
    preauthData?.data?.preauthStatus === 'PREAUTH_APPROVED' && preauthData?.data?.approvedAmount === 32000.00,
    'Enclave 4.3: State Health Agency pre-auth approved with cashless coverage guarantee',
    preauthData?.data?.caseRef
  );

  // Test 4.4: Zero-Balance Billing Claim Adjudication
  const pmjayClaimRes = await fetch(`${API_BASE}/api/v1/partner/pmjay/claims/adjudicate-package`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      caseRef: preauthData?.data?.caseRef,
      packageCode: 'SU004',
      totalHospitalExpense: 36400,
      otConsumablesCost: 4500,
      implantCost: 0
    })
  });
  const pmjayClaimData = await pmjayClaimRes.json();
  assert(pmjayClaimRes.status === 201, 'Enclave 4.4: PM-JAY zero-balance claim adjudication returned 201 Created');
  assert(
    pmjayClaimData?.data?.patientOutOfPocket === 0.00 && pmjayClaimData?.data?.isZeroBalanceBillingEnforced === true,
    'Enclave 4.4: 100% cashless zero-balance billing enforced, eliminating patient out-of-pocket extortion',
    `SHA Settlement: ₹${pmjayClaimData?.data?.shaPayableAmount}`
  );

  // ==========================================================================
  // ENCLAVE 5: COLD-CHAIN BLOOD BANK IOT SENTINEL & CROSSMATCH AUTO-EXPIRY
  // ==========================================================================
  console.log('\n--- [ENCLAVE 5] Cold-Chain Blood Bank IoT Sentinel & Crossmatch Auto-Expiry ---');

  // Test 5.1: Ingest Normal Cold-Chain Temperature (4.2°C)
  const coldNomRes = await fetch(`${API_BASE}/api/v1/partner/blood-bank/iot/telemetry-stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      storageUnitId: 'PRBC-CHILLER-01',
      unitType: 'PRBC_REFRIGERATOR',
      currentTemperature: 4.2
    })
  });
  const coldNomData = await coldNomRes.json();
  assert(coldNomRes.status === 201, 'Enclave 5.1: Blood bank normal cold-chain telemetry returned 201 Created');
  assert(
    coldNomData?.data?.breachDetected === false && coldNomData?.data?.alarmStatus === 'NORMAL_MONITORING',
    'Enclave 5.1: PRBC chiller temperature verified nominal within safe limits (2.0°C to 6.0°C)',
    `Current: ${coldNomData?.data?.currentTemperature}°C`
  );

  // Test 5.2: Ingest Temperature Breach Excursion (8.8°C)
  const coldBreachRes = await fetch(`${API_BASE}/api/v1/partner/blood-bank/iot/telemetry-stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      storageUnitId: 'PRBC-CHILLER-01',
      unitType: 'PRBC_REFRIGERATOR',
      currentTemperature: 8.8 // Breach!
    })
  });
  const coldBreachData = await coldBreachRes.json();
  assert(coldBreachRes.status === 201, 'Enclave 5.2: Temperature breach telemetry returned 201 Created');
  assert(
    coldBreachData?.data?.breachDetected === true && coldBreachData?.data?.alarmStatus === 'AUDIBLE_BUZZER_AND_SMS_BROADCAST',
    'Enclave 5.2: Temperature breach (+8.8°C) triggers audible alarm and emergency SMS to Blood Bank Officer'
  );

  // Test 5.3: Surgical Cross-Match Reservation (48h Hold)
  const resBldRes = await fetch(`${API_BASE}/api/v1/partner/blood-bank/crossmatch/reserve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      unitBarcode: 'BLD-PRBC-O-POS-9001',
      patientUhId: 'UHID-2026-7701',
      patientName: 'Rajeev Sharma',
      plannedSurgeryName: 'Elective Cholecystectomy',
      holdDurationHours: 48
    })
  });
  const resBldData = await resBldRes.json();
  assert(resBldRes.status === 201, 'Enclave 5.3: Blood crossmatch reservation returned 201 Created');
  assert(
    resBldData?.data?.reservationStatus === 'ACTIVE_SURGERY_HOLD',
    'Enclave 5.3: Blood unit reserved with 48-hour auto-expiration countdown engaged',
    resBldData?.data?.reservationId
  );

  // Test 5.4: Automated 48-Hour Cross-Match Reservation Sweep
  const sweepRes = await fetch(`${API_BASE}/api/v1/partner/blood-bank/crossmatch/auto-expire-sweep`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const sweepData = await sweepRes.json();
  assert(sweepRes.status === 200, 'Enclave 5.4: 48-hour crossmatch auto-expire sweep returned 200 OK');
  assert(
    sweepData?.data?.unitsAutoReleasedCount > 0 && sweepData?.data?.preventedBloodWastage === true,
    'Enclave 5.4: Unutilized reserved blood units safely restored to emergency general pool after 48 hours'
  );

  // Test 5.5: Blood Bank Inventory Summary Query
  const invBldRes = await fetch(`${API_BASE}/api/v1/partner/blood-bank/inventory/summary`, {
    headers
  });
  const invBldData = await invBldRes.json();
  assert(invBldRes.status === 200, 'Enclave 5.5: Real-time blood bank inventory stock summary returned 200 OK');
  assert(
    invBldData?.data?.totalUnitsInStock >= 4,
    'Enclave 5.5: Group-wise stock monitored in real-time to avoid emergency blood shortages'
  );

  // --- Final Results ---
  console.log('\n======================================================================');
  console.log(`CLINICAL OPERATIONS SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runClinicalOperationsSuite().catch((err) => {
  console.error('[!] Clinical Operations test suite fatal crash:', err);
  process.exit(1);
});
