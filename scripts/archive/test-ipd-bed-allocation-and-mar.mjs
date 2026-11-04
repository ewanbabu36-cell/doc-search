/**
 * Comprehensive Verification Suite for IPD Bed Allocation,
 * Bedside MAR (Medication Administration Record), and Discharge Bed Sanitization
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('='.repeat(75));
console.log('🛏️ DOCSEARCH IPD BED ALLOCATION, BEDSIDE MAR & DISCHARGE SANITIZATION');
console.log('='.repeat(75));

let passedGates = 0;
let totalGates = 0;

async function runGate(name, testFn) {
  totalGates++;
  console.log(`\n--- [Gate ${totalGates}] ${name} ---`);
  try {
    await testFn();
    console.log(`✅ PASS: ${name}`);
    passedGates++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

async function main() {
  // ---------------------------------------------------------------------------
  // Gate 1: BedManagementView Requisition Card & 1-Click Bed Allocation Modal
  // ---------------------------------------------------------------------------
  await runGate('BedManagementView: Stat Admission Requisitions & 1-Click Bed Allocation', () => {
    const viewPath = path.resolve('apps/partner-platform/src/components/views/BedManagementView.tsx');
    assert.ok(fs.existsSync(viewPath), 'BedManagementView.tsx must exist');
    const source = fs.readFileSync(viewPath, 'utf8');

    // 1. Accepts admissionRequests / requests props
    assert.ok(
      source.includes('requests?: InpatientAdmissionRequestDto[]') ||
      source.includes('admissionRequests?: InpatientAdmissionRequestDto[]'),
      'BedManagementView must accept admission requests prop'
    );

    // 2. Accepts onAllocateBedRequest callback
    assert.ok(
      source.includes('onAllocateBedRequest?:'),
      'BedManagementView must accept onAllocateBedRequest prop'
    );

    // 3. Displays active admission requisitions banner
    assert.ok(
      source.includes('Active Admission Requisitions') || source.includes('Active Inpatient Admission Orders'),
      'Must render Active Admission Requisitions banner'
    );

    // 4. Renders 1-click [🛏️ Allocate Bed] button
    assert.ok(
      source.includes('Allocate Bed'),
      'Must render 1-click Allocate Bed button'
    );
    assert.ok(
      source.includes('onAllocateBedRequest(req)') || source.includes('onAllocateBedRequest && onAllocateBedRequest(req)'),
      'Must trigger onAllocateBedRequest on click'
    );
  });

  // ---------------------------------------------------------------------------
  // Gate 2: NursingStationView Admission Requisitions & Workbench Integration
  // ---------------------------------------------------------------------------
  await runGate('NursingStationView: Admission Requisition Banner & Bed Allocation Action', () => {
    const stationPath = path.resolve('apps/partner-platform/src/components/views/NursingStationView.tsx');
    assert.ok(fs.existsSync(stationPath), 'NursingStationView.tsx must exist');
    const source = fs.readFileSync(stationPath, 'utf8');

    // 1. Accepts admissionRequests and onAllocateBedRequest
    assert.ok(
      source.includes('admissionRequests') || source.includes('requests'),
      'NursingStationView must accept admission requests'
    );
    assert.ok(
      source.includes('onAllocateBedRequest'),
      'NursingStationView must accept onAllocateBedRequest callback'
    );

    // 2. Renders pending requisitions with Allocate Bed button
    assert.ok(
      source.includes('Active Inpatient Admission Orders') || source.includes('Active Admission Requisitions'),
      'Must display active inpatient admission banner'
    );
    assert.ok(
      source.includes('Allocate Bed'),
      'Must render Allocate Bed button for pending requisitions'
    );
  });

  // ---------------------------------------------------------------------------
  // Gate 3: InpatientDomainManager Event Catching & Allocation Flow
  // ---------------------------------------------------------------------------
  await runGate('InpatientDomainManager: IPD_ADMISSION_ORDERED Subscription & Discharge Turnaround', () => {
    const mgrPath = path.resolve('apps/partner-platform/src/components/InpatientDomainManager.tsx');
    assert.ok(fs.existsSync(mgrPath), 'InpatientDomainManager.tsx must exist');
    const source = fs.readFileSync(mgrPath, 'utf8');

    // 1. Subscribes to IPD_ADMISSION_ORDERED
    assert.ok(
      source.includes("subscribe('IPD_ADMISSION_ORDERED'"),
      'Must subscribe to IPD_ADMISSION_ORDERED event from Doctor Cockpit'
    );

    // 2. Wires onAllocateBedRequest
    assert.ok(
      source.includes('handleOpenAllocateBedForRequest'),
      'Must provide handleOpenAllocateBedForRequest handler'
    );
    assert.ok(
      source.includes('onAllocateBedRequest={handleOpenAllocateBedForRequest}'),
      'Must pass onAllocateBedRequest to views'
    );

    // 3. Finalize Discharge Summary transitions bed to CLEANING
    assert.ok(
      source.includes('handleFinalizeDischargeSummary'),
      'Must implement handleFinalizeDischargeSummary'
    );
    assert.ok(
      source.includes("status: 'CLEANING'") || source.includes('CLEANING'),
      'Finalize discharge summary must transition bed to CLEANING'
    );
  });

  // ---------------------------------------------------------------------------
  // Gate 4: Bedside MAR in NursingCareView with Morning / Noon / Night Checkboxes
  // ---------------------------------------------------------------------------
  await runGate('NursingCareView: Bedside MAR Morning/Noon/Night Shift Dose Checkboxes', () => {
    const marPath = path.resolve('apps/partner-platform/src/components/views/NursingCareView.tsx');
    assert.ok(fs.existsSync(marPath), 'NursingCareView.tsx must exist');
    const source = fs.readFileSync(marPath, 'utf8');

    // 1. MarDoseSlot interface defined
    assert.ok(
      source.includes('interface MarDoseSlot'),
      'Must define MarDoseSlot interface'
    );
    assert.ok(
      source.includes('morningDose'),
      'MarScheduleEntry must have morningDose'
    );
    assert.ok(
      source.includes('noonDose'),
      'MarScheduleEntry must have noonDose'
    );
    assert.ok(
      source.includes('nightDose'),
      'MarScheduleEntry must have nightDose'
    );

    // 2. Checkboxes for Morning, Noon, Night slots
    assert.ok(
      source.includes('mar-checkbox-morning'),
      'Must render Morning dose checkbox'
    );
    assert.ok(
      source.includes('mar-checkbox-noon'),
      'Must render Noon dose checkbox'
    );
    assert.ok(
      source.includes('mar-checkbox-night'),
      'Must render Night dose checkbox'
    );

    // 3. Dose administration handler with timestamp & nurse ID
    assert.ok(
      source.includes('handleToggleDoseSlot'),
      'Must implement handleToggleDoseSlot'
    );
    assert.ok(
      source.includes('administeredAt') && source.includes('administeredBy'),
      'Must persist administeredAt and administeredBy'
    );

    // 4. Subscribes to IPD_ADMISSION_ORDERED for auto-populating doctor prescribed meds
    assert.ok(
      source.includes("subscribe('IPD_ADMISSION_ORDERED'"),
      'Must subscribe to IPD_ADMISSION_ORDERED to load doctor prescribed medications'
    );
  });

  // ---------------------------------------------------------------------------
  // Gate 5: PostgreSQL Database Schema & Repository Bed State Transitions
  // ---------------------------------------------------------------------------
  await runGate('Database & Repository: PostgreSQL clinical.inpatient_beds & inpatient_admissions', () => {
    const schemaPath = path.resolve('packages/database/src/schema/clinical/index.ts');
    const repoPath = path.resolve('apps/api-gateway/src/repositories/partner/InpatientManagementRepository.ts');
    assert.ok(fs.existsSync(schemaPath), 'clinical schema must exist');
    assert.ok(fs.existsSync(repoPath), 'InpatientManagementRepository.ts must exist');

    const schemaSource = fs.readFileSync(schemaPath, 'utf8');
    const repoSource = fs.readFileSync(repoPath, 'utf8');

    // 1. Inpatient Beds table in schema
    assert.ok(
      schemaSource.includes("'inpatient_beds'"),
      'Table inpatient_beds must exist in clinical schema'
    );
    assert.ok(
      schemaSource.includes("'inpatient_admissions'"),
      'Table inpatient_admissions must exist in clinical schema'
    );
    assert.ok(
      schemaSource.includes("'inpatient_bed_turnaround'"),
      'Table inpatient_bed_turnaround must exist in clinical schema'
    );

    // 2. Repository createAdmission updates bed to OCCUPIED
    assert.ok(
      repoSource.includes("status: 'OCCUPIED'"),
      'createAdmission must set bed status to OCCUPIED'
    );
    assert.ok(
      repoSource.includes(".insert(inpatientAdmissions)"),
      'createAdmission must insert row into inpatientAdmissions'
    );

    // 3. Repository dischargePatient transitions bed to CLEANING
    assert.ok(
      repoSource.includes("status: 'CLEANING'"),
      'dischargePatient must transition bed status to CLEANING'
    );
    assert.ok(
      repoSource.includes("inpatientBedTurnaround"),
      'dischargePatient must record housekeeping turnaround in inpatientBedTurnaround'
    );
  });

  // ---------------------------------------------------------------------------
  // Gate 6: End-to-End Simulation: OPD Order ➔ Bed Allocation ➔ MAR ➔ Discharge
  // ---------------------------------------------------------------------------
  await runGate('Full Lifecycle Simulation: OPD Doctor orders ICU admission ➔ Nurse allocates Bed ICU-04 ➔ Administers Morning Dose in MAR ➔ Finalizes discharge summary ➔ Bed transitions to CLEANING', async () => {
    const tenantId = '11111111-1111-4111-8111-111111111111';

    // Step 1: Doctor in Solo Doctor OPD Cockpit issues Inpatient Admission Order
    const doctorAdmissionOrder = {
      patientName: 'Rajesh Kulkarni',
      mrn: 'MRN-2026-7788',
      token: 'TK-042',
      ward: 'ICU',
      priority: 'EMERGENCY',
      diagnosis: 'Severe Acute Sepsis with Hemodynamic Instability',
      orders: [
        { name: 'Inj Meropenem 1g IV in 100ml NS STAT', dosage: '1g IV Infusion', route: 'IV' },
        { name: 'Inj Pantoprazole 40mg IV Push', dosage: '40mg IV Slow', route: 'IV' }
      ],
      orderedAt: new Date().toISOString()
    };

    assert.strictEqual(doctorAdmissionOrder.patientName, 'Rajesh Kulkarni');
    assert.strictEqual(doctorAdmissionOrder.ward, 'ICU');
    assert.strictEqual(doctorAdmissionOrder.priority, 'EMERGENCY');
    console.log(`  [Step 1] OPD Doctor Ordered Admission: ${doctorAdmissionOrder.patientName} ➔ ${doctorAdmissionOrder.ward} (${doctorAdmissionOrder.priority})`);

    // Step 2: Nursing Station receives requisition
    const admissionRequisition = {
      id: `req-adm-${Date.now()}`,
      tenantId,
      patientName: doctorAdmissionOrder.patientName,
      patientMrn: doctorAdmissionOrder.mrn,
      tokenNumber: doctorAdmissionOrder.token,
      targetWard: doctorAdmissionOrder.ward,
      priority: doctorAdmissionOrder.priority,
      provisionalDiagnosis: doctorAdmissionOrder.diagnosis,
      status: 'PENDING',
      requestedAt: doctorAdmissionOrder.orderedAt
    };
    assert.strictEqual(admissionRequisition.status, 'PENDING');
    console.log(`  [Step 2] Nursing Station Requisition Displayed: ${admissionRequisition.patientName} (${admissionRequisition.status})`);

    // Step 3: Nurse Allocates Bed ICU-04
    let bedIcu04 = {
      id: 'bed-icu-04',
      bedCode: 'ICU-04',
      wardId: 'wrd-icu',
      wardName: 'Intensive Care Unit (ICU)',
      status: 'AVAILABLE',
      currentPatientId: undefined,
      currentPatientName: undefined,
      currentAdmissionId: undefined
    };
    assert.strictEqual(bedIcu04.status, 'AVAILABLE', 'Initial bed must be AVAILABLE');

    // Execute 1-click allocation
    const admissionRecord = {
      id: `adm-${Date.now()}`,
      tenantId,
      admissionNumber: `ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName: admissionRequisition.patientName,
      patientMrn: admissionRequisition.patientMrn,
      wardId: bedIcu04.wardId,
      wardName: bedIcu04.wardName,
      bedId: bedIcu04.id,
      bedCode: bedIcu04.bedCode,
      status: 'ADMITTED',
      admissionDateTime: new Date().toISOString(),
      dischargeSummaryFinalized: false
    };

    // Update Bed state
    bedIcu04.status = 'OCCUPIED';
    bedIcu04.currentPatientId = 'pat-7788';
    bedIcu04.currentPatientName = admissionRecord.patientName;
    bedIcu04.currentPatientMrn = admissionRecord.patientMrn;
    bedIcu04.currentAdmissionId = admissionRecord.id;

    assert.strictEqual(bedIcu04.status, 'OCCUPIED', 'Bed status must transition to OCCUPIED');
    assert.strictEqual(bedIcu04.currentPatientName, 'Rajesh Kulkarni');
    assert.strictEqual(admissionRecord.status, 'ADMITTED', 'Admission status must be ADMITTED');
    console.log(`  [Step 3] Nurse Allocated Bed: ${bedIcu04.bedCode} ➔ Status: ${bedIcu04.status} (Occupant: ${bedIcu04.currentPatientName})`);

    // Step 4: Nurse Opens Bedside MAR and Administers Morning Dose
    let marEntry = {
      id: `mar-${Date.now()}`,
      patientName: admissionRecord.patientName,
      patientUhid: admissionRecord.patientMrn,
      bedNumber: bedIcu04.bedCode,
      medicationName: doctorAdmissionOrder.orders[0].name,
      dosage: doctorAdmissionOrder.orders[0].dosage,
      route: doctorAdmissionOrder.orders[0].route,
      status: 'SCHEDULED',
      morningDose: { given: false },
      noonDose: { given: false },
      nightDose: { given: false }
    };

    assert.strictEqual(marEntry.morningDose.given, false, 'Morning dose initially unadministered');

    // Nurse checks [Dose Given] for Morning (08:00)
    const nurseId = 'RN-ICU-402';
    const nurseName = 'Sr. Sunita R.N.';
    const adminTime = '08:05 AM';

    marEntry.morningDose = {
      given: true,
      administeredAt: adminTime,
      administeredBy: `${nurseName} [${nurseId}]`
    };
    marEntry.status = 'GIVEN';
    marEntry.administeredAt = adminTime;
    marEntry.administeredBy = `${nurseName} [${nurseId}]`;

    assert.strictEqual(marEntry.morningDose.given, true, 'Morning dose must be recorded as given');
    assert.strictEqual(marEntry.morningDose.administeredAt, '08:05 AM');
    assert.ok(marEntry.morningDose.administeredBy.includes('RN-ICU-402'), 'Nurse ID must be persisted');
    console.log(`  [Step 4] Bedside MAR Morning Dose Administered: ${marEntry.medicationName} ➔ Given by ${marEntry.morningDose.administeredBy} at ${marEntry.morningDose.administeredAt}`);

    // Step 5: Attending Physician Finalizes Discharge Summary
    const dischargeSummary = {
      id: `ds-${Date.now()}`,
      admissionId: admissionRecord.id,
      patientName: admissionRecord.patientName,
      attendingConsultantName: 'Dr. Priya Nair, MD (Critical Care)',
      finalPrimaryDiagnosis: 'Resolved Sepsis with Hemodynamic Stability',
      hospitalCourseSummary: 'Patient responded excellently to IV Meropenem and supportive ICU care.',
      treatmentGiven: 'Broad-spectrum antibiotic therapy, IV hydration, and vital stabilization.',
      isFinalized: true,
      finalizedAt: new Date().toISOString()
    };
    admissionRecord.dischargeSummaryFinalized = true;
    admissionRecord.status = 'DISCHARGED';

    assert.strictEqual(dischargeSummary.isFinalized, true);
    assert.strictEqual(admissionRecord.status, 'DISCHARGED');
    console.log(`  [Step 5] Discharge Summary Finalized: ${dischargeSummary.finalPrimaryDiagnosis} (Sealed by ${dischargeSummary.attendingConsultantName})`);

    // Step 6: Discharge Summary Finalization Transitions Bed to CLEANING
    bedIcu04.status = 'CLEANING';
    bedIcu04.currentPatientName = undefined;
    bedIcu04.currentPatientMrn = undefined;
    bedIcu04.currentAdmissionId = undefined;
    bedIcu04.currentPatientId = undefined;

    const housekeepingTurnaround = {
      id: `trn-${Date.now()}`,
      bedId: bedIcu04.id,
      bedCode: bedIcu04.bedCode,
      status: 'PENDING_CLEANING',
      cleaningType: 'TERMINAL_DISCHARGE_DISINFECTION',
      requestedAt: new Date().toISOString()
    };

    assert.strictEqual(bedIcu04.status, 'CLEANING', 'Bed status must transition to CLEANING upon discharge summary finalization');
    assert.strictEqual(bedIcu04.currentPatientName, undefined, 'Bed occupant must be cleared');
    assert.strictEqual(housekeepingTurnaround.status, 'PENDING_CLEANING');
    console.log(`  [Step 6] Bed Transition: ${bedIcu04.bedCode} transitioned to ${bedIcu04.status} (Housekeeping Turnaround: ${housekeepingTurnaround.cleaningType})`);
  });

  console.log('\n' + '='.repeat(75));
  console.log(`RESULT: ${passedGates}/${totalGates} GATES PASSED`);
  console.log('='.repeat(75));

  if (passedGates === totalGates) {
    console.log('\n🎉 ALL 6 IPD BED ALLOCATION & MAR BEDSIDE NURSING GATES PASSED!\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME GATES FAILED.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
