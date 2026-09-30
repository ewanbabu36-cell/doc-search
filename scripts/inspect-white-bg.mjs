import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/ui-visibility-audit-scan.json', 'utf8'));
let out = '';
data.suspiciousHardcodedBgWhite.forEach((item) => {
  const content = fs.readFileSync(item.file, 'utf8');
  const lines = content.split('\n');
  const start = Math.max(0, item.line - 4);
  const end = Math.min(lines.length, item.line + 3);
  out += `\n=== ${item.file}:${item.line} ===\n`;
  for (let i = start; i < end; i++) {
    out += `${i + 1}: ${lines[i]}\n`;
  }
});

fs.writeFileSync('scripts/white_bg_context.txt', out);
console.log('Successfully wrote', out.length, 'bytes to scripts/white_bg_context.txt');
