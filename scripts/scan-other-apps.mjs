import fs from 'fs';
import path from 'path';

function checkDirectory(dirName) {
  if (!fs.existsSync(dirName)) return [];
  const entries = fs.readdirSync(dirName, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const fullPath = path.join(dirName, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(checkDirectory(fullPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude PDF generator or print utilities
        if (fullPath.includes('Pdf') || fullPath.includes('pdf') || fullPath.includes('Print')) return;
        
        // Check for potential contrast / visibility issues
        if ((line.includes("'#0f172a'") || line.includes('"#0f172a"') || line.includes("'#1e293b'") || line.includes('"#1e293b"')) &&
            (line.includes('--ds-color-surface') || line.includes('bg-[#0b0f17]') || line.includes('bg-slate-900') || line.includes('bg-gray-900') || line.includes('#121826') || line.includes('#0b0f17'))) {
          results.push({
            file: fullPath.replace(/\\/g, '/'),
            line: idx + 1,
            type: 'DARK_ON_DARK',
            text: line.trim()
          });
        }
      });
    }
  }
  return results;
}

const companyFindings = checkDirectory('apps/company-platform/src');
const landingFindings = checkDirectory('apps/landing-page/src');

console.log(`Company Platform Dark-on-Dark Clashes: ${companyFindings.length}`);
companyFindings.forEach(f => console.log(`- ${f.file}:${f.line} -> ${f.text}`));

console.log(`\nLanding Page Dark-on-Dark Clashes: ${landingFindings.length}`);
landingFindings.forEach(f => console.log(`- ${f.file}:${f.line} -> ${f.text}`));
