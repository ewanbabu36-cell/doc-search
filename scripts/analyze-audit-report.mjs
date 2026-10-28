import fs from 'fs';

const report = JSON.parse(fs.readFileSync('scripts/audit-hardcoded-report.json', 'utf8'));

console.log('========================================================================');
console.log('              MONOREPO HARDCODED / MOCK / UI AUDIT ANALYSIS             ');
console.log('========================================================================\n');

for (const [dir, d] of Object.entries(report)) {
  console.log(`\n================== ${dir} ==================`);
  console.log(`Total files: ${d.totalFiles} | Flagged files: ${d.matchedFilesCount}`);
  console.log('Findings breakdown:', JSON.stringify(d.findingsByPattern, null, 2));

  // Sort files by total findings
  const sorted = d.fileDetails.map(f => {
    const total = f.findings.reduce((sum, item) => sum + item.count, 0);
    return {
      file: f.file,
      total,
      breakdown: f.findings.map(x => `${x.pattern}: ${x.count}`).join(', '),
      samples: f.findings.map(x => `[${x.pattern}]: ${JSON.stringify(x.samples)}`).join(' | ')
    };
  }).sort((a,b) => b.total - a.total);

  console.log('\n--- Top 15 Highest Hardcoded/Mock Files ---');
  sorted.slice(0, 15).forEach((x, i) => {
    console.log(`${i+1}. ${x.file} (${x.total} findings)`);
    console.log(`   Patterns: ${x.breakdown}`);
    console.log(`   Samples: ${x.samples.slice(0, 180)}...`);
  });
}
