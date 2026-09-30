import fs from 'node:fs';
import path from 'node:path';

const DIR_C = 'C:\\Users\\alamr\\OneDrive\\Desktop\\DOC SEARCH';
const DIR_D = 'D:\\DOC SEARCH';

const filesToCopy = [
  'DOC_SEARCH_PHASE18_FINAL_CLOSURE_REPORT.md',
  'DOC_SEARCH_STATIC_VS_DYNAMIC_DATA_AUDIT_REPORT.md',
  'scripts/cdp-test.mjs',
  'scripts/inspect-ui-inventory.mjs',
  'test-p0-verification.cjs',
  'test-restart-persistence.cjs'
];

for (const rel of filesToCopy) {
  const src = path.join(DIR_C, rel);
  const dest = path.join(DIR_D, rel);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Copied ${rel} from C to D`);
  } else {
    console.log(`Not found in C: ${rel}`);
  }
}

// Also update .gitignore in D
const gitignorePath = path.join(DIR_D, '.gitignore');
let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
const additions = [
  'data/chrome-profile-*',
  'data/db/',
  'data/db-native-utf8/',
  'packages/database/.data/',
  'filtered_mocks.txt',
  'frontend_audit.txt',
  'mock_search_results.txt',
  'scratch_inventory.json'
];

let addedCount = 0;
for (const item of additions) {
  if (!gitignoreContent.includes(item)) {
    gitignoreContent += `\n${item}`;
    addedCount++;
  }
}
if (addedCount > 0) {
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
  console.log(`Added ${addedCount} entries to D's .gitignore`);
}

// Update vite.config.ts in apps/partner-platform
const vitePath = path.join(DIR_D, 'apps/partner-platform/vite.config.ts');
let viteContent = fs.readFileSync(vitePath, 'utf8');
if (!viteContent.includes('ignored:')) {
  viteContent = viteContent.replace(
    'server: {',
    'server: {\n    watch: {\n      ignored: [\'**/dist/**\', \'**/node_modules/**\']\n    },'
  );
  fs.writeFileSync(vitePath, viteContent, 'utf8');
  console.log('Updated apps/partner-platform/vite.config.ts with watch ignored paths');
}
