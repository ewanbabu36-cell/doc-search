import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === '.turbo') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk('.');
console.log(`Total scanned source files: ${allFiles.length}`);

const findings = {
  localStorageWrites: [],
  mockFallbackUsage: [],
  hardcodedEndpoints: [],
  missingErrorHandling: [],
  unwiredEvents: [],
  missingPgPersistence: []
};

for (const file of allFiles) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (line.includes('localStorage.setItem(') && !file.includes('test') && !file.includes('mock')) {
      findings.localStorageWrites.push({ file, lineNum, line: line.trim() });
    }
    if (line.includes('isMockFallbackAllowed()') && !file.includes('test')) {
      findings.mockFallbackUsage.push({ file, lineNum, line: line.trim() });
    }
    if ((line.includes('http://127.0.0.1:') || line.includes('http://localhost:')) && !file.includes('test') && !file.includes('check-ports')) {
      findings.hardcodedEndpoints.push({ file, lineNum, line: line.trim() });
    }
    if (line.includes('// Local/graceful database fallback') || line.includes('// ignore') || line.includes('catch {}')) {
      findings.missingErrorHandling.push({ file, lineNum, line: line.trim() });
    }
  });
}

console.log(`LocalStorage raw writes (potential data loss on tab clear): ${findings.localStorageWrites.length}`);
console.log(`Mock fallback checks in production services: ${findings.mockFallbackUsage.length}`);
console.log(`Hardcoded localhost/127.0.0.1 IP/port occurrences: ${findings.hardcodedEndpoints.length}`);
console.log(`Silent catch blocks or empty error fallbacks: ${findings.missingErrorHandling.length}`);

// Sample top files with localStorage writes
const storageByFile = {};
findings.localStorageWrites.forEach(f => {
  storageByFile[f.file] = (storageByFile[f.file] || 0) + 1;
});
console.log('\nTop files relying on localStorage writes:');
Object.entries(storageByFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([f, count]) => console.log(`  ${count} writes -> ${f}`));
