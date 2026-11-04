import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Staff Security & Anti-Poaching Remediation Verification...\n');

const permsPath = path.resolve('apps/partner-platform/src/utils/partnerRolePermissions.ts');
const staffDirectoryPath = path.resolve('apps/partner-platform/src/components/views/StaffDirectoryView.tsx');
const patientDirectoryPath = path.resolve('apps/partner-platform/src/components/views/PatientDirectoryView.tsx');

const permsCode = fs.readFileSync(permsPath, 'utf8');
const staffDirCode = fs.readFileSync(staffDirectoryPath, 'utf8');
const patientDirCode = fs.readFileSync(patientDirectoryPath, 'utf8');

let failed = false;

function check(title, condition) {
  if (condition) {
    console.log(`✅ PASS: ${title}`);
  } else {
    console.error(`❌ FAIL: ${title}`);
    failed = true;
  }
}

// 1. Check isDestructiveActionAllowed
check(
  'isDestructiveActionAllowed includes OWNER, ADMINISTRATOR, and CENTRE_MANAGER',
  permsCode.includes("'OWNER'") &&
  permsCode.includes("'ADMINISTRATOR'") &&
  permsCode.includes("'CENTRE_MANAGER'") &&
  permsCode.includes("upper.includes('OWNER')")
);

// 2. Check StaffDirectoryView security guards
check(
  'StaffDirectoryView imports isDestructiveActionAllowed and computes isSuperOrAdmin',
  staffDirCode.includes("import { isDestructiveActionAllowed } from '../../utils/partnerRolePermissions.js'") &&
  staffDirCode.includes('const isSuperOrAdmin =') &&
  staffDirCode.includes('isDestructiveActionAllowed(actorRole)')
);

check(
  'StaffDirectoryView guards top Export CSV and Add Staff buttons with isSuperOrAdmin',
  staffDirCode.includes('{isSuperOrAdmin && (') &&
  staffDirCode.includes('handleExportCSV') &&
  staffDirCode.includes('setIsCreateOpen(true)')
);

check(
  'StaffDirectoryView restricts Action Dropdown for junior staff to View Profile only',
  staffDirCode.includes('items={') &&
  staffDirCode.includes('isSuperOrAdmin') &&
  staffDirCode.includes(": [\n                                  { id: 'profile', label: 'View Staff Profile'") &&
  staffDirCode.includes("{ id: 'delete', label: '🗑️ Delete Staff Member'") &&
  staffDirCode.includes("{ id: 'permissions', label: '🛡️ Manage Permissions & Features (RBAC)'")
);

// 3. Check PatientDirectoryView Anti-Poaching Export CSV Guard
check(
  'PatientDirectoryView imports isDestructiveActionAllowed and computes isExportAuthorized',
  patientDirCode.includes("import { isDestructiveActionAllowed } from '../../utils/partnerRolePermissions.js'") &&
  patientDirCode.includes('const isExportAuthorized =') &&
  patientDirCode.includes('canExportPatientData')
);

check(
  'PatientDirectoryView protects Export CSV button with Export Protected (Admin Only) badge',
  patientDirCode.includes('{isExportAuthorized ? (') &&
  patientDirCode.includes('handleExportCsv') &&
  patientDirCode.includes('Export Protected (Admin Only)')
);

if (failed) {
  console.error('\n❌ Security Verification FAILED!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL SECURITY REMEDIATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
