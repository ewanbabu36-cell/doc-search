import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING SOLO DOCTOR & SAAS FEATURES ===\n');

let allPassed = true;

function checkFileContains(filePath, patterns, label) {
  console.log(`Checking ${label} (${filePath})...`);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ File not found: ${filePath}`);
    allPassed = false;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const pattern of patterns) {
    const isMatch = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
    if (!isMatch) {
      console.error(`  ❌ Missing expected pattern: ${pattern}`);
      allPassed = false;
    } else {
      console.log(`  ✓ Found: ${typeof pattern === 'string' ? pattern.slice(0, 50) : pattern}`);
    }
  }
}

// 1. PartnerPlatformShell.tsx
checkFileContains(
  path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'components', 'PartnerPlatformShell.tsx'),
  [
    'isDoctorFocusMode',
    'toggleDoctorFocusMode',
    'Solo Doctor Cockpit',
    'ACTIVE ⇄ FULL ERP',
    'Pro Clinic (Active)'
  ],
  'Solo Doctor Focus Mode & SaaS Subscription Badge'
);

// 2. DoctorExpressConsultationDesk.tsx
checkFileContains(
  path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'components', 'views', 'DoctorExpressConsultationDesk.tsx'),
  [
    'Repeat Previous Rx',
    'handleRepeatPreviousRx',
    'previousConsultation',
    'Repeat Previous Rx (1-Click)'
  ],
  '1-Click Repeat Previous Rx'
);

// 3. PrintableDoctorPrescriptionModal.tsx
checkFileContains(
  path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'components', 'dialogs', 'PrintableDoctorPrescriptionModal.tsx'),
  [
    'letterheadMode',
    'handleSelectLetterheadMode',
    'PREPRINTED_PAD',
    'Plain A4 (Full Header)',
    'Pre-Printed Pad (65mm Top Margin)',
    'preprinted-pad-spacer',
    'minHeight: \'65mm\''
  ],
  'Pre-Printed Letterhead Margin Switch'
);

// 4. PatientDirectoryView.tsx
checkFileContains(
  path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'components', 'views', 'PatientDirectoryView.tsx'),
  [
    'handleExportCsv',
    'Zero Lock-in',
    'docsearch-patient-directory-',
    'National Identifiers (ABHA / Aadhaar)',
    'Registration Date'
  ],
  '1-Click Patient Data Backup / CSV Export'
);

if (allPassed) {
  console.log('\n🎉 ALL SOLO DOCTOR & SAAS FEATURES VERIFIED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('\n❌ SOME CHECKS FAILED.');
  process.exit(1);
}
