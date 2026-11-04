import fs from 'fs';
import path from 'path';

function scan(dir) {
  if (!fs.existsSync(dir)) return [];
  let res = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== 'dist') {
      res = res.concat(scan(p));
    } else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((l, idx) => {
        if ((l.includes("'#0f172a'") || l.includes('"#0f172a"') || l.includes("'#1e293b'") || l.includes('"#1e293b"')) &&
            (l.includes('color:') || l.includes('color :'))) {
          res.push({ file: p.replace(/\\/g, '/'), line: idx + 1, text: l.trim() });
        }
      });
    }
  }
  return res;
}

console.log('Company platform defects:', scan('apps/company-platform/src'));
console.log('Landing page defects:', scan('apps/landing-page/src'));
