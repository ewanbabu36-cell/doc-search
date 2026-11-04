import fs from 'node:fs';

const audit = JSON.parse(fs.readFileSync('data/localstorage-audit.json', 'utf8'));
const keysToCheck = ['docsearch_patients', 'docsearch_encounters', 'docsearch_pharmacy_invoices', 'docsearch_pending_lab_orders'];

for (const k of keysToCheck) {
  const matches = audit.setItemCalls.filter(c => c.snippet.includes(k));
  console.log(`\n=== Matches for ${k} (${matches.length}) ===`);
  matches.forEach(m => console.log(`${m.file}:${m.line} -> ${m.snippet}`));
}
