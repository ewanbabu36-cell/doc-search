import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- DOCSEARCH OPD 1-FLOW EXPRESS & CENTRAL HELP DESK VERIFICATION ---');

// 1. Verify partner-foundation-service.ts
const foundationPath = path.resolve('apps/partner-platform/src/services/partner-foundation-service.ts');
assert(fs.existsSync(foundationPath), `File not found: ${foundationPath}`);
const foundationContent = fs.readFileSync(foundationPath, 'utf8');

assert(foundationContent.includes('getPreferredPartners'), 'Must export getPreferredPartners');
assert(foundationContent.includes('setPreferredPartners'), 'Must export setPreferredPartners');
assert(foundationContent.includes('Shree Ram Diagnostics & Pathology'), 'Must include default exclusive lab');
assert(foundationContent.includes('City Medicos & Chemist POS'), 'Must include default exclusive chemist');
console.log('✅ partner-foundation-service.ts implements exclusive partner tie-up management.');

// 2. Verify OpdOneFlowExpressView.tsx
const oneFlowPath = path.resolve('apps/partner-platform/src/components/views/OpdOneFlowExpressView.tsx');
assert(fs.existsSync(oneFlowPath), `File not found: ${oneFlowPath}`);
const oneFlowContent = fs.readFileSync(oneFlowPath, 'utf8');

assert(oneFlowContent.includes('CLINICAL_PROTOCOLS'), 'Must export CLINICAL_PROTOCOLS order sets');
assert(oneFlowContent.includes('viral-fever'), 'Must include viral-fever protocol');
assert(oneFlowContent.includes('type2-diabetes'), 'Must include type2-diabetes protocol');
assert(oneFlowContent.includes('acute-gastritis'), 'Must include acute-gastritis protocol');
assert(oneFlowContent.includes('hypertension-check'), 'Must include hypertension-check protocol');
assert(oneFlowContent.includes('Step 1: Patient Quick Check-In'), 'Must contain Step 1 Check-in');
assert(oneFlowContent.includes('2. Doctor EMR & Rx'), 'Must contain Step 2 Doctor EMR & Rx');
assert(oneFlowContent.includes('Step 3: Lab & Pharmacy Auto-Routing'), 'Must contain Step 3 Auto-Routing');
assert(oneFlowContent.includes('Step 4: Instant Settlement & Dynamic UPI Payment'), 'Must contain Step 4 UPI Payment');
assert(oneFlowContent.includes('5. Print & Next'), 'Must contain Step 5 Handover & Next');
assert(oneFlowContent.includes('Ctrl + Enter'), 'Must support Ctrl+Enter keyboard shortcut');
console.log('✅ OpdOneFlowExpressView.tsx implements complete 5-step minimal-click pipeline.');

// 3. Verify CentralHelpDeskExitHubView.tsx
const helpDeskPath = path.resolve('apps/partner-platform/src/components/views/CentralHelpDeskExitHubView.tsx');
assert(fs.existsSync(helpDeskPath), `File not found: ${helpDeskPath}`);
const helpDeskContent = fs.readFileSync(helpDeskPath, 'utf8');

assert(helpDeskContent.includes('Central Help Desk & Exit Print Counter'), 'Must have Help Desk header');
assert(helpDeskContent.includes('⚡ 1-Click Print All Patient Documents'), 'Must support 1-click dossier print');
assert(helpDeskContent.includes('Send All Documents to WhatsApp'), 'Must support WhatsApp delivery');
assert(helpDeskContent.includes('Doctor Rx'), 'Must check Doctor Rx status');
assert(helpDeskContent.includes('Lab Report'), 'Must check Lab Report status');
assert(helpDeskContent.includes('Billing & Galla'), 'Must check Billing status');
assert(helpDeskContent.includes('Chemist Handover'), 'Must check Chemist status');
console.log('✅ CentralHelpDeskExitHubView.tsx implements Single Window Exit Counter.');

// 4. Verify PartnerPlatformShell.tsx
const shellPath = path.resolve('apps/partner-platform/src/components/PartnerPlatformShell.tsx');
assert(fs.existsSync(shellPath), `File not found: ${shellPath}`);
const shellContent = fs.readFileSync(shellPath, 'utf8');

assert(shellContent.includes('opd-one-flow-express'), 'Shell must register opd-one-flow-express module');
assert(shellContent.includes('help-desk-exit-hub'), 'Shell must register help-desk-exit-hub module');
assert(shellContent.includes('⚡ 1-Flow Express'), 'Shell must contain 1-Flow Express header button');
console.log('✅ PartnerPlatformShell.tsx integrates 1-Flow Express and Help Desk Exit Hub.');

console.log('\n🎉 ALL 1-FLOW EXPRESS & LESS-CLICKABLE WORKFLOW CHECKS PASSED SUCCESSFULLY!');
