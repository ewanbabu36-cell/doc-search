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

const allFiles = [
  ...walkDir(path.join(REPO_ROOT, 'apps/partner-platform/src')),
  ...walkDir(path.join(REPO_ROOT, 'apps/company-platform/src')),
  ...walkDir(path.join(REPO_ROOT, 'apps/landing-page/src'))
].filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));

const findings = [];

// Business entities that must be server-backed, not localStorage-backed
const BUSINESS_ENTITIES = [
  'patient',
  'encounter',
  'opd_queue',
  'queue',
  'consultation',
  'prescription',
  'lab_order',
  'radiology',
  'dispens',
  'pharmacy',
  'admission',
  'bed',
  'invoice',
  'billing',
  'vitals',
  'partner_user',
  'registered_partner',
  'verification_queue'
];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(REPO_ROOT, file).replace(/\\/g, '/');

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('localStorage.getItem') || line.includes('localStorage.setItem')) {
      const match = line.match(/localStorage\.(getItem|setItem)\s*\(\s*['"]([^'"]+)['"]/);
      if (match) {
        const action = match[1];
        const key = match[2];

        // Determine if this is UI preference, auth token/session, temporary draft, or business entity
        let classification = 'UI_PREFERENCE';
        if (key.includes('token') || key.includes('auth') || key.includes('session') || key.includes('logged_out')) {
          classification = 'SESSION_AUTH';
        } else if (key.includes('theme') || key.includes('mode') || key.includes('filter') || key.includes('sidebar') || key.includes('intensity') || key.includes('active_tab')) {
          classification = 'UI_PREFERENCE';
        } else if (key.includes('draft')) {
          classification = 'TEMPORARY_DRAFT';
        } else {
          for (const ent of BUSINESS_ENTITIES) {
            if (key.toLowerCase().includes(ent)) {
              classification = 'BUSINESS_SOURCE_OF_TRUTH';
              break;
            }
          }
        }

        findings.push({
          file: relPath,
          line: i + 1,
          action,
          key,
          code: line.trim(),
          classification
        });
      }
    }
  }
}

const businessTruthFindings = findings.filter(f => f.classification === 'BUSINESS_SOURCE_OF_TRUTH');

console.log('Total localStorage calls found:', findings.length);
console.log('Classified as BUSINESS_SOURCE_OF_TRUTH:', businessTruthFindings.length);

const groupedByFile = {};
for (const f of businessTruthFindings) {
  if (!groupedByFile[f.file]) groupedByFile[f.file] = [];
  groupedByFile[f.file].push(f);
}

console.log('\nFiles containing potential LOCALSTORAGE_BUSINESS_TRUTH:');
for (const [file, items] of Object.entries(groupedByFile)) {
  console.log(`- ${file} (${items.length} occurrences): keys = [${[...new Set(items.map(i => i.key))].join(', ')}]`);
}

fs.writeFileSync(
  'audit-results/category-6-localstorage-business-truth.json',
  JSON.stringify({ total: findings.length, businessTruthFindings, groupedByFile }, null, 2)
);
