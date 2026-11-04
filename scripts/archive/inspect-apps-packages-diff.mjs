import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('d-vs-c-comparison-report.json', 'utf8'));

console.log('--- SAMPLE OF APPS FILES ONLY IN D (first 30) ---');
const appsOnlyInD = report.allOnlyInD.filter(f => f.relPath.startsWith('apps/'));
console.log(`Total apps files only in D: ${appsOnlyInD.length}`);
for (const f of appsOnlyInD.slice(0, 30)) {
  console.log(' ', f.relPath);
}

console.log('\n--- SAMPLE OF PACKAGES FILES ONLY IN D (first 30) ---');
const packagesOnlyInD = report.allOnlyInD.filter(f => f.relPath.startsWith('packages/'));
console.log(`Total packages files only in D: ${packagesOnlyInD.length}`);
for (const f of packagesOnlyInD.slice(0, 30)) {
  console.log(' ', f.relPath);
}
