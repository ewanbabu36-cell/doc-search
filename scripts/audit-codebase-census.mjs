import fs from 'node:fs';
import path from 'node:path';

function countFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
  let count = 0;
  let lines = 0;
  if (!fs.existsSync(dir)) return { count: 0, lines: 0 };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git', '.turbo', 'build'].includes(entry.name)) {
      const sub = countFiles(fullPath, exts);
      count += sub.count;
      lines += sub.lines;
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      count++;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        lines += content.split('\n').length;
      } catch {}
    }
  }
  return { count, lines };
}

const targets = [
  'apps/api-gateway/src',
  'apps/partner-platform/src',
  'apps/patient-app/src',
  'apps/company-platform/src',
  'apps/landing-page/src',
  'packages/database/src',
  'packages/auth/src',
  'packages/shared-core/src',
  'packages/api-contracts/src',
  'tests',
  'apps/api-gateway/test'
];

console.log('========================================================================');
console.log('              DOC SEARCH — SYSTEM CODEBASE CENSUS                       ');
console.log('========================================================================');
let totalFiles = 0;
let totalLines = 0;

for (const target of targets) {
  const stats = countFiles(target);
  totalFiles += stats.count;
  totalLines += stats.lines;
  console.log(`${target.padEnd(30)} : ${String(stats.count).padStart(5)} files | ${stats.lines.toLocaleString().padStart(9)} lines`);
}

console.log('------------------------------------------------------------------------');
console.log(`TOTAL MONOREPO CODE           : ${String(totalFiles).padStart(5)} files | ${totalLines.toLocaleString().padStart(9)} lines`);
console.log('========================================================================');
