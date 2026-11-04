import fs from 'fs';
import path from 'path';

const query = process.argv[2];
if (!query) {
  console.log('Usage: node scripts/search-code.mjs <term>');
  process.exit(1);
}

function search(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== '.gemini') {
        search(full);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(query)) {
        console.log(full.replace(/\\/g, '/'));
      }
    }
  }
}

search('.');
