import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles('apps/api-gateway/src/routes');
const allRoutes = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /(?:fastify|app|router)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    allRoutes.push({
      method: m[1].toUpperCase(),
      path: m[2],
      file: path.relative('.', f).replace(/\\/g, '/')
    });
  }
});

const queries = [
  'compliance/documents',
  'admission-requests',
  'blood-bank',
  'lab/catalog',
  'lab/orders',
  'encounters',
  'patients',
  'pharmacy/medications',
  'pharmacy/prescriptions',
  'pharmacy/inventory',
  'pharmacy/batches',
  'staff/members'
];

queries.forEach(q => {
  console.log(`\n=== QUERY: ${q} ===`);
  const found = allRoutes.filter(r => r.path.includes(q));
  if (found.length === 0) {
    console.log('  NONE FOUND');
  } else {
    found.forEach(r => console.log(`  ${r.method} ${r.path} (${r.file})`));
  }
});
