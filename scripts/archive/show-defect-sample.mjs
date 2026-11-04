import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/classified_dark_text.json', 'utf8'));

console.log('--- CreateInvoiceView.tsx defects ---');
data.defectDarkOnDark.filter(d => d.file === 'CreateInvoiceView.tsx').forEach(c => {
  console.log(`${c.line}: ${c.text}`);
});

console.log('\n--- ProcurementOverviewView.tsx defects ---');
data.defectDarkOnDark.filter(d => d.file === 'ProcurementOverviewView.tsx').forEach(c => {
  console.log(`${c.line}: ${c.text}`);
});
