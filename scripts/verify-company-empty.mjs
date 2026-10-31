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
let nonEmptyCount = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Match const (INITIAL|SAMPLE|MOCK)_... = [ ... ] where array has items
  const matches = [...content.matchAll(/const\s+((?:INITIAL|SAMPLE|MOCK)_[A-Za-z0-9_]+)[^=]*=\s*\[\s*([^\]]+?)\s*\];/g)];
  if (matches.length > 0) {
    matches.forEach(m => {
      // ignore if empty array
      if (m[2].trim() !== '') {
        console.log(`NON-EMPTY: ${f.replace(/\\/g, '/')} -> ${m[1]}`);
        nonEmptyCount++;
      }
    });
  }
});

console.log(`\nTotal non-empty INITIAL/SAMPLE/MOCK arrays in company-platform: ${nonEmptyCount}`);
