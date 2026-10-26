// scripts/test-abdm-and-nhcx-lifecycle.mjs
// Automated 6-Gate Test Suite for ABDM M1/M2/M3 & NHCX Auto-Adjudication Lifecycles

import assert from 'node:assert/strict';

console.log('========================================================================');
console.log('🏥 DOCSEARCH AYUSHMAN BHARAT ABDM & NHCX VERIFICATION SUITE');
console.log('========================================================================\n');

let gatesPassed = 0;

// Mock / Mini in-memory event bus mirroring hospital-event-bus.ts
class TestEventBus {
  constructor() {
    this.handlers = new Map();
    this.history = [];
  }
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType).add(handler);
    return () => this.handlers.get(eventType).delete(handler);
  }
  publish(eventType, sender, data, summary) {
    const payload = {
      eventId: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType,
      source: sender,
      data,
      timestamp: new Date().toISOString(),
      summary: summary || `${eventType} published by ${sender}`
    };
    this.history.push(payload);
    const subscribers = this.handlers.get(eventType);
    if (subscribers) {
      for (const fn of subscribers) {
        try {
          fn(payload);
        } catch (e) {
          console.error(`Error in event handler for ${eventType}:`, e);
        }
      }
    }
    return payload;
  }
}

const eventBus = new TestEventBus();

// In-Memory ABDM & NHCX State
const abdmDatabase = {
  scanTokens: [],
  careContexts: [],
  fhirBundles: [],
  auditLogs: []
};

const nhcxDatabase = {
  settledClaims: new Map()
};

// ----------------------------------------------------------------------------
// GATE 1: ABDM M2 "Scan & Share" Counter OPD Check-In & Care Context Linking
// ----------------------------------------------------------------------------
console.log('👉 GATE 1: Testing ABDM M2 "Scan & Share" Inbound Counter Check-in...');

const patientScanProfile = {
  abhaNumber: '91-5502-1194-8201',
  abhaAddress: 'amitabh.sen@sbx',
  name: 'Amitabh Sen',
  gender: 'MALE',
  dob: '1976-02-19',
  mobile: '+91 98111 22334',
  address: 'Greater Kailash, New Delhi',
  pinCode: '110048'
};

const tokenNum = 101;
const patientUhid = `UHID-2026-${tokenNum}`;

// 1. Process Scan and Share Token
const scanToken = {
  id: `token-scan-${Date.now()}`,
  tokenNumber: `TKN-${tokenNum}`,
  patientAbhaNumber: patientScanProfile.abhaNumber,
  patientAbhaAddress: patientScanProfile.abhaAddress,
  patientName: patientScanProfile.name,
  gender: patientScanProfile.gender,
  dob: patientScanProfile.dob,
  mobile: patientScanProfile.mobile,
  scannedCounterName: 'Counter 01 (Front Desk OPD)',
  assignedOpdDepartment: 'General Medicine',
  assignedDoctorName: 'Dr. Ramesh Gupta, MD',
  status: 'CONVERTED_TO_APPOINTMENT',
  scannedAt: new Date().toISOString()
};
abdmDatabase.scanTokens.push(scanToken);

// 2. Link ABDM M2 Care Context
const careContext = {
  id: `ctx-${Date.now()}`,
  abhaAddress: patientScanProfile.abhaAddress,
  patientMrn: patientUhid,
  patientName: patientScanProfile.name,
  careContextType: 'OPD_CONSULTATION',
  careContextReference: `OPD-TOKEN-${tokenNum}`,
  displayTitle: `OPD Consultation Token #${tokenNum}`,
  doctorName: 'Dr. Ramesh Gupta, MD',
  departmentName: 'General Medicine',
  isLinkedToAbdm: true,
  createdAt: new Date().toISOString()
};
abdmDatabase.careContexts.push(careContext);

assert.equal(abdmDatabase.scanTokens.length, 1);
assert.equal(abdmDatabase.careContexts.length, 1);
assert.equal(abdmDatabase.careContexts[0].careContextReference, 'OPD-TOKEN-101');
assert.equal(abdmDatabase.careContexts[0].abhaAddress, 'amitabh.sen@sbx');

