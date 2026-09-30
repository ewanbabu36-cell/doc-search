const { execSync } = require('child_process');
const fs = require('fs');

const packages = [
  'packages/api-contracts',
  'packages/auth',
  'packages/shared-core',
  'packages/database',
  'apps/api-gateway',
  'apps/partner-platform',
  'apps/company-platform',
  'apps/landing-page'
];

const results = {};

for (const p of packages) {
  process.stdout.write(`[*] Checking ${p}... `);
  try {
    const out = execSync('npx.cmd tsc --noEmit', { cwd: p, encoding: 'utf8', stdio: 'pipe' });
    console.log('PASSED');
    results[p] = { status: 'PASSED', errorCount: 0 };
  } catch (err) {
    const output = (err.stdout || '') + '\n' + (err.stderr || '');
    const errors = output.split('\n').filter(l => l.includes('error TS'));
    console.log(`FAILED (${errors.length} TypeScript errors)`);
    results[p] = {
      status: 'FAILED',
      errorCount: errors.length,
      sampleErrors: errors.slice(0, 8)
    };
  }
}

fs.writeFileSync('scripts/typecheck-results.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to scripts/typecheck-results.json');
