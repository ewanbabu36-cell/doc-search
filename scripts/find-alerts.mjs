import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function scan(dir) {
  for (const item of fs.readdirSync(dir)) {
    if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const c = fs.readFileSync(full, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, idx) => {
        if (!l.includes('//') && !l.includes('Alert') && !l.includes('ConfirmDialog') && !l.includes('isAlert') && !l.includes('showAlert') && !l.includes('setAlert')) {
          if (/\b(window\.)?(alert|confirm)\s*\(/.test(l)) {
            console.log(`${full.replace(rootDir, '').replace(/^[\\\/]/, '')}:${idx + 1} -> ${l.trim()}`);
          }
        }
      });
    }
  }
}

scan(path.join(rootDir, 'apps'));
