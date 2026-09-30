import fs from 'fs';

const mismatches = JSON.parse(fs.readFileSync('audit-results/category-6-api-contract-mismatches.json', 'utf8')).mismatches;
const uniqueBasePaths = new Set();
for (const p of Object.keys(mismatches)) {
  let base = p.split('?')[0].split('$')[0].split(':')[0];
  if (base.endsWith('/')) base = base.slice(0, -1);
  uniqueBasePaths.add(base);
}

console.log('Unique base paths:');
for (const b of uniqueBasePaths) {
  console.log(' -', b);
}
