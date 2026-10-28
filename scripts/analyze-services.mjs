import fs from 'fs';
import path from 'path';

const dir = 'apps/partner-platform/src/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

const findings = [];
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const hasLoadStored = /loadStored|localStorage\.getItem/i.test(content);
  const hasMockImport = /from ['"].*mock.*['"]/i.test(content);
  const apiMatches = content.match(/apiRequest|apiCall|fetch\(/g);
  const apiCallsCount = apiMatches ? apiMatches.length : 0;
  
  findings.push({
    file: f,
    hasLoadStored,
    hasMockImport,
    apiCallsCount,
    lines: content.split('\n').length
  });
}

console.log('=== PARTNER PLATFORM SERVICES ARCHITECTURAL SCAN ===');
console.log('Total services files:', findings.length);
console.log('');
console.log('Services with localStorage / in-memory / mock fallbacks:');
findings.filter(f => f.hasLoadStored || f.hasMockImport || f.apiCallsCount === 0)
  .sort((a,b) => b.lines - a.lines)
  .forEach(f => {
    console.log(
      f.file.padEnd(45),
      '| MockImport:', String(f.hasMockImport).padEnd(5),
      '| LoadStored:', String(f.hasLoadStored).padEnd(5),
      '| ApiCalls:', String(f.apiCallsCount).padStart(3),
      '| Lines:', f.lines
    );
  });
