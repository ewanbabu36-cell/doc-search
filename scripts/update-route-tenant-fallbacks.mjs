import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'apps/api-gateway/src/routes';
const OLD_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';
const CANONICAL_ID = '11111111-1111-4111-8111-111111111111';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  let replacedFiles = 0;
  let totalReplacements = 0;

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const res = processDir(fullPath);
      replacedFiles += res.replacedFiles;
      totalReplacements += res.totalReplacements;
    } else if (f.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(OLD_ID)) {
        const count = content.split(OLD_ID).length - 1;
        const newContent = content.replaceAll(OLD_ID, CANONICAL_ID);
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`  ✓ Updated ${path.relative(process.cwd(), fullPath)}: replaced ${count} occurrences`);
        replacedFiles++;
        totalReplacements += count;
      }
    }
  }
  return { replacedFiles, totalReplacements };
}

console.log('=== UPDATING ROUTE FALLBACK TENANT IDS ===\n');
const res = processDir(TARGET_DIR);
console.log(`\nUpdated ${res.replacedFiles} route files with ${res.totalReplacements} replacements.`);
