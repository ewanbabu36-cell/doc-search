import fs from 'fs';
import path from 'path';

function inspectDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { error: 'Not found: ' + dirPath };
  }
  return fs.readdirSync(dirPath, { withFileTypes: true }).map(d => (d.isDirectory() ? d.name + '/' : d.name));
}

console.log('--- C: root ---');
console.log(inspectDir('C:/Users/alamr/OneDrive/Desktop/DOC SEARCH'));

console.log('--- D: root ---');
console.log(inspectDir('D:/DOC SEARCH'));

const repoRoot = fs.existsSync('D:/DOC SEARCH/apps') ? 'D:/DOC SEARCH' : 'C:/Users/alamr/OneDrive/Desktop/DOC SEARCH';
console.log('Active Repo Root:', repoRoot);

console.log('--- apps/partner-platform/src ---');
console.log(inspectDir(path.join(repoRoot, 'apps/partner-platform/src')));

console.log('--- apps/company-platform/src ---');
console.log(inspectDir(path.join(repoRoot, 'apps/company-platform/src')));

console.log('--- apps/landing-page/src ---');
console.log(inspectDir(path.join(repoRoot, 'apps/landing-page/src')));
