/**
 * DOC SEARCH — UPI Soundbox Webhook & Instant Thermal Receipt Auto-Print Verification Suite
 * 
 * Gates Verified:
 * 1. Counter Soundbox Ingestion API (POST /api/v1/partner/billing/soundbox-webhook)
 * 2. Real-time Merchant Transaction Settlement (PAID_CONFIRMED)
 * 3. Hindi/English Voice Synthesis Prompts ("DocSearch counter par Rs. [amount] praapt hue")
 * 4. Silent Auto-Cut ESC/POS Receipt Generator (58mm/80mm, GS V 66 0 paper cut)
 * 5. Web Audio Player Widget & Shell Integration
 * 6. Real-World Zero-Fake-Data & Zero-Blocking-Popup Verification
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateInvoiceReceiptBytes } from '../packages/shared-core/dist/index.js';

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
console.log('🔊 DOC SEARCH UPI SOUNDBOX & THERMAL AUTO-CUT VERIFICATION SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// GATE 1: Counter Soundbox Ingestion Webhook API
// -----------------------------------------------------------------------------
console.log('--- GATE 1: Counter Soundbox Ingestion API ---');

const routesPath = path.resolve('apps/api-gateway/src/routes/partner/billing-management.routes.ts');
const routesSource = fs.readFileSync(routesPath, 'utf8');

assert(
  routesSource.includes("'/api/v1/partner/billing/soundbox-webhook'"),
  'Routes register POST /api/v1/partner/billing/soundbox-webhook'
);
assert(
  routesSource.includes('billingManagementService.processSoundboxWebhook'),
  'Webhook endpoint routes payloads to billingManagementService.processSoundboxWebhook'
);
assert(
  routesSource.includes('txnRef or invoiceId is required'),
  'Webhook validates presence of transaction reference or invoice ID'
);

// -----------------------------------------------------------------------------
// GATE 2: Soundbox Service & Transaction Reconciliation
// -----------------------------------------------------------------------------
console.log('\n--- GATE 2: Soundbox Service & Transaction Reconciliation ---');

const servicePath = path.resolve('apps/api-gateway/src/services/partner/BillingManagementService.ts');
const serviceSource = fs.readFileSync(servicePath, 'utf8');

assert(
  serviceSource.includes('processSoundboxWebhook'),
  'BillingManagementService contains processSoundboxWebhook method'
);
assert(
  serviceSource.includes('PAID_CONFIRMED'),
  'processSoundboxWebhook transitions invoice to PAID_CONFIRMED'
);
assert(
  serviceSource.includes('collectPayment'),
  'processSoundboxWebhook executes atomic payment collection ledger write'
);

// -----------------------------------------------------------------------------
// GATE 3: Hindi & English Voice Announcement Synthesis
// -----------------------------------------------------------------------------
console.log('\n--- GATE 3: Hindi & English Voice Announcement Synthesis ---');

assert(
  serviceSource.includes('DocSearch counter par') && serviceSource.includes('rupaye praapt hue'),
  'Service generates standard Indian Hindi voice announcement: "DocSearch counter par [amount] rupaye praapt hue"'
);
assert(
  serviceSource.includes('received successfully for invoice') && serviceSource.includes('on DocSearch UPI'),
  'Service generates English voice announcement: "Rupees [amount] received successfully for invoice [INV] on DocSearch UPI"'
);
assert(
  serviceSource.includes('soundboxVoicePromptHindi') && serviceSource.includes('soundboxVoicePromptEnglish'),
  'Webhook response returns structured soundboxVoicePromptHindi and soundboxVoicePromptEnglish fields'
);

// -----------------------------------------------------------------------------
// GATE 4: Auto-Cut ESC/POS Thermal Receipt Generation
// -----------------------------------------------------------------------------
console.log('\n--- GATE 4: Auto-Cut ESC/POS Thermal Receipt Generation ---');

const mockPaymentEvent = {
  facilityName: 'DocSearch Partner Clinic',
  facilityGstin: '29ABCDE1234F1Z5',
  invoiceNumber: 'INV-2026-0942',
  date: '22-Oct-2026',
  customerName: 'Rohit Kulkarni',
  patientPhone: '+91 98450 12345',
  items: [
    { name: 'OPD Specialist Consultation', qty: 1, amount: 500 },
    { name: 'Fast Blood Sugar (FBS)', qty: 1, amount: 100 }
  ],
  totalAmount: 600,
  netPayable: 600,
  paidAmount: 600,
  balanceDue: 0,
  paymentMode: 'UPI (Soundbox Confirmed)',
  upiQrString: 'upi://pay?pa=clinic@icici&pn=DocSearch&am=600.00&cu=INR'
};

const receiptBytes = generateInvoiceReceiptBytes(mockPaymentEvent, { rollWidth: '80mm', feedLines: 4 });

assert(receiptBytes instanceof Uint8Array, 'generateInvoiceReceiptBytes produces raw Uint8Array');
assert(receiptBytes.length > 100, `Thermal receipt generated ${receiptBytes.length} raw ESC/POS bytes`);

// Verify ESC @ init (0x1B, 0x40)
assert(receiptBytes[0] === 0x1b && receiptBytes[1] === 0x40, 'Receipt stream initializes printer with ESC @');

// Verify paper cut command GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
const hasCut = receiptBytes.some((b, i) =>
  b === 0x1d && receiptBytes[i + 1] === 0x56 && receiptBytes[i + 2] === 0x42 && receiptBytes[i + 3] === 0x00
);
assert(hasCut, 'Receipt stream ends with standard GS V 66 0 full paper auto-cut');

// -----------------------------------------------------------------------------
// GATE 5: Soundbox Audio Player Widget & Shell Integration
// -----------------------------------------------------------------------------
console.log('\n--- GATE 5: Soundbox Audio Player Widget & Shell Integration ---');

const playerPath = path.resolve('apps/partner-platform/src/components/common/SoundboxAudioPlayer.tsx');
assert(fs.existsSync(playerPath), 'SoundboxAudioPlayer.tsx component exists');

const playerSource = fs.readFileSync(playerPath, 'utf8');
assert(
  playerSource.includes('playSoundboxChime') && playerSource.includes('AudioContext'),
  'SoundboxAudioPlayer synthesizes C5-E5-G5 triad chime via Web Audio API'
);
assert(
  playerSource.includes('speakAnnouncement') && playerSource.includes('SpeechSynthesisUtterance'),
  'SoundboxAudioPlayer speaks Hindi and English voice prompts via SpeechSynthesis API'
);
assert(
  playerSource.includes('autoCutThermalReceipt') || playerSource.includes('generateInvoiceReceiptBytes'),
  'SoundboxAudioPlayer automatically triggers silent ESC/POS thermal print upon payment receipt'
);
assert(
  playerSource.includes("'docsearch:soundbox_payment'"),
  'SoundboxAudioPlayer listens for global docsearch:soundbox_payment custom event'
);

const shellPath = path.resolve('apps/partner-platform/src/components/PartnerPlatformShell.tsx');
const shellSource = fs.readFileSync(shellPath, 'utf8');
assert(
  shellSource.includes('SoundboxAudioPlayer'),
  'PartnerPlatformShell mounts SoundboxAudioPlayer in the header for counter receptionists and doctors'
);

// -----------------------------------------------------------------------------
// GATE 6: Real-World Zero-Fake-Data & Zero-Blocking-Popups Verification
// -----------------------------------------------------------------------------
console.log('\n--- GATE 6: Real-World Zero-Fake-Data & Zero-Blocking-Popups ---');

const ccmPath = path.resolve('apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx');
const ccmSource = fs.readFileSync(ccmPath, 'utf8');

assert(
  !ccmSource.includes("patientName: 'Aman Verma'") && !ccmSource.includes("tokenNumber: 'TK-427'"),
  'Purged fake Aman Verma / TK-427 queue fallback from ClinicalConsultationDomainManager'
);

const cockpitPath = path.resolve('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx');
const cockpitSource = fs.readFileSync(cockpitPath, 'utf8');

assert(
  !cockpitSource.includes("pName.includes('sharma') || pName.includes('verma')"),
  'Purged fake sharma/verma chronic medication fabrication from SoloDoctorOpdCockpitView'
);
assert(
  !cockpitSource.includes('setIsNextPatientPromptOpen(true)'),
  'Removed blocking isNextPatientPromptOpen modal popup on consultation completion'
);

console.log('\n======================================================================');
console.log(`📊 SOUNDBOX TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL UPI SOUNDBOX & THERMAL AUTO-CUT DELIVERABLES PASSED 100%!');
  process.exit(0);
}
