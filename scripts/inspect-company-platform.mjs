import fs from 'fs';

const report = JSON.parse(fs.readFileSync('scripts/audit-hardcoded-report.json', 'utf8'));
const cp = report['apps/company-platform/src'];

console.log('Total files in company-platform:', cp.totalFiles);
console.log('Flagged files:', cp.matchedFilesCount);
console.log('Breakdown:', cp.findingsByPattern);

const sorted = cp.fileDetails.map(f => {
  const total = f.findings.reduce((sum, item) => sum + item.count, 0);
  return {
    file: f.file,
    total,
    patterns: f.findings.map(x => `${x.pattern}: ${x.count}`).join(', ')
  };
}).sort((a,b) => b.total - a.total);

console.log('\nTop 25 files in company-platform with hardcoded/mock hits:');
sorted.slice(0, 25).forEach((x, i) => {
  console.log(`${i+1}. ${x.file} (${x.total}) -> ${x.patterns}`);
});
