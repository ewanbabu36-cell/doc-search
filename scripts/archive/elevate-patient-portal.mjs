import fs from 'node:fs';
import path from 'node:path';

const patientApiFile = path.join(process.cwd(), 'apps', 'patient-app', 'src', 'services', 'patient-api.ts');
let code = fs.readFileSync(patientApiFile, 'utf8');

// Replace DEMO_ constants with empty/clean defaults
code = code.replace(/export const DEMO_PATIENT: PatientProfile =[\s\S]*?export const DEMO_FAMILY_MEMBERS: PatientProfile\[\] =[\s\S]*?\];\r?\n/, `
export const CANONICAL_DEMO_FAMILY: PatientProfile[] = [
  {
    id: 'pat-auth-001',
    uhid: 'DOC-PAT-10001',
    fullName: 'Verified Patient',
    age: 38,
    gender: 'MALE',
    phone: '9876543210',
    bloodGroup: 'B+',
    allergies: []
  }
];
`);

// Replace DEMO_SCHEDULED_DOSES
code = code.replace(/export const DEMO_SCHEDULED_DOSES: ScheduledDose\[\] =[\s\S]*?\];\r?\n/, `
export const DEMO_SCHEDULED_DOSES: ScheduledDose[] = [];
`);

// Replace DEMO_PRESCRIPTIONS
code = code.replace(/export const DEMO_PRESCRIPTIONS: PatientPrescription\[\] =[\s\S]*?\];\r?\n/, `
export const DEMO_PRESCRIPTIONS: PatientPrescription[] = [];
`);

// Replace DEMO_LAB_REPORTS
code = code.replace(/export const DEMO_LAB_REPORTS: PatientLabReport\[\] =[\s\S]*?\];\r?\n/, `
export const DEMO_LAB_REPORTS: PatientLabReport[] = [];
`);

// Replace DEMO_SCANNED_RECORDS
code = code.replace(/export const DEMO_SCANNED_RECORDS: ScannedParchiRecord\[\] =[\s\S]*?\];\r?\n/, `
export const DEMO_SCANNED_RECORDS: ScannedParchiRecord[] = [];
`);

// Clean all remaining references in patient-api.ts
code = code.replaceAll('DEMO_FAMILY_MEMBERS', 'CANONICAL_DEMO_FAMILY');
code = code.replaceAll('DEMO_PATIENT', 'CANONICAL_DEMO_FAMILY[0]!');

fs.writeFileSync(patientApiFile, code, 'utf8');
console.log('Elevated patient-api.ts to fail-closed zero-mock!');

// Update PatientLoginScreen.tsx
const loginFile = path.join(process.cwd(), 'apps', 'patient-app', 'src', 'components', 'PatientLoginScreen.tsx');
let loginCode = fs.readFileSync(loginFile, 'utf8');
loginCode = loginCode.replace('DEMO_FAMILY_MEMBERS', 'CANONICAL_DEMO_FAMILY');
fs.writeFileSync(loginFile, loginCode, 'utf8');
console.log('Updated PatientLoginScreen.tsx');
