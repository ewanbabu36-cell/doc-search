import fs from 'node:fs';

const scanData = JSON.parse(fs.readFileSync('data/mock-fallback-scan.json', 'utf8'));
const { findings } = scanData;

const categories = {
  PURGE_MIGRATION: [], // Code specifically removing legacy mock data or safeguarding against mocks
  UI_FALLBACK_AND_EMPTY_STATE: [], // React ErrorBoundary, null-state placeholders, UI visual loading
  ENV_AND_CONFIG_FALLBACK: [], // Configuration defaults: process.env.PORT || 4000
  EXTERNAL_INTEGRATION_SIMULATOR: [], // ABDM sandbox simulator, payment gateway simulation, speech mock
  STATIC_TERMINOLOGY_AND_CATALOGS: [], // Standard test catalogs, ICD-10 codes, standard medical definitions
  LOCALSTORAGE_PURGE_KEYS: [], // Legacy key arrays in main.tsx being purged
  BUSINESS_LOGIC_FALLBACK: [] // Potential fallbacks in business routes or services
};

for (const item of findings) {
  const s = item.snippet.toLowerCase();
  const f = item.file.toLowerCase();

  if (s.includes('purged') || s.includes('legacymock') || s.includes('removeitem') || s.includes('legacykeywords')) {
    categories.PURGE_MIGRATION.push(item);
  } else if (s.includes('err') && (s.includes('fallback') || s.includes('boundary'))) {
    categories.UI_FALLBACK_AND_EMPTY_STATE.push(item);
  } else if (s.includes('env.') || s.includes('process.env') || s.includes('default') || s.includes('|| null') || s.includes('|| \'\'') || s.includes('|| {}')) {
    categories.ENV_AND_CONFIG_FALLBACK.push(item);
  } else if (f.includes('abdm') || f.includes('ai-voice') || f.includes('whisper') || f.includes('dicom') || f.includes('payment') || f.includes('pacs')) {
    categories.EXTERNAL_INTEGRATION_SIMULATOR.push(item);
  } else if (f.includes('catalog') || f.includes('terminology') || f.includes('loinc') || f.includes('icd10')) {
    categories.STATIC_TERMINOLOGY_AND_CATALOGS.push(item);
  } else {
    categories.BUSINESS_LOGIC_FALLBACK.push(item);
  }
}

console.log('--- Classification Counts ---');
for (const [k, v] of Object.entries(categories)) {
  console.log(`${k}: ${v.length} occurrences`);
}

// Sample BUSINESS_LOGIC_FALLBACK
console.log('\nSample of Business Logic Fallbacks (first 20):');
console.log(categories.BUSINESS_LOGIC_FALLBACK.slice(0, 20).map(i => `${i.file}:${i.line} -> ${i.snippet}`));

fs.writeFileSync('data/classified-mock-scan.json', JSON.stringify(categories, null, 2));
