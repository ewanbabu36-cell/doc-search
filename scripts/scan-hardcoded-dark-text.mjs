import fs from 'fs';
import path from 'path';

const dir = 'apps/partner-platform/src/components/views';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

console.log(`Checking ${files.length} views in partner-platform for dark text (#0f172a, #1e293b, #000000, text-slate-900)...`);

const findings = [];
for (const f of files) {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Exclude print sheets, receipts, canvas print simulations
    if (f.includes('Print') || f.includes('Receipt') || f.includes('Thermal')) return;
    
    // Look for dark text on general cards or headings
    if ((line.includes("'#0f172a'") || line.includes('"#0f172a"') || line.includes("'#1e293b'") || line.includes('"#1e293b"')) &&
        !line.includes('//') && !line.includes('print')) {
      findings.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
}

console.log(`Found ${findings.length} occurrences of hardcoded dark text in views:`);
const byFile = {};
findings.forEach(f => {
  byFile[f.file] = (byFile[f.file] || 0) + 1;
});
console.log(JSON.stringify(byFile, null, 2));
