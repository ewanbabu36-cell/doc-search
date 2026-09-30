import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('d-vs-c-comparison-report.json', 'utf8'));
console.log('SUMMARY:', JSON.stringify(report.summary, null, 2));

console.log('\n--- DIFFERENT CODE/CONFIG FILES (excluding data/) ---');
const nonDbDiffs = report.differentFiles.filter(f => !f.relPath.startsWith('data/'));
console.log('Total non-DB different files:', nonDbDiffs.length);
for (const f of nonDbDiffs) {
  console.log(' ', f.relPath, '-> newer in:', f.newer, '| C:', f.mtimeC, '| D:', f.mtimeD, '| sizeC:', f.sizeC, '| sizeD:', f.sizeD);
}

console.log('\n--- FILES ONLY IN C (excluding scratch, audit-results, data) ---');
const relevantOnlyInC = report.allOnlyInC.filter(f => !f.relPath.startsWith('audit-results/') && !f.relPath.startsWith('scratch/') && !f.relPath.startsWith('data/'));
console.log('Relevant only in C count:', relevantOnlyInC.length);
for (const f of relevantOnlyInC) {
  console.log(' ', f.relPath, f.mtimeStr, f.size);
}

console.log('\n--- FILES ONLY IN D (summary by top-level folder) ---');
const dFolderCounts = {};
for (const f of report.allOnlyInD) {
  const top = f.relPath.split('/')[0];
  dFolderCounts[top] = (dFolderCounts[top] || 0) + 1;
}
console.log('Only in D top folders:', dFolderCounts);
