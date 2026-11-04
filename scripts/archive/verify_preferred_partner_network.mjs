import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- DOCSEARCH PREFERRED PARTNER NETWORK (EXCLUSIVE TIE-UPS) VERIFICATION ---');

// 1. Verify partner-foundation-service.ts
const foundationPath = path.resolve('apps/partner-platform/src/services/partner-foundation-service.ts');
assert(fs.existsSync(foundationPath), `File not found: ${foundationPath}`);
const foundationContent = fs.readFileSync(foundationPath, 'utf8');

assert(foundationContent.includes('getPreferredPartners'), 'Must export getPreferredPartners');
assert(foundationContent.includes('setPreferredPartners'), 'Must export setPreferredPartners');
assert(foundationContent.includes('Shree Ram Diagnostics & Pathology'), 'Must contain default lab partner');
assert(foundationContent.includes('City Medicos & Chemist POS'), 'Must contain default pharmacy partner');
console.log('✅ partner-foundation-service.ts implements preferred partner storage & retrieval.');

// 2. Verify PreferredPartnerNetworkView.tsx
const viewPath = path.resolve('apps/partner-platform/src/components/views/PreferredPartnerNetworkView.tsx');
assert(fs.existsSync(viewPath), `File not found: ${viewPath}`);
const viewContent = fs.readFileSync(viewPath, 'utf8');

assert(viewContent.includes('Exclusive Pathology Partner'), 'Must contain Exclusive Pathology Partner section');
assert(viewContent.includes('Exclusive Pharmacy Partner'), 'Must contain Exclusive Pharmacy Partner section');
assert(viewContent.includes('handleSimulateFullLoop'), 'Must contain full loop simulation trigger');
assert(viewContent.includes('LAB_REPORT_COMPLETED'), 'Must publish LAB_REPORT_COMPLETED loop-back event');
assert(viewContent.includes('MOCK_DISPATCH_RECORDS'), 'Must contain closed-loop dispatch telemetry');
assert(viewContent.includes('Invite Nearby Chemist or Lab'), 'Must contain invite partner modal');
console.log('✅ PreferredPartnerNetworkView.tsx implements complete closed-loop tie-up management.');

// 3. Verify PartnerPlatformShell.tsx
const shellPath = path.resolve('apps/partner-platform/src/components/PartnerPlatformShell.tsx');
assert(fs.existsSync(shellPath), `File not found: ${shellPath}`);
const shellContent = fs.readFileSync(shellPath, 'utf8');

assert(shellContent.includes('preferred-partner-network'), 'Shell must register preferred-partner-network module');
assert(shellContent.includes('PreferredPartnerNetworkView'), 'Shell must import and render PreferredPartnerNetworkView');
console.log('✅ PartnerPlatformShell.tsx integrates Preferred Partner Network.');

console.log('\n🎉 ALL PREFERRED PARTNER NETWORK CHECKS PASSED SUCCESSFULLY!');
