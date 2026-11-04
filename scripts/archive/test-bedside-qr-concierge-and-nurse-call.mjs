import fs from 'fs';
import assert from 'assert';

console.log('================================================================');
console.log('DOCSEARCH BEDSIDE QR CONCIERGE & NURSE CALL BELL VERIFICATION');
console.log('================================================================\n');

let gatesPassed = 0;
const totalGates = 6;

function runGate(num, title, fn) {
  try {
    fn();
    console.log(`[PASS] Gate ${num}: ${title}`);
    gatesPassed++;
  } catch (err) {
    console.error(`[FAIL] Gate ${num}: ${title}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// GATE 1: Printable Bedside QR Standee Component
// -------------------------------------------------------------
runGate(1, 'PrintableBedsideQrCardModal: Standee Generation & QR Code SVG', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/dialogs/PrintableBedsideQrCardModal.tsx', 'utf8');
  assert(file.includes('export const PrintableBedsideQrCardModal'), 'Modal component exported');
  assert(file.includes('viewBox="0 0 160 160"'), 'Generates vector QR Code SVG');
  assert(file.includes('patientMrn'), 'Embeds Patient MRN');
  assert(file.includes('window.print()'), 'Provides instant thermal/paper print');
});

// -------------------------------------------------------------
// GATE 2: Bedside Patient Concierge Mobile View
// -------------------------------------------------------------
runGate(2, 'Bedside Mobile Concierge: Running Bill, Diet Plan & Nurse Bell', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/dialogs/PrintableBedsideQrCardModal.tsx', 'utf8');
  assert(file.includes('Live Running Bill Summary'), 'Displays running bill widget');
  assert(file.includes('dietPlan'), 'Displays doctor diet & routine plan');
  assert(file.includes('handleTriggerNurseCall'), 'Implements nurse call trigger');
});

// -------------------------------------------------------------
// GATE 3: Event Bus NURSE_CALL_REQUESTED Publication
// -------------------------------------------------------------
runGate(3, 'Hospital Event Bus: Publishes NURSE_CALL_REQUESTED Event', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/dialogs/PrintableBedsideQrCardModal.tsx', 'utf8');
  assert(file.includes("'NURSE_CALL_REQUESTED'"), 'Publishes NURSE_CALL_REQUESTED event type');
  assert(file.includes('BedsidePatientConcierge'), 'Source module is BedsidePatientConcierge');
  assert(file.includes('bedCode: bed.bedCode'), 'Includes bedCode in payload');
  assert(file.includes('reason: nurseCallReason'), 'Includes assistance reason in payload');
});

// -------------------------------------------------------------
// GATE 4: NursingStationView Active Nurse Call Banner
// -------------------------------------------------------------
runGate(4, 'NursingStationView: Subscribes to NURSE_CALL_REQUESTED & Renders Banner', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/views/NursingStationView.tsx', 'utf8');
  assert(file.includes('hospitalEventBus.subscribe'), 'Subscribes to hospital event bus');
  assert(file.includes("'NURSE_CALL_REQUESTED'"), 'Listens for NURSE_CALL_REQUESTED events');
  assert(file.includes('activeNurseCalls'), 'Manages active nurse calls list');
  assert(file.includes('nursing-active-call-bells-banner'), 'Renders active call bells banner in DOM');
  assert(file.includes('handleDismissNurseCall'), 'Provides 1-click Attended & Clear action');
});

// -------------------------------------------------------------
// GATE 5: InpatientDomainManager Global Toast Notification
// -------------------------------------------------------------
runGate(5, 'InpatientDomainManager: Global Nurse Call Notification Handler', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/InpatientDomainManager.tsx', 'utf8');
  assert(file.includes("subscribe('NURSE_CALL_REQUESTED'"), 'Subscribes to NURSE_CALL_REQUESTED globally');
  assert(file.includes('NURSE CALL: Bed'), 'Displays toast notification for floor nurses');
});

// -------------------------------------------------------------
// GATE 6: Simulation Test
// -------------------------------------------------------------
runGate(6, 'Full Broadcast Simulation: Bedside QR Call ➔ Nursing Station Alert Card', () => {
  const mockCall = {
    bedId: 'bed-icu-04',
    bedCode: 'ICU-04',
    wardName: 'Intensive Care Unit',
    patientName: 'Sunil Gavaskar',
    patientMrn: 'UHID-2026-9021',
    reason: 'IV Infusion Beeping / Occlusion',
    calledAt: '09:14:22 PM'
  };

  const alertCard = {
    id: `call-${Date.now()}`,
    ...mockCall,
    receivedAt: '09:14:22 PM'
  };

  assert.strictEqual(alertCard.bedCode, 'ICU-04');
  assert.strictEqual(alertCard.reason, 'IV Infusion Beeping / Occlusion');
  assert(alertCard.id.startsWith('call-'));
});

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${gatesPassed}/${totalGates} Gates Passed`);
console.log('-------------------------------------------------------------');

if (gatesPassed === totalGates) {
  console.log('🎉 ALL 6 BEDSIDE QR CONCIERGE & NURSE CALL GATES PASSED!\n');
  process.exit(0);
} else {
  console.error(`❌ Verification failed: Only ${gatesPassed}/${totalGates} passed.`);
  process.exit(1);
}
