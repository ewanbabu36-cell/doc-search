import fs from 'fs';

const scan = JSON.parse(fs.readFileSync('data/ui-visibility-audit-scan.json', 'utf8'));

// 1. Group undefined CSS variables by variable name
const varCounts = {};
for (const item of scan.undefinedVarUsages) {
  varCounts[item.varName] = (varCounts[item.varName] || 0) + 1;
}

const sortedVars = Object.entries(varCounts).sort((a, b) => b[1] - a[1]);
console.log('=== TOP UNDEFINED CSS VARIABLES ===');
sortedVars.slice(0, 30).forEach(([name, count]) => {
  console.log(`${name.padEnd(35)} : ${count} occurrences`);
});

// Show sample occurrences of top undefined variables
console.log('\n=== SAMPLE OCCURRENCES OF TOP UNDEFINED VARIABLES ===');
const topNames = new Set(sortedVars.slice(0, 10).map(x => x[0]));
scan.undefinedVarUsages
  .filter(x => topNames.has(x.varName))
  .slice(0, 15)
  .forEach(x => {
    console.log(`[${x.varName}] in ${x.file}:${x.line}`);
    console.log(`  Code: ${x.text}`);
    console.log(`  Fallback: ${x.fallback}`);
  });

// 2. Check hardcoded white backgrounds in partner platform
console.log('\n=== HARDCODED WHITE BACKGROUNDS IN PARTNER PLATFORM ===');
scan.suspiciousHardcodedBgWhite.forEach(x => {
  console.log(`${x.file}:${x.line} -> ${x.text}`);
});
