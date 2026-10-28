import fs from 'fs';

function checkRoutes(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const regex = /fastify\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
  let m;
  console.log(`\n=== ${file} ===`);
  while ((m = regex.exec(content)) !== null) {
    console.log(`${m[1].toUpperCase().padEnd(6)} ${m[2]}`);
  }
}

checkRoutes('apps/api-gateway/src/routes/partner/insurance-management.routes.ts');
checkRoutes('apps/api-gateway/src/routes/partner/nhcx-insurance.routes.ts');
