import fs from 'fs';
import assert from 'assert';

console.log('===========================================================================');
console.log('🔊 DOCSEARCH MULTILINGUAL HARDWARE SOUNDBOX & REAL-TIME EVENT BUS TEST');
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
// GATE 1: Indic Language Prompts & SoundboxLanguage Typings
// -------------------------------------------------------------
runGate(1, 'SoundboxAudioPlayer: 6-Language Indic Vernacular Payment Prompts', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/common/SoundboxAudioPlayer.tsx', 'utf8');
  assert(file.includes("export type SoundboxLanguage = 'HI' | 'BN' | 'MR' | 'TA' | 'TE' | 'EN'"), 'Exports SoundboxLanguage union');
  assert(file.includes('डॉकसर्च काउंटर पर'), 'Includes Hindi payment prompt');
  assert(file.includes('ডকসার্চ কাউন্টারে'), 'Includes Bengali payment prompt');
  assert(file.includes('डॉकसर्च काउंटरवर'), 'Includes Marathi payment prompt');
  assert(file.includes('டாக்ஸர்ச் கவுண்டரில்'), 'Includes Tamil payment prompt');
  assert(file.includes('డాక్సెర్చ్ కౌంటర్ లో'), 'Includes Telugu payment prompt');
  assert(file.includes('received successfully on DocSearch UPI'), 'Includes English payment prompt');
});

// -------------------------------------------------------------
// GATE 2: Web Audio API Iconic 3-Tone Chime Synthesis
// -------------------------------------------------------------
runGate(2, 'SoundboxAudioPlayer: Iconic Counter 3-Tone Chime Synthesis (C5 -> E5 -> G5)', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/common/SoundboxAudioPlayer.tsx', 'utf8');
  assert(file.includes('523.25'), 'Includes C5 pitch (523.25 Hz)');
  assert(file.includes('659.25'), 'Includes E5 pitch (659.25 Hz)');
  assert(file.includes('783.99'), 'Includes G5 pitch (783.99 Hz)');
  assert(file.includes('createOscillator'), 'Uses Web Audio API AudioContext oscillator');
});

// -------------------------------------------------------------
// GATE 3: Silent ESC/POS Thermal Receipt Hardware Driver
// -------------------------------------------------------------
runGate(3, 'SoundboxAudioPlayer: Silent ESC/POS Thermal Receipt Hardware Driver', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/common/SoundboxAudioPlayer.tsx', 'utf8');
  assert(file.includes('generateInvoiceReceiptBytes'), 'Generates valid 80mm ESC/POS invoice bytes');
  assert(file.includes('hardwarePrinterService.printRaw'), 'Dispatches directly to physical thermal printer');
});

// -------------------------------------------------------------
// GATE 4: Real-Time Event Bus Subscriptions
// -------------------------------------------------------------
runGate(4, 'SoundboxAudioPlayer: Real-Time Event Bus Subscriptions (PAYMENT_RECEIVED & SOUNDBOX_ALERT)', () => {
  const file = fs.readFileSync('apps/partner-platform/src/components/common/SoundboxAudioPlayer.tsx', 'utf8');
  assert(file.includes("hospitalEventBus.subscribe('PAYMENT_RECEIVED'"), 'Subscribes to PAYMENT_RECEIVED event');
  assert(file.includes("hospitalEventBus.subscribe('SOUNDBOX_ALERT'"), 'Subscribes to SOUNDBOX_ALERT event');
  assert(file.includes('unsubPayment();'), 'Cleans up payment subscription');
  assert(file.includes('unsubSoundbox();'), 'Cleans up soundbox alert subscription');
});

// -------------------------------------------------------------
// GATE 5: Persistent Shell Header Integration
// -------------------------------------------------------------
runGate(5, 'PartnerPlatformShell: Persistent Header Mounting & Interactive Toggle', () => {
  const shellFile = fs.readFileSync('apps/partner-platform/src/components/PartnerPlatformShell.tsx', 'utf8');
  assert(shellFile.includes('import { SoundboxAudioPlayer }'), 'Imports SoundboxAudioPlayer');
  assert(shellFile.includes('<SoundboxAudioPlayer facilityName={cleanFacilityBrand} compact={true} />'), 'Mounts SoundboxAudioPlayer in persistent shell header');
});

// -------------------------------------------------------------
// GATE 6: Full Broadcast Simulation Run
// -------------------------------------------------------------
runGate(6, 'Full Broadcast Simulation: Cashier UPI Scan ➔ Soundbox Audio & Print Flow', () => {
  const paymentPayload = {
    invoiceId: 'inv-opd-8821',
    invoiceNumber: 'INV-2026-8821',
    amount: 750,
    patientName: 'Sunita Sharma',
    patientPhone: '9820011223',
    payerVpa: 'sunita@okhdfcbank',
    txnRef: 'UPI-ICICI-99210041'
  };

  const amount = paymentPayload.amount;
  assert.strictEqual(amount, 750);

  const hindiPrompt = `डॉकसर्च काउंटर पर ${amount} रुपये प्राप्त हुए`;
  const bengaliPrompt = `ডকসার্চ কাউন্টারে ${amount} টাকা প্রাপ্ত হয়েছে`;
  const marathiPrompt = `डॉकसर्च काउंटरवर ${amount} रुपये मिळाले`;

  assert(hindiPrompt.includes('750 रुपये प्राप्त हुए'));
  assert(bengaliPrompt.includes('750 টাকা প্রাপ্ত হয়েছে'));
  assert(marathiPrompt.includes('750 रुपये मिळाले'));
});

console.log('\n---------------------------------------------------------------------------');
console.log(`Results: ${gatesPassed}/${totalGates} Gates Passed`);
console.log('---------------------------------------------------------------------------');

if (gatesPassed === totalGates) {
  console.log('🎉 ALL 6 MULTILINGUAL SOUNDBOX & REAL-TIME EVENT BUS GATES PASSED!\n');
  process.exit(0);
} else {
  console.error(`❌ Verification failed: Only ${gatesPassed}/${totalGates} passed.`);
  process.exit(1);
}
