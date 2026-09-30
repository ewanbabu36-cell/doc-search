import fs from 'fs';

const data = JSON.parse(fs.readFileSync('reports/backend-logic/baseline.json', 'utf8'));
const smells = data.logicSmells;

console.log(`Total logic smells: ${smells.length}\n`);

const byCat = {};
smells.forEach(s => {
  byCat[s.category] = (byCat[s.category] || 0) + 1;
});

console.log('Breakdown by Taxonomy Category:');
for (const [cat, count] of Object.entries(byCat)) {
  console.log(`  ${cat}: ${count}`);
}

// Inspect Category O: Mock/fallback business logic
console.log('\n=== Category O: Mock/fallback business logic ===');
const catO = smells.filter(s => s.category.includes('Mock'));
catO.slice(0, 20).forEach(s => {
  console.log(`  ${s.file}:${s.line} -> ${s.code}`);
});

// Inspect Category H: Tenant isolation / hardcoded seed IDs
console.log('\n=== Category H: Tenant isolation / hardcoded test UUIDs in production code ===');
const catH = smells.filter(s => s.category.includes('Tenant'));
console.log(`Total: ${catH.length}`);
catH.slice(0, 15).forEach(s => {
  console.log(`  ${s.file}:${s.line} -> ${s.code}`);
});

// Inspect Category N: Silent catch blocks
console.log('\n=== Category N: Silent catch blocks swallowing errors ===');
const catN = smells.filter(s => s.category.includes('error-path'));
console.log(`Total: ${catN.length}`);
catN.slice(0, 15).forEach(s => {
  console.log(`  ${s.file}:${s.line} -> ${s.code}`);
});
