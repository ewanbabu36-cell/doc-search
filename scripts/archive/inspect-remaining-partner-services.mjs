import fs from 'node:fs';

const services = [
  'partner-foundation-service.ts',
  'staff-administration-service.ts',
  'doctor-roster-service.ts',
  'patient-registration-service.ts',
  'encounter-service.ts',
  'clinical-consultation-service.ts',
  'radiology-management-service.ts',
  'dietary-management-service.ts',
  'executive-command-service.ts',
  'abdm-fhir-service.ts',
  'telemedicine-rpm-service.ts',
  'whatsapp-portal-service.ts'
];

for (const s of services) {
  const p = `apps/partner-platform/src/services/${s}`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const mockImports = content.match(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/g);
  console.log(`=== ${s} ===`);
  if (mockImports) {
    console.log(mockImports.join('\n'));
  }
}

// Also check ai-cdss
const pAi = 'apps/partner-platform/src/services/ai-cdss-service.ts';
if (fs.existsSync(pAi)) {
  const content = fs.readFileSync(pAi, 'utf8');
  const mockImports = content.match(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/g);
  console.log(`=== ai-cdss-service.ts ===`);
  if (mockImports) console.log(mockImports.join('\n'));
} else {
  console.log('ai-cdss-service.ts does not exist, let us check who imports mock-ai-cdss-data.ts');
}
