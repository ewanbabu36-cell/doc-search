import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('apps/company-platform/src');
let total = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = [...content.matchAll(/const\s+((?:INITIAL|SAMPLE|MOCK)_[A-Za-z0-9_]+)/g)];
  if (matches.length > 0) {
    total += matches.length;
    console.log(`${f.replace(/\\/g, '/')}: ${matches.map(m => m[1]).join(', ')}`);
  }
});

console.log(`\nTotal INITIAL/SAMPLE/MOCK found: ${total}`);
