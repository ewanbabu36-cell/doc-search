import fs from 'fs';

const scan = JSON.parse(fs.readFileSync('data/ui-visibility-audit-scan.json', 'utf8'));

// Filter suspicious white-on-white combos
// Exclude SVG definitions or standard button primary styles where white text is on colored buttons
const realWhiteIssues = [];

for (const item of scan.suspiciousHardcodedWhiteWithWhiteText) {
  const t = item.text;
  // If it's a card/div background that has white or #fff AND text is white or text-primary
  if ((t.includes("background: '#fff") || t.includes('background: "#fff') || 
       t.includes("backgroundColor: '#fff") || t.includes('backgroundColor: "#fff"') ||
       t.includes("background: '#FFFFFF'") || t.includes("backgroundColor: '#FFFFFF'") ||
       t.includes('bg-white') || t.includes('bg-[#fff')) &&
      (t.includes('text-white') || t.includes('#f8fafc') || t.includes('#fff') || t.includes('--ds-color-text-primary'))) {
    // Check if it's NOT a dark button or colored badge
    if (!t.includes('bg-primary') && !t.includes('bg-blue') && !t.includes('bg-indigo') && !t.includes('bg-red') && !t.includes('bg-green')) {
      realWhiteIssues.push(item);
    }
  }
}

console.log(`Found ${realWhiteIssues.length} real white-on-white candidates:`);
realWhiteIssues.forEach(x => {
  console.log(`- ${x.file}:${x.line}\n  ${x.text}`);
});
