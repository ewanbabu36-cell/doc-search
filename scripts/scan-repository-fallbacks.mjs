import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.ts')) results.push(full);
  });
  return results;
}

const files = walk('apps/api-gateway/src/repositories');
console.log(`Scanning ${files.length} repository files for in-memory Maps and fallbacks...`);

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  const normFile = path.relative('.', file).replace(/\\/g, '/');
  lines.forEach((line, idx) => {
    if (line.includes('new Map') || line.includes('new Set') || (line.includes('catch') && line.includes('inMemory'))) {
      console.log(`${normFile}:${idx + 1} -> ${line.trim()}`);
    }
  });
}
