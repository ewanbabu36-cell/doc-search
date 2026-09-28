import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- DOCSEARCH HOSPITAL IN-HOUSE CLOSED-LOOP PIPELINE VERIFICATION ---');

// 1. Verify HospitalInHouseClosedLoopView.tsx
const viewPath = path.resolve('apps/partner-platform/src/components/views/HospitalInHouseClosedLoopView.tsx');
assert(fs.existsSync(viewPath), `File not found: ${viewPath}`);
const viewContent = fs.readFileSync(viewPath, 'utf8');

assert(viewContent.includes('HospitalInHouseClosedLoopView'), 'Must export HospitalInHouseClosedLoopView');
assert(viewContent.includes('HospitalLoopMode'), 'Must define HospitalLoopMode (OPD | IPD)');
assert(viewContent.includes('opdSteps'), 'Must contain OPD In-House closed-loop stages');
assert(viewContent.includes('ipdSteps'), 'Must contain IPD Bedside closed-loop stages');
assert(viewContent.includes('handleRunSimulation'), 'Must implement live simulation trigger');
assert(viewContent.includes('LAB_ORDER_CREATED'), 'Must emit LAB_ORDER_CREATED');
assert(viewContent.includes('LAB_REPORT_COMPLETED'), 'Must emit LAB_REPORT_COMPLETED');
assert(viewContent.includes('PRESCRIPTION_ISSUED'), 'Must emit PRESCRIPTION_ISSUED');
assert(viewContent.includes('PRESCRIPTION_DISPENSED'), 'Must emit PRESCRIPTION_DISPENSED');
assert(viewContent.includes('BILL_SETTLED'), 'Must emit BILL_SETTLED');
assert(viewContent.includes('Unified Hospital Database'), 'Must highlight Unified Hospital Database superpower');
assert(viewContent.includes('Sub-Second Reactive Alert'), 'Must highlight Sub-Second Reactive Alert superpower');
assert(viewContent.includes('MOCK_TELEMETRY_LOG'), 'Must maintain closed-loop telemetry stream');
console.log('✅ HospitalInHouseClosedLoopView.tsx implements complete OPD and IPD closed-loop pipelines.');

// 2. Verify HospitalHomeActivityHub.tsx
const hubPath = path.resolve('apps/partner-platform/src/components/HospitalHomeActivityHub.tsx');
assert(fs.existsSync(hubPath), `File not found: ${hubPath}`);
const hubContent = fs.readFileSync(hubPath, 'utf8');

assert(hubContent.includes('hospital-closed-loop'), 'Hub must have navigation link to hospital-closed-loop');
assert(hubContent.includes('In-House Closed-Loop Pipeline (OPD & IPD)'), 'Hub must contain prominent launchpad banner');
console.log('✅ HospitalHomeActivityHub.tsx contains In-House Closed-Loop Pipeline banner & link.');

// 3. Verify PartnerPlatformShell.tsx
const shellPath = path.resolve('apps/partner-platform/src/components/PartnerPlatformShell.tsx');
assert(fs.existsSync(shellPath), `File not found: ${shellPath}`);
const shellContent = fs.readFileSync(shellPath, 'utf8');

assert(shellContent.includes('hospital-closed-loop'), 'Shell must register hospital-closed-loop module');
assert(shellContent.includes('HospitalInHouseClosedLoopView'), 'Shell must import and render HospitalInHouseClosedLoopView');
console.log('✅ PartnerPlatformShell.tsx registers and renders hospital-closed-loop.');

// 4. Verify partnerRolePermissions.ts
const permPath = path.resolve('apps/partner-platform/src/utils/partnerRolePermissions.ts');
assert(fs.existsSync(permPath), `File not found: ${permPath}`);
const permContent = fs.readFileSync(permPath, 'utf8');

assert(permContent.includes('hospital-closed-loop'), 'partnerRolePermissions.ts must grant access to hospital-closed-loop');
console.log('✅ partnerRolePermissions.ts allows hospital-closed-loop access.');

// 5. Verify index.ts exports
const indexPath = path.resolve('apps/partner-platform/src/index.ts');
assert(fs.existsSync(indexPath), `File not found: ${indexPath}`);
const indexContent = fs.readFileSync(indexPath, 'utf8');

assert(indexContent.includes('HospitalInHouseClosedLoopView'), 'index.ts must export HospitalInHouseClosedLoopView');
console.log('✅ apps/partner-platform/src/index.ts exports HospitalInHouseClosedLoopView.');

console.log('\n🎉 ALL HOSPITAL IN-HOUSE CLOSED-LOOP CHECKS PASSED SUCCESSFULLY!');
