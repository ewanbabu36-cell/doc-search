import fs from 'node:fs';
import path from 'node:path';

const searchDirs = ['apps/partner-platform/src/components'];
const results = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && /\.(tsx|jsx)$/.test(e.name)) {
      const code = fs.readFileSync(p, 'utf8');
      const lines = code.split('\n');
      
      // Look for elements with white or very light background that contain var(--ds-color-text-primary) or var(--ds-color-text-secondary)
      lines.forEach((l, idx) => {
        if (
          (l.includes('var(--ds-color-text-primary)') || l.includes('var(--ds-color-text-secondary)')) &&
          (l.includes('#ffffff') || l.includes('#f8fafc') || l.includes('#f1f5f9') || l.includes('bg-white') || l.includes('--ds-color-bg-surface'))
        ) {
          results.push({ file: p.replace(/\\/g, '/'), line: idx + 1, snippet: l.trim() });
        }
      });
    }
  }
}

for (const d of searchDirs) walk(d);

console.log(`Found ${results.length} direct inline conflicts.`);
results.forEach(r => console.log(`${r.file}:${r.line} -> ${r.snippet}`));
