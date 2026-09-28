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
const tablePattern = /export const (\w+)\s*=\s*(?:\w+\.)?table\s*\(\s*['"`]([^'"`]+)['"`]/g;
const pgTablePattern = /export const (\w+)\s*=\s*pgTable\s*\(\s*['"`]([^'"`]+)['"`]/g;

for (const file of schemaFiles) {
  const normFile = file.replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    tables.push({
      file: normFile,
      varName: match[1],
      sqlTableName: match[2]
    });
  }
  while ((match = pgTablePattern.exec(content)) !== null) {
    if (!tables.some(t => t.file === normFile && t.varName === match[1])) {
      tables.push({
        file: normFile,
        varName: match[1],
        sqlTableName: match[2]
      });
    }
  }
}

console.log(`Total Database Tables Discovered: ${tables.length}`);
const bySchema = {};
tables.forEach(t => {
  const parts = t.file.split('/');
  const group = parts[parts.length - 2] || 'root';
  bySchema[group] = (bySchema[group] || 0) + 1;
});
console.log('Tables by Group:', bySchema);
fs.writeFileSync('scripts/audit-db-tables.json', JSON.stringify(tables, null, 2));
