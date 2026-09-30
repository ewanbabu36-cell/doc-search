import fs from 'node:fs';
import path from 'node:path';

function scan(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) scan(p, out);
    else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      const c = fs.readFileSync(p, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('hasPermission') || l.includes('canAccess') || l.includes('roles.') || l.includes('isSuperAdmin')) {
          out.push({ file: p.replace(/\\/g, '/'), line: i + 1, text: l.trim().substring(0, 100) });
        }
      });
    }
  }
  return out;
}

const res = scan('D:/DOC SEARCH/apps/partner-platform/src');
console.log('Partner Platform RBAC matches:', res.length);
res.slice(0, 10).forEach(r => console.log(r.file.split('/').slice(-2).join('/') + ':' + r.line, r.text));

const res2 = scan('D:/DOC SEARCH/apps/company-platform/src');
console.log('Company Platform RBAC matches:', res2.length);
res2.slice(0, 10).forEach(r => console.log(r.file.split('/').slice(-2).join('/') + ':' + r.line, r.text));
