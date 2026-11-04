import fs from 'node:fs';
import path from 'node:path';

const searchDirs = [
  'apps/api-gateway/src',
  'apps/partner-platform/src',
  'apps/company-platform/src',
  'apps/landing-page/src',
  'packages/database/src',
  'packages/auth/src'
];

const patterns = [/mock/i, /fallback/i, /dummy/i, /synthetic/i, /sample_patient/i, /fake_/i];

const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(ts|tsx|js|mjs)$/.test(entry.name)) continue;
      if (entry.name.includes('.test.') || entry.name.includes('.spec.')) continue;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const pat of patterns) {
          if (pat.test(line)) {
            findings.push({
              file: fullPath.replace(/\\/g, '/'),
              line: idx + 1,
              matchedPattern: pat.toString(),
              snippet: line.trim()
            });
            break;
          }
        }
      });
    }
  }
}

for (const d of searchDirs) {
  walk(d);
}

console.log(`Total occurrences found: ${findings.length}`);

// Group by file
const grouped = {};
for (const f of findings) {
  if (!grouped[f.file]) grouped[f.file] = [];
  grouped[f.file].push(f);
}

fs.writeFileSync('data/mock-fallback-scan.json', JSON.stringify({ total: findings.length, grouped, findings }, null, 2));
console.log('Results written to data/mock-fallback-scan.json');
