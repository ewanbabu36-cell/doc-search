import fs from 'fs';

const b = JSON.parse(fs.readFileSync('reports/persistence/baseline.json', 'utf8'));

console.log('=== ALL 66 SUSPECTED BUSINESS DATA IN FRONTEND STORAGE ===');
b.businessStorage.forEach((x, i) => {
  console.log(`[${i+1}] ${x.file}:${x.line} -> ${x.code}`);
});
