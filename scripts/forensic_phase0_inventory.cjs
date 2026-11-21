const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'd:\\DOC SEARCH';

function countFilesAndLines(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.css', '.html', '.mjs', '.cjs']) {
  let fileCount = 0;
  let lineCount = 0;
  function walk(d) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (exts.includes(ext)) {
          fileCount++;
          try {
            const content = fs.readFileSync(full, 'utf8');
            lineCount += content.split('\n').length;
          } catch (e) {}
        }
      }
    }
  }
  walk(dir);
  return { fileCount, lineCount };
}

// 1. Applications inventory
const appsDir = path.join(rootDir, 'apps');
const apps = fs.readdirSync(appsDir).filter(f => fs.statSync(path.join(appsDir, f)).isDirectory());
const appDetails = [];

for (const app of apps) {
  const pkgPath = path.join(appsDir, app, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  }
  const stats = countFilesAndLines(path.join(appsDir, app));
  appDetails.push({
    name: app,
    packageName: pkg.name || app,
    version: pkg.version || '1.0.0',
    scripts: pkg.scripts || {},
    dependenciesCount: Object.keys(pkg.dependencies || {}).length,
    devDependenciesCount: Object.keys(pkg.devDependencies || {}).length,
    dependencies: Object.keys(pkg.dependencies || {}),
    files: stats.fileCount,
    lines: stats.lineCount
  });
}

// 2. Packages inventory
const pkgsDir = path.join(rootDir, 'packages');
const pkgs = fs.readdirSync(pkgsDir).filter(f => fs.statSync(path.join(pkgsDir, f)).isDirectory());
const pkgDetails = [];

for (const p of pkgs) {
  const pkgPath = path.join(pkgsDir, p, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  }
  const stats = countFilesAndLines(path.join(pkgsDir, p));
  pkgDetails.push({
    name: p,
    packageName: pkg.name || p,
    version: pkg.version || '1.0.0',
    scripts: pkg.scripts || {},
    dependenciesCount: Object.keys(pkg.dependencies || {}).length,
    devDependenciesCount: Object.keys(pkg.devDependencies || {}).length,
    dependencies: Object.keys(pkg.dependencies || {}),
    files: stats.fileCount,
    lines: stats.lineCount
  });
}

// 3. Database migrations inventory
const migDir = path.join(rootDir, 'packages', 'database', 'migrations');
let migrationFiles = [];
let journalEntries = [];
if (fs.existsSync(migDir)) {
  migrationFiles = fs.readdirSync(migDir).filter(f => f.endsWith('.sql'));
  const journalPath = path.join(migDir, 'meta', '_journal.json');
  if (fs.existsSync(journalPath)) {
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    journalEntries = journal.entries || [];
  }
}

// 4. Environment files audit (tracking status & variable keys without exposing values)
const envFiles = ['.env', '.env.example', '.env.local', '.env.production', '.env.production.example', '.env.docker.example'];
const envDetails = [];
for (const ef of envFiles) {
  const full = path.join(rootDir, ef);
  const exists = fs.existsSync(full);
  let isTracked = false;
  if (exists) {
    try {
      const out = execSync(`git ls-files --error-unmatch "${ef}"`, { cwd: rootDir, stdio: 'pipe' }).toString().trim();
      isTracked = out === ef;
    } catch (e) {
      isTracked = false;
    }
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    const varKeys = lines
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => l.split('=')[0].trim());
    envDetails.push({ file: ef, exists, isTracked, keyCount: varKeys.length, keys: varKeys });
  } else {
    envDetails.push({ file: ef, exists: false, isTracked: false, keyCount: 0, keys: [] });
  }
}

// 5. Root package.json
const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// 6. Existing Certification and Audit Documents
const docs = fs.readdirSync(rootDir).filter(f => f.endsWith('.md') && (f.includes('AUDIT') || f.includes('CERTIFICATION') || f.includes('REPORT') || f.includes('DECISION') || f.includes('REGISTER')));

const result = {
  timestamp: new Date().toISOString(),
  rootPackage: {
    name: rootPkg.name,
    scripts: rootPkg.scripts,
    packageManager: rootPkg.packageManager,
    workspaces: rootPkg.workspaces || []
  },
  applications: appDetails,
  packages: pkgDetails,
  migrations: {
    totalSqlFiles: migrationFiles.length,
    sqlFiles: migrationFiles,
    journalEntriesCount: journalEntries.length,
    journalEntries: journalEntries.map(j => ({ idx: j.idx, tag: j.tag, when: j.when }))
  },
  environmentSecurity: envDetails,
  existingAuditDocsCount: docs.length,
  existingAuditDocs: docs
};

fs.writeFileSync(path.join(rootDir, 'DOCSEARCH_PHASE0_RAW_METRICS.json'), JSON.stringify(result, null, 2), 'utf8');
console.log('Phase 0 Raw Metrics collected and written to DOCSEARCH_PHASE0_RAW_METRICS.json');
