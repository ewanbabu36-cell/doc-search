import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'build') return;
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) results.push(p);
  });
  return results;
}

const files = [...walk('apps/partner-platform/src'), ...walk('apps/company-platform/src'), ...walk('apps/landing-page/src')];
console.log(`Scanning ${files.length} frontend source files for hardcoded MOCK_ strings...`);

const findings = [];
files.forEach(f => {
  // Exclude mock data files explicitly named mock-*.ts
  if (path.basename(f).startsWith('mock-')) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('MOCK_')) {
      findings.push({ file: f, line: idx + 1, code: l.trim() });
    }
  });
});

console.log(`Found ${findings.length} occurrences:`);
findings.forEach(f => console.log(`  ${f.file}:${f.line} -> ${f.code}`));
