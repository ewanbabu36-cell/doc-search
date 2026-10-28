import fs from 'node:fs';

const services = [
  'compliance-service.ts',
  'platform-engineering-service.ts',
  'ai-service.ts',
  'analytics-service.ts',
  'communication-service.ts',
  'company-admin-service.ts',
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
  const importMatch = content.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/);
  if (!importMatch) continue;
  const symbols = importMatch[1].split(',').map(x => x.trim()).filter(Boolean);
  console.log(`\n=== ${s} ===`);
  for (const sym of symbols) {
    const regex = new RegExp(`\\b${sym}\\b`, 'g');
    const matches = (content.match(regex) || []).length;
    console.log(`  ${sym}: ${matches} times`);
  }
}
