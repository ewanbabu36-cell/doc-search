import fs from 'fs';
const file = 'apps/partner-platform/src/services/api-client.ts';
let content = fs.readFileSync(file, 'utf8');
const start = content.indexOf('export function isMockFallbackAllowed');
const end = content.indexOf('export async function apiRequest');
if (start !== -1 && end !== -1) {
  const target = content.substring(start, end);
  content = content.replace(target, 'export function isMockFallbackAllowed(): boolean {\n  return false;\n}\n\n');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated partner api-client.ts');
} else {
  console.log('Target not found', { start, end });
}
