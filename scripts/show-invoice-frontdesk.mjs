import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/classified_dark_text.json', 'utf8'));

console.log('--- InvoiceDetailView.tsx ---');
data.defectDarkOnDark.filter(d => d.file === 'InvoiceDetailView.tsx').forEach(c => {
  console.log(`${c.line}: ${c.text}`);
});

console.log('\n--- FrontDeskMobileWorkstationView.tsx ---');
data.defectDarkOnDark.filter(d => d.file === 'FrontDeskMobileWorkstationView.tsx').forEach(c => {
  console.log(`${c.line}: ${c.text}`);
});
