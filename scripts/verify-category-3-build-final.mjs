import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

const TARGETS = [
  { name: '@docsearch/api-contracts', dir: 'packages/api-contracts', artifacts: ['dist/index.js', 'dist/index.d.ts'] },
  { name: '@docsearch/shared-core', dir: 'packages/shared-core', artifacts: ['dist/index.js', 'dist/server.js', 'dist/index.d.ts'] },
  { name: '@docsearch/auth', dir: 'packages/auth', artifacts: ['dist/index.js', 'dist/index.d.ts'] },
  { name: '@docsearch/database', dir: 'packages/database', artifacts: ['dist/index.js', 'dist/index.d.ts'] },
  { name: '@docsearch/ui-kit', dir: 'packages/ui-kit', artifacts: ['dist/index.js', 'dist/index.d.ts'] },
  { name: '@docsearch/api-gateway', dir: 'apps/api-gateway', artifacts: ['dist/server.js'] },
  { name: '@docsearch/company-platform', dir: 'apps/company-platform', artifacts: ['dist/bundle/index.html'] },
  { name: '@docsearch/landing-page', dir: 'apps/landing-page', artifacts: ['dist/bundle/index.html'] },
  { name: '@docsearch/partner-platform', dir: 'apps/partner-platform', artifacts: ['dist/bundle/index.html'] }
];

console.log('--- PHASE 16: FINAL INDEPENDENT BUILD VERIFICATION ---');
const t0 = performance.now();
const pnpm = process.platform === 'win32' ? '.\\pnpm.cmd' : 'pnpm';

let failed = 0;
const results = [];

for (const t of TARGETS) {
  process.stdout.write(`Verifying build for [${t.name}] ... `);
  const pkgStart = performance.now();
  try {
    execSync(`${pnpm} --filter ${t.name} run build`, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    const dur = ((performance.now() - pkgStart) / 1000).toFixed(1);

    // Check artifacts
    const missing = [];
    for (const a of t.artifacts) {
      const artPath = path.resolve(ROOT_DIR, t.dir, a);
      if (!fs.existsSync(artPath) || fs.statSync(artPath).size === 0) {
        missing.push(a);
      }
    }

    if (missing.length > 0) {
      console.log(`FAIL (Missing: ${missing.join(', ')}) [${dur}s]`);
      failed++;
      results.push({ name: t.name, status: 'FAIL_ARTIFACT', missing });
    } else {
      console.log(`PASS [${dur}s]`);
      results.push({ name: t.name, status: 'PASS', duration: dur });
    }
  } catch (err) {
    const dur = ((performance.now() - pkgStart) / 1000).toFixed(1);
    console.log(`FAIL (Exit: ${err.status}) [${dur}s]`);
    failed++;
    results.push({ name: t.name, status: 'FAIL_BUILD', exitCode: err.status });
  }
}

const totalDur = ((performance.now() - t0) / 1000).toFixed(1);
console.log(`\nVerification finished in ${totalDur}s. Total Failures: ${failed}`);

if (failed > 0) {
  console.error('FINAL RESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('FINAL RESULT: PASS — ZERO REPOSITORY-WIDE BUILD / COMPILE ERRORS');
  process.exitCode = 0;
}
