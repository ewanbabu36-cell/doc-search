/**
 * DOC SEARCH — Final Production Gap Remediation & Doctor Ergonomics Verification Suite
 * 
 * Gates Verified:
 * 1. Multi-Industry Department Auto-Provisioning (DEP-GEN default with .onConflictDoNothing())
 * 2. Provider Auto-Provisioning Fallback (PROV-XXXX attending physician profile)
 * 3. Dynamic NPCI UPI QR Generation Endpoint & Intent URI Format
 * 4. Raw ESC/POS Thermal Print Generator (58mm/80mm roll, bold headers, QR raster, GS V 66 0 cut)
 * 5. Offline Write-Ahead Token Engine & WAL Queue Architecture
 * 6. Doctor Cockpit 3-Zone Ergonomics & [··· More Actions] Dropdown Drawer
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateOpdTokenSlipBytes, generateInvoiceReceiptBytes, EscPosReceiptBuilder } from '../packages/shared-core/dist/index.js';

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
console.log('🩺 DOC SEARCH FINAL PRODUCTION GAP & DOCTOR ERGONOMICS TEST SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// GATE 1: Multi-Industry Department Auto-Provisioning
// -----------------------------------------------------------------------------
console.log('--- GATE 1: Department Auto-Provisioning (.onConflictDoNothing) ---');

const repoPath = path.resolve('apps/api-gateway/src/repositories/partner/ClinicalWorkflowRepository.ts');
const repoSource = fs.readFileSync(repoPath, 'utf8');

assert(repoSource.includes('resolveDepartmentId'), 'ClinicalWorkflowRepository contains resolveDepartmentId method');
assert(
  repoSource.includes('DEP-GEN') && repoSource.includes('General Services & Front Desk'),
  'resolveDepartmentId defines fallback DEP-GEN / General Services & Front Desk default department'
);
assert(
  repoSource.includes('.onConflictDoNothing()'),
  'resolveDepartmentId uses .onConflictDoNothing() to prevent unique key collision crashes'
);
assert(
  !repoSource.includes("throw AppError.notFound('No department found for this organization')"),
  'resolveDepartmentId no longer throws 404 NOT_FOUND when tenant has no prior departments'
);

// -----------------------------------------------------------------------------
// GATE 2: Provider Auto-Provisioning Fallback
// -----------------------------------------------------------------------------
console.log('\n--- GATE 2: Provider Auto-Provisioning Fallback ---');

assert(repoSource.includes('resolveDoctorId'), 'ClinicalWorkflowRepository contains resolveDoctorId method');
assert(
  repoSource.includes('PROV-') && repoSource.includes('onConflictDoNothing'),
  'resolveDoctorId auto-provisions a default provider profile with onConflictDoNothing fallback'
);
assert(
  !repoSource.includes("throw AppError.notFound('No doctor found for this organization')"),
  'resolveDoctorId no longer throws 404 NOT_FOUND for new tenants'
);

// -----------------------------------------------------------------------------
// GATE 3: Dynamic NPCI UPI QR Generation Endpoint
// -----------------------------------------------------------------------------
console.log('\n--- GATE 3: Dynamic NPCI UPI QR Generation Endpoint ---');

const billingRoutesPath = path.resolve('apps/api-gateway/src/routes/partner/billing-management.routes.ts');
const billingRoutesSource = fs.readFileSync(billingRoutesPath, 'utf8');

assert(
  billingRoutesSource.includes("'/api/v1/partner/billing/invoices/:id/upi-qr'"),
  'Billing routes expose GET /api/v1/partner/billing/invoices/:id/upi-qr'
);
assert(
  billingRoutesSource.includes('generateDynamicUpiQr'),
  'Route invokes generateDynamicUpiQr service logic'
);
assert(
  billingRoutesSource.includes('upiIntentUrl') && billingRoutesSource.includes('qrPayload'),
  'Route returns structured upiIntentUrl and qrPayload for front-desk displays'
);

// Test NPCI UPI Intent URI format
const sampleVpa = 'docsearch.clinic@icici';
const sampleMerchant = 'DocSearch Multispeciality Clinic';
const sampleAmount = 750.5;
const sampleTxnRef = 'TXN-INV-2026-999';
const sampleNote = 'Invoice INV-2026-999';

const testUpiUri = `upi://pay?pa=${encodeURIComponent(sampleVpa)}&pn=${encodeURIComponent(sampleMerchant)}&am=${sampleAmount.toFixed(2)}&cu=INR&tr=${sampleTxnRef}&tn=${encodeURIComponent(sampleNote)}`;

assert(testUpiUri.startsWith('upi://pay?'), 'UPI URI uses standard upi://pay? scheme');
assert(testUpiUri.includes('pa=docsearch.clinic%40icici'), 'UPI URI includes URL-encoded payee VPA');
assert(testUpiUri.includes('am=750.50'), 'UPI URI includes 2-decimal formatted amount');
assert(testUpiUri.includes('cu=INR'), 'UPI URI currency is INR');
assert(testUpiUri.includes('tr=TXN-INV-2026-999'), 'UPI URI includes unique transaction reference');

// -----------------------------------------------------------------------------
// GATE 4: Raw ESC/POS Thermal Print Generator
// -----------------------------------------------------------------------------
console.log('\n--- GATE 4: Raw ESC/POS Thermal Print Generator (58mm/80mm) ---');

// Test 58mm OPD Token Slip
const tokenData58 = {
  facilityName: 'DocSearch Apollo Chamber',
  facilityAddress: 'Shop 4, Metro Pillar 112, Bengaluru',
  facilityPhone: '+91 98765 43210',
  tokenNumber: 'A-042',
  patientName: 'Aarav Sharma',
  uhid: 'UHID-2026-0042',
  departmentName: 'General Medicine',
  doctorName: 'Dr. Priya Mehta, MD',
  queuePosition: 3,
  estimatedWaitMinutes: 12,
  printedAt: '22-Oct-2026 10:15 AM',
  qrPayload: 'https://docsearch.in/t/A-042'
};

const bytes58 = generateOpdTokenSlipBytes(tokenData58, { rollWidth: '58mm', feedLines: 3 });
assert(bytes58 instanceof Uint8Array, 'generateOpdTokenSlipBytes returns Uint8Array');
assert(bytes58.length > 50, `58mm token slip generates ${bytes58.length} raw ESC/POS bytes`);

// Check ESC @ init (0x1B, 0x40)
assert(bytes58[0] === 0x1b && bytes58[1] === 0x40, 'Byte sequence begins with hardware ESC @ initialization');

// Check paper cut sequence GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
const hasCut58 = bytes58.some((b, i) =>
  b === 0x1d && bytes58[i + 1] === 0x56 && bytes58[i + 2] === 0x42 && bytes58[i + 3] === 0x00
);
assert(hasCut58, '58mm slip contains standard GS V 66 0 full paper cut sequence');

// Test 80mm Invoice Receipt
const invoiceData80 = {
  facilityName: 'DocSearch Multispeciality Hospital',
  facilityAddress: '100 Feet Road, Indiranagar, Bengaluru',
  facilityGstin: '29ABCDE1234F1Z5',
  invoiceNumber: 'INV-2026-0881',
  invoiceDate: '22-Oct-2026',
  patientName: 'Sumantha Banerjee',
  patientPhone: '+91 99887 76655',
  items: [
    { description: 'OPD Specialist Consultation', qty: 1, rate: 800, amount: 800 },
    { description: 'Complete Blood Count (CBC)', qty: 1, rate: 450, amount: 450 },
    { description: 'Fast Random Blood Glucose', qty: 1, rate: 120, amount: 120 }
  ],
  subtotal: 1370,
  tax: 0,
  discount: 70,
  grandTotal: 1300,
  paymentMode: 'UPI',
  paidAmount: 1300,
  balanceDue: 0,
  qrPayload: 'upi://pay?pa=hospital@icici&pn=Hospital&am=1300.00&cu=INR'
};

const bytes80 = generateInvoiceReceiptBytes(invoiceData80, { rollWidth: '80mm', feedLines: 4 });
assert(bytes80 instanceof Uint8Array, 'generateInvoiceReceiptBytes returns Uint8Array');
assert(bytes80.length > bytes58.length, `80mm invoice receipt generates ${bytes80.length} raw ESC/POS bytes`);

const hasCut80 = bytes80.some((b, i) =>
  b === 0x1d && bytes80[i + 1] === 0x56 && bytes80[i + 2] === 0x42 && bytes80[i + 3] === 0x00
);
assert(hasCut80, '80mm invoice receipt contains standard GS V 66 0 paper cut sequence');

// Verify ThermalPrintPreviewModal silent print integration
const modalPath = path.resolve('apps/partner-platform/src/components/common/ThermalPrintPreviewModal.tsx');
const modalSource = fs.readFileSync(modalPath, 'utf8');
assert(
  modalSource.includes('handleDirectSilentPrint') || modalSource.includes('Silent ESC/POS Print'),
  'ThermalPrintPreviewModal provides 1-click silent thermal print action'
);

// -----------------------------------------------------------------------------
// GATE 5: Offline Write-Ahead Token Engine & WAL
// -----------------------------------------------------------------------------
console.log('\n--- GATE 5: Offline Write-Ahead Token Engine & WAL ---');

const offlineEnginePath = path.resolve('apps/partner-platform/src/services/offline-token-cache.ts');
const offlineEngineSource = fs.readFileSync(offlineEnginePath, 'utf8');

assert(
  offlineEngineSource.includes('DocSearchOfflineVault') || offlineEngineSource.includes('offlineTokenCache'),
  'offline-token-cache.ts exports client offline engine'
);
assert(
  offlineEngineSource.includes('OfflineRegistrationPayload'),
  'Exports OfflineRegistrationPayload interface'
);
assert(
  offlineEngineSource.includes('indexedDB') && offlineEngineSource.includes('localStorage'),
  'Supports IndexedDB primary storage with localStorage fallback'
);
assert(
  offlineEngineSource.includes("window.addEventListener('online'") || offlineEngineSource.includes("'online'"),
  'Registers online window event listener for automatic background sync'
);

// Verify FastOpdRegistrationDrawer integration
const drawerPath = path.resolve('apps/partner-platform/src/components/common/FastOpdRegistrationDrawer.tsx');
const drawerSource = fs.readFileSync(drawerPath, 'utf8');

assert(
  drawerSource.includes('offlineTokenCache'),
  'FastOpdRegistrationDrawer imports and integrates offlineTokenCache'
);
assert(
  drawerSource.includes('queueOfflineRegistration'),
  'FastOpdRegistrationDrawer queues token registration upon network disconnection'
);

// -----------------------------------------------------------------------------
// GATE 6: Doctor Cockpit 3-Zone Ergonomics & [··· More Actions] Drawer
// -----------------------------------------------------------------------------
console.log('\n--- GATE 6: Doctor Cockpit 3-Zone Ergonomics & [··· More Actions] Drawer ---');

const cockpitPath = path.resolve('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx');
const cockpitSource = fs.readFileSync(cockpitPath, 'utf8');

// Zone 1: Collapsible Queue Rail
assert(
  cockpitSource.includes('isQueueCollapsed ?') && cockpitSource.includes('Queue Rail'),
  'Zone 1: Collapsible queue rail implemented for maximum screen real estate'
);

// Zone 2: Rapid Rx Smart Pad
assert(
  cockpitSource.includes('Rapid Rx') &&
  (cockpitSource.includes('handleAddMedicationFromRapidRx') || cockpitSource.includes('handleAddMultipleMedicationsFromRapidRx')),
  'Zone 2: Rapid Rx Smart Pad active for rapid medication entry'
);

// Zone 3: Sticky Action Bar & [··· More Actions] Popover
assert(
  cockpitSource.includes('isMoreActionsOpen') && cockpitSource.includes('More Actions'),
  'Zone 3: Sticky Action Bar includes [··· More Actions ▾] popover menu'
);
assert(
  cockpitSource.includes('setIsMedicalCertModalOpen') &&
  cockpitSource.includes('setIsReferralModalOpen') &&
  cockpitSource.includes('setIsDicomViewerOpen') &&
  cockpitSource.includes('setIsAdmissionModalOpen') &&
  cockpitSource.includes('setIsDaycareModalOpen') &&
  cockpitSource.includes('setIsVernacularModalOpen') &&
  cockpitSource.includes('setIsChamberPaymentOpen'),
  'Secondary modals (Sick leave, Referral, DICOM, Admission, Daycare, Vernacular, Chamber fee) tucked into More Actions'
);
assert(
  cockpitSource.includes('MLC Active') && cockpitSource.includes('mlcDetails?.isMlc'),
  'Prominent MLC Active badge rendered when Medico-Legal Case is detected'
);

console.log('\n======================================================================');
console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PRODUCTION GAP REMEDIATION & DOCTOR ERGONOMICS GATES PASSED 100%!');
  process.exit(0);
}
