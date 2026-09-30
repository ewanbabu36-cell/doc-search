import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n================================================================');
console.log('🔄 SMART BACKGROUND SYNC & AUTO-REFRESH VERIFICATION');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. LiveSyncRefreshButton Component
console.log('--- 1. Checking LiveSyncRefreshButton Primitive ---');
const buttonPath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'primitives', 'LiveSyncRefreshButton.tsx');
assert(fs.existsSync(buttonPath), 'LiveSyncRefreshButton.tsx exists');
const buttonContent = fs.readFileSync(buttonPath, 'utf-8');

assert(buttonContent.includes('export const LiveSyncRefreshButton'), 'Exports LiveSyncRefreshButton');
assert(buttonContent.includes('docsearch:manual_refresh'), 'Dispatches docsearch:manual_refresh event');
assert(buttonContent.includes('Shift'), 'Supports Shift+R hotkey');
assert(buttonContent.includes('timeAgoText'), 'Displays relative time ago text');

const indexPath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'primitives', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');
assert(indexContent.includes('LiveSyncRefreshButton'), 'Exported from primitives index.ts');

// 2. CompanyShell Integration
console.log('\n--- 2. Checking CompanyShell Integration ---');
const companyShellPath = path.join(rootDir, 'apps', 'company-platform', 'src', 'components', 'CompanyShell.tsx');
const companyShellContent = fs.readFileSync(companyShellPath, 'utf-8');

assert(companyShellContent.includes('LiveSyncRefreshButton'), 'Imports and renders LiveSyncRefreshButton');
assert(companyShellContent.includes("window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"), 'Resets scroll to top on domain change');
assert(companyShellContent.includes('docsearch:domain_activated'), 'Dispatches docsearch:domain_activated event');

// 3. PartnerPlatformShell Integration
console.log('\n--- 3. Checking PartnerPlatformShell Integration ---');
const partnerShellPath = path.join(rootDir, 'apps', 'partner-platform', 'src', 'components', 'PartnerPlatformShell.tsx');
const partnerShellContent = fs.readFileSync(partnerShellPath, 'utf-8');

assert(partnerShellContent.includes('LiveSyncRefreshButton'), 'Imports and renders LiveSyncRefreshButton');
assert(partnerShellContent.includes("window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"), 'Resets scroll to top on module change');
assert(partnerShellContent.includes('docsearch:module_activated'), 'Dispatches docsearch:module_activated event');

// 4. PartnerListView Smart Re-sync
console.log('\n--- 4. Checking PartnerListView Smart Re-sync ---');
const partnerListPath = path.join(rootDir, 'apps', 'company-platform', 'src', 'components', 'crm', 'PartnerListView.tsx');
const partnerListContent = fs.readFileSync(partnerListPath, 'utf-8');

assert(partnerListContent.includes('docsearch:domain_activated'), 'Listens to docsearch:domain_activated');
assert(partnerListContent.includes('docsearch:manual_refresh'), 'Listens to docsearch:manual_refresh');
assert(partnerListContent.includes('lastFetchTimeRef'), 'Has throttling ref to prevent rapid double-fetching');
assert(partnerListContent.includes('visibilitychange'), 'Listens to visibilitychange for silent focus re-sync');

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passCount} / ${passCount + failCount} TESTS PASSED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
