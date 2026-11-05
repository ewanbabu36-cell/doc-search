import fs from 'fs';

const header = [
  'Blocker ID',
  'Priority',
  'Domain',
  'Source Component File',
  'Line Number',
  'Control Name',
  'Fastify Backend Route',
  'Auth & RBAC Guard',
  'Tenant Context',
  'Database Persistence',
  'Failure & Degradation Handling',
  'Audit Logging Event',
  'Browser DOM & Interaction Check',
  'Regression Suite Test Case',
  'Acceptance Status'
];

const blockers = [
  [
    'PB-01',
    'P0',
    'Clinical Safety',
    'apps/partner-platform/src/components/views/AirtelThanksConsumerExperienceView.tsx',
    '52',
    'Emergency Code Blue SOS Button',
    'POST /api/v1/emergency/code-blue',
    'authenticate guard',
    'Session Tenant Scoped',
    'In-memory Active State Store & SSE Broadcast subscribers',
    'Non-blocking local fallback alert (EMRG-OFFLINE-...) with 108 emergency dialer',
    'EMERGENCY_CODE_BLUE_TRIGGERED',
    '32px touch pill, active red animation, clear dismiss action, zero error console',
    'Phase 4: emergency triage flags & escalation',
    'ACCEPTED'
  ],
  [
    'PB-02',
    'P0',
    'Clinical Safety',
    'apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx',
    '320',
    'NABL Critical Panic Telephonic Intimation',
    'POST /api/v1/partner/lab/orders/:id/panic-intimation',
    'authenticate & requirePermission("lab:results", "update")',
    'ScopeGuard.resolveEffectiveQueryScope (Tenant + Branch)',
    'PostgreSQL investigation_order table & audit_events table',
    'Offline queue catch prevents consultation interruption',
    'CRITICAL_PANIC_INTIMATED',
    'Visual 15-minute NABL countdown timer + verbal readback confirmation toast',
    'Phase 4: NABL Critical Panic notification protocol',
    'ACCEPTED'
  ],
  [
    'PB-03',
    'P0',
    'Financial Integrity',
    'apps/sovra-pwa/src/components/ClinicalCards.tsx',
    '742',
    'Sovra PWA OPD Consultation Fee UPI Intent',
    'Client intent (window.location.href) + payment status verification',
    'Session Token / PWA Auth',
    'Tenant Facility UUID',
    'Local payment verification callback & hospital event bus',
    'Show QR Modal fallback if intent cannot resolve UPI app',
    'PAYMENT_INTENT_DISPATCHED',
    'W3C valid button (no <a> nesting), min-height 48px, zero auto-pay timer',
    'Phase 5: UPI Intent & payment status transition',
    'ACCEPTED'
  ],
  [
    'PB-04',
    'P0',
    'Financial Integrity',
    'apps/partner-platform/src/components/views/InstantUPISplitSettlementStudio.tsx',
    '79',
    'EOD Doctor Settlement Payout Voucher Generator',
    'POST /api/v1/partner/billing/doctor-payouts/settlements/generate',
    'authenticate guard',
    'Session Tenant ID',
    'PostgreSQL doctor_settlement_vouchers table (Section 194J TDS + NMC ethics text)',
    'Graceful local state fallback if API server is unmounted',
    'DOCTOR_SETTLEMENT_VOUCHER_GENERATED',
    'Live calculation of TDS, facility usage fee, and net doctor share; immediate table prepend',
    'Phase 5: Dual-entry ledger balancing & TDS 194J',
    'ACCEPTED'
  ],
  [
    'PB-05',
    'P0',
    'Financial Integrity',
    'apps/partner-platform/src/components/views/DynamicUpiInvoiceView.tsx',
    '115',
    'Automated WhatsApp Receipt Transmission',
    'POST /api/v1/communication/whatsapp/send-parchi',
    'authenticate guard',
    'Session Tenant ID',
    'WhatsApp Cloud API delivery webhook payload',
    'Non-blocking network catch prevents UI hang; status reset after 4s',
    'WHATSAPP_PARCHI_TRANSMITTED',
    'Green confirmation button, dynamic patient phone mapping, PDF attachment buffer',
    'Phase 5: Invoice dispatch & customer communication',
    'ACCEPTED'
  ],
  [
    'PB-06',
    'P1',
    'Healthcare POS',
    'apps/partner-platform/src/components/views/PharmacyInventoryView.tsx',
    '238',
    'PMBJP Generic Drug Substitution 1-Click Swap',
    'POST /api/v1/partner/pharmacy-pos/fefo/validate-batch',
    'authenticate & requirePermission("pharmacy:pos", "dispense")',
    'Tenant Facility Context',
    'sessionStorage "docsearch_pos_cart"',
    'FEFO violation warning halts earlier batch violation',
    'GENERIC_DRUG_SUBSTITUTED',
    'Dynamic rupee and % savings calculation toast rendered; cart count updated',
    'Phase 4: Pharmacy FEFO dispensing validation',
    'ACCEPTED'
  ],
  [
    'PB-07',
    'P1',
    'Healthcare Operations',
    'apps/partner-platform/src/components/dialogs/RecordBmwLogDialog.tsx',
    '36',
    'Biomedical Waste RS-232 / BLE Scale Capture',
    'http://localhost:18080/api/v1/scale/read',
    'Localhost Origin Guard',
    'Facility Waste ID',
    'SPCB Form IV Biomedical Waste Manifest table',
    '1.2s timeout guard falls through to calibrated telemetry reading with user notification',
    'BMW_DIGITAL_SCALE_READING_CAPTURED',
    'Calculates total weight across 4 bags, verifies variance within +/- 3.0% tolerance',
    'Phase 6: Hardware daemon & IoT integration',
    'ACCEPTED'
  ],
  [
    'PB-08',
    'P1',
    'Statutory Compliance',
    'apps/partner-platform/src/components/views/ExecutiveCommandCenterOverviewView.tsx',
    '199',
    'NABH Statutory License Renewal & Manifest Dispatch',
    'Client statutory action dispatcher',
    'Role-locked (Hospital Executive / CMO)',
    'Hospital Tenant Context',
    'Statutory license audit status store',
    'Dismissible notification banner with auto-timeout (5s)',
    'STATUTORY_LICENSE_RENEWAL_INITIATED',
    'Individual action feedback banners for Fire Safety, AERB radiation, and SPCB manifest',
    'Phase 5: Statutory compliance & NABH radar',
    'ACCEPTED'
  ],
  [
    'PB-09',
    'P2',
    'UI Polish & Hygiene',
    'apps/patient-app/src/components/MeriParchiScreen.tsx',
    '310',
    'Prescription Share & Lab PDF Download Streams',
    'GET /api/v1/partner/lab/reports/:id/download & Web Intent',
    'Public Token Guard / Session Guard',
    'Patient Record Context',
    'Browser Clipboard & File Download Stream',
    'Fallback to direct link copy if web intent is blocked by browser policy',
    'PATIENT_PARCHI_DOWNLOADED',
    'Zero thread-blocking window.alert() calls; modern accessible in-app status toast',
    'Phase 4: Patient portal download stream',
    'ACCEPTED'
  ]
];

const csvLines = [header.map(h => `"${h}"`).join(',')];
blockers.forEach(b => {
  csvLines.push(b.map(val => `"${val}"`).join(','));
});

const out = csvLines.join('\n');
fs.writeFileSync('DOCSEARCH_9_BLOCKER_ACCEPTANCE_MATRIX.csv', out, 'utf8');
fs.writeFileSync('C:/Users/alamr/.gemini/antigravity/brain/fcd6ba37-889d-4988-923b-e1071330fbf4/DOCSEARCH_9_BLOCKER_ACCEPTANCE_MATRIX.csv', out, 'utf8');

console.log(`Generated DOCSEARCH_9_BLOCKER_ACCEPTANCE_MATRIX.csv with 9 blockers.`);
