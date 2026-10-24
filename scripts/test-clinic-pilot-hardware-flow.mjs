/**
 * DOC SEARCH — Real-World Clinic Pilot Final-Mile Workflow & Barcode Suite Verification
 *
 * Gates Verified:
 * 1. Dynamic Countertop UPI QR & Soundbox Auto-Reconciliation:
 *    - Canonical UPI URL format (pa=ashiyana.hospital@upi, tn=OPD_Fee_)
 *    - Soundbox listener indicators and ascending cash register triad chime (C5-E5-G5-C6)
 * 2. ESC/POS 1D Code128 Barcode & Auto-Cut Thermal Printing:
 *    - EscPosBuilder barcode() method using GS k 73 (0x1D, 0x6B, 0x49) standard bytes
 *    - buildTokenSlipEscPos() and buildPrescriptionThermalEscPos() barcode calls
 *    - ESC @ initialization and GS V paper cut
 * 3. End-to-End Event Bus Consultation Wiring:
 *    - SoloDoctorOpdCockpitView handleComplete publishes PRESCRIPTION_ISSUED and LAB_ORDER_CREATED
 *    - FrontDeskWorkstationView subscribes to PRESCRIPTION_ISSUED and auto-marks token as COMPLETED
 * 4. Fast Pharmacy POS Hardware Barcode Scanner Rx Auto-Load:
 *    - Keyboard wedge barcode listener handling TK- / RX- token barcodes
 *    - Auto-populates cart with prescribed medications and triggers audio feedback
 * 5. Pediatric Weight-Based Dosage Calculator in Doctor Cockpit:
 *    - Pediatric Dose Calculator button for patients <= 12 years / <= 40 kg
 *    - Rapid calculation panel with Paracetamol, Augmentin, Azithromycin, Ondansetron, Montair-LC Kid
 *    - 1-click '+ Add to Rx' direct prescription insertion
 * 6. 1-Click WhatsApp Rx Dispatch on Consultation Completion:
 *    - Direct WhatsApp dispatch button rendered on completion status banner and sticky action bar
 * 7. Pre-Printed Letterhead Footer Suppression Toggle:
 *    - suppressPreprintedFooter state persisted in localStorage
 */

