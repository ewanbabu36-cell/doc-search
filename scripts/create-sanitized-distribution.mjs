import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('D:/DOC SEARCH');
const STAGING_DIR = path.join(ROOT_DIR, '.tmp_sanitized_staging');
const targetZipName = process.argv[2] || 'DOC_SEARCH_COMPLETE_PROJECT.zip';
const OUTPUT_ZIP = path.join(ROOT_DIR, targetZipName);

console.log('================================================================');
console.log(`DOC SEARCH — COMPLETE PROJECT ARCHIVE GENERATOR (${targetZipName})`);
console.log('================================================================\n');

// 1. Clean previous staging or zip if exists
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
if (fs.existsSync(OUTPUT_ZIP)) {
  fs.rmSync(OUTPUT_ZIP, { force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });

// 2. Define Exclusion Rules
const IGNORED_EXACT_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  'coverage',
  '.tmp_sanitized_staging',
  'backups',
  '.storage',
  'scratch'
]);

const IGNORED_PATH_PREFIXES = [
  'data/db-native-utf8',
  'data/backups',
  'data/pacs-storage',
  'data/mail-inbox',
  'data/analyzers',
  'data/printers',
  'data/dsc-vault',
  'data/storage'
];

function shouldExclude(relPath, isDirectory) {
  const normalized = relPath.replace(/\\/g, '/');
  const base = path.basename(relPath);
  const segments = normalized.split('/');

  // Check directories to skip anywhere in the tree
  if (segments.some(s => IGNORED_EXACT_DIRS.has(s))) {
    return true;
  }

  // Check path prefixes
  for (const prefix of IGNORED_PATH_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) {
      return true;
    }
  }

  // Check ZIPs
  if (base.endsWith('.zip') || base.endsWith('.tar.gz') || base.endsWith('.tgz')) {
    return true;
  }

  // Check .env files: Keep ONLY .env.example
  if (base.startsWith('.env')) {
    if (base === '.env.example') {
      return false; // KEEP
    }
    return true; // EXCLUDE .env, .env.local, .env.production, etc.
  }

  // Exclude log files from runs
  if (base.endsWith('.log') && !normalized.startsWith('docs/')) {
    return true;
  }

  return false;
}

// 3. Recursive Copy
let fileCount = 0;
let dirCount = 0;

function copyRecursive(currentDir, targetDir, relBase = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(currentDir, entry.name);
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    const destPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (shouldExclude(relPath, true)) {
        continue;
      }
      fs.mkdirSync(destPath, { recursive: true });
      dirCount++;
      copyRecursive(srcPath, destPath, relPath);
    } else if (entry.isFile()) {
      if (shouldExclude(relPath, false)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
      fileCount++;
    }
  }
}

console.log('Copying complete sanitized project tree to staging area...');
copyRecursive(ROOT_DIR, STAGING_DIR);
console.log(`Staged ${fileCount} files across ${dirCount} directories.\n`);

// 4. Audit & Verification Gate on Staged Material
console.log('--- EXPLICIT SANITIZATION & COMPLETENESS CHECKS ---');

function walkStaging(dir, foundList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(STAGING_DIR, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkStaging(full, foundList);
    } else {
      foundList.push(rel);
    }
  }
  return foundList;
}

const allStagedFiles = walkStaging(STAGING_DIR);

// Verification 1: No live .env files
const leakedEnvFiles = allStagedFiles.filter(f => {
  const b = path.basename(f);
  return b.startsWith('.env') && b !== '.env.example';
});
console.log(`Live .env files in archive: ${leakedEnvFiles.length} (Expected: 0)`);
if (leakedEnvFiles.length > 0) {
  console.error('FATAL: Leaked .env files found:', leakedEnvFiles);
  process.exit(1);
}

// Verification 2: .env.example is present
const hasEnvExample = allStagedFiles.some(f => path.basename(f) === '.env.example');
console.log(`.env.example present: ${hasEnvExample} (Expected: true)`);
if (!hasEnvExample) {
  console.error('FATAL: .env.example template missing from archive!');
  process.exit(1);
}

// Verification 3: No raw database cluster files
const leakedDbFiles = allStagedFiles.filter(f =>
  f.includes('db-native-utf8') ||
  f.includes('PG_VERSION') ||
  f.includes('pacs-storage') ||
  f.includes('wal_archive') ||
  f.startsWith('.storage')
);
console.log(`Raw DB / PACS / Backup files: ${leakedDbFiles.length} (Expected: 0)`);
if (leakedDbFiles.length > 0) {
  console.error('FATAL: Leaked DB / storage files found:', leakedDbFiles);
  process.exit(1);
}

// Verification 4: No node_modules
const leakedNodeModules = allStagedFiles.filter(f => f.includes('node_modules'));
console.log(`node_modules files: ${leakedNodeModules.length} (Expected: 0)`);
if (leakedNodeModules.length > 0) {
  console.error('FATAL: node_modules found in staging!');
  process.exit(1);
}

// Verification 5: Key source directories are present
const requiredDirs = ['apps', 'packages', 'tooling', 'tests', 'scripts', 'docs'];
for (const req of requiredDirs) {
  const hasDir = allStagedFiles.some(f => f.startsWith(req + '/'));
  console.log(`Required directory '${req}' present: ${hasDir}`);
  if (!hasDir) {
    console.error(`FATAL: Required directory '${req}' missing from archive!`);
    process.exit(1);
  }
}

console.log('\nAll sanitization & completeness assertions PASSED!\n');

// 5. Create ZIP Archive
console.log(`Creating ${OUTPUT_ZIP} via native tar compression...`);
execSync(`tar.exe -a -c -f "${OUTPUT_ZIP}" *`, {
  cwd: STAGING_DIR,
  stdio: 'inherit'
});

// 6. Clean up staging directory
fs.rmSync(STAGING_DIR, { recursive: true, force: true });

// 7. Measure File Size & SHA-256
const stats = fs.statSync(OUTPUT_ZIP);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
const fileBuffer = fs.readFileSync(OUTPUT_ZIP);
const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

console.log('\n================================================================');
console.log('COMPLETE PROJECT ARCHIVE GENERATED SUCCESSFULLY');
console.log('================================================================');
console.log(`Primary Archive:   ${OUTPUT_ZIP}`);
console.log(`File Size:         ${sizeMB} MB (${stats.size} bytes)`);
console.log(`SHA-256 Checksum:  ${sha256}`);
console.log('================================================================\n');
