import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'D:/DOC SEARCH';

console.log('=== PARTNER PLATFORM main.tsx ===');
console.log(fs.readFileSync(path.join(REPO_ROOT, 'apps/partner-platform/src/main.tsx'), 'utf8').slice(0, 1000));

console.log('=== COMPANY PLATFORM main.tsx ===');
console.log(fs.readFileSync(path.join(REPO_ROOT, 'apps/company-platform/src/main.tsx'), 'utf8').slice(0, 1000));

console.log('=== LANDING PAGE main.tsx ===');
console.log(fs.readFileSync(path.join(REPO_ROOT, 'apps/landing-page/src/main.tsx'), 'utf8').slice(0, 1000));

const partnerViews = fs.readdirSync(path.join(REPO_ROOT, 'apps/partner-platform/src/components/views'));
console.log('Total partner views count:', partnerViews.length);
fs.writeFileSync('audit-results/partner-views-inventory.json', JSON.stringify(partnerViews, null, 2));

const companyComponents = fs.readdirSync(path.join(REPO_ROOT, 'apps/company-platform/src/components'));
console.log('Company component categories:', companyComponents);
