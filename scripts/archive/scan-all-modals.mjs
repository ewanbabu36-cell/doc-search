import fs from 'node:fs';
import path from 'node:path';

const APPS = [
  { name: 'partner-platform', dir: 'D:/DOC SEARCH/apps/partner-platform/src' },
  { name: 'company-platform', dir: 'D:/DOC SEARCH/apps/company-platform/src' },
  { name: 'landing-page', dir: 'D:/DOC SEARCH/apps/landing-page/src' }
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const modalStats = {};

for (const app of APPS) {
  const files = walk(app.dir);
  let rawModals = 0;
  let uiKitModals = 0;
  const rawModalFiles = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const isModalComponent = path.basename(file).includes('Dialog') || path.basename(file).includes('Modal') || /className=["'][^"']*fixed inset-0[^"']*["']/.test(content);
    if (isModalComponent) {
      if (content.includes('<Dialog') || content.includes('<Modal')) {
        uiKitModals++;
      } else if (/className=["'][^"']*fixed inset-0/i.test(content) || /style=\{\{[^}]*position:\s*['"]fixed['"]/i.test(content)) {
        rawModals++;
        rawModalFiles.push(path.relative('D:/DOC SEARCH', file).replace(/\\/g, '/'));
      }
    }
  }

  modalStats[app.name] = {
    uiKitModals,
    rawModals,
    sampleRaw: rawModalFiles.slice(0, 10)
  };
}

console.log('MODAL / DIALOG STATS ACROSS APPS:');
console.log(JSON.stringify(modalStats, null, 2));
