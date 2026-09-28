import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/alamr/OneDrive/Desktop/DOC SEARCH';

console.log('=== VERIFYING UNIVERSAL STAFF DIRECTORY ACROSS ALL PROFILES ===\n');

let passed = true;

// 1. Check partnerRolePermissions.ts
const permissionsPath = path.join(baseDir, 'apps/partner-platform/src/utils/partnerRolePermissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf-8');

const requiredRolesInPermissions = [
  'DOCTOR',
  'ATTENDING_DOCTOR',
  'CONSULTANT_PHYSICIAN',
  'CLINIC_DOCTOR',
  'PATHOLOGIST',
  'LAB_TECHNICIAN',
  'RADIOLOGIST',
  'DISPENSING_PHARMACIST',
  'PHARMACIST',
  'JAN_AUSHADHI_OPERATOR',
  'BILLING_MANAGER'
];

console.log('1. Checking RBAC Permissions in partnerRolePermissions.ts:');
for (const role of requiredRolesInPermissions) {
  // Check if role has 'staff-administration' in its permissions array
  const regex = new RegExp(`${role}:[\\s\\S]*?'staff-administration'`);
  if (regex.test(permissionsContent)) {
    console.log(`  ✓ ${role} has 'staff-administration' permission`);
  } else {
    console.error(`  ✗ ${role} MISSING 'staff-administration' permission!`);
    passed = false;
  }
}

// Check authorizedAdminRoles in isPartnerModuleAllowed
if (permissionsContent.includes("moduleKey === 'staff-administration'")) {
  console.log("  ✓ isPartnerModuleAllowed has specialized handler for 'staff-administration'");
} else {
  console.error("  ✗ isPartnerModuleAllowed missing specialized handler for 'staff-administration'!");
  passed = false;
}

// 2. Check PartnerPlatformShell.tsx
console.log('\n2. Checking PartnerPlatformShell.tsx sidebar sections:');
const shellPath = path.join(baseDir, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx');
const shellContent = fs.readFileSync(shellPath, 'utf-8');

const shellChecks = [
  { name: 'Doctor Focus Mode', check: "label: 'Clinic Staff Directory'" },
  { name: 'Simple Mode', check: "label: '8. Staff & Care Team'" },
  { name: 'Clinic Workspace', check: "label: 'Clinic Staff & Care Team'" },
  { name: 'Pharmacy Workspace', check: "label: 'Chemist Staff & Cashiers'" },
  { name: 'Pathology Workspace', check: "label: 'Lab Staff & Phlebotomists'" },
  { name: 'Diagnostic Centre Workspace', check: "label: 'Radiology & Centre Team'" },
  { name: 'Hospital Workspace', check: "label: 'Staff Directory & Roles'" },
  { name: 'Enterprise Command', check: "label: 'Staff Directory & Roles'" }
];

for (const sc of shellChecks) {
  if (shellContent.includes(sc.check)) {
    console.log(`  ✓ ${sc.name} contains staff directory entry`);
  } else {
    console.error(`  ✗ ${sc.name} MISSING: ${sc.check}`);
    passed = false;
  }
}

// 3. Check Home Activity Hubs
console.log('\n3. Checking Home Activity Hubs for Staff Directory launcher buttons:');
const hubChecks = [
  {
    name: 'ClinicHomeActivityHub',
    path: 'apps/partner-platform/src/components/ClinicHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  },
  {
    name: 'PharmacyHomeActivityHub',
    path: 'apps/partner-platform/src/components/PharmacyHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  },
  {
    name: 'PathologyHomeActivityHub',
    path: 'apps/partner-platform/src/components/PathologyHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  },
  {
    name: 'DiagnosticCentreHomeActivityHub',
    path: 'apps/partner-platform/src/components/DiagnosticCentreHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  },
  {
    name: 'HospitalHomeActivityHub',
    path: 'apps/partner-platform/src/components/HospitalHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  },
  {
    name: 'EnterpriseCommandHomeActivityHub',
    path: 'apps/partner-platform/src/components/EnterpriseCommandHomeActivityHub.tsx',
    match: "onNavigateModule('staff-administration')"
  }
];

for (const hub of hubChecks) {
  const fullPath = path.join(baseDir, hub.path);
  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes(hub.match)) {
    console.log(`  ✓ ${hub.name} has onNavigateModule('staff-administration') launcher`);
  } else {
    console.error(`  ✗ ${hub.name} MISSING launcher!`);
    passed = false;
  }
}

console.log('\n===============================================================');
if (passed) {
  console.log('🎉 ALL PROFILES SUCCESSFULLY CONFIGURED WITH UNIVERSAL STAFF DIRECTORY!');
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
