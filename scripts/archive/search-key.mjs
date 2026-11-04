import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'build') return;
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx')) results.push(p);
  });
  return results;
}

const key = 'docsearch_pending_lab_orders';
const files = walk('apps');
console.log(`Searching for "${key}" across apps (excluding node_modules)...`);
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes(key)) {
    console.log(f);
    const lines = c.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes(key)) console.log(`  L${idx + 1}: ${l.trim()}`);
    });
  }
});
