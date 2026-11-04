import fs from 'fs';

let content = fs.readFileSync('apps/api-gateway/src/app.ts', 'utf8');
if (!content.includes('workspaceLayoutRoutes')) {
  content = content.replace(
    "import { commercialOperationsRoutes } from './routes/partner/commercial-operations.routes.js';",
    "import { commercialOperationsRoutes } from './routes/partner/commercial-operations.routes.js';\nimport { workspaceLayoutRoutes } from './routes/partner/workspace-layout.routes.js';"
  );
  content = content.replace(
    "await app.register(ewanSuperBrainRoutes);",
    "await app.register(ewanSuperBrainRoutes);\n  await app.register(workspaceLayoutRoutes);"
  );
  fs.writeFileSync('apps/api-gateway/src/app.ts', content, 'utf8');
  console.log('✅ Registered workspaceLayoutRoutes in apps/api-gateway/src/app.ts');
} else {
  console.log('Already registered.');
}
