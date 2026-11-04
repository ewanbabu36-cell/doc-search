import fs from 'fs';

const results = JSON.parse(fs.readFileSync('scripts/audit-scan-results.json', 'utf8'));

console.log('=== 1. In-Memory Maps in Services & Repositories ===');
const mapsByFile = {};
results.inMemoryMaps.forEach(m => {
  mapsByFile[m.file] = mapsByFile[m.file] || [];
  mapsByFile[m.file].push(`${m.line}: ${m.text}`);
});
for (const [file, lines] of Object.entries(mapsByFile)) {
  console.log(`\nFile: ${file} (${lines.length} maps)`);
  lines.slice(0, 3).forEach(l => console.log('  ' + l));
}

console.log('\n=== 2. Mock / Fallbacks in Returns & Catches ===');
results.mockFallbacksInServices.forEach(m => {
  console.log(`${m.file}:${m.line} -> ${m.text}`);
});

console.log('\n=== 3. Hardcoded Doctors / Patients ===');
results.hardcodedDoctorsPatients.forEach(m => {
  console.log(`${m.file}:${m.line} -> ${m.text}`);
});

console.log('\n=== 4. Hardcoded Dashboard Metrics ===');
results.hardcodedDashboardMetrics.forEach(m => {
  console.log(`${m.file}:${m.line} -> ${m.text}`);
});
