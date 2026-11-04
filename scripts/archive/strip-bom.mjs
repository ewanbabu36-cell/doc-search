import fs from 'node:fs';
import path from 'node:path';

const dir = 'packages/database/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

let fixedCount = 0;
for (const f of files) {
  const filePath = path.join(dir, f);
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    console.log('Stripping BOM from:', f);
    fs.writeFileSync(filePath, buf.subarray(3));
    fixedCount++;
  }
}

console.log(`BOM check complete. Fixed ${fixedCount} files.`);
