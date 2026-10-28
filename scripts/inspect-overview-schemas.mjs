import fs from 'node:fs';

const schemas = [
  'abdm-fhir-gateway.schema.ts',
  'clinical-consultation.schema.ts',
  'dietary-management.schema.ts',
  'doctor-roster.schema.ts',
  'encounter-management.schema.ts',
  'partner-foundation.schema.ts',
  'patient-registration.schema.ts',
  'radiology-management.schema.ts',
  'staff-administration.schema.ts',
  'telemedicine-rpm.schema.ts',
  'whatsapp-patient-portal.schema.ts'
];

for (const s of schemas) {
  const p = `packages/api-contracts/src/partner-platform/${s}`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const matches = content.match(/export const [A-Za-z0-9]+Overview(?:Metrics)?(?:Dto)?Schema = z\.object\(\{[\s\S]*?\}\);/g);
  console.log(`=== ${s} ===`);
  if (matches) {
    console.log(matches.join('\n\n'));
  } else {
    // look for overview
    const anyOverview = content.match(/Overview[\s\S]{1,200}?\}\);/g);
    if (anyOverview) console.log(anyOverview[0]);
  }
}
