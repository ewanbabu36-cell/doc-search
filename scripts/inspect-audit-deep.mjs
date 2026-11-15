import fs from 'fs';

const data = JSON.parse(fs.readFileSync('audit-deep-findings.json', 'utf8'));

console.log('=== TENANT BREAKDOWN FOR POPULATED TABLES ===');
const legacyTenant = '6855be07-5298-4148-a571-c51ac49ac7f3';
const zeroTenant = '00000000-0000-0000-0000-000000000000';
const canonicalTenant = '11111111-1111-4111-8111-111111111111';

let legacyTables = [];
let zeroTenantTables = [];

for (const [tbl, breakdown] of Object.entries(data.db.tenantBreakdown)) {
  for (const b of breakdown) {
    if (b.tid === legacyTenant) {
      legacyTables.push({ table: tbl, count: b.c });
    }
    if (b.tid === zeroTenant) {
      zeroTenantTables.push({ table: tbl, count: b.c });
    }
  }
}

console.log(`Tables with legacy tenant (${legacyTenant}): ${legacyTables.length}`);
legacyTables.forEach(t => console.log(`  - ${t.table}: ${t.count} rows`));

console.log(`\nTables with all-zero tenant (${zeroTenant}): ${zeroTenantTables.length}`);
zeroTenantTables.forEach(t => console.log(`  - ${t.table}: ${t.count} rows`));

console.log('\n=== CRITICAL ZERO-ROW TABLES IN CLINICAL / PUBLIC SCHEMA ===');
const criticalPrefixes = ['clinical.', 'public.'];
const criticalZero = data.db.zeroTables.filter(t => {
  return (
    t.includes('encounter') ||
    t.includes('prescription') ||
    t.includes('lab') ||
    t.includes('vital') ||
    t.includes('invoice') ||
    t.includes('admission') ||
    t.includes('surgery') ||
    t.includes('tpa') ||
    t.includes('abdm') ||
    t.includes('doctor') ||
    t.includes('patient') ||
    t.includes('bed') ||
    t.includes('icu')
  );
});

console.log(`Found ${criticalZero.length} critical clinical zero-row tables (samples):`);
criticalZero.slice(0, 30).forEach(t => console.log(`  - ${t}`));

console.log('\n=== FRONTEND SYNCHRONOUS ALERTS & CONFIRMS (TOP FILES) ===');
const fileCounts = {};
data.frontendDialogs.forEach(d => {
  fileCounts[d.file] = (fileCounts[d.file] || 0) + 1;
});
const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
sortedFiles.slice(0, 20).forEach(([f, c]) => console.log(`  ${c} alerts/confirms in ${f}`));
