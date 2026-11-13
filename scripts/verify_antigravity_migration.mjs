import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function getFileHashAndSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, size: 0, hash: 'MISSING' };
  }
  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { exists: true, size: stat.size, hash };
}

function countDir(dirPath) {
  let fileCount = 0;
  let dirCount = 0;
  let totalBytes = 0;

  function traverse(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          dirCount++;
          traverse(full);
        } else if (entry.isFile()) {
          fileCount++;
          try {
            totalBytes += fs.statSync(full).size;
          } catch (e) {}
        }
      }
    } catch (e) {
      // Permission or locked file
    }
  }

  if (fs.existsSync(dirPath)) {
    traverse(dirPath);
  }
  return { fileCount, dirCount, totalBytes, mb: (totalBytes / (1024 * 1024)).toFixed(2) };
}

console.log('=== VERIFYING ANTIGRAVITY DATA COPIES ===');

const cPath = 'C:\\Users\\alamr\\.gemini\\antigravity';
const dData = 'D:\\AntigravityData';
const backupData = 'D:\\Antigravity_Migration_Backup\\snapshot_20261113_1611\\gemini_antigravity';

console.log('\n--- 1. Critical Index Database: conversation_summaries.db ---');
const cDb = getFileHashAndSize(path.join(cPath, 'conversation_summaries.db'));
const dDb = getFileHashAndSize(path.join(dData, 'conversation_summaries.db'));
const bDb = getFileHashAndSize(path.join(backupData, 'conversation_summaries.db'));

console.log(`C:      Size: ${cDb.size} bytes | SHA256: ${cDb.hash}`);
console.log(`D:      Size: ${dDb.size} bytes | SHA256: ${dDb.hash}`);
console.log(`Backup: Size: ${bDb.size} bytes | SHA256: ${bDb.hash}`);

console.log('\n--- 2. Critical Configuration: installation_id & other root files ---');
for (const file of ['installation_id', 'version.txt', 'config.json']) {
  const cFile = getFileHashAndSize(path.join(cPath, file));
  const dFile = getFileHashAndSize(path.join(dData, file));
  if (cFile.exists) {
    console.log(`File [${file}]: C: ${cFile.hash.slice(0, 16)}... | D: ${dFile.hash.slice(0, 16)}... Match: ${cFile.hash === dFile.hash}`);
  }
}

console.log('\n--- 3. Target D:\\AntigravityData Volume Stats ---');
const dStats = countDir(dData);
console.log(`D:\\AntigravityData: ${dStats.fileCount} files, ${dStats.dirCount} folders, ${dStats.mb} MB`);

console.log('\n--- 4. Drive Space Check ---');
import { execSync } from 'child_process';
const driveInfo = execSync('powershell -NoProfile -Command "Get-PSDrive C, D | Select-Object Name, @{N=\'UsedGB\';E={[math]::Round($_.Used/1GB,2)}}, @{N=\'FreeGB\';E={[math]::Round($_.Free/1GB,2)}} | ConvertTo-Json"').toString();
console.log(driveInfo);
