import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'D:/DOC SEARCH';

const partnerShell = fs.readFileSync(path.join(REPO_ROOT, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx'), 'utf8');
const lines = partnerShell.split('\n');

// Find how activeView / activeTab is defined and rendered
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [active') || lines[i].includes('setActive') || lines[i].includes('renderView') || lines[i].includes('renderActive')) {
    console.log(`PartnerShell L${i + 1}:`, lines[i].trim());
  }
}

console.log('--- COMPANY SHELL navigation inspection ---');
const companyShell = fs.readFileSync(path.join(REPO_ROOT, 'apps/company-platform/src/components/CompanyShell.tsx'), 'utf8');
const compLines = companyShell.split('\n');
for (let i = 0; i < compLines.length; i++) {
  if (compLines[i].includes('const [active') || compLines[i].includes('setActive') || compLines[i].includes('renderView') || compLines[i].includes('renderContent')) {
    console.log(`CompanyShell L${i + 1}:`, compLines[i].trim());
  }
}
