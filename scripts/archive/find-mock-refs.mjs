import fs from 'fs';
import path from 'path';

function glob(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) res = res.concat(glob(full));
    else if (/\.(ts|tsx)$/.test(f.name)) res.push(full.replace(/\\/g, '/'));
  }
  return res;
}

const allFiles = [
  ...glob('apps/partner-platform/src'),
  ...glob('apps/company-platform/src'),
  ...glob('apps/patient-app/src')
];

export function findFilesReferencing(mockName) {
  const matches = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(mockName)) {
      matches.push(file);
    }
  }
  return matches;
}

const targetMocks = [
  'mock-billing-data',
  'mock-insurance-claims-data',
  'mock-inpatient-data',
  'mock-operation-theatre-data',
  'mock-emergency-data',
  'mock-pharmacy-data',
  'mock-blood-bank-data',
  'mock-procurement-data',
  'mock-clinical-investigation-data',
  'mock-mrd-data',
  'mock-quality-infection-data',
  'mock-asset-biomedical-data'
];

for (const m of targetMocks) {
  const refs = findFilesReferencing(m);
  console.log(`${m}: ${refs.length} references:`, refs);
}
