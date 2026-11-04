import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = process.cwd();
const EXCLUDED = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  '.data',
  '.storage',
  'coverage',
  'audit-results'
]);

let scannedCount = 0;
let jsonCount = 0;
let jsCount = 0;
let tsCount = 0;
const errors = [];

function checkDirectory(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (EXCLUDED.has(item.name)) continue;
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      checkDirectory(itemPath);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      const relative = path.relative(ROOT, itemPath).replace(/\\/g, '/');

      if (ext === '.json') {
        scannedCount++;
        jsonCount++;
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          if (relative.includes('tsconfig') || relative.includes('.vscode')) {
            const config = ts.readConfigFile(itemPath, ts.sys.readFile);
            if (config.error) {
              errors.push({ file: relative, error: config.error.messageText });
            }
          } else {
            JSON.parse(content);
          }
        } catch (err) {
          errors.push({ file: relative, error: err.message });
        }
      } else if (['.js', '.mjs', '.cjs'].includes(ext)) {
        scannedCount++;
        jsCount++;
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          const source = ts.createSourceFile(
            relative,
            content,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.JS
          );
          if (source.parseDiagnostics && source.parseDiagnostics.length > 0) {
            for (const d of source.parseDiagnostics) {
              errors.push({ file: relative, error: d.messageText, code: d.code });
            }
          }
        } catch (err) {
          errors.push({ file: relative, error: err.message });
        }
      } else if (['.ts', '.tsx'].includes(ext)) {
        scannedCount++;
        tsCount++;
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          const source = ts.createSourceFile(
            relative,
            content,
            ts.ScriptTarget.Latest,
            true,
            ext === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
          );
          if (source.parseDiagnostics && source.parseDiagnostics.length > 0) {
            for (const d of source.parseDiagnostics) {
              errors.push({ file: relative, error: d.messageText, code: d.code });
            }
          }
        } catch (err) {
          errors.push({ file: relative, error: err.message });
        }
      }
    }
  }
}

console.log('--- PHASE 12: FINAL INDEPENDENT SYNTAX AUDIT ---');
const t0 = performance.now();
checkDirectory(ROOT);
const t1 = performance.now();
const duration = ((t1 - t0) / 1000).toFixed(2);

console.log(`Scan completed in ${duration}s.`);
console.log(`Total Source Files Checked: ${scannedCount}`);
console.log(`- JSON Files: ${jsonCount}`);
console.log(`- JS/MJS/CJS Files: ${jsCount}`);
console.log(`- TS/TSX Files: ${tsCount}`);
console.log(`Total Syntax Errors: ${errors.length}`);

if (errors.length > 0) {
  console.error('FAIL - Syntax Errors Detected:', errors);
  process.exitCode = 1;
} else {
  console.log('PASS - ZERO REPOSITORY-WIDE SYNTAX/PARSING ERRORS');
  process.exitCode = 0;
}
