import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const routesDir = path.join(rootDir, 'apps/api-gateway/src/routes');
const routes = [];

function findRoutes(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      findRoutes(full);
    } else if (f.name.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.matchAll(/fastify\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g);
      for (const m of matches) {
        routes.push({
          method: m[1].toUpperCase(),
          path: m[2],
          file: path.relative(rootDir, full)
        });
      }
    }
  }
}
findRoutes(routesDir);

console.log('Total Fastify Routes registered:', routes.length);

const targets = [
  'compliance',
  'patient-360',
  'health',
  'ai-copilot',
  'copilot',
  'ai/chat',
  'ai-chat',
  'ai/voice',
  'ai-voice',
  'biomedical',
  'blood-bank',
  'partner/configuration',
  'procurement',
  'staff/members'
];

for (const t of targets) {
  const matching = routes.filter(r => r.path.toLowerCase().includes(t.toLowerCase()));
  console.log(`\n--- TARGET: "${t}" (matches: ${matching.length}) ---`);
  matching.slice(0, 10).forEach(m => console.log(`  [${m.method}] ${m.path} (${m.file})`));
}
