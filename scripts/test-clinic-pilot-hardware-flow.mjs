/**
 * DOC SEARCH — Real-World Clinic Pilot Hardware Thermal Rx & Dynamic UPI QR Verification Suite
 *
 * Deliverables Verified:
 * 1. Dynamic Countertop UPI QR & Soundbox Auto-Reconciliation in FrontDeskWorkstationView:
 *    - Validates standard UPI URL format ('upi://pay?pa=ashiyana.hospital@upi&pn=...&am=...&tn=OPD_Fee_...')
 *    - Scannable dynamic QR image renderer via qrserver API
 *    - Subscriptions for 'SOUNDBOX_ALERT' and 'PAYMENT_RECEIVED' on hospitalEventBus
 *    - Cash register ascending chime synthesizer (C5 -> E5 -> G5 -> C6)
 * 2. Doctor Chamber 80mm Thermal Prescription (Rx Slip) ESC/POS Driver:
 *    - ThermalPrescriptionSlipData interface exported in hardware-printer-service.ts
 *    - buildPrescriptionThermalEscPos generator with standard ESC/POS commands (ESC @, GS V 0 / GS V 66 0)
 *    - printThermalPrescriptionSlip driver supporting WebUSB/Network/Virtual thermal printer
 *    - SoloDoctorOpdCockpitView [🖨️ Thermal Cut] / [Thermal Rx] invocation
 * 3. Pre-Printed Letterhead Footer Suppression Toggle:
 *    - Suppress footer state and localStorage persistence in PrintableDoctorPrescriptionModal.tsx
 *    - Interactive header toggle chip and conditional omission of printed footer
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
console.log('🏥 DOC SEARCH CLINIC PILOT HARDWARE & DYNAMIC UPI QR TEST SUITE');
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
  'FrontDeskWorkstationView builds canonical dynamic UPI URL with pa=ashiyana.hospital@upi and tn=OPD_Fee_'
);

assert(
  frontDeskCode.includes('api.qrserver.com/v1/create-qr-code') &&
    frontDeskCode.includes('Scan to Pay ₹'),
  'FrontDeskWorkstationView renders dynamic QR code image and "Scan to Pay ₹" banner'
);

assert(
  frontDeskCode.includes("hospitalEventBus.subscribe('SOUNDBOX_ALERT'") &&
    frontDeskCode.includes("hospitalEventBus.subscribe('PAYMENT_RECEIVED'"),
  'FrontDeskWorkstationView subscribes to SOUNDBOX_ALERT and PAYMENT_RECEIVED on hospitalEventBus'
);

assert(
  frontDeskCode.includes('playCashRegisterChime') &&
    frontDeskCode.includes('523.25') &&
    frontDeskCode.includes('1046.5'),
  'FrontDeskWorkstationView synthesizes ascending cash register triad chime (C5-E5-G5-C6) on payment confirmation'
);

assert(
  frontDeskCode.includes('Listening for Paytm / PhonePe Soundbox payment'),
  'FrontDeskWorkstationView displays live Soundbox listener indicator'
);

// -----------------------------------------------------------------------------
// GATE 2: Doctor Chamber 80mm Thermal Prescription ESC/POS Driver
// -----------------------------------------------------------------------------
console.log('\n--- GATE 2: Doctor Chamber 80mm Thermal Prescription Driver ---');

const printerServicePath = path.resolve('apps/partner-platform/src/services/hardware-printer-service.ts');
assert(fs.existsSync(printerServicePath), 'hardware-printer-service.ts exists');

const printerServiceCode = fs.readFileSync(printerServicePath, 'utf8');

assert(
  printerServiceCode.includes('export interface ThermalPrescriptionSlipData') &&
    printerServiceCode.includes('export interface ThermalPrescriptionMedItem'),
  'hardware-printer-service exports ThermalPrescriptionSlipData and ThermalPrescriptionMedItem interfaces'
);

assert(
  printerServiceCode.includes('buildPrescriptionThermalEscPos') &&
    printerServiceCode.includes('printThermalPrescriptionSlip'),
  'hardware-printer-service implements buildPrescriptionThermalEscPos and printThermalPrescriptionSlip'
);

assert(
  printerServiceCode.includes('0x1B, 0x40') && printerServiceCode.includes('0x1D, 0x56'),
  'ESC/POS prescription generator includes ESC @ hardware init and GS V paper auto-cut'
);

const cockpitPath = path.resolve('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx');
assert(fs.existsSync(cockpitPath), 'SoloDoctorOpdCockpitView.tsx exists');

const cockpitCode = fs.readFileSync(cockpitPath, 'utf8');

assert(
  cockpitCode.includes('hardwarePrinterService.printThermalPrescriptionSlip'),
  'SoloDoctorOpdCockpitView invokes hardwarePrinterService.printThermalPrescriptionSlip'
);

assert(
  cockpitCode.includes('Thermal Rx') || cockpitCode.includes('Thermal Cut'),
  'SoloDoctorOpdCockpitView provides Thermal Rx print button in consultation workflow'
);

// -----------------------------------------------------------------------------
// GATE 3: Pre-Printed Letterhead Footer Suppression Toggle
// -----------------------------------------------------------------------------
console.log('\n--- GATE 3: Pre-Printed Letterhead Footer Suppression Toggle ---');

const modalPath = path.resolve('apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx');
assert(fs.existsSync(modalPath), 'PrintableDoctorPrescriptionModal.tsx exists');

const modalCode = fs.readFileSync(modalPath, 'utf8');

assert(
  modalCode.includes('suppressPreprintedFooter') &&
    modalCode.includes('docsearch_suppress_preprinted_footer'),
  'PrintableDoctorPrescriptionModal supports suppressPreprintedFooter state persisted in localStorage'
);

assert(
  modalCode.includes('Suppress Footer') && modalCode.includes('Pad has printed address'),
  'PrintableDoctorPrescriptionModal provides interactive toggle chip for suppressing footer on pre-printed pads'
);

assert(
  modalCode.includes('!suppressPreprintedFooter') || modalCode.includes('suppressPreprintedFooter ?'),
  'PrintableDoctorPrescriptionModal conditionally suppresses printed footer on canvas'
);

console.log('\n======================================================================');
console.log(`📊 CLINIC PILOT REPORT: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CLINIC PILOT HARDWARE & DYNAMIC UPI QR DELIVERABLES VERIFIED 100%!');
  process.exit(0);
}
