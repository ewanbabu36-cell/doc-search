import fs from 'fs';
import path from 'path';

const p = 'C:\\Users\\alamr\\AppData\\Local\\Programs\\antigravity';
let count = 0, bytes = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full);
    else if (f.isFile()) { count++; bytes += fs.statSync(full).size; }
  }
}
walk(p);
console.log(`App Binaries: files=${count} mb=${(bytes / 1024 / 1024).toFixed(2)}`);
