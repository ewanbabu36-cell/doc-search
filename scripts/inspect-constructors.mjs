import fs from 'node:fs';

const services = [
  'ai-service.ts',
  'analytics-service.ts',
  'communication-service.ts',
  'company-admin-service.ts',
  'compliance-service.ts',
  'infrastructure-service.ts',
  'platform-engineering-service.ts',
  'product-service.ts',
  'security-service.ts',
  'support-service.ts'
];

for (const s of services) {
  const p = `apps/company-platform/src/services/${s}`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const matches = content.match(/constructor\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/);
  console.log(`=== ${s} constructor ===`);
  if (matches) {
    console.log(matches[0]);
  } else {
    console.log('No constructor');
  }
}
