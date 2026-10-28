import { execSync } from 'node:child_process';

try {
  const output = execSync('node node_modules/typescript/bin/tsc -p apps/company-platform/tsconfig.json --noEmit', {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 50 * 1024 * 1024
  });
  console.log('SUCCESS: apps/company-platform has 0 TypeScript errors!');
  console.log(output);
} catch (err) {
  console.log('EXIT CODE:', err.status);
  console.log('STDOUT:\n', err.stdout);
  console.log('STDERR:\n', err.stderr);
}
