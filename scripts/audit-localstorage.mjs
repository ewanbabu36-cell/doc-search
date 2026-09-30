import fs from 'node:fs';
import path from 'node:path';

const searchDirs = ['apps/partner-platform/src', 'apps/company-platform/src', 'apps/landing-page/src'];
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('localStorage.')) {
          findings.push({
            file: fullPath.replace(/\\/g, '/'),
            line: idx + 1,
            snippet: line.trim()
          });
        }
      });
    }
  }
}

for (const d of searchDirs) walk(d);

console.log(`Total localStorage references: ${findings.length}`);

// Filter for setItem
const setItemCalls = findings.filter(f => f.snippet.includes('localStorage.setItem'));
console.log(`localStorage.setItem calls: ${setItemCalls.length}`);
console.log('Unique keys saved to localStorage:');
const keys = new Set();
for (const c of setItemCalls) {
  const match = c.snippet.match(/localStorage\.setItem\(\s*['"`]([^'"`]+)['"`]/);
  if (match) {
    keys.add(match[1]);
  }
}
console.log(Array.from(keys));

fs.writeFileSync('data/localstorage-audit.json', JSON.stringify({ total: findings.length, keys: Array.from(keys), setItemCalls }, null, 2));
