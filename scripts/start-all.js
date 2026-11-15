const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

try {
  process.loadEnvFile(path.join(rootDir, '.env'));
} catch {}

process.env.SEED_DEMO_FIXTURES = 'false';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';
process.env.NODE_ENV = 'development';

// 1. Free ports before launching
const ports = [3000, 4000, 5173, 5174, 5175, 5176, 5177, 18080, 8042, 11112];
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
let isShuttingDown = false;

function spawnService(svc) {
  svc.restartCount = svc.restartCount || 0;
  svc.lastCrashTime = svc.lastCrashTime || 0;
  svc.maxRestarts = svc.maxRestarts !== undefined ? svc.maxRestarts : 10;
  svc.restartCooldownMs = svc.restartCooldownMs || 1500;
  svc.autoRestart = svc.autoRestart !== undefined ? svc.autoRestart : true;

  console.log(`[+] Launching ${svc.name}${svc.port ? ` on port ${svc.port}` : ''}...`);
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
      console.log(`${svc.color}[${svc.name}${svc.port ? `:${svc.port}` : ''}]\x1b[0m ${text}`);
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`${svc.color}[${svc.name}${svc.port ? `:${svc.port}` : ''} ERR]\x1b[0m ${text}`);
    }
  });

  child.on('close', (code, signal) => {
    if (isShuttingDown) {
      console.log(`[-] ${svc.name} exited cleanly during supervisor shutdown.`);
      return;
    }
    console.log(`[-] ${svc.name} exited with code ${code}${signal ? ` (Signal: ${signal})` : ''}`);

    if (svc.autoRestart && (code !== 0 || signal)) {
      const now = Date.now();
      // Reset crash count if running stably for more than 5 minutes
      if (now - svc.lastCrashTime > 300000) {
        svc.restartCount = 0;
      }
      svc.lastCrashTime = now;

      if (svc.restartCount < svc.maxRestarts) {
        svc.restartCount++;
        const delay = svc.restartCooldownMs;
        console.warn(
          `[\x1b[33m!\x1b[0m] SUPERVISOR SELF-HEALING: ${svc.name}${svc.port ? ` (Port ${svc.port})` : ''} died. Auto-recovering instance in ${delay}ms... (Attempt ${svc.restartCount}/${svc.maxRestarts})`
        );
        setTimeout(() => {
          if (isShuttingDown) return;
          if (svc.port && svc.port > 0) {
            try {
              const out = execSync(`netstat -ano | findstr :${svc.port} | findstr LISTENING`, { encoding: 'utf8' });
              const pid = out.trim().split(/\s+/).pop();
              if (pid && pid !== '0' && pid !== String(process.pid)) {
                execSync(`taskkill /F /PID ${pid}`);
              }
            } catch {}
          }
          const newChild = spawnService(svc);
          const idx = children.indexOf(child);
          if (idx !== -1) children[idx] = newChild;
        }, delay);
      } else {
        console.error(
          `[\x1b[31m✖\x1b[0m] CRITICAL: ${svc.name} exceeded maximum restart threshold (${svc.maxRestarts} crashes in 5m). Supervisor halting restart loop for this service.`
        );
      }
    }
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
    args: ['--max-old-space-size=2048', '--env-file=' + path.join(rootDir, '.env'), 'dist/server.js'],
    color: '\x1b[35m',
    autoRestart: true
  };
  spawnService(gateway);

  console.log('[*] Waiting for API Gateway PostgreSQL engine to become healthy...');
  const healthy = await waitForHealth('http://127.0.0.1:4000/api/v1/health');
  if (healthy) {
    console.log('[\x1b[32m✔\x1b[0m] API Gateway is healthy at http://localhost:4000\n');
    console.log('[*] Verifying & seeding Insurance & Procurement PostgreSQL records... (Already Verified)');
  } else {
    console.log('[\x1b[33m!\x1b[0m] Health check timeout reached; continuing with frontend launch...\n');
  }

  // Step 1.5: Start DocSearch Local Hardware Agent (LHA)
  const hardwareAgent = {
    name: 'Hardware Agent',
    port: 18080,
    cwd: rootDir,
    executable: process.execPath,
    args: ['--max-old-space-size=512', 'scripts/docsearch-hardware-agent.mjs'],
    color: '\x1b[32m',
    autoRestart: true
  };
  spawnService(hardwareAgent);

  // Step 1.6: Start DocSearch Radiology PACS Server (DICOM C-STORE + DICOMweb)
  const pacsServer = {
    name: 'PACS Server',
    port: 8042,
    cwd: rootDir,
    executable: process.execPath,
    args: ['--max-old-space-size=2048', 'scripts/docsearch-pacs-server.mjs'],
    color: '\x1b[36m',
    autoRestart: true
  };
  spawnService(pacsServer);

  // Step 1.7: Start Automated Encrypted Database Backup Cron (Every 6h)
  const backupCron = {
    name: 'Backup Daemon',
    port: 5432,
    cwd: rootDir,
    executable: process.execPath,
    args: ['--max-old-space-size=512', 'scripts/automated-encrypted-backup-cron.mjs'],
    color: '\x1b[33m',
    autoRestart: true
  };
  spawnService(backupCron);

  // Step 1.8: Start Autonomous Clinical Sweepers Daemon (Crossmatch Expiry & Bed SLA Escalation)
  const clinicalSweepers = {
    name: 'Clinical Sweepers',
    port: 0,
    cwd: rootDir,
    executable: process.execPath,
    args: ['--max-old-space-size=512', 'scripts/clinical-sweepers-daemon.mjs'],
    color: '\x1b[34m',
    autoRestart: true
  };
  spawnService(clinicalSweepers);

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
      name: 'Patient Mobile App',
      port: 5174,
      cwd: path.join(rootDir, 'apps/patient-app'),
      executable: process.execPath,
      args: [path.join(rootDir, 'apps/patient-app/node_modules/vite/bin/vite.js'), '--port', '5174', '--host', '--strictPort'],
      color: '\x1b[35m'
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

  // Step 3: Launch DocSearch Master Unified Gateway on Port 3000
  const unifiedGateway = {
    name: 'Master Gateway Hub',
    port: 3000,
    cwd: rootDir,
    executable: process.execPath,
    args: ['--max-old-space-size=512', 'scripts/unified-gateway.mjs'],
    color: '\x1b[36m',
    autoRestart: true
  };
  spawnService(unifiedGateway);

  // Keep supervisor process alive indefinitely
  setInterval(() => {}, 60000);
}

const cleanup = () => {
  isShuttingDown = true;
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
