import fs from 'fs';
import path from 'path';

function walk(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res.push(...walk(p));
    else if (p.endsWith('.ts')) res.push(p);
  });
  return res;
}

const routeFiles = walk('apps/api-gateway/src/routes');
const realCatchesWith200 = [];

for (const f of routeFiles) {
  const content = fs.readFileSync(f, 'utf8');
  // Match catch blocks
  const catchRegex = /catch\s*(?:\([^)]*\))?\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = catchRegex.exec(content)) !== null) {
    const block = match[1];
    if (block.includes('reply.status(200)') || block.includes('status(200)') || (block.includes('reply.send') && block.includes('success: true'))) {
      realCatchesWith200.push({ file: f, block: block.trim().replace(/\s+/g, ' ') });
    }
  }
}

console.log('Real catches returning 200 count:', realCatchesWith200.length);
realCatchesWith200.forEach(c => console.log(`- ${c.file} -> ${c.block.slice(0, 100)}`));
