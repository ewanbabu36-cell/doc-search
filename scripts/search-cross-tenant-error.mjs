import fs from 'node:fs';
import path from 'node:path';

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      search(p);
    } else if (e.isFile() && /\.(ts|tsx|js|mjs)$/.test(e.name)) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.toLowerCase().includes('cross-tenant') || c.includes('strictly forbidden')) {
        const lines = c.split('\n');
        lines.forEach((l, i) => {
          if (l.toLowerCase().includes('cross-tenant') || l.includes('strictly forbidden')) {
            console.log(`${p}:${i+1} -> ${l.trim()}`);
          }
        });
      }
    }
  }
}

search('apps');
search('packages');
