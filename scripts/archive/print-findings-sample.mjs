import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/audit-results/ux-accessibility/raw-findings.json', 'utf8'));

const semantic = data.findings.filter(f => f.category === 'Semantic HTML / Keyboard');
console.log('=== SEMANTIC HTML / KEYBOARD FINDINGS ===');
for (const s of semantic) {
  console.log(`${s.file}:${s.line} -> ${s.snippet}`);
}

const inputSample = data.findings.filter(f => f.category === 'Forms and Inputs').slice(0, 15);
console.log('\n=== FORMS AND INPUTS SAMPLE (15) ===');
for (const s of inputSample) {
  console.log(`${s.file}:${s.line} -> ${s.snippet}`);
}
