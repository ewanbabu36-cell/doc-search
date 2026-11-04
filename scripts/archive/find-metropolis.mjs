import fs from 'node:fs';
import path from 'node:path';

function searchString(dir, text) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.git' && e.name !== 'dist') {
        searchString(full, text);
      }
    } else if (e.isFile()) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes(text)) {
          console.log(`FOUND "${text}" IN: ${full}`);
        }
      } catch (err) {}
    }
  }
}

console.log('Searching for "labtech@metropolis.com"...');
searchString('D:/DOC SEARCH/apps', 'labtech@metropolis.com');
searchString('D:/DOC SEARCH/packages', 'labtech@metropolis.com');

console.log('Searching for "Metropolis Diagnostics Lab"...');
searchString('D:/DOC SEARCH/apps', 'Metropolis Diagnostics Lab');
searchString('D:/DOC SEARCH/packages', 'Metropolis Diagnostics Lab');
