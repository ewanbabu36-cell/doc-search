import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'D:/DOC SEARCH';

function walkDir(dir) {
  let results = [];
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

const companyViews = walkDir(path.join(REPO_ROOT, 'apps/company-platform/src/components'))
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log('Company platform components count:', companyViews.length);

const landingViews = walkDir(path.join(REPO_ROOT, 'apps/landing-page/src/components'))
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log('Landing page components count:', landingViews.length);

// Read PartnerPlatformShell.tsx imports and module map
const partnerShellContent = fs.readFileSync(path.join(REPO_ROOT, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx'), 'utf8');
console.log('PartnerPlatformShell length:', partnerShellContent.length);

// Read CompanyShell.tsx
const companyShellContent = fs.readFileSync(path.join(REPO_ROOT, 'apps/company-platform/src/components/CompanyShell.tsx'), 'utf8');
console.log('CompanyShell length:', companyShellContent.length);
