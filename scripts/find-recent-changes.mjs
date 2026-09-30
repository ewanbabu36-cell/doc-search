import fs from 'fs';
import path from 'path';

const root = process.cwd();
const ignore = new Set(['node_modules', '.git', 'dist', '.gemini', 'build', '.turbo', '.next']);
const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // last 3 days

const results = [];

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    if (ignore.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else {
      try {
        const stat = fs.statSync(full);
        if (stat.mtimeMs >= cutoff) {
          const rel = path.relative(root, full).replace(/\\/g, '/');
          results.push({ path: rel, mtime: new Date(stat.mtimeMs).toISOString(), size: stat.size });
        }
      } catch {}
    }
  }
}

walk(root);
results.sort((a,b) => b.mtime.localeCompare(a.mtime));
console.log('Total files modified in last 3 days:', results.length);
const srcOnly = results.filter(r => 
  (r.path.startsWith('apps/') || r.path.startsWith('packages/')) && 
  !r.path.includes('/dist/') && 
  !r.path.endsWith('.log') && 
  !r.path.endsWith('.map')
);
console.log('Source files in apps/ and packages/ modified in last 3 days:', srcOnly.length);
console.log(JSON.stringify(srcOnly.slice(0, 50), null, 2));

// Save to disk for inspection
fs.writeFileSync('scripts/recent-files-3days.json', JSON.stringify(srcOnly, null, 2));
