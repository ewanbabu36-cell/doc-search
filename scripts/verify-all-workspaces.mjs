import { execSync } from 'child_process';

const workspaces = [
  'packages/api-contracts',
  'packages/database',
  'apps/api-gateway',
  'apps/company-platform',
  'apps/partner-platform',
  'apps/patient-app',
];

console.log('--- STARTING MONOREPO ZERO-MOCK COMPILATION AUDIT ---');

let hasFailure = false;
for (const ws of workspaces) {
  process.stdout.write(`Auditing ${ws} ... `);
  try {
    execSync('npx tsc --noEmit', { cwd: ws, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('PASS (0 errors)');
  } catch (err) {
    console.log('FAIL');
    console.error(err.stdout || err.stderr || err.message);
    hasFailure = true;
  }
}

if (hasFailure) {
  console.error('\n❌ Monorepo has TypeScript compilation errors.');
  process.exit(1);
} else {
  console.log('\n✅ ALL 6 MONOREPO WORKSPACES PASSED WITH 0 TYPESCRIPT ERRORS!');
  process.exit(0);
}
