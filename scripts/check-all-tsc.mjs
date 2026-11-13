import { execSync } from 'child_process';

const tsconfigs = [
  'packages/shared-core/tsconfig.json',
  'packages/database/tsconfig.json',
  'packages/auth/tsconfig.json',
  'packages/api-contracts/tsconfig.json',
  'packages/ui-kit/tsconfig.json',
  'apps/api-gateway/tsconfig.json',
  'apps/partner-platform/tsconfig.json',
  'apps/patient-app/tsconfig.json',
  'apps/company-platform/tsconfig.json',
  'apps/landing-page/tsconfig.json'
];

let failed = 0;
for (const p of tsconfigs) {
  process.stdout.write(`Checking ${p}... `);
  try {
    execSync(`npx tsc --noEmit -p ${p}`, { stdio: 'pipe' });
    console.log('PASSED');
  } catch (err) {
    console.log('FAILED');
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} TypeScript configurations failed.`);
  process.exit(1);
} else {
  console.log(`\n✅ All 10/10 TypeScript configurations PASSED.`);
  process.exit(0);
}
