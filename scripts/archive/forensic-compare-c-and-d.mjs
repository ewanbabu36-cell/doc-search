import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIR_C = 'C:\\Users\\alamr\\OneDrive\\Desktop\\DOC SEARCH';
const DIR_D = 'D:\\DOC SEARCH';

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  '.cache',
  'temp_chrome_profile'
]);

function getFileHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    return null;
  }
}

function scanDir(dir, baseDir = dir) {
  const fileList = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const subFiles = scanDir(path.join(dir, entry.name), baseDir);
        fileList.push(...subFiles);
      } else if (entry.isFile()) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        try {
          const stat = fs.statSync(fullPath);
          fileList.push({
            relPath,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            mtimeStr: stat.mtime.toISOString(),
          });
        } catch (e) {
          // ignore stat errors
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${dir}:`, err.message);
  }
  return fileList;
}

console.log('Scanning C:', DIR_C);
const filesC = scanDir(DIR_C);
console.log(`Found ${filesC.length} files in C (excluding node_modules, .git, etc.)`);

console.log('Scanning D:', DIR_D);
const filesD = scanDir(DIR_D);
console.log(`Found ${filesD.length} files in D (excluding node_modules, .git, etc.)`);

const mapC = new Map(filesC.map(f => [f.relPath, f]));
const mapD = new Map(filesD.map(f => [f.relPath, f]));

const onlyInC = [];
const onlyInD = [];
const bothIdentical = [];
const bothDifferent = [];

for (const [relPath, itemC] of mapC.entries()) {
  if (!mapD.has(relPath)) {
    onlyInC.push(itemC);
  } else {
    const itemD = mapD.get(relPath);
    // Compare content
    const hashC = getFileHash(path.join(DIR_C, relPath));
    const hashD = getFileHash(path.join(DIR_D, relPath));

    if (hashC === hashD) {
      bothIdentical.push({
        relPath,
        size: itemC.size,
      });
    } else {
      bothDifferent.push({
        relPath,
        sizeC: itemC.size,
        sizeD: itemD.size,
        mtimeC: itemC.mtimeStr,
        mtimeD: itemD.mtimeStr,
        newer: itemC.mtimeMs > itemD.mtimeMs ? 'C' : (itemD.mtimeMs > itemC.mtimeMs ? 'D' : 'EQUAL_TIME'),
        timeDiffSec: Math.round(Math.abs(itemC.mtimeMs - itemD.mtimeMs) / 1000)
      });
    }
  }
}

for (const [relPath, itemD] of mapD.entries()) {
  if (!mapC.has(relPath)) {
    onlyInD.push(itemD);
  }
}

const summary = {
  totalInC: filesC.length,
  totalInD: filesD.length,
  identicalCount: bothIdentical.length,
  differentCount: bothDifferent.length,
  onlyInCCount: onlyInC.length,
  onlyInDCount: onlyInD.length,
  differentFilesNewerInC: bothDifferent.filter(f => f.newer === 'C').length,
  differentFilesNewerInD: bothDifferent.filter(f => f.newer === 'D').length,
  differentFiles: bothDifferent,
  onlyInC: onlyInC.slice(0, 100), // first 100 sample
  onlyInD: onlyInD.slice(0, 100), // first 100 sample
};

console.log('\n================ COMPARISON SUMMARY ================');
console.log(`Total comparable files in C: ${summary.totalInC}`);
console.log(`Total comparable files in D: ${summary.totalInD}`);
console.log(`Identical files in both:     ${summary.identicalCount}`);
console.log(`Different content in both:   ${summary.differentCount}`);
console.log(`  - Newer in C:              ${summary.differentFilesNewerInC}`);
console.log(`  - Newer in D:              ${summary.differentFilesNewerInD}`);
console.log(`Files ONLY in C:             ${summary.onlyInCCount}`);
console.log(`Files ONLY in D:             ${summary.onlyInDCount}`);
console.log('====================================================\n');

if (bothDifferent.length > 0) {
  console.log('Sample of different files:');
  for (const f of bothDifferent.slice(0, 30)) {
    console.log(`[${f.newer} is newer] ${f.relPath} (C: ${f.mtimeC}, D: ${f.mtimeD}, sizeC: ${f.sizeC}, sizeD: ${f.sizeD})`);
  }
}

if (onlyInC.length > 0) {
  console.log(`\nFiles only in C (showing top ${Math.min(20, onlyInC.length)}):`);
  for (const f of onlyInC.slice(0, 20)) {
    console.log(`[ONLY IN C] ${f.relPath} (${f.mtimeStr})`);
  }
}

if (onlyInD.length > 0) {
  console.log(`\nFiles only in D (showing top ${Math.min(20, onlyInD.length)}):`);
  for (const f of onlyInD.slice(0, 20)) {
    console.log(`[ONLY IN D] ${f.relPath} (${f.mtimeStr})`);
  }
}

fs.writeFileSync('d-vs-c-comparison-report.json', JSON.stringify({
  summary: {
    totalInC: summary.totalInC,
    totalInD: summary.totalInD,
    identicalCount: summary.identicalCount,
    differentCount: summary.differentCount,
    differentFilesNewerInC: summary.differentFilesNewerInC,
    differentFilesNewerInD: summary.differentFilesNewerInD,
    onlyInCCount: summary.onlyInCCount,
    onlyInDCount: summary.onlyInDCount
  },
  differentFiles: bothDifferent,
  allOnlyInC: onlyInC,
  allOnlyInD: onlyInD
}, null, 2));

console.log('\nWrote full report to d-vs-c-comparison-report.json');
