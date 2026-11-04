import fs from 'fs';
import path from 'path';

const dir = 'apps/partner-platform/src/components/views';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const classified = {
  intentionalBadgeOrPrint: [],
  defectDarkOnDark: []
};

for (const f of files) {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (f.includes('Print') || f.includes('Receipt') || f.includes('Thermal')) return;
    
    if ((line.includes("'#0f172a'") || line.includes('"#0f172a"') || line.includes("'#1e293b'") || line.includes('"#1e293b"') || line.includes("'#334155'") || line.includes('"#334155"')) &&
        !line.includes('//')) {
      const item = { file: f, line: idx + 1, text: line.trim() };
      
      // Is it a badge, alert, paper container, kbd shortcut, or QR code SVG?
      const isBadge = line.includes('Badge') || line.includes('borderRadius: \'9999px\'') || line.includes('padding: \'2px 6px\'') || line.includes('padding: \'2px 8px\'') || line.includes('<kbd');
      const isWarningOrSuccess = line.includes('f59e0b') || line.includes('warning') || line.includes('10b981') || line.includes('emerald') || line.includes('amber') || line.includes('#F8FAFC');
      const isPrintArea = line.includes('printable') || line.includes('print-') || line.includes('Paper') || line.includes('receipt');
      const isQrCodeSvg = line.includes('<rect') && (line.includes('fill="#0f172a"') || line.includes("fill='#0f172a'"));
      
      if ((isBadge && isWarningOrSuccess) || isPrintArea || isQrCodeSvg) {
        classified.intentionalBadgeOrPrint.push(item);
      } else {
        classified.defectDarkOnDark.push(item);
      }
    }
  });
}

console.log(`Intentional High-Contrast (Badge / Print): ${classified.intentionalBadgeOrPrint.length}`);
console.log(`Defect Dark-on-Dark candidates: ${classified.defectDarkOnDark.length}`);

fs.writeFileSync('scripts/classified_dark_text.json', JSON.stringify(classified, null, 2));

// Print summary by view for defects
const defectByFile = {};
classified.defectDarkOnDark.forEach(d => {
  defectByFile[d.file] = (defectByFile[d.file] || 0) + 1;
});
console.log('Top defect views:');
console.log(Object.entries(defectByFile).sort((a,b) => b[1] - a[1]).slice(0, 20));
