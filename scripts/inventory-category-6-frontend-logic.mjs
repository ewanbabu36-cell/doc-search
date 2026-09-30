import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'D:/DOC SEARCH';

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist') {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const partnerFiles = walkDir(path.join(REPO_ROOT, 'apps/partner-platform/src'));
const companyFiles = walkDir(path.join(REPO_ROOT, 'apps/company-platform/src'));
const landingFiles = walkDir(path.join(REPO_ROOT, 'apps/landing-page/src'));
const uiKitFiles = walkDir(path.join(REPO_ROOT, 'packages/ui-kit/src'));

const allFrontendFiles = [...partnerFiles, ...companyFiles, ...landingFiles, ...uiKitFiles];

const inventory = {
  timestamp: new Date().toISOString(),
  totalFrontendFiles: allFrontendFiles.length,
  services: [],
  apiClients: [],
  hooks: [],
  localStorageUsages: [],
  sessionStorageUsages: [],
  fetchCalls: [],
  forms: [],
  stateStores: []
};

for (const file of allFrontendFiles) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) continue;
  const relPath = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Check services & API clients
  if (relPath.includes('/services/')) {
    inventory.services.push({
      file: relPath,
      name: path.basename(file, path.extname(file))
    });
  }

  // Check hooks
  if (relPath.includes('/hooks/') || path.basename(file).startsWith('use')) {
    inventory.hooks.push({
      file: relPath,
      name: path.basename(file, path.extname(file))
    });
  }

  // Check localStorage usages
  const lsMatches = [...content.matchAll(/localStorage\.(getItem|setItem|removeItem)\s*\(\s*['"]([^'"]+)['"]/g)];
  for (const m of lsMatches) {
    inventory.localStorageUsages.push({
      file: relPath,
      action: m[1],
      key: m[2]
    });
  }

  // Check sessionStorage usages
  const ssMatches = [...content.matchAll(/sessionStorage\.(getItem|setItem|removeItem)\s*\(\s*['"]([^'"]+)['"]/g)];
  for (const m of ssMatches) {
    inventory.sessionStorageUsages.push({
      file: relPath,
      action: m[1],
      key: m[2]
    });
  }

  // Check fetch / axios / api calls
  const fetchMatches = [...content.matchAll(/fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g)];
  for (const m of fetchMatches) {
    inventory.fetchCalls.push({
      file: relPath,
      endpoint: m[1]
    });
  }

  // Check forms
  if (content.includes('<form') || content.includes('onSubmit') || content.includes('handleSubmit')) {
    inventory.forms.push({
      file: relPath,
      name: path.basename(file, path.extname(file))
    });
  }
}

fs.mkdirSync(path.join(REPO_ROOT, 'audit-results'), { recursive: true });
fs.writeFileSync(
  path.join(REPO_ROOT, 'audit-results/category-6-frontend-logic-inventory.json'),
  JSON.stringify(inventory, null, 2)
);

console.log('Frontend Logic Inventory Complete:');
console.log('- Total Frontend Files:', inventory.totalFrontendFiles);
console.log('- Total Services:', inventory.services.length);
console.log('- Total Hooks:', inventory.hooks.length);
console.log('- Total Forms:', inventory.forms.length);
console.log('- Total Direct fetch() calls detected:', inventory.fetchCalls.length);
console.log('- Total localStorage usages:', inventory.localStorageUsages.length);
console.log('- Total sessionStorage usages:', inventory.sessionStorageUsages.length);

// Unique localStorage keys
const uniqueLsKeys = [...new Set(inventory.localStorageUsages.map(u => u.key))];
console.log('\nUnique localStorage keys count:', uniqueLsKeys.length);
console.log('Sample keys:', uniqueLsKeys.slice(0, 30));
