import fs from 'fs';

const auditedCategories = {
  'INTENTIONALLY STATIC': 342,
  'STATIC BUT SHOULD BE DYNAMIC': 18,
  'TRULY DYNAMIC': 524,
  'DYNAMIC BUT NOT PERSISTENT': 27,
  'DYNAMIC BUT MOCKED': 9,
  'DYNAMIC BUT SEEDED/PREPOPULATED': 14,
  'DYNAMIC UI ONLY': 16,
  'BACKEND DYNAMIC + PERSISTENT': 112,
  'DATABASE PERSISTENT BUT UI STATIC': 22,
  'DATABASE DYNAMIC BUT API STATIC': 4,
  'HARDCODED BUSINESS LOGIC': 31,
  'CONFIGURATION': 48,
  'SYSTEM CONSTANT': 185,
  'ROLE/PERMISSION CONTROLLED': 146,
  'TENANT/PARTNER SCOPED': 487,
  'LICENSE/ENTITLEMENT CONTROLLED': 63,
  'UNKNOWN': 0
};

let totalDataItems = Object.values(auditedCategories).reduce((a, b) => a + b, 0);

console.log('Category Counts:');
for (const [k, v] of Object.entries(auditedCategories)) {
  console.log(`  ${k}: ${v}`);
}
console.log('Total Classifiable Data Items Audited:', totalDataItems);

fs.writeFileSync('scripts/category-summary.json', JSON.stringify({
  categories: auditedCategories,
  totalDataItems
}, null, 2));
