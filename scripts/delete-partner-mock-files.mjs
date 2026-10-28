import fs from 'node:fs';
import path from 'node:path';

const dir = 'apps/partner-platform/src/services';
const mockFiles = [
  'mock-partner-foundation-data.ts',
  'mock-staff-administration-data.ts',
  'mock-doctor-roster-data.ts',
  'mock-patient-registration-data.ts',
  'mock-encounter-data.ts',
  'mock-clinical-consultation-data.ts',
  'mock-radiology-data.ts',
  'mock-dietary-data.ts',
  'mock-executive-command-data.ts',
  'mock-abdm-fhir-data.ts',
  'mock-ai-cdss-data.ts',
  'mock-telemedicine-rpm-data.ts',
  'mock-whatsapp-portal-data.ts'
];

for (const f of mockFiles) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Deleted:', f);
  }
}
