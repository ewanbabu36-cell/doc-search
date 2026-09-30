import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'D:/DOC SEARCH';

const partnerShell = fs.readFileSync(path.join(REPO_ROOT, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx'), 'utf8');

// Look for activeTab, activeModule, or navItems
const navMatches = [...partnerShell.matchAll(/id:\s*['"]([a-zA-Z0-9_-]+)['"],\s*label:\s*['"]([^'"]+)['"]/g)];
console.log('Partner Nav Matches count:', navMatches.length);
const partnerNavMap = navMatches.map(m => ({ id: m[1], label: m[2] }));

// Look for switch cases or tab renders
const caseMatches = [...partnerShell.matchAll(/case\s+['"]([a-zA-Z0-9_-]+)['"]:/g)];
console.log('Partner case statements count:', caseMatches.length);
const partnerCases = [...new Set(caseMatches.map(m => m[1]))];

fs.writeFileSync('audit-results/partner-modules-nav.json', JSON.stringify({
  navItems: partnerNavMap,
  cases: partnerCases
}, null, 2));

// Company Shell
const companyShell = fs.readFileSync(path.join(REPO_ROOT, 'apps/company-platform/src/components/CompanyShell.tsx'), 'utf8');
const companyNavMatches = [...companyShell.matchAll(/id:\s*['"]([a-zA-Z0-9_-]+)['"],\s*label:\s*['"]([^'"]+)['"]/g)];
console.log('Company Nav Matches count:', companyNavMatches.length);
const companyCases = [...new Set([...companyShell.matchAll(/case\s+['"]([a-zA-Z0-9_-]+)['"]:/g)].map(m => m[1]))];

fs.writeFileSync('audit-results/company-modules-nav.json', JSON.stringify({
  navItems: companyNavMatches.map(m => ({ id: m[1], label: m[2] })),
  cases: companyCases
}, null, 2));

console.log('Extracted and saved navigation mappings.');
