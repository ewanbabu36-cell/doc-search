import fs from 'fs';
import path from 'path';

const keyword = process.argv[2] || 'encounter';

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p));
    else if (p.endsWith('.ts')) results.push(p);
  });
  return results;
}

const files = walk('apps/api-gateway/src/routes');
console.log(`Searching routes for "${keyword}"...`);
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const regex = /(fastify|app)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(c)) !== null) {
    if (m[3].toLowerCase().includes(keyword.toLowerCase())) {
      console.log(`${f} -> ${m[2].toUpperCase()} ${m[3]}`);
    }
  }
});
