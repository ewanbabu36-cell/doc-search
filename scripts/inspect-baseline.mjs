import fs from 'fs';

const b = JSON.parse(fs.readFileSync('reports/persistence/baseline.json', 'utf8'));

console.log('=== SUSPECTED BUSINESS DATA IN FRONTEND STORAGE (' + b.businessStorage.length + ') ===');
b.businessStorage.slice(0, 30).forEach(x => {
  console.log(`${x.file}:${x.line} -> ${x.code}`);
});

console.log('\n=== SUSPICIOUS REPOSITORY PATTERNS (' + b.repositoryFindings.length + ') ===');
b.repositoryFindings.slice(0, 30).forEach(x => {
  console.log(`${x.file}:${x.line} [${x.issue}] -> ${x.code}`);
});

console.log('\n=== SERVICE IN-MEMORY MAPS (' + b.serviceFindings.length + ') ===');
b.serviceFindings.forEach(x => {
  console.log(`${x.file}:${x.line} [${x.issue}] -> ${x.code}`);
});
