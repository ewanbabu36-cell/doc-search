import fs from 'node:fs';

const scanData = JSON.parse(fs.readFileSync('data/mock-fallback-scan.json', 'utf8'));
const { findings } = scanData;

const frontendFindings = findings.filter(f => f.file.startsWith('apps/partner-platform/src') || f.file.startsWith('apps/company-platform/src'));

console.log(`Frontend occurrences: ${frontendFindings.length}`);

// Check for dangerous patterns: synthetic patient arrays, mock state initialization, mock api intercepts
const suspicious = [];
for (const f of frontendFindings) {
  const s = f.snippet.toLowerCase();
  if (
    (s.includes('patient') || s.includes('doctor') || s.includes('encounter') || s.includes('invoice') || s.includes('order')) &&
    (s.includes('const mock') || s.includes('let mock') || s.includes('var mock') || s.includes('mockpatients') || s.includes('mockdoctors') || s.includes('initialmock') || s.includes('defaultmock'))
  ) {
    suspicious.push(f);
  }
}

console.log(`Suspicious frontend mock arrays found: ${suspicious.length}`);
console.log(suspicious.map(s => `${s.file}:${s.line} -> ${s.snippet}`));

fs.writeFileSync('data/frontend-suspicious-mocks.json', JSON.stringify({ count: suspicious.length, suspicious }, null, 2));
