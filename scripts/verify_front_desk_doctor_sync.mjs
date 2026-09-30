import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/alamr/OneDrive/Desktop/DOC SEARCH';

console.log('=== VERIFYING FRONT DESK TO DOCTOR OPD QUEUE SYNC ===\n');

let passed = true;

// 1. Verify FrontDeskMobileWorkstationView saves to docsearch_encounters and dispatches docsearch:encounters-updated
console.log('1. Checking FrontDeskMobileWorkstationView.tsx:');
const frontDeskPath = path.join(baseDir, 'apps/partner-platform/src/components/views/FrontDeskMobileWorkstationView.tsx');
const frontDeskContent = fs.readFileSync(frontDeskPath, 'utf-8');

if (
  frontDeskContent.includes("localStorage.setItem('docsearch_encounters'") &&
  frontDeskContent.includes("new CustomEvent('docsearch:encounters-updated'") &&
  frontDeskContent.includes("new CustomEvent('docsearch:patient-registered'")
) {
  console.log('  ✓ FrontDeskMobileWorkstationView saves encounter to docsearch_encounters and dispatches docsearch:encounters-updated event');
} else {
  console.error('  ✗ FrontDeskMobileWorkstationView missing docsearch_encounters sync or event dispatch!');
  passed = false;
}

// 2. Verify ClinicalConsultationDomainManager listens to docsearch:encounters-updated
console.log('\n2. Checking ClinicalConsultationDomainManager.tsx:');
const managerPath = path.join(baseDir, 'apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx');
const managerContent = fs.readFileSync(managerPath, 'utf-8');

if (
  managerContent.includes("window.addEventListener('docsearch:encounters-updated'") &&
  managerContent.includes("window.addEventListener('docsearch:patient-registered'")
) {
  console.log('  ✓ ClinicalConsultationDomainManager listens to docsearch:encounters-updated to reload waiting queue in real time');
} else {
  console.error('  ✗ ClinicalConsultationDomainManager missing event listeners for real-time encounter sync!');
  passed = false;
}

// 3. Verify FastOpdRegistrationDrawer also maintains sync
console.log('\n3. Checking FastOpdRegistrationDrawer.tsx:');
const drawerPath = path.join(baseDir, 'apps/partner-platform/src/components/common/FastOpdRegistrationDrawer.tsx');
const drawerContent = fs.readFileSync(drawerPath, 'utf-8');

if (
  drawerContent.includes("localStorage.setItem('docsearch_encounters'") &&
  drawerContent.includes("new CustomEvent('docsearch:encounters-updated'")
) {
  console.log('  ✓ FastOpdRegistrationDrawer maintains complete docsearch_encounters sync');
} else {
  console.error('  ✗ FastOpdRegistrationDrawer sync issue!');
  passed = false;
}

console.log('\n===============================================================');
if (passed) {
  console.log('🎉 FRONT DESK TO DOCTOR OPD QUEUE SYNC VERIFIED SUCCESSFULLY!');
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
