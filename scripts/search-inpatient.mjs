import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) results.push(p);
  });
  return results;
}

const files = walk('apps/partner-platform/src');
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const regex = /['"`](\/api\/v1\/partner\/inpatient\/[^'"`]+)['"`]/g;
  let m;
  while ((m = regex.exec(c)) !== null) {
    console.log(`${f} -> ${m[1]}`);
  }
});
