import fs from 'fs';

const results = JSON.parse(fs.readFileSync('scripts/audit-scan-results.json', 'utf8'));

let out = '# DETAILED AUDIT SCAN FINDINGS\n\n';

out += '## 1. IN-MEMORY MAPS IN SERVICES & REPOSITORIES (' + results.inMemoryMaps.length + ' occurrences)\n\n';
const mapsByFile = {};
results.inMemoryMaps.forEach(m => {
  mapsByFile[m.file] = mapsByFile[m.file] || [];
  mapsByFile[m.file].push(m);
});
for (const [file, items] of Object.entries(mapsByFile)) {
  out += `### \`${file}\` (${items.length})\n`;
  items.forEach(i => {
    out += `- Line ${i.line}: \`${i.text}\`\n`;
  });
  out += '\n';
}

out += '## 2. MOCK / FALLBACK RETURNS & CATCHES (' + results.mockFallbacksInServices.length + ' occurrences)\n\n';
results.mockFallbacksInServices.forEach(m => {
  out += `- \`${m.file}:${m.line}\`: \`${m.text}\`\n`;
});

out += '\n## 3. HARDCODED DOCTORS & PATIENTS (' + results.hardcodedDoctorsPatients.length + ' occurrences)\n\n';
results.hardcodedDoctorsPatients.forEach(m => {
  out += `- \`${m.file}:${m.line}\`: \`${m.text}\`\n`;
});

out += '\n## 4. HARDCODED DASHBOARD METRICS (' + results.hardcodedDashboardMetrics.length + ' occurrences)\n\n';
results.hardcodedDashboardMetrics.forEach(m => {
  out += `- \`${m.file}:${m.line}\`: \`${m.text}\`\n`;
});

fs.writeFileSync('scripts/detailed-findings.md', out);
console.log('Wrote detailed findings to scripts/detailed-findings.md');
