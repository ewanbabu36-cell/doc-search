import fs from 'fs';

const findings = JSON.parse(fs.readFileSync('reports/backend-logic/deep-scan-findings.json', 'utf8'));
const falseSuccess = findings.filter(f => f.type === 'FALSE_SUCCESS_IN_CATCH');

console.log(`Found ${falseSuccess.length} FALSE_SUCCESS_IN_CATCH occurrences:`);
falseSuccess.forEach(f => {
  console.log(`\nLocation: ${f.file}:${f.line}`);
  console.log(`Code: ${f.code}`);
});
