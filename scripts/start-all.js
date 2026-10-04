const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

process.env.SEED_DEMO_FIXTURES = 'false';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';
process.env.NODE_ENV = 'development';

// 1. Free ports before launching
const ports = [4000, 5173, 5175, 5177];
try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = output.split('\n');
  const pids = new Set();
  for (const line of lines) {
    for (const port of ports) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          pids.add(pid);
        }
      }
    }
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`);
    } catch {}
  }
} catch {}

console.log('\n============================================================');
console.log('🚀 STARTING DOC SEARCH 4-SERVICE SUITE SUPERVISOR');
console.log('============================================================\n');

const children = [];

function spawnService(svc) {
  console.log(`[+] Launching ${svc.name} on port ${svc.port}...`);
  const child = spawn(svc.executable, svc.args, {
    cwd: svc.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch',
      ALLOW_EMBEDDED_POSTGRES: 'false',
      NODE_ENV: 'development',
      ...(svc.env || {})
    }
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

  return child;
}

async function checkPostgresReady(timeoutMs = 1500) {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch',
      connectionTimeoutMillis: timeoutMs
    });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}

function waitForHealth(url, maxWaitMs = 60000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      });
      req.on('error', () => {});
      req.on('timeout', () => req.destroy());
      if (Date.now() - start > maxWaitMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 500);
  });
}

async function main() {
  // Step 0: Ensure Native PostgreSQL is listening on port 5432
  const pgReady = await checkPostgresReady(1000);
  if (!pgReady) {
    console.log('[*] Native PostgreSQL not detected on port 5432. Launching native PostgreSQL daemon...');
    spawnService({
      name: 'PostgreSQL 18.4',
      port: 5432,
      cwd: rootDir,
      executable: process.execPath,
      args: ['scripts/native-postgres-daemon.mjs'],
      color: '\x1b[34m'
    });
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await checkPostgresReady(1500)) {
        console.log('[\x1b[32m✔\x1b[0m] Native PostgreSQL is listening on 127.0.0.1:5432\n');
        break;
      }
    }
  } else {
    console.log('[\x1b[32m✔\x1b[0m] Native PostgreSQL already active on 127.0.0.1:5432\n');
  }

  // Step 1: Start API Gateway
  const gateway = {
    name: 'API Gateway',
    port: 4000,
    cwd: path.join(rootDir, 'apps/api-gateway'),
    executable: process.execPath,
    args: ['dist/server.js'],
    color: '\x1b[35m'
  };
  spawnService(gateway);

  console.log('[*] Waiting for API Gateway PostgreSQL engine to become healthy...');
  const healthy = await waitForHealth('http://127.0.0.1:4000/api/v1/health');
  if (healthy) {
    console.log('[\x1b[32m✔\x1b[0m] API Gateway is healthy at http://localhost:4000\n');
  } else {
    console.log('[\x1b[33m!\x1b[0m] Health check timeout reached; continuing with frontend launch...\n');
  }

  // Step 2: Start frontend services with dual-stack host flag
  const frontends = [
    {
      name: 'Partner Platform',
      port: 5173,
      cwd: path.join(rootDir, 'apps/partner-platform'),
      executable: process.execPath,
      args: [path.join(rootDir, 'apps/partner-platform/node_modules/vite/bin/vite.js'), '--port', '5173', '--host', '--strictPort'],
      color: '\x1b[36m'
    },
    {
      name: 'Company Platform',
      port: 5177,
      cwd: path.join(rootDir, 'apps/company-platform'),
      executable: process.execPath,
      args: [path.join(rootDir, 'apps/company-platform/node_modules/vite/bin/vite.js'), '--port', '5177', '--host', '--strictPort'],
      color: '\x1b[32m'
    },
    {
      name: 'Landing Page',
      port: 5175,
      cwd: path.join(rootDir, 'apps/landing-page'),
      executable: process.execPath,
      args: [path.join(rootDir, 'apps/landing-page/node_modules/vite/bin/vite.js'), '--port', '5175', '--host', '--strictPort'],
      color: '\x1b[33m'
    }
  ];

  for (const svc of frontends) {
    spawnService(svc);
    // Give each frontend 1.5 seconds to bind cleanly without lock contention
    await new Promise((r) => setTimeout(r, 1500));
  }
}

const cleanup = () => {
  console.log('\n[!] Shutting down all services...');
  children.forEach((c) => {
    try {
      c.kill();
    } catch {}
  });
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main().catch(console.error);
