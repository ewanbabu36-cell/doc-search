import fs from 'node:fs';
import path from 'node:path';

function searchJson(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.git' && e.name !== 'dist') {
        searchJson(full);
      }
    } else if (e.isFile() && (e.name.endsWith('.json') || e.name.endsWith('.ts') || e.name.endsWith('.js'))) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.toLowerCase().includes('metropolis')) {
          console.log(`FOUND metropolis in: ${full}`);
        }
      } catch (err) {}
    }
  }
}

searchJson('D:/DOC SEARCH/apps');
searchJson('D:/DOC SEARCH/data');
