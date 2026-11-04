import fs from 'fs';
import path from 'path';

function checkWhiteBgWithLightText(dirName) {
  if (!fs.existsSync(dirName)) return [];
  const entries = fs.readdirSync(dirName, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const fullPath = path.join(dirName, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        results = results.concat(checkWhiteBgWithLightText(fullPath));
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (fullPath.includes('Pdf') || fullPath.includes('pdf')) return;
        // White bg with light/white text
        if ((line.includes("background: '#fff'") || line.includes("backgroundColor: '#fff'") || line.includes("backgroundColor: '#ffffff'") || line.includes('bg-white')) &&
            (line.includes("color: '#fff'") || line.includes("color: '#ffffff'") || line.includes("color: '#f8fafc'") || line.includes("text-white") || line.includes("var(--ds-color-text-primary)"))) {
          // If it's a button like bg-blue-600 text-white, it's fine. Check if bg is white:
          const isWhiteBg = /(?:background(?:Color)?\s*:\s*['"]#(?:fff|ffffff)['"]|bg-white\b)/i.test(line);
          const isWhiteText = /(?:color\s*:\s*['"]#(?:fff|ffffff|f8fafc)['"]|text-white\b|var\(--ds-color-text-primary\))/i.test(line);
          if (isWhiteBg && isWhiteText) {
            results.push({
              file: fullPath.replace(/\\/g, '/'),
              line: idx + 1,
              text: line.trim()
            });
          }
        }
      });
    }
  }
  return results;
}

const companyClashes = checkWhiteBgWithLightText('apps/company-platform/src');
const uiKitClashes = checkWhiteBgWithLightText('packages/ui-kit/src');

console.log(`Company Platform White-on-White Clashes: ${companyClashes.length}`);
companyClashes.forEach(f => console.log(`- ${f.file}:${f.line} -> ${f.text}`));

console.log(`\nUI Kit White-on-White Clashes: ${uiKitClashes.length}`);
uiKitClashes.forEach(f => console.log(`- ${f.file}:${f.line} -> ${f.text}`));
