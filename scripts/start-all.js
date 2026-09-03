const { spawn } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';

const services = [
  {
    name: 'API Gateway',
    port: 4000,
    cwd: path.join(rootDir, 'apps/api-gateway'),
    executable: process.execPath,
    args: ['dist/server.js'],
    color: '\x1b[35m'
  },
  {
    name: 'Partner Platform',
    port: 5173,
    cwd: path.join(rootDir, 'apps/partner-platform'),
    executable: isWindows ? '.\\node_modules\\.bin\\vite.cmd' : './node_modules/.bin/vite',
    args: ['--port', '5173', '--host', '0.0.0.0'],
    color: '\x1b[36m'
  },
  {
    name: 'Company Platform',
    port: 5174,
    cwd: path.join(rootDir, 'apps/company-platform'),
    executable: isWindows ? '.\\node_modules\\.bin\\vite.cmd' : './node_modules/.bin/vite',
    args: ['--port', '5174', '--host', '0.0.0.0'],
    color: '\x1b[32m'
  },
  {
    name: 'Landing Page',
    port: 5175,
    cwd: path.join(rootDir, 'apps/landing-page'),
    executable: isWindows ? '.\\node_modules\\.bin\\vite.cmd' : './node_modules/.bin/vite',
    args: ['--port', '5175', '--host', '0.0.0.0'],
    color: '\x1b[33m'
  }
];

console.log('\n============================================================');
console.log('🚀 STARTING DOC SEARCH 4-SERVICE SUITE SUPERVISOR');
console.log('============================================================\n');

const children = [];

services.forEach((svc) => {
  console.log(`[+] Launching ${svc.name} on port ${svc.port}...`);

  const child = spawn(svc.executable, svc.args, {
    cwd: svc.cwd,
    stdio: 'pipe',
    shell: isWindows
  });

  children.push(child);

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

process.on('SIGINT', () => {
  console.log('\n[!] Shutting down all services...');
  children.forEach((c) => {
    try {
      c.kill();
    } catch {}
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach((c) => {
    try {
      c.kill();
    } catch {}
  });
  process.exit(0);
});
