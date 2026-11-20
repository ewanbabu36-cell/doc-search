import fs from 'fs';
import path from 'path';

function getDirStats(dirPath) {
  let totalBytes = 0;
  let fileCount = 0;
  let dirCount = 0;

  function traverse(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      try {
        if (entry.isDirectory()) {
          dirCount++;
          traverse(fullPath);
        } else if (entry.isFile()) {
          fileCount++;
          const stat = fs.statSync(fullPath);
          totalBytes += stat.size;
        }
      } catch (e) {}
    }
  }

  traverse(dirPath);
  return { totalBytes, fileCount, dirCount };
}

function run() {
  const root = process.cwd();
  console.log(`=== AUDITING ROOT DIRECTORY: ${root} ===\n`);

  const topLevel = fs.readdirSync(root, { withFileTypes: true });
  const results = [];

  for (const item of topLevel) {
    const itemPath = path.join(root, item.name);
    try {
      if (item.isDirectory()) {
        const stats = getDirStats(itemPath);
        results.push({
          name: item.name,
          type: 'DIR',
          bytes: stats.totalBytes,
          mb: (stats.totalBytes / (1024 * 1024)).toFixed(2),
          gb: (stats.totalBytes / (1024 * 1024 * 1024)).toFixed(3),
          files: stats.fileCount,
          folders: stats.dirCount
        });
      } else if (item.isFile()) {
        const stat = fs.statSync(itemPath);
        results.push({
          name: item.name,
          type: 'FILE',
          bytes: stat.size,
          mb: (stat.size / (1024 * 1024)).toFixed(2),
          gb: (stat.size / (1024 * 1024 * 1024)).toFixed(3),
          files: 1,
          folders: 0
        });
      }
    } catch (e) {}
  }

  results.sort((a, b) => b.bytes - a.bytes);

  console.log('--- TOP 25 LARGEST ITEMS IN ROOT ---');
  for (const r of results.slice(0, 25)) {
    console.log(`${r.type.padEnd(5)} | ${r.mb.padStart(9)} MB (${r.gb} GB) | Files: ${String(r.files).padStart(6)} | ${r.name}`);
  }

  // Also analyze sub-breakdowns:
  // 1. All node_modules combined across monorepo
  console.log('\n--- SCANNING SPECIFIC MONOREPO BREAKDOWNS ---');
  
  // Find all node_modules
  let totalNodeModulesBytes = 0;
  let totalNodeModulesFiles = 0;
  
  function scanForFolder(startDir, folderName) {
    let matches = [];
    function walk(cur) {
      let entries;
      try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const fp = path.join(cur, e.name);
        if (e.isDirectory()) {
          if (e.name === folderName) {
            const st = getDirStats(fp);
            matches.push({ path: path.relative(root, fp), ...st });
          } else {
            walk(fp);
          }
        }
      }
    }
    walk(startDir);
    return matches;
  }

  const nmList = scanForFolder(root, 'node_modules');
  let nmBytes = 0, nmFiles = 0;
  for (const nm of nmList) {
    nmBytes += nm.totalBytes;
    nmFiles += nm.fileCount;
  }
  console.log(`Total node_modules across monorepo: ${(nmBytes / (1024 * 1024)).toFixed(2)} MB (${(nmBytes / (1024 * 1024 * 1024)).toFixed(3)} GB) across ${nmFiles} files in ${nmList.length} folders.`);

  // Find all dist / build folders
  const distList = scanForFolder(root, 'dist');
  let distBytes = 0, distFiles = 0;
  for (const d of distList) {
    distBytes += d.totalBytes;
    distFiles += d.fileCount;
  }
  console.log(`Total dist/build folders: ${(distBytes / (1024 * 1024)).toFixed(2)} MB across ${distFiles} files in ${distList.length} folders.`);

  // Find all .turbo folders
  const turboList = scanForFolder(root, '.turbo');
  let turboBytes = 0, turboFiles = 0;
  for (const t of turboList) {
    turboBytes += t.totalBytes;
    turboFiles += t.fileCount;
  }
  console.log(`Total .turbo cache folders: ${(turboBytes / (1024 * 1024)).toFixed(2)} MB across ${turboFiles} files in ${turboList.length} folders.`);

  // Find large files (> 5MB) across entire repository
  console.log('\n--- LARGE INDIVIDUAL FILES (> 5 MB) ---');
  const largeFiles = [];
  function scanLargeFiles(cur) {
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const fp = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && e.name !== '.git') {
          scanLargeFiles(fp);
        }
      } else if (e.isFile()) {
        try {
          const st = fs.statSync(fp);
          if (st.size > 5 * 1024 * 1024) {
            largeFiles.push({ path: path.relative(root, fp), bytes: st.size, mb: (st.size / (1024 * 1024)).toFixed(2) });
          }
        } catch {}
      }
    }
  }
  scanLargeFiles(root);
  largeFiles.sort((a, b) => b.bytes - a.bytes);
  for (const lf of largeFiles) {
    console.log(`FILE | ${lf.mb.padStart(8)} MB | ${lf.path}`);
  }

  // Breakdown of apps/
  console.log('\n--- APPS BREAKDOWN ---');
  if (fs.existsSync('apps')) {
    const apps = fs.readdirSync('apps', { withFileTypes: true });
    for (const app of apps) {
      if (app.isDirectory()) {
        const st = getDirStats(path.join('apps', app.name));
        console.log(`apps/${app.name}: ${(st.totalBytes / (1024 * 1024)).toFixed(2)} MB (${st.fileCount} files)`);
      }
    }
  }

  // Breakdown of packages/
  console.log('\n--- PACKAGES BREAKDOWN ---');
  if (fs.existsSync('packages')) {
    const pkgs = fs.readdirSync('packages', { withFileTypes: true });
    for (const pkg of pkgs) {
      if (pkg.isDirectory()) {
        const st = getDirStats(path.join('packages', pkg.name));
        console.log(`packages/${pkg.name}: ${(st.totalBytes / (1024 * 1024)).toFixed(2)} MB (${st.fileCount} files)`);
      }
    }
  }
}

run();
