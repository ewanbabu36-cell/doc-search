import fs from 'node:fs';

const c_gitignore = fs.readFileSync('C:/Users/alamr/OneDrive/Desktop/DOC SEARCH/.gitignore', 'utf8');
const d_gitignore = fs.readFileSync('D:/DOC SEARCH/.gitignore', 'utf8');
console.log('=== .gitignore DIFF ===');
console.log('In C:');
for (const line of c_gitignore.split('\n')) {
  if (!d_gitignore.includes(line.trim()) && line.trim()) console.log('+', line);
}

const c_vite = fs.readFileSync('C:/Users/alamr/OneDrive/Desktop/DOC SEARCH/apps/partner-platform/vite.config.ts', 'utf8');
const d_vite = fs.readFileSync('D:/DOC SEARCH/apps/partner-platform/vite.config.ts', 'utf8');
console.log('\n=== vite.config.ts ===');
if (c_vite === d_vite) {
  console.log('Content identical!');
} else {
  console.log('Differences found. Line-by-line:');
  const linesC = c_vite.split('\n');
  const linesD = d_vite.split('\n');
  for (let i = 0; i < Math.max(linesC.length, linesD.length); i++) {
    if (linesC[i] !== linesD[i]) {
      console.log(`L${i+1} C: ${linesC[i] || '<empty>'}`);
      console.log(`L${i+1} D: ${linesD[i] || '<empty>'}`);
    }
  }
}

const c_pkg = fs.readFileSync('C:/Users/alamr/OneDrive/Desktop/DOC SEARCH/packages/database/package.json', 'utf8');
const d_pkg = fs.readFileSync('D:/DOC SEARCH/packages/database/package.json', 'utf8');
console.log('\n=== packages/database/package.json ===');
if (c_pkg === d_pkg) {
  console.log('Content identical!');
} else {
  console.log('Differences found. Line-by-line:');
  const linesC = c_pkg.split('\n');
  const linesD = d_pkg.split('\n');
  for (let i = 0; i < Math.max(linesC.length, linesD.length); i++) {
    if (linesC[i] !== linesD[i]) {
      console.log(`L${i+1} C: ${linesC[i] || '<empty>'}`);
      console.log(`L${i+1} D: ${linesD[i] || '<empty>'}`);
    }
  }
}
