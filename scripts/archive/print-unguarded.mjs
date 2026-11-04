import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const jsonPath = path.join(rootDir, 'reports/rbac/baseline.json');
const baseline = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('--- ENDPOINTS CLASSIFIED AS UNGUARDED (Count:', baseline.routeAudit.endpoints.filter(e => e.classification === 'UNGUARDED').length, ') ---');
for (const e of baseline.routeAudit.endpoints.filter(e => e.classification === 'UNGUARDED')) {
  console.log(`${e.method} ${e.path} [${e.file}]`);
}
