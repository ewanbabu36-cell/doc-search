import fs from 'fs';
import path from 'path';

const FRONTEND_DIRS = [
  'apps/partner-platform/src',
  'apps/company-platform/src',
  'apps/landing-page/src',
  'packages/ui-kit/src'
];

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css', '.jsx', '.js']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'build') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// 1. Collect all defined CSS variables in themes.css, base.css, index.css
const cssFiles = [
  'packages/ui-kit/src/styles/themes.css',
  'packages/ui-kit/src/styles/base.css',
  'apps/partner-platform/src/index.css',
  'apps/partner-platform/src/App.css',
  'apps/company-platform/src/index.css',
  'apps/landing-page/src/index.css'
];

const definedVars = new Set();
for (const cssFile of cssFiles) {
  if (fs.existsSync(cssFile)) {
    const content = fs.readFileSync(cssFile, 'utf8');
    const matches = content.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g);
    for (const m of matches) {
      definedVars.add('--' + m[1]);
    }
  }
}

console.log(`Total defined CSS variables found: ${definedVars.size}`);

// 2. Scan all files for var(--...) usage and check for undefined variables
const allFrontendFiles = FRONTEND_DIRS.flatMap(d => getAllFiles(d));
console.log(`Total frontend files to audit: ${allFrontendFiles.length}`);

const undefinedVarUsages = [];
const suspiciousHardcodedBgWhite = [];
const suspiciousHardcodedBgDarkWithDarkText = [];
const suspiciousHardcodedWhiteWithWhiteText = [];

for (const file of allFrontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check var(--...)
    const varMatches = line.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)(?:,\s*([^)]+))?\)/g);
    for (const vm of varMatches) {
      const varName = vm[1];
      const fallback = vm[2]?.trim();
      if (!definedVars.has(varName)) {
        undefinedVarUsages.push({
          file: file.replace(/\\/g, '/'),
          line: lineNum,
          varName,
          fallback: fallback || 'NONE',
          text: line.trim()
        });
      }
    }

    // Check for potential contrast clashes
    // E.g. bg-white or #ffffff or #fff on background with white/light text
    if ((line.includes('#fff') || line.includes('#ffffff') || line.includes('bg-white') || line.includes('background: \'#fff') || line.includes('background: "#fff') || line.includes('backgroundColor: \'#fff') || line.includes('backgroundColor: "#fff')) &&
        (line.includes('text-white') || line.includes('#f8fafc') || line.includes('#fff') || line.includes('--ds-color-text-primary'))) {
      suspiciousHardcodedWhiteWithWhiteText.push({
        file: file.replace(/\\/g, '/'),
        line: lineNum,
        text: line.trim()
      });
    }

    // Check for hardcoded dark text (#0f172a, #000, #1e293b, text-black) in inline styles or classes
    if ((line.includes('#0f172a') || line.includes('#1e293b') || line.includes('#000000') || line.includes('text-slate-900') || line.includes('text-black')) &&
        (line.includes('--ds-color-surface') || line.includes('--ds-surface-') || line.includes('#121826') || line.includes('#0b0f17') || line.includes('#182234') || line.includes('bg-slate-900') || line.includes('bg-gray-900'))) {
      suspiciousHardcodedBgDarkWithDarkText.push({
        file: file.replace(/\\/g, '/'),
        line: lineNum,
        text: line.trim()
      });
    }

    // Hardcoded white background in partner platform (which is primarily dark theme)
    if (file.includes('partner-platform') && (line.includes("background: '#ffffff'") || line.includes("background: '#fff'") || line.includes('backgroundColor: "#ffffff"') || line.includes('backgroundColor: "#fff"') || line.includes("background: '#FFFFFF'") || line.includes("backgroundColor: '#FFFFFF'"))) {
      suspiciousHardcodedBgWhite.push({
        file: file.replace(/\\/g, '/'),
        line: lineNum,
        text: line.trim()
      });
    }
  });
}

const report = {
  totalDefinedVars: definedVars.size,
  totalFilesAudited: allFrontendFiles.length,
  undefinedVarUsages,
  suspiciousHardcodedBgWhite,
  suspiciousHardcodedBgDarkWithDarkText,
  suspiciousHardcodedWhiteWithWhiteText
};

fs.writeFileSync('data/ui-visibility-audit-scan.json', JSON.stringify(report, null, 2));

console.log('\n=== AUDIT RESULTS SUMMARY ===');
console.log(`Undefined CSS Variable Usages: ${undefinedVarUsages.length}`);
console.log(`Hardcoded White Backgrounds in Partner Platform: ${suspiciousHardcodedBgWhite.length}`);
console.log(`Suspicious Dark-on-Dark or Mixed Combos: ${suspiciousHardcodedBgDarkWithDarkText.length}`);
console.log(`Suspicious White-on-White Combos: ${suspiciousHardcodedWhiteWithWhiteText.length}`);
console.log('Detailed results written to data/ui-visibility-audit-scan.json');
