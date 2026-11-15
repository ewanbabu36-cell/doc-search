import fs from 'fs';
import path from 'path';

console.log('=== 1. AUDITING REMAINING ALERTS & CONFIRMS ===');
const alertFiles = [];
function scanAlerts(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scanAlerts(full);
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if ((line.match(/\balert\s*\(/) || line.match(/\bconfirm\s*\(/)) && !line.includes('//') && !line.includes('NEWS2') && !line.includes('Alert (')) {
          alertFiles.push({ file: full, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
}
['apps/partner-platform/src', 'apps/patient-app/src', 'apps/company-platform/src'].forEach(scanAlerts);
console.log(`Remaining alert/confirm calls: ${alertFiles.length}`);
alertFiles.slice(0, 15).forEach(a => console.log(`  [Line ${a.line}] ${a.file.replace(/.*apps[\\\/]/, '')}: ${a.text.slice(0, 80)}`));

console.log('\n=== 2. AUDITING DEAD ONCLICK HANDLERS (TODO / EMPTY / CONSOLE.LOG) ===');
const deadButtons = [];
function scanDeadButtons(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scanDeadButtons(full);
    else if (e.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.match(/onClick=\{?\s*\(\s*\)\s*=>\s*\{\s*\}?/) || line.match(/onClick=\{?\s*\(\s*\)\s*=>\s*console\.(log|warn)/)) {
          deadButtons.push({ file: full.replace(/.*apps[\\\/]/, ''), line: idx + 1, text: line.trim() });
        }
      });
    }
  }
}
['apps/partner-platform/src', 'apps/patient-app/src', 'apps/company-platform/src'].forEach(scanDeadButtons);
console.log(`Dead / Stubbed onClick handlers found: ${deadButtons.length}`);
deadButtons.slice(0, 15).forEach(b => console.log(`  [Line ${b.line}] ${b.file}: ${b.text.slice(0, 80)}`));

console.log('\n=== 3. AUDITING HARDCODED MOCK / STUB ENDPOINTS IN API GATEWAY ===');
const mockRoutes = [];
function scanMockRoutes(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scanMockRoutes(full);
    else if (e.name.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('// mock') || content.includes('// dummy') || content.includes('// simulated') || content.includes('// TODO')) {
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('// mock') || l.includes('// dummy') || l.includes('// simulated') || l.includes('// TODO')) {
            mockRoutes.push({ file: full.replace(/.*apps[\\\/]/, ''), line: idx + 1, text: l.trim() });
          }
        });
      }
    }
  }
}
scanMockRoutes('apps/api-gateway/src/routes');
console.log(`Simulated / Mock route comments found: ${mockRoutes.length}`);
mockRoutes.slice(0, 15).forEach(m => console.log(`  [Line ${m.line}] ${m.file}: ${m.text.slice(0, 80)}`));
