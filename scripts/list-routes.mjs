import fs from 'fs';

const content = fs.readFileSync('apps/api-gateway/src/routes/partner/billing-management.routes.ts', 'utf8');
const regex = /fastify\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
let m;
console.log('=== BILLING MANAGEMENT BACKEND ROUTES ===');
while ((m = regex.exec(content)) !== null) {
  console.log(`${m[1].toUpperCase().padEnd(6)} ${m[2]}`);
}
