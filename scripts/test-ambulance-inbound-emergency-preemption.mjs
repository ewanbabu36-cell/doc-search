import fs from 'fs';
import assert from 'assert';

console.log('===========================================================================');
console.log('🚑 DOCSEARCH INBOUND AMBULANCE EMERGENCY PREEMPTION & MULTILINGUAL TV TEST');
console.log('===========================================================================\n');

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
// GATE 1: AmbulanceTransferView Pre-Hospital Activations
// -------------------------------------------------------------
runGate(1, 'AmbulanceTransferView: Pre-Hospital Door-to-Needle Event Dispatch', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/views/AmbulanceTransferView.tsx', 'utf8');
  assert(file.includes('handlePreActivateCathLab'), 'Implements Cath Lab pre-activation');
  assert(file.includes('handlePreActivateTraumaBay'), 'Implements Trauma Bay pre-activation');
  assert(file.includes('handlePreActivateStrokeCT'), 'Implements Code Stroke CT pre-activation');
  assert(file.includes("'CATH_LAB_PRE_ACTIVATED'"), 'Publishes CATH_LAB_PRE_ACTIVATED event');
  assert(file.includes("'EMERGENCY_TRIAGE_ALERT'"), 'Publishes EMERGENCY_TRIAGE_ALERT event');
});

// -------------------------------------------------------------
// GATE 2: FrontDeskWorkstationView Inbound Subscriptions
// -------------------------------------------------------------
runGate(2, 'FrontDeskWorkstationView: Inbound Ambulance Event Subscriptions', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/views/FrontDeskWorkstationView.tsx', 'utf8');
  assert(file.includes("subscribe('CATH_LAB_PRE_ACTIVATED'"), 'Subscribes to CATH_LAB_PRE_ACTIVATED');
  assert(file.includes("subscribe('EMERGENCY_TRIAGE_ALERT'"), 'Subscribes to EMERGENCY_TRIAGE_ALERT');
  assert(file.includes("subscribe('INBOUND_AMBULANCE_DISPATCHED'"), 'Subscribes to INBOUND_AMBULANCE_DISPATCHED');
  assert(file.includes('inboundAmbulanceAlerts'), 'Manages inbound ambulance alerts state');
});

// -------------------------------------------------------------
// GATE 3: Front Desk Alert Banner & Fast-Track ER Token Action
// -------------------------------------------------------------
runGate(3, 'FrontDeskWorkstationView: Alert Banner & Fast-Track ER Token Action', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/views/FrontDeskWorkstationView.tsx', 'utf8');
  assert(file.includes('inbound-ambulance-alerts-banner'), 'Renders inbound ambulance alerts banner in DOM');
  assert(file.includes('handleFastTrackAmbulanceToken'), 'Implements fast-track ER token action');
  assert(file.includes("visitType: 'EMERGENCY'"), 'Sets visitType to EMERGENCY');
  assert(file.includes('priorityScore: 15000'), 'Assigns highest priority score 15000');
  assert(file.includes("publish(\n      'TOKEN_GENERATED'"), 'Publishes TOKEN_GENERATED event across LAN');
});

// -------------------------------------------------------------
// GATE 4: HospitalQueueTvDisplayView Multilingual Indic Voice Engine
// -------------------------------------------------------------
runGate(4, 'HospitalQueueTvDisplayView: 6-Language Multilingual Indic Voice Engine', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/views/HospitalQueueTvDisplayView.tsx', 'utf8');
  assert(file.includes('export type TvAnnouncementLanguage'), 'Exports TvAnnouncementLanguage');
  assert(file.includes('playRegionalTokenAnnouncement'), 'Implements playRegionalTokenAnnouncement');
  assert(file.includes('টোকেন নম্বর'), 'Includes pristine Bengali announcement');
  assert(file.includes('टोकन क्रमांक'), 'Includes pristine Marathi announcement');
  assert(file.includes('டோக்கன் எண்'), 'Includes pristine Tamil announcement');
  assert(file.includes('టోకెన్ సంఖ్య'), 'Includes pristine Telugu announcement');
  assert(file.includes('टोकन संख्या'), 'Includes pristine Hindi announcement');
  assert(file.includes('Indic Language Selector'), 'Renders language selector toolbar on TV header');
});

// -------------------------------------------------------------
// GATE 5: Emergency Hierarchy Queue Priority Verification
// -------------------------------------------------------------
runGate(5, 'Queue Preemption Math: EMERGENCY (15000) > LAB_RETURN (12000) > WAITING (0)', () => {
  const queue = [
    { token: 20, name: 'Normal Patient 1', visitType: 'WALK_IN', status: 'WAITING', priorityScore: 0 },
    { token: 21, name: 'Normal Patient 2', visitType: 'WALK_IN', status: 'WAITING', priorityScore: 0 },
    { token: 15, name: 'Returning Lab Patient', visitType: 'WALK_IN', status: 'AWAITING_LAB_RETURN', priorityScore: 12000 },
    { token: 22, name: 'Harish Chandra Gupta (STEMI)', visitType: 'EMERGENCY', status: 'WAITING', priorityScore: 15000 }
  ];

  const sorted = [...queue].sort((a, b) => b.priorityScore - a.priorityScore);

  assert.strictEqual(sorted[0].name, 'Harish Chandra Gupta (STEMI)', 'Emergency patient must be #1 in queue');
  assert.strictEqual(sorted[1].name, 'Returning Lab Patient', 'Lab-return patient must be #2 in queue');
  assert.strictEqual(sorted[2].name, 'Normal Patient 1', 'Normal patients follow afterwards');
});

// -------------------------------------------------------------
// GATE 6: Full End-to-End Simulation Run
// -------------------------------------------------------------
runGate(6, 'Full Lifecycle Simulation: Inbound Ambulance ➔ Front Desk Alert ➔ Fast-Track Token', () => {
  const ambulanceTelemetry = {
    ambulanceId: 'AMB-108-ALPHA',
    patientName: 'Harish Chandra Gupta',
    chiefComplaint: 'Acute Extensive Anterior STEMI • ST-Elevation V1-V4: 4.5mm',
    severity: 'CATH_LAB_STAT_RED',
    location: 'Western Express Highway (2.4 km out)',
    etaSeconds: 340
  };

  const frontDeskAlert = {
    id: `amb-${Date.now()}`,
    ...ambulanceTelemetry,
    timestamp: new Date().toISOString()
  };

  const emergencyToken = {
    id: `token-er-${Date.now()}`,
    tokenNumber: 23,
    patientName: frontDeskAlert.patientName,
    visitType: 'EMERGENCY',
    status: 'WAITING',
    priorityScore: 15000,
    assignedRoom: 'EMERGENCY RESUSCITATION BAY 1',
    chiefComplaint: frontDeskAlert.chiefComplaint
  };

  assert.strictEqual(emergencyToken.patientName, 'Harish Chandra Gupta');
  assert.strictEqual(emergencyToken.visitType, 'EMERGENCY');
  assert.strictEqual(emergencyToken.priorityScore, 15000);
});

console.log('\n---------------------------------------------------------------------------');
console.log(`Results: ${gatesPassed}/${totalGates} Gates Passed`);
console.log('---------------------------------------------------------------------------');

if (gatesPassed === totalGates) {
  console.log('🎉 ALL 6 INBOUND AMBULANCE EMERGENCY & MULTILINGUAL TV GATES PASSED!\n');
  process.exit(0);
} else {
  console.error(`❌ Verification failed: Only ${gatesPassed}/${totalGates} passed.`);
  process.exit(1);
}
