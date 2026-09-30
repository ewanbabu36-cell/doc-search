import fs from 'fs';

const d = JSON.parse(fs.readFileSync('scripts/classified_dark_text.json', 'utf8'));

function showDefects(filename) {
  const items = d.defectDarkOnDark.filter(x => x.file === filename);
  console.log(`\n=== ${filename} (${items.length} items) ===`);
  items.forEach(it => console.log(`L${it.line}: ${it.text}`));
}

showDefects('InsuranceOverviewView.tsx');
showDefects('InsurancePlanCatalogView.tsx');
showDefects('InsuranceReportsView.tsx');
showDefects('PatientDigitalTwinLongevityView.tsx');
showDefects('PreferredPartnerNetworkView.tsx');
showDefects('VendorDetailView.tsx');
