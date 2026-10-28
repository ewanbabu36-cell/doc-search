import fs from 'node:fs';

const services = [
  'infrastructure-service.ts',
  'integration-service.ts',
  'compliance-service.ts',
  'platform-engineering-service.ts',
  'ai-service.ts',
  'analytics-service.ts',
  'communication-service.ts',
  'company-admin-service.ts',
  'executive-service.ts',
  'partner-service.ts',
  'product-service.ts',
  'sales-marketing-service.ts',
  'security-service.ts',
  'subscription-service.ts',
  'support-service.ts'
];

for (const s of services) {
  const p = `apps/company-platform/src/services/${s}`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const mockImports = content.match(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/g);
  console.log(`=== ${s} ===`);
  if (mockImports) {
    console.log(mockImports.join('\n'));
  } else {
    console.log('No mock imports');
  }
}