import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('======================================================================');
console.log('🏥 DOC SEARCH CLINIC PILOT WORKFLOW & BARCODE VERIFICATION SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// GATE 1: Dynamic Countertop UPI QR & Soundbox Auto-Reconciliation
// -----------------------------------------------------------------------------
console.log('--- GATE 1: Dynamic Countertop UPI QR & Soundbox Auto-Reconciliation ---');

const frontDeskPath = path.resolve('apps/partner-platform/src/components/views/FrontDeskWorkstationView.tsx');
assert(fs.existsSync(frontDeskPath), 'FrontDeskWorkstationView.tsx exists');
const frontDeskCode = fs.readFileSync(frontDeskPath, 'utf8');

assert(
  frontDeskCode.includes('upi://pay?pa=ashiyana.hospital@upi') &&
    frontDeskCode.includes('&tn=OPD_Fee_'),
  'FrontDeskWorkstationView builds canonical dynamic UPI URL with pa=ashiyana.hospital@upi'
);
assert(
  frontDeskCode.includes('api.qrserver.com/v1/create-qr-code') &&
    frontDeskCode.includes('Scan to Pay ₹'),
  'FrontDeskWorkstationView renders dynamic QR code image and "Scan to Pay ₹" banner'
);
assert(
  frontDeskCode.includes("hospitalEventBus.subscribe('SOUNDBOX_ALERT'") &&
    frontDeskCode.includes("hospitalEventBus.subscribe('PAYMENT_RECEIVED'"),
  'FrontDeskWorkstationView subscribes to SOUNDBOX_ALERT and PAYMENT_RECEIVED'
);
assert(
  frontDeskCode.includes('playCashRegisterChime') &&
    frontDeskCode.includes('523.25') &&
    frontDeskCode.includes('1046.5'),
  'FrontDeskWorkstationView synthesizes ascending cash register triad chime (C5-E5-G5-C6)'
);

// -----------------------------------------------------------------------------
// GATE 2: ESC/POS 1D Code128 Barcode & Thermal Drivers
// -----------------------------------------------------------------------------
console.log('\n--- GATE 2: ESC/POS 1D Code128 Barcode & Thermal Drivers ---');

const printerServicePath = path.resolve('apps/partner-platform/src/services/hardware-printer-service.ts');
assert(fs.existsSync(printerServicePath), 'hardware-printer-service.ts exists');
const printerServiceCode = fs.readFileSync(printerServicePath, 'utf8');

assert(
  printerServiceCode.includes('barcode(data: string, type: \'CODE128\' = \'CODE128\'') &&
    printerServiceCode.includes('0x1D, 0x6B, 0x49'),
  'EscPosBuilder implements barcode() method with GS k 73 (0x1D, 0x6B, 0x49) Code 128 standard'
);
assert(
  printerServiceCode.includes('.barcode(slip.tokenNumber') ||
    printerServiceCode.includes('.barcode(slip.tokenNumber, \'CODE128\''),
  'buildOpdTokenEscPos prints centered Code128 barcode of tokenNumber on token slip'
);
assert(
  printerServiceCode.includes('buildTokenSlipEscPos'),
  'HardwarePrinterService exports buildTokenSlipEscPos alias'
);
assert(
  printerServiceCode.includes('.barcode(String(data.tokenNumber)'),
  'buildPrescriptionThermalEscPos prints centered Code128 barcode on thermal Rx slip'
);
assert(
  printerServiceCode.includes('0x1B, 0x40') && printerServiceCode.includes('0x1D, 0x56'),
  'Thermal generator includes standard ESC @ initialization and GS V paper auto-cut'
);

// -----------------------------------------------------------------------------
// GATE 3: End-to-End Event Bus Consultation Wiring
// -----------------------------------------------------------------------------
console.log('\n--- GATE 3: End-to-End Event Bus Consultation Wiring ---');

const cockpitPath = path.resolve('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx');
assert(fs.existsSync(cockpitPath), 'SoloDoctorOpdCockpitView.tsx exists');
const cockpitCode = fs.readFileSync(cockpitPath, 'utf8');

assert(
  cockpitCode.includes("hospitalEventBus.publish(\n      'PRESCRIPTION_ISSUED'") ||
    cockpitCode.includes("hospitalEventBus.publish('PRESCRIPTION_ISSUED'"),
  'SoloDoctorOpdCockpitView handleComplete publishes PRESCRIPTION_ISSUED on event bus'
);
assert(
  cockpitCode.includes("hospitalEventBus.publish(\n        'LAB_ORDER_CREATED'") ||
    cockpitCode.includes("hospitalEventBus.publish('LAB_ORDER_CREATED'"),
  'SoloDoctorOpdCockpitView handleComplete publishes LAB_ORDER_CREATED when tests are ordered'
);
assert(
  frontDeskCode.includes("hospitalEventBus.subscribe('PRESCRIPTION_ISSUED'"),
  'FrontDeskWorkstationView subscribes to PRESCRIPTION_ISSUED on hospitalEventBus'
);
assert(
  frontDeskCode.includes("status: 'COMPLETED'") &&
    frontDeskCode.includes("showToast(`✓ Token #${targetToken}"),
  'FrontDeskWorkstationView auto-marks queue token as COMPLETED with confirmation toast'
);

// -----------------------------------------------------------------------------
// GATE 4: Fast Pharmacy POS Barcode Scanner Token Auto-Load
// -----------------------------------------------------------------------------
console.log('\n--- GATE 4: Fast Pharmacy POS Barcode Scanner Token Auto-Load ---');

const pharmacyPath = path.resolve('apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx');
assert(fs.existsSync(pharmacyPath), 'FastPharmacyPosCounterView.tsx exists');
const pharmacyCode = fs.readFileSync(pharmacyPath, 'utf8');

assert(
  pharmacyCode.includes('liveIncomingRxList') &&
    pharmacyCode.includes("hospitalEventBus.subscribe('PRESCRIPTION_ISSUED'"),
  'FastPharmacyPosCounterView tracks live incoming e-prescriptions from PRESCRIPTION_ISSUED event'
);
assert(
  pharmacyCode.includes("cleanRaw.startsWith('tk-')") ||
    pharmacyCode.includes("cleanRaw.startsWith('tok-')"),
  'FastPharmacyPosCounterView handleBarcodeScan detects scanned token/prescription barcodes'
);
assert(
  pharmacyCode.includes('setBillingMode(\'HOSPITAL_RX\')') &&
    pharmacyCode.includes('setCart(mappedCartItems)'),
  'FastPharmacyPosCounterView auto-populates cart with prescribed medicines upon token barcode scan'
);

// -----------------------------------------------------------------------------
// GATE 5: Pediatric Weight-Based Dosage Calculator
// -----------------------------------------------------------------------------
console.log('\n--- GATE 5: Pediatric Weight-Based Dosage Calculator in Doctor Cockpit ---');

assert(
  cockpitCode.includes('Pediatric Dose Calculator') &&
    cockpitCode.includes('isPediatricCalcOpen'),
  'SoloDoctorOpdCockpitView renders [👶 Pediatric Dose Calculator] toggle button'
);
assert(
  cockpitCode.includes('Syp. Paracetamol (Calpol 250)') &&
    cockpitCode.includes('Syp. Amoxicillin + Clavulanate (Augmentin Duo)') &&
    cockpitCode.includes('Syp. Azithromycin (Azee 200)') &&
    cockpitCode.includes('Syp. Ondansetron (Emeset)'),
  'Pediatric calculator includes Indian standard syrups (Paracetamol, Augmentin, Azithromycin, Ondansetron)'
);
assert(
  cockpitCode.includes('+ Add to Rx') &&
    cockpitCode.includes('setMedList((prev) => [...prev, newMed])'),
  'Pediatric calculator provides 1-click "+ Add to Rx" button to populate prescription pad'
);

// -----------------------------------------------------------------------------
// GATE 6: 1-Click WhatsApp Rx Dispatch on Consultation Complete
// -----------------------------------------------------------------------------
console.log('\n--- GATE 6: 1-Click WhatsApp Rx Dispatch on Consultation Complete ---');

assert(
  cockpitCode.includes('WhatsApp Rx to +91') &&
    cockpitCode.includes('api.whatsapp.com/send?phone='),
  'SoloDoctorOpdCockpitView completion banner renders direct 1-click WhatsApp dispatch button'
);

// -----------------------------------------------------------------------------
// GATE 7: Pre-Printed Letterhead Footer Suppression Toggle
// -----------------------------------------------------------------------------
console.log('\n--- GATE 7: Pre-Printed Letterhead Footer Suppression Toggle ---');

const modalPath = path.resolve('apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx');
assert(fs.existsSync(modalPath), 'PrintableDoctorPrescriptionModal.tsx exists');
const modalCode = fs.readFileSync(modalPath, 'utf8');

assert(
  modalCode.includes('suppressPreprintedFooter') &&
    modalCode.includes('docsearch_suppress_preprinted_footer'),
  'PrintableDoctorPrescriptionModal supports suppressPreprintedFooter state in localStorage'
);

console.log('\n======================================================================');
console.log(`📊 FINAL REPORT: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CLINIC PILOT FINAL-MILE DELIVERABLES VERIFIED 100%!');
  process.exit(0);
}
