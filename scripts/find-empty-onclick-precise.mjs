import fs from 'fs';
import path from 'path';

const deadHandlers = [];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scan(full);
    else if (e.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check single-line empty handler: onClick={() => {}} or onClick={() => { /* todo */ }}
        if (line.match(/onClick=\{?\s*\(\s*.*?\s*\)\s*=>\s*\{\s*(\/\*.*?\*\/)?\s*\}?\}?/)) {
          // Verify it doesn't open a multiline block
          if (line.includes('=> {}') || line.includes('=> { }') || line.includes('=> {/*') || line.match(/=>\s*\{\s*\}/)) {
            deadHandlers.push({ file: full, line: i + 1, text: line.trim() });
          }
        }
        // Check button without onClick or type="button" without onClick in interactive elements
        if (line.includes('onClick={() => console.') || line.includes('onClick={() => { console.')) {
          deadHandlers.push({ file: full, line: i + 1, text: line.trim() });
        }
      }
    }
  }
}

['apps/partner-platform/src', 'apps/patient-app/src', 'apps/company-platform/src'].forEach(scan);

console.log(`Found ${deadHandlers.length} truly empty/console-only onClick handlers:`);
deadHandlers.forEach(d => console.log(`  [Line ${d.line}] ${d.file.replace(/.*apps[\\\/]/, '')}: ${d.text}`));