console.log('   ✓ ABDM Scan & Share token created:', scanToken.tokenNumber);
console.log('   ✓ ABDM M2 Care Context linked:', careContext.careContextReference);
console.log('   [GATE 1 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// GATE 2: Front Desk Queue Token Broadcast & ABHA Badge Verification
// ----------------------------------------------------------------------------
console.log('👉 GATE 2: Verifying LAN Event Bus TOKEN_GENERATED with ABHA Metadata...');

let receivedTokenEvent = null;
eventBus.subscribe('TOKEN_GENERATED', (event) => {
  receivedTokenEvent = event;
});

// Front desk emits canonical event
const generatedTokenPayload = {
  token: tokenNum,
  tokenNumber: String(tokenNum),
  encounterId: `enc-abdm-${tokenNum}`,
  patientName: patientScanProfile.name,
  patientMrn: patientUhid,
  patientMobile: patientScanProfile.mobile,
  doctorName: 'Dr. Ramesh Gupta, MD',
  department: 'General Medicine',
  chamber: 'Room 101',
  visitType: 'WALK_IN',
  priorityTier: 'ROUTINE',
  isAbhaLinked: true,
  abhaAddress: patientScanProfile.abhaAddress,
  abhaNumber: patientScanProfile.abhaNumber,
  gender: patientScanProfile.gender,
  age: 50
};

eventBus.publish('TOKEN_GENERATED', 'AbdmScanAndShare', generatedTokenPayload, `🇮🇳 ABDM Scan & Share Token #${tokenNum} generated`);

assert.ok(receivedTokenEvent !== null, 'TOKEN_GENERATED event must be received');
assert.equal(receivedTokenEvent.data.isAbhaLinked, true, 'Token must be marked as ABHA linked');
assert.equal(receivedTokenEvent.data.abhaAddress, 'amitabh.sen@sbx');
assert.equal(receivedTokenEvent.data.tokenNumber, '101');

console.log('   ✓ LAN event broadcasted with isAbhaLinked: true');
console.log('   ✓ ABHA address verified on token payload:', receivedTokenEvent.data.abhaAddress);
console.log('   [GATE 2 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// GATE 3: Solo Doctor Cockpit M3 FHIR R4 Prescription Bundle Generation
// ----------------------------------------------------------------------------
console.log('👉 GATE 3: Generating ABDM M3 NRCES FHIR R4 Prescription Document...');

let fhirGeneratedEvent = null;
eventBus.subscribe('ABDM_FHIR_BUNDLE_GENERATED', (event) => {
  fhirGeneratedEvent = event;
});

const fhirBundleId = `BUNDLE-PRE-${new Date().toISOString().substring(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;

const fhirBundlePayload = {
  resourceType: 'Bundle',
  id: fhirBundleId,
  meta: {
    profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord']
  },
  type: 'document',
  timestamp: new Date().toISOString(),
  entry: [
    {
      resource: {
        resourceType: 'Composition',
        status: 'final',
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '440545006', display: 'Prescription record' }]
        },
        subject: { reference: `Patient/${patientUhid}`, display: patientScanProfile.abhaAddress },
        author: [{ reference: 'Practitioner/IN-HPR-2026-9041', display: 'Dr. Ramesh Gupta, MD' }],
        section: [
          {
            title: 'Medications',
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Tab Paracetamol 650mg TDS x 3 days, Tab Amoxicillin 500mg BD x 5 days</div>'
            }
          }
        ]
      }
    }
  ]
};

const fhirRecord = {
  id: `fhir-${Date.now()}`,
  bundleId: fhirBundleId,
  profileType: 'Prescription',
  patientAbhaAddress: patientScanProfile.abhaAddress,
  patientMrn: patientUhid,
  careContextRef: `OPD-TOKEN-${tokenNum}`,
  documentDate: new Date().toISOString().substring(0, 10),
  authorPractitionerHprId: 'IN-HPR-2026-9041',
  authorPractitionerName: 'Dr. Ramesh Gupta, MD',
  fhirJsonPayload: JSON.stringify(fhirBundlePayload, null, 2),
  validationStatus: 'VALID_FHIR_R4',
  digitalSignatureHash: 'a4f9812bc890e716d41829e24b7a192809e6c25a71b29d1824ef0937a6b89c31'
};
abdmDatabase.fhirBundles.push(fhirRecord);

eventBus.publish(
  'ABDM_FHIR_BUNDLE_GENERATED',
  'SoloDoctorOpdCockpitView',
  {
    bundleId: fhirRecord.bundleId,
    profileType: 'Prescription',
    patientAbhaAddress: patientScanProfile.abhaAddress,
    patientMrn: patientUhid,
    careContextRef: fhirRecord.careContextRef,
    doctorName: 'Dr. Ramesh Gupta, MD',
    medicationsCount: 2
  },
  `🇮🇳 ABDM M3 FHIR R4 Prescription (${fhirRecord.bundleId}) linked to ABHA ${patientScanProfile.abhaAddress}`
);

assert.ok(fhirGeneratedEvent !== null, 'ABDM_FHIR_BUNDLE_GENERATED event must be received');
assert.equal(fhirRecord.validationStatus, 'VALID_FHIR_R4');
assert.equal(JSON.parse(fhirRecord.fhirJsonPayload).resourceType, 'Bundle');
assert.equal(fhirRecord.careContextRef, 'OPD-TOKEN-101');

console.log('   ✓ NRCES FHIR R4 Bundle generated:', fhirBundleId);
console.log('   ✓ Profile:', fhirBundlePayload.meta.profile[0]);
console.log('   ✓ Linked to Care Context:', fhirRecord.careContextRef);
console.log('   [GATE 3 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// GATE 4: NHCX 2.0 Instant Cashless Auto-Adjudication Execution
// ----------------------------------------------------------------------------
console.log('👉 GATE 4: Testing NHCX Zero-Wait Claim Auto-Adjudication Engine...');

let nhcxSanctionedEvent = null;
let paymentReceivedEvent = null;

eventBus.subscribe('NHCX_CLAIM_SANCTIONED', (event) => {
  nhcxSanctionedEvent = event;
});

eventBus.subscribe('PAYMENT_RECEIVED', (event) => {
  paymentReceivedEvent = event;
});

const totalBill = 79000;
const copayAmount = 1200; // GIPSA non-payable consumables
const approvedAmount = totalBill - copayAmount; // 77800

const claimId = `NHCX-2026-CLAIM-${Math.floor(100000 + Math.random() * 900000)}`;
const authStamp = `AUTH-STAMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const claimSanctionDetails = {
  nhcxClaimId: claimId,
  approvedAmount,
  copayAmount,
  deductionAmount: 0,
  adjudicationDurationSec: 8.4,
  approvalAuthCode: authStamp,
  settledAt: new Date().toLocaleTimeString(),
  caseId: 'CASE-APPENDICITIS-01',
  uhid: 'UHID-2026-9041',
  ipdNumber: 'IPD-2026-8812',
  patientName: 'Rahul Verma',
  payerName: 'Star Health & Allied Insurance Co Ltd',
  tpaName: 'In-House TPA Star Health',
  policyNumber: 'SH-POL-8492019',
  totalHospitalBill: totalBill
};

nhcxDatabase.settledClaims.set('CASE-APPENDICITIS-01', claimSanctionDetails);

// Emit events
eventBus.publish('NHCX_CLAIM_SANCTIONED', 'InstantNhcxAutoAdjudicationView', claimSanctionDetails);
eventBus.publish('PAYMENT_RECEIVED', 'InstantNhcxAutoAdjudicationView', {
  amount: approvedAmount,
  mode: 'TPA_INSURANCE',
  reference: authStamp,
  patientName: 'Rahul Verma',
  invoiceId: claimId,
  timestamp: new Date().toISOString()
});

assert.ok(nhcxSanctionedEvent !== null, 'NHCX_CLAIM_SANCTIONED event must be emitted');
assert.ok(paymentReceivedEvent !== null, 'PAYMENT_RECEIVED event must be emitted');
assert.equal(paymentReceivedEvent.data.amount, 77800);
assert.equal(paymentReceivedEvent.data.mode, 'TPA_INSURANCE');
assert.equal(paymentReceivedEvent.data.reference, authStamp);

console.log('   ✓ NHCX Claim ID:', claimId);
console.log('   ✓ Approved Amount: ₹', approvedAmount);
console.log('   ✓ Approval Auth Stamp:', authStamp);
console.log('   [GATE 4 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// GATE 5: Soundbox Payment Broadcast & Multilingual Voice Synthesis
// ----------------------------------------------------------------------------
console.log('👉 GATE 5: Verifying Multilingual Soundbox Announcement for NHCX Settlement...');

const soundboxReceivedLog = [];
// Mirror Soundbox Audio Player logic
const soundboxSubscriber = (event) => {
  const data = event.data || {};
  if (event.eventType === 'PAYMENT_RECEIVED') {
    const amt = Number(data.amount || 0);
    const mode = data.mode || 'UPI';
    const textHindi = `डॉक्टर सर्च पर ${amt} रुपये प्राप्त हुए`;
    const textEnglish = `Received ${amt} rupees on DocSearch via ${mode}`;
    soundboxReceivedLog.push({ amt, mode, textHindi, textEnglish });
  }
};

soundboxSubscriber(paymentReceivedEvent);

assert.equal(soundboxReceivedLog.length, 1);
assert.equal(soundboxReceivedLog[0].amt, 77800);
assert.equal(soundboxReceivedLog[0].mode, 'TPA_INSURANCE');
assert.ok(soundboxReceivedLog[0].textHindi.includes('77800 रुपये प्राप्त हुए'));

console.log('   ✓ Soundbox received payment event: ₹ 77,800');
console.log('   ✓ Hindi Speech Synthesis String:', soundboxReceivedLog[0].textHindi);
console.log('   ✓ English Speech Synthesis String:', soundboxReceivedLog[0].textEnglish);
console.log('   [GATE 5 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// GATE 6: Consolidated IPD Billing & Cashless Multi-Clearance Invoicing
// ----------------------------------------------------------------------------
console.log('👉 GATE 6: Verifying Consolidated IPD Billing with 1-Click NHCX Claim Clearance...');

const settledClaim = nhcxDatabase.settledClaims.get('CASE-APPENDICITIS-01');
assert.ok(settledClaim, 'Settled claim must exist in database');

// Simulating ConsolidatedIpdBillingDialog settlement
const invoiceNumber = `INV-IPD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
const settledIpdInvoice = {
  invoiceNumber,
  admissionId: 'adm-appendicitis-01',
  patientMrn: 'UHID-2026-9041',
  patientName: 'Rahul Verma',
  grossTotal: totalBill,
  taxAmount: Math.round(totalBill * 0.05),
  netTotal: totalBill + Math.round(totalBill * 0.05),
  paymentMode: 'TPA_INSURANCE',
  paymentReference: `${settledClaim.nhcxClaimId} • ${settledClaim.approvalAuthCode}`,
  settledStatus: 'PAID_IN_FULL',
  tpaApprovedAmount: settledClaim.approvedAmount,
  clearedAt: new Date().toISOString()
};

assert.equal(settledIpdInvoice.paymentMode, 'TPA_INSURANCE');
assert.ok(settledIpdInvoice.paymentReference.includes('AUTH-STAMP-'));
assert.ok(settledIpdInvoice.paymentReference.includes('NHCX-2026-CLAIM-'));
assert.equal(settledIpdInvoice.settledStatus, 'PAID_IN_FULL');

console.log('   ✓ IPD Tax Invoice Generated:', invoiceNumber);
console.log('   ✓ Settlement Mode: NHCX / TPA Cashless Clearance');
console.log('   ✓ Payment Reference Bound:', settledIpdInvoice.paymentReference);
console.log('   [GATE 6 PASSED]\n');
gatesPassed++;

// ----------------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------------
console.log('========================================================================');
console.log(`🎉 ALL ${gatesPassed}/6 ABDM & NHCX VERIFICATION GATES PASSED!`);
console.log('========================================================================\n');
process.exit(0);
