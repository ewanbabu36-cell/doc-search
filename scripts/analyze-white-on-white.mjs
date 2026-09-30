import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/ui-visibility-audit-scan.json', 'utf8'));
const items = data.suspiciousHardcodedWhiteWithWhiteText;

console.log(`Total white-with-white candidates: ${items.length}`);

// Group by file
const fileMap = {};
for (const item of items) {
  fileMap[item.file] = (fileMap[item.file] || 0) + 1;
}

console.log('Top files with candidates:');
const sortedFiles = Object.entries(fileMap).sort((a, b) => b[1] - a[1]);
for (const [file, count] of sortedFiles.slice(0, 15)) {
  console.log(`  ${count} in ${file}`);
}

// Let's inspect the actual lines:
// Look for genuine white-on-white: e.g. background is white (#fff / #ffffff / bg-white) AND color is white (#fff / #ffffff / text-white)
const realClashes = [];
for (const item of items) {
  const t = item.text;
  // Does it set background to white AND text color to white on the SAME element?
  const hasWhiteBg = /(?:background(?:Color)?\s*:\s*['"]#(?:fff|ffffff)['"]|bg-white\b)/i.test(t);
  const hasWhiteText = /(?:color\s*:\s*['"]#(?:fff|ffffff|f8fafc)['"]|text-white\b)/i.test(t);
  if (hasWhiteBg && hasWhiteText) {
    realClashes.push(item);
  }
}

console.log(`\nExact same-line white-background + white-text clashes: ${realClashes.length}`);
for (const clash of realClashes) {
  console.log(`- ${clash.file}:${clash.line} -> ${clash.text}`);
}

// Save detailed breakdown to file
fs.writeFileSync('scripts/white_on_white_analysis.json', JSON.stringify({
  total: items.length,
  exactSameLineClashes: realClashes,
  allCandidates: items
}, null, 2));
