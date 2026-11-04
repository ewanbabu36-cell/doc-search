import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.turbo' || file === 'build') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const apiRoutes = walk('apps/api-gateway/src/routes').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
const apiServices = walk('apps/api-gateway/src/services').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
const apiRepos = walk('apps/api-gateway/src/repositories').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
const dbSchemas = walk('packages/database/src/schema').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
const partnerFiles = walk('apps/partner-platform/src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const companyFiles = walk('apps/company-platform/src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const landingFiles = walk('apps/landing-page/src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const authFiles = walk('packages/auth/src').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
const sharedFiles = walk('packages/shared-core/src').filter(f => f.endsWith('.ts') || f.endsWith('.js'));

console.log(JSON.stringify({
  apiRouteFiles: apiRoutes.length,
  apiServiceFiles: apiServices.length,
  apiRepositoryFiles: apiRepos.length,
  dbSchemaFiles: dbSchemas.length,
  partnerPlatformFiles: partnerFiles.length,
  companyPlatformFiles: companyFiles.length,
  landingPageFiles: landingFiles.length,
  authPackageFiles: authFiles.length,
  sharedCoreFiles: sharedFiles.length,
  totalFrontendFiles: partnerFiles.length + companyFiles.length + landingFiles.length,
  totalBackendFiles: apiRoutes.length + apiServices.length + apiRepos.length + dbSchemas.length + authFiles.length + sharedFiles.length,
  totalAuditedSourceFiles: apiRoutes.length + apiServices.length + apiRepos.length + dbSchemas.length + partnerFiles.length + companyFiles.length + landingFiles.length + authFiles.length + sharedFiles.length
}, null, 2));
