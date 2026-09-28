import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
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

const schemaFiles = walk('packages/database/src/schema').filter(f => f.endsWith('.ts'));

const tables = [];
const tablePattern = /export const (\w+) = (?:pgTable|pgTableCreator\([^)]*\))\s*\(\s*['"`]([^'"`]+)['"`]/g;

for (const file of schemaFiles) {
  const normFile = file.replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    const varName = match[1];
    const sqlTableName = match[2];
    const line = content.substring(0, match.index).split('\n').length;
    
    // Check snippet for tenantId / partnerId
    const snippet = content.substring(match.index, Math.min(content.length, match.index + 1200));
    const hasTenantId = /tenantId|tenant_id/.test(snippet);
    const hasPartnerId = /partnerId|partner_id/.test(snippet);
    const hasOrgId = /organizationId|organization_id/.test(snippet);
    const hasBranchId = /branchId|branch_id/.test(snippet);
    const hasDeletedAt = /deletedAt|deleted_at|isDeleted/.test(snippet);
    const hasCreatedAt = /createdAt|created_at/.test(snippet);

    tables.push({
      file: normFile,
      line,
      varName,
      sqlTableName,
      hasTenantId,
      hasPartnerId,
      hasOrgId,
      hasBranchId,
      hasDeletedAt,
      hasCreatedAt
    });
  }
}

console.log(`Total Database Tables Discovered: ${tables.length}`);
const withoutTenant = tables.filter(t => !t.hasTenantId);
console.log(`Tables without tenantId (likely global/system/hq tables): ${withoutTenant.length}`);
fs.writeFileSync('scripts/audit-db-tables.json', JSON.stringify(tables, null, 2));
console.log('Saved to scripts/audit-db-tables.json');
