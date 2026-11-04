import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = [
  'packages/api-contracts/dist',
  'packages/shared-core/dist',
  'packages/auth/dist',
  'packages/database/dist',
  'packages/ui-kit/dist',
  'apps/api-gateway/dist',
  'apps/company-platform/dist',
  'apps/landing-page/dist',
  'apps/partner-platform/dist',
  '.turbo'
];

function cleanDirectoryContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        cleanDirectoryContents(full);
        fs.rmdirSync(full);
      } else {
        fs.unlinkSync(full);
      }
    } catch (err) {
      // If OneDrive locked a file, continue
    }
  }
}

console.log('Cleaning generated build artifacts for zero-trust clean build...');
let cleaned = 0;
for (const rel of TARGET_DIRS) {
  const full = path.resolve(ROOT_DIR, rel);
  if (fs.existsSync(full)) {
    try {
      fs.rmSync(full, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      console.log(`  Removed directory: ${rel}`);
    } catch {
      cleanDirectoryContents(full);
      console.log(`  Emptied directory: ${rel}`);
    }
    cleaned++;
  }
}
console.log(`Clean complete. Processed ${cleaned} artifact directories.`);
