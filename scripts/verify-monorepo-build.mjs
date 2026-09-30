import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const tscPath = path.resolve('node_modules/.bin/tsc.cmd');

const packages = [
  { name: '@docsearch/api-contracts', tsconfig: 'packages/api-contracts/tsconfig.json' },
  { name: '@docsearch/auth', tsconfig: 'packages/auth/tsconfig.json' },
  { name: '@docsearch/shared-core', tsconfig: 'packages/shared-core/tsconfig.json' },
  { name: '@docsearch/database', tsconfig: 'packages/database/tsconfig.json' },
  { name: 'api-gateway', tsconfig: 'apps/api-gateway/tsconfig.json' },
  { name: 'partner-platform', tsconfig: 'apps/partner-platform/tsconfig.json' },
  { name: 'company-platform', tsconfig: 'apps/company-platform/tsconfig.json' },
  { name: 'landing-page', tsconfig: 'apps/landing-page/tsconfig.json' }
];

const results = [];

console.log('======================================================================');
console.log('🛠 MONOREPO TYPECHECK VERIFICATION SUITE');
console.log('======================================================================\n');

for (const pkg of packages) {
  process.stdout.write(`[*] Checking ${pkg.name.padEnd(28)}... `);
  const startTime = Date.now();
  const cmd = `"${tscPath}" --project "${pkg.tsconfig}" --noEmit`;
  try {
    const stdout = execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const duration = Date.now() - startTime;
    console.log(`PASSED (${duration}ms)`);
    results.push({
      name: pkg.name,
      tsconfig: pkg.tsconfig,
      status: 'PASSED',
      exitCode: 0,
      durationMs: duration,
      output: stdout.trim().slice(-300)
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`FAILED (${duration}ms)`);
    results.push({
      name: pkg.name,
      tsconfig: pkg.tsconfig,
      status: 'FAILED',
      exitCode: err.status || 1,
      durationMs: duration,
      error: (err.stdout || err.stderr || err.message).trim().slice(-1000)
    });
  }
}

console.log('\n======================================================================');
console.log('SUMMARY RESULTS:');
console.log('======================================================================');
for (const r of results) {
  console.log(`${r.status === 'PASSED' ? '✔' : '✖'} ${r.name.padEnd(28)}: ${r.status} (${r.durationMs}ms)`);
}

fs.writeFileSync('data/monorepo-typecheck-results.json', JSON.stringify(results, null, 2));
console.log('\nDetailed logs saved to data/monorepo-typecheck-results.json');
