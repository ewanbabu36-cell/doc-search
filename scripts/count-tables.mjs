import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) res = res.concat(getFiles(full));
    else if (item.name.endsWith('.ts')) res.push(full);
  }
  return res;
}

const files = getFiles('packages/database/src/schema');
let totalTables = 0;
const tablesBySchema = {};
const allTableNames = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/(?:table|\.table|pgTable)\s*\(\s*['"]([^'"]+)['"]/g);
  for (const m of matches) {
    totalTables++;
    const rel = path.relative('packages/database/src/schema', file);
    tablesBySchema[rel] = (tablesBySchema[rel] || 0) + 1;
    allTableNames.push({ table: m[1], file: rel });
  }
}

console.log('Total Defined Database Tables:', totalTables);
for (const [k, v] of Object.entries(tablesBySchema)) {
  console.log('  ', k, '->', v, 'tables');
}

// Compare with TRACKED_TABLES
const pContent = fs.readFileSync('packages/database/src/embedded-persistence.ts', 'utf8');
const trackedMatches = [...pContent.matchAll(/['"]([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)['"]/g)].map(m => m[1]);
console.log('\nTracked Tables in embedded-persistence.ts:', trackedMatches.length);
console.log('Tracked tables list:');
trackedMatches.forEach(t => console.log('  -', t));
