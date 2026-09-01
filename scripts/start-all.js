const { spawn } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

const services = [
  {
    name: 'API Gateway',
    port: 4000,
    cmd: 'pnpm',
    args: ['--filter', '@docsearch/api-gateway', 'start'],
    color: '\x1b[35m'
  },
  {
    name: 'Partner Platform',
    port: 5173,
    cmd: 'pnpm',
    args: ['--filter', '@docsearch/partner-platform', 'dev', '--port', '5173', '--host'],
    color: '\x1b[36m'
  },
  {
    name: 'Company Platform',
    port: 5174,
    cmd: 'pnpm',
    args: ['--filter', '@docsearch/company-platform', 'dev', '--port', '5174', '--host'],
    color: '\x1b[32m'
  },
  {
    name: 'Landing Page',
    port: 5175,
    cmd: 'pnpm',
    args: ['--filter', '@docsearch/landing-page', 'dev', '--port', '5175', '--host'],
    color: '\x1b[33m'
  }
];

console.log('\n============================================================');
console.log('🚀 STARTING DOC SEARCH 4-SERVICE SUITE SUPERVISOR');
console.log('============================================================\n');

services.forEach((svc) => {
  const isWindows = process.platform === 'win32';
  const executable = isWindows ? 'cmd.exe' : svc.cmd;
  const execArgs = isWindows ? ['/c', svc.cmd, ...svc.args] : svc.args;

  console.log(`[+] Launching ${svc.name} on port ${svc.port}...`);

  const child = spawn(executable, execArgs, {
    cwd: rootDir,
    stdio: 'pipe',
    shell: isWindows
  });

  child.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      console.log(`${svc.color}[${svc.name}:${svc.port}]\x1b[0m ${text}`);
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`${svc.color}[${svc.name}:${svc.port} ERR]\x1b[0m ${text}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[-] ${svc.name} exited with code ${code}`);
  });
});
